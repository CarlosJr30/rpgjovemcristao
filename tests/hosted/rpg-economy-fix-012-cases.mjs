import assert from 'node:assert/strict';
import { Client } from 'pg';
export async function run({
  q,
  tx,
  check,
  denied,
  uid,
  tid,
  options,
  connections,
  read,
  env,
  project,
}) {
  const files = JSON.parse(
    read('packages/database/deployments/economyfix012/' + env + '-files.json'),
  );
  const wrap = (s) =>
    "BEGIN;SET LOCAL economyfix012.target_project='" +
    project +
    "';" +
    s +
    ';COMMIT;';
  const migration = read(files.migration);
  // The historical bootstrap omits the read-only story receipts table. Match its real key shape.
  await q(
    'CREATE SCHEMA IF NOT EXISTS story_private;CREATE TABLE IF NOT EXISTS story_private.step_receipts(traveler_id uuid NOT NULL REFERENCES public.travelers(id),story_id uuid NOT NULL,revision integer NOT NULL,step text NOT NULL,source text NOT NULL,proof_reference text,observed_seconds integer,duration_seconds integer,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(traveler_id,story_id,revision,step));',
  );
  const call = async (
    n,
    sql,
    args = [],
    client = { query: q },
    role = 'authenticated',
  ) => {
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL ROLE ' + role);
      await client.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          n === null ? '' : uid(n),
          JSON.stringify({ session_id: uid(5000 + n), is_anonymous: false }),
        ],
      );
      const r = await client.query(sql, args);
      await client.query('COMMIT');
      return r.rows[0]?.x;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  };
  const state = (n) => call(n, 'select public.get_shop($1) x', [tid(n)]);
  const initialize = (n, actor = tid(n), client) =>
    call(n, 'select public.initialize_shop_economy($1) x', [actor], client);
  const fixture = async (n, { verified = false } = {}) => {
    await q(
      "update public.travelers set created_at='2026-09-01T00:00:00Z',economic_verified_at=case when $2 then now() else null end,journey_progress=null,xp=0,level=1 where id=$1",
      [tid(n), verified],
    );
    await q(
      'insert into public.wallets(traveler_id,created_at,updated_at) select id,created_at,created_at from public.travelers where id=$1',
      [tid(n)],
    );
    await q(
      'insert into public.traveler_stats(traveler_id,created_at,updated_at) select id,created_at,created_at from public.travelers where id=$1',
      [tid(n)],
    );
    await q(
      "insert into public.inventory(traveler_id,item_id,quantity,metadata,acquired_at) select id,'traveler-boots',1,null,created_at from public.travelers where id=$1",
      [tid(n)],
    );
    await q(
      "insert into public.equipped_items(traveler_id,slot,item_id) values($1,'boots','traveler-boots')",
      [tid(n)],
    );
  };
  for (let n = 20; n <= 35; n++) await fixture(n, { verified: n === 20 });
  const snapshot = async (n) =>
    (
      await q(
        "select jsonb_build_object('traveler',(select to_jsonb(t)-'updated_at'-'economic_verified_at' from public.travelers t where id=$1),'wallet',(select to_jsonb(w) from public.wallets w where traveler_id=$1),'stats',(select to_jsonb(s) from public.traveler_stats s where traveler_id=$1),'inventory',(select jsonb_agg(i order by id) from public.inventory i where traveler_id=$1),'equipped',(select jsonb_agg(e order by slot) from public.equipped_items e where traveler_id=$1),'qa',(select jsonb_agg(p) from economy_qa_private.profiles p where traveler_id=$1)) x",
        [tid(n)],
      )
    ).rows[0].x;
  const functions = async () =>
    (
      await q(
        "select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) body,p.proacl::text acl from pg_proc p where p.pronamespace in('public'::regnamespace,'shop_private'::regnamespace) order by 1",
      )
    ).rows;
  const oldFunctions = await functions();
  const oldConstraint = (
    await q(
      "select pg_get_constraintdef(oid) x from pg_constraint where conrelid='public.chest_operations'::regclass and conname='chest_operations_type_check'",
    )
  ).rows[0].x;
  const beforeInstall = await snapshot(21);
  await check('012 wrong project refuses DDL', async () => {
    await denied(
      () =>
        q(
          wrap(migration).replace(
            "target_project='" + project + "'",
            "target_project='wrong'",
          ),
        ),
      '42501',
    );
    await q('ROLLBACK');
  });
  await q(wrap(migration));
  await check(
    '012 installs without initializing an avatar or granting value',
    async () => {
      assert.deepEqual(await snapshot(21), beforeInstall);
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where operation_type='economic-initialization'",
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await q(
            'select economic_verified_at is null x from public.travelers where id=$1',
            [tid(21)],
          )
        ).rows[0].x,
        true,
      );
    },
  );
  await check(
    '012 empty recovery restores previous functions ACLs and receipt constraint',
    async () => {
      await q(wrap(read(files.recovery)));
      assert.deepEqual(await functions(), oldFunctions);
      assert.equal(
        (
          await q(
            "select pg_get_constraintdef(oid) x from pg_constraint where conrelid='public.chest_operations'::regclass and conname='chest_operations_type_check'",
          )
        ).rows[0].x,
        oldConstraint,
      );
      await q(wrap(migration));
    },
  );
  await check(
    '012 new verified avatar stays enabled and initialization is a no-op',
    async () => {
      const before = await snapshot(20);
      const mark = (
        await q(
          'select economic_verified_at x from public.travelers where id=$1',
          [tid(20)],
        )
      ).rows[0].x;
      assert.equal((await state(20)).enabled, true);
      assert.equal((await initialize(20)).status, 'already-initialized');
      assert.deepEqual(await snapshot(20), before);
      assert.deepEqual(
        (
          await q(
            'select economic_verified_at x from public.travelers where id=$1',
            [tid(20)],
          )
        ).rows[0].x,
        mark,
      );
    },
  );
  await check(
    '012 own read classifies pristine legacy but does not initialize it',
    async () => {
      const s = await state(21);
      assert.equal(s.enabled, false);
      assert.equal(s.initializationEligible, true);
      assert.equal(s.reason, 'legacy-reconciliation-required');
      assert.equal(
        (
          await q(
            'select economic_verified_at is null x from public.travelers where id=$1',
            [tid(21)],
          )
        ).rows[0].x,
        true,
      );
    },
  );
  await check(
    '012 explicit pristine initialization preserves every existing value and issues one zero audit',
    async () => {
      const before = await snapshot(21);
      const r = await initialize(21);
      assert.equal(r.status, 'initialized');
      assert.deepEqual(await snapshot(21), before);
      const receipt = (
        await q(
          "select rewards,price_paid from public.chest_operations where traveler_id=$1 and operation_type='economic-initialization'",
          [tid(21)],
        )
      ).rows;
      assert.equal(receipt.length, 1);
      assert.equal(receipt[0].price_paid, 0);
      assert.equal(receipt[0].rewards.newCurrencyGranted, 0);
      assert.equal(receipt[0].rewards.newItemsGranted, 0);
      assert.equal((await state(21)).enabled, true);
      assert.equal((await initialize(21)).status, 'already-initialized');
    },
  );
  await check(
    '012 concurrent requests create only one initialization audit',
    async () => {
      const c = new Client(options);
      connections.push(c);
      await c.connect();
      await Promise.all([initialize(22), initialize(22, tid(22), c)]);
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where traveler_id=$1 and operation_type='economic-initialization'",
            [tid(22)],
          )
        ).rows[0].n,
        1,
      );
    },
  );
  await check(
    '012 zero balance with an old receipt stays blocked',
    async () => {
      await q(
        "insert into public.chest_operations(traveler_id,operation_key,operation_type,chest_type,source,rewards) values($1,'old-zero','purchase','common','legacy','{}')",
        [tid(23)],
      );
      assert.equal((await state(23)).initializationEligible, false);
      await denied(() => initialize(23), '42501');
    },
  );
  await check(
    '012 zero balance with XP or additional inventory stays blocked',
    async () => {
      await q('update public.travelers set xp=1 where id=$1', [tid(24)]);
      await denied(() => initialize(24), '42501');
      await q(
        "insert into public.inventory(traveler_id,item_id,quantity) values($1,'traveler-helmet-rare',1)",
        [tid(25)],
      );
      await denied(() => initialize(25), '42501');
    },
  );
  await check(
    '012 positive legacy balance and touched zero wallet are never approved',
    async () => {
      await q('update public.wallets set coins=1 where traveler_id=$1', [
        tid(26),
      ]);
      await denied(() => initialize(26), '42501');
      await q('update public.wallets set coins=0 where traveler_id=$1', [
        tid(27),
      ]);
      await denied(() => initialize(27), '42501');
    },
  );
  await check(
    '012 progression and private QA history disqualify a zero baseline',
    async () => {
      await q(
        "update public.travelers set journey_progress='{}',xp=0 where id=$1",
        [tid(28)],
      );
      await q(
        "insert into economy_private.journey_rewards(traveler_id,reward_key) values($1,'historical-zero')",
        [tid(28)],
      );
      await denied(() => initialize(28), '42501');
      await q(
        "insert into economy_qa_private.profiles(account_id,traveler_id,activation_id,reason,created_at,expires_at,coins,chests,revision) values($1,$2,$3,'Synthetic excluded QA',now(),now()+interval '168 hours',0,0,0)",
        [uid(29), tid(29), uid(9029)],
      );
      await denied(() => initialize(29), '42501');
    },
  );
  await check(
    '012 foreign inactive anonymous service and expired-session requests are denied',
    async () => {
      await denied(() => initialize(30, tid(31)), '42501');
      await q('update public.travelers set is_active=false where id=$1', [
        tid(31),
      ]);
      await denied(() => initialize(31), '42501');
      await denied(
        () =>
          call(
            null,
            'select public.initialize_shop_economy($1) x',
            [tid(30)],
            undefined,
            'anon',
          ),
        '42501',
      );
      await denied(
        () =>
          call(
            30,
            'select public.initialize_shop_economy($1) x',
            [tid(30)],
            undefined,
            'service_role',
          ),
        '42501',
      );
      await q(
        "update auth.sessions set not_after=now()-interval '1 second' where id=$1",
        [uid(5030)],
      );
      await denied(() => initialize(30), '42501');
    },
  );
  await check(
    '012 initialization audit is immutable and cannot be forged by a client',
    async () => {
      await denied(
        () =>
          q(
            "update public.chest_operations set source='changed' where traveler_id=$1 and operation_type='economic-initialization'",
            [tid(21)],
          ),
        '42501',
      );
      await denied(
        () =>
          q(
            "delete from public.chest_operations where traveler_id=$1 and operation_type='economic-initialization'",
            [tid(21)],
          ),
        '42501',
      );
      await denied(
        () =>
          call(
            32,
            "insert into public.chest_operations(traveler_id,operation_key,operation_type,source,rewards) values($1,'forged','economic-initialization','economic-init-012','{}')",
            [tid(32)],
          ),
        '42501',
      );
    },
  );
  await check(
    '012 active-avatar revocation while waiting for a row lock denies initialization',
    async () => {
      const lock = new Client(options),
        command = new Client(options);
      connections.push(lock, command);
      await lock.connect();
      await command.connect();
      await lock.query('BEGIN');
      await lock.query(
        'select 1 from public.travelers where id=$1 for update',
        [tid(34)],
      );
      const pending = initialize(34, tid(34), command).then(
        () => ({ code: 'unexpected-success' }),
        (e) => ({ code: e.code }),
      );
      let waiting = false;
      for (let n = 0; n < 100; n++) {
        waiting = (
          await q(
            "select exists(select 1 from pg_stat_activity where pid=$1 and wait_event='transactionid') x",
            [command.processID],
          )
        ).rows[0].x;
        if (waiting) break;
        await new Promise((r) => setTimeout(r, 20));
      }
      assert.equal(waiting, true);
      await lock.query(
        'update public.travelers set is_active=false where id=$1',
        [tid(34)],
      );
      await lock.query('COMMIT');
      assert.equal((await pending).code, '42501');
      assert.equal(
        (
          await q(
            'select economic_verified_at is null x from public.travelers where id=$1',
            [tid(34)],
          )
        ).rows[0].x,
        true,
      );
    },
  );
  await check(
    '012 failure after receipt insertion rolls the entire initialization back',
    async () => {
      await q(
        "create function public.fixture_fail_012() returns trigger language plpgsql as $$begin if NEW.id='" +
          tid(32) +
          "'::uuid and NEW.economic_verified_at is not null then raise exception 'Synthetic failure';end if;return NEW;end$$;create trigger fixture_fail_012 before update on public.travelers for each row execute function public.fixture_fail_012();",
      );
      const before = await snapshot(32);
      await denied(() => initialize(32), 'P0001');
      assert.deepEqual(await snapshot(32), before);
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where traveler_id=$1 and operation_type='economic-initialization'",
            [tid(32)],
          )
        ).rows[0].n,
        0,
      );
      await q(
        'drop trigger fixture_fail_012 on public.travelers;drop function public.fixture_fail_012();',
      );
    },
  );
  await check(
    '012 approved Teste Chat A and its QA budget remain exactly preserved',
    async () => {
      await q(
        "update public.travelers set name='Teste Chat A',level=50,xp=245016,economic_verified_at=null where id=$1",
        [tid(2)],
      );
      await q('update public.wallets set coins=1006265 where traveler_id=$1', [
        tid(2),
      ]);
      await q(
        "insert into economy_qa_private.profiles(account_id,traveler_id,activation_id,reason,created_at,expires_at,coins,chests,revision) values($1,$2,$3,'Synthetic preservation',now(),now()+interval '168 hours',9960,1,2)",
        [uid(2), tid(2), uid(9099)],
      );
      const hash = (
        await q('select shop_private.reconciliation_snapshot_010($1) x', [
          tid(2),
        ])
      ).rows[0].x;
      await tx(
        "SET LOCAL economyfix010.approval='OWNER-APPROVED-2026-11-07';select shop_private.reconcile_legacy_010('" +
          tid(2) +
          "','" +
          uid(90099) +
          "','" +
          hash +
          "');",
      );
      const before = await snapshot(2);
      const mark = (
        await q(
          'select economic_verified_at x from public.travelers where id=$1',
          [tid(2)],
        )
      ).rows[0].x;
      assert.equal((await initialize(2)).status, 'already-initialized');
      assert.deepEqual(await snapshot(2), before);
      assert.deepEqual(
        (
          await q(
            'select economic_verified_at x from public.travelers where id=$1',
            [tid(2)],
          )
        ).rows[0].x,
        mark,
      );
    },
  );
  await check(
    '012 containment blocks only initialization and retains audits and verified Shop access',
    async () => {
      await denied(() => q(wrap(read(files.recovery))), '42501');
      await q('ROLLBACK');
      await q(wrap(read(files.containment)));
      await denied(() => initialize(33), '42501');
      assert.equal((await state(33)).initializationEligible, false);
      assert.equal((await state(21)).enabled, true);
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where operation_type='economic-initialization'",
          )
        ).rows[0].n,
        2,
      );
    },
  );
}
