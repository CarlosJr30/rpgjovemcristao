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
}) {
  const env = process.env.RPG_FIX010_PRODUCTION === '1' ? 'production' : 'test';
  const files = JSON.parse(
    read('packages/database/deployments/economyfix010/' + env + '-files.json'),
  );
  const project = files.project;
  if (env === 'production')
    await q(
      "create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$",
    );
  const steps =
    env === 'production'
      ? [
          [
            'supabase/migrations/20261103045257_economy_001c_community_chests_production.sql',
            'economy001c.target_project',
          ],
          [
            'supabase/migrations/20261103045303_economy_001c_shop_release_production.sql',
            'shop001c.target_project',
          ],
          [
            'supabase/migrations/20261103145109_economy_qa_002_isolated_training_production.sql',
            'economyqa002.target_project',
          ],
        ]
      : [
          [
            'supabase/migrations/20261102135323_economy_001c_community_chests_test.sql',
            'economy001c.target_project',
          ],
          [
            'supabase/migrations/20261103034651_economy_001c_shop_qa_test.sql',
            'shop001c.target_project',
          ],
          [
            'supabase/migrations/20261103045300_economy_001c_shop_release_test.sql',
            'shop001c.target_project',
          ],
          [
            'supabase/migrations/20261103093714_economy_qa_002_isolated_training_test.sql',
            'economyqa002.target_project',
          ],
        ];
  for (const [file, key] of steps) {
    if (file.includes('034651'))
      await q(read('tests/hosted/fixtures/economy-001c-owned-equipment.sql'));
    await q(
      'BEGIN;SET LOCAL ' +
        key +
        "='" +
        project +
        "';SET LOCAL shop001c.price_approval='common40-sword35-armor65-shield115';" +
        read(file) +
        ';COMMIT;',
    );
  }
  const actor = tid(2),
    other = tid(3),
    nonce = uid(90010);
  const replace = (s) =>
    s
      .replaceAll('31b70059-deca-44c8-a6df-f21ea68b6e42', actor)
      .replaceAll('78729453-8e04-478c-96ae-d37cead1bc8c', uid(2));
  const migration = replace(read(files.migration));
  const wrap = (s, valid = true) =>
    "BEGIN;SET LOCAL economyfix010.target_project='" +
    (valid ? project : 'invalid') +
    "';" +
    s +
    ';COMMIT;';
  const install = async () => {
    await q(wrap(migration));
    if (files.patch) {
      const fixtureHash = (
        await q(
          "select md5(replace(pg_get_functiondef('shop_private.protect_reconciliation_010()'::regprocedure),E'\\r\\n',E'\\n')) x",
        )
      ).rows[0].x;
      await q(
        wrap(
          replace(read(files.patch)).replace(
            '5b881b21003ac746da00484c6a1e0817',
            fixtureHash,
          ),
        ),
      );
    }
  };
  const functions = async () =>
    (
      await q(
        "select oid::regprocedure::text signature,pg_get_functiondef(oid) body,proacl::text acl from pg_proc where pronamespace in('public'::regnamespace,'economy_private'::regnamespace,'shop_private'::regnamespace,'economy_qa_private'::regnamespace) order by 1",
      )
    ).rows;
  const data = async () =>
    (
      await q(
        "select jsonb_build_object('travelers',(select jsonb_agg(to_jsonb(v)-'updated_at'-'economic_verified_at' order by id) from public.travelers v),'wallets',(select jsonb_agg(v order by traveler_id) from public.wallets v),'stats',(select jsonb_agg(v order by traveler_id) from public.traveler_stats v),'inventory',(select jsonb_agg(v order by id) from public.inventory v),'equipped',(select jsonb_agg(v order by traveler_id,slot) from public.equipped_items v),'chests',(select jsonb_agg(v order by traveler_id,chest_type) from public.traveler_chests v),'qa',(select jsonb_agg(v order by account_id) from economy_qa_private.profiles v),'qa_receipts',(select jsonb_agg(v order by id) from economy_qa_private.receipts v)) x",
      )
    ).rows[0].x;
  await q(
    "update public.travelers set name='Teste Chat A',level=50,xp=245016,economic_verified_at=null where id=$1",
    [actor],
  );
  await q('update public.wallets set coins=1006265 where traveler_id=$1', [
    actor,
  ]);
  await q(
    'insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,hair_color,avatar_variant,level,xp,is_active) select $1,user_id,name,body_type,skin_tone,hair_style,hair_color,avatar_variant,1,0,false from public.travelers where id=$2',
    [tid(202), actor],
  );
  await q(
    "insert into public.chest_operations(traveler_id,operation_key,operation_type,chest_type,source,rewards) values($1,'historical-fixture','grant','common','legacy-fixture','{}')",
    [actor],
  );
  await q(
    "insert into public.traveler_chests(traveler_id,chest_type,quantity,sources) values($1,'common',1,'[\"legacy-fixture\"]') on conflict(traveler_id,chest_type) do update set quantity=1,sources='[\"legacy-fixture\"]'",
    [actor],
  );
  await q(
    "insert into economy_qa_private.profiles(account_id,traveler_id,activation_id,reason,created_at,expires_at,coins,chests,revision) select $1,$2,$3,'Synthetic preservation fixture',now(),now()+interval '168 hours',9960,1,2",
    [uid(2), actor, uid(90000)],
  );
  for (const [command, delta, n] of [
    ['budget', 10000, 90001],
    ['purchase', -40, 90002],
    ['equip', 0, 90003],
  ])
    await q(
      "insert into economy_qa_private.receipts(account_id,traveler_id,operation_id,command,payload,result,delta) values($1,$2,$3,$4,'{}','{}',$5)",
      [uid(2), actor, uid(n), command, delta],
    );
  const before = await data(),
    old = await functions(),
    constraint = (
      await q(
        "select pg_get_constraintdef(oid) x from pg_constraint where conrelid='public.chest_operations'::regclass and conname='chest_operations_type_check'",
      )
    ).rows[0].x;
  await check(
    '010 refuses wrong deployment project before any DDL',
    async () => {
      await denied(() => q(wrap(migration, false)), '42501');
      await q('ROLLBACK');
      assert.equal(
        (
          await q(
            "select to_regprocedure('shop_private.reconcile_legacy_010(uuid,uuid,text)') x",
          )
        ).rows[0].x,
        null,
      );
    },
  );
  await install();
  await check(
    '010 installs support without currency receipt or canonical data change',
    async () => {
      assert.deepEqual(await data(), before);
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where operation_type='administrative-reconciliation'",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check(
    '010 empty recovery restores exact old definitions ACLs and constraint',
    async () => {
      await q(wrap(read(files.recovery)));
      assert.deepEqual(await functions(), old);
      assert.equal(
        (
          await q(
            "select pg_get_constraintdef(oid) x from pg_constraint where conrelid='public.chest_operations'::regclass and conname='chest_operations_type_check'",
          )
        ).rows[0].x,
        constraint,
      );
      await install();
    },
  );
  await check(
    '010 only intended prior balance function changes; generic authority remains closed',
    async () => {
      const now = await functions();
      for (const f of old)
        if (f.signature !== 'shop_private.coin_balance(uuid)')
          assert.deepEqual(
            now.find((v) => v.signature === f.signature),
            f,
          );
      for (const role of ['anon', 'authenticated', 'service_role'])
        for (const signature of [
          'shop_private.reconcile_legacy_010(uuid,uuid,text)',
          'shop_private.reconciliation_snapshot_010(uuid)',
          'public.arena_authority_v3(uuid,uuid,text,jsonb)',
        ])
          assert.equal(
            (
              await q("select has_function_privilege($1,$2,'execute') x", [
                role,
                signature,
              ])
            ).rows[0].x,
            false,
          );
    },
  );
  const snap = async () =>
    (await q('select shop_private.reconciliation_snapshot_010($1) x', [actor]))
      .rows[0].x;
  let snapshot = await snap();
  const reconcile = async ({
    id = actor,
    op = nonce,
    hash = snapshot,
    approval = true,
    client = { query: q },
  } = {}) => {
    try {
      await client.query('BEGIN');
      if (approval)
        await client.query(
          "set local economyfix010.approval='OWNER-APPROVED-2026-11-07'",
        );
      const r = await client.query(
        'select shop_private.reconcile_legacy_010($1,$2,$3) x',
        [id, op, hash],
      );
      await client.query('COMMIT');
      return r.rows[0].x;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  };
  const call = async (sql, args = [], n = 2) => {
    try {
      await q('BEGIN');
      await q('SET LOCAL ROLE authenticated');
      await q(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          uid(n),
          JSON.stringify({
            sub: uid(n),
            session_id: uid(5000 + n),
            is_anonymous: false,
          }),
        ],
      );
      const r = await q(sql, args);
      await q('COMMIT');
      return r.rows[0].x;
    } catch (e) {
      await q('ROLLBACK');
      throw e;
    }
  };
  await check('010 wrong avatar and homonym cannot be reconciled', async () => {
    for (const id of [other, tid(202)])
      await denied(() => reconcile({ id }), '42501');
    assert.deepEqual(await data(), before);
  });
  await check(
    '010 explicit approval and exact snapshot are mandatory',
    async () => {
      await denied(() => reconcile({ approval: false }), '42501');
      await denied(() => reconcile({ hash: '0'.repeat(32) }), 'PT409');
    },
  );
  await check(
    '010 absent normal session prevents operator reconciliation',
    async () => {
      await denied(
        () =>
          tx(
            "delete from auth.sessions where user_id='" +
              uid(2) +
              "';set local economyfix010.approval='OWNER-APPROVED-2026-11-07';select shop_private.reconcile_legacy_010('" +
              actor +
              "','" +
              nonce +
              "','" +
              snapshot +
              "')",
          ),
        '42501',
      );
      assert.deepEqual(await data(), before);
    },
  );
  await check(
    '010 snapshot mutation refuses operation without blessing changed coins',
    async () => {
      await denied(
        () =>
          tx(
            "update public.wallets set coins=coins+1 where traveler_id='" +
              actor +
              "';set local economyfix010.approval='OWNER-APPROVED-2026-11-07';select shop_private.reconcile_legacy_010('" +
              actor +
              "','" +
              nonce +
              "','" +
              snapshot +
              "')",
          ),
        'PT409',
      );
      assert.deepEqual(await data(), before);
    },
  );
  await check(
    '010 official legacy denial and private QA budget remain independent',
    async () => {
      assert.equal(
        (await call('select public.get_shop($1) x', [actor])).reason,
        'legacy-reconciliation-required',
      );
      const qa = await call('select public.get_training_qa($1) x', [actor]);
      assert.equal(qa.coins, 9960);
      assert.equal(qa.chests, 1);
    },
  );
  await check(
    '010 failure during marker update rolls back approval receipt atomically',
    async () => {
      await q(
        "create function public.fixture_abort_010() returns trigger language plpgsql as $$begin if new.economic_verified_at is not null then raise exception 'Synthetic fault' using errcode='P0001';end if;return new;end$$;create trigger zz_fixture_abort_010 before update on public.travelers for each row execute function public.fixture_abort_010()",
      );
      await denied(() => reconcile(), 'P0001');
      await q(
        'drop trigger zz_fixture_abort_010 on public.travelers;drop function public.fixture_abort_010()',
      );
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where operation_type='administrative-reconciliation'",
          )
        ).rows[0].n,
        0,
      );
      assert.deepEqual(await data(), before);
    },
  );
  let receipt;
  await check(
    '010 concurrent operator retries create exactly one administrative basis with no grant',
    async () => {
      const otherClient = new Client(options);
      connections.push(otherClient);
      await otherClient.connect();
      const results = await Promise.all([
        reconcile(),
        reconcile({ client: otherClient }),
      ]);
      receipt = results[0];
      assert.equal(results[0], results[1]);
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where operation_type='administrative-reconciliation'",
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (await q('select shop_private.coin_balance($1)::int x', [actor]))
          .rows[0].x,
        1006265,
      );
      assert.deepEqual(await data(), before);
      assert.equal(
        (
          await q(
            'select economic_verified_at is not null x from public.travelers where id=$1',
            [actor],
          )
        ).rows[0].x,
        true,
      );
    },
  );
  await check(
    '010 replay keeps receipt while another nonce cannot ratify twice',
    async () => {
      assert.equal(await reconcile(), receipt);
      await denied(() => reconcile({ op: uid(90011) }), 'PT409');
    },
  );
  await check(
    '010 administrative receipt records missing provenance and cannot be altered or deleted',
    async () => {
      const r = (
        await q('select rewards x from public.chest_operations where id=$1', [
          receipt,
        ])
      ).rows[0].x;
      assert.equal(r.unprovenXP, 16);
      assert.equal(r.unprovenCoins, 6);
      assert.equal(r.legacyReceiptsAuthoritative, false);
      assert.equal(r.newCurrencyGranted, 0);
      await denied(
        () =>
          q("update public.chest_operations set rewards='{}' where id=$1", [
            receipt,
          ]),
        '42501',
      );
      await denied(
        () => q('delete from public.chest_operations where id=$1', [receipt]),
        '42501',
      );
    },
  );
  await check(
    '010 normal existing shop debits approved baseline and replay never repeats debit',
    async () => {
      const op = uid(90020);
      const a = await call(
        "select public.purchase_shop($1,'chest','common',$2) x",
        [actor, op],
      );
      assert.equal(a.pricePaid, 40);
      const b = await call(
        "select public.purchase_shop($1,'chest','common',$2) x",
        [actor, op],
      );
      assert.equal(a.receiptId, b.receiptId);
      assert.equal(
        (
          await q('select coins from public.wallets where traveler_id=$1', [
            actor,
          ])
        ).rows[0].coins,
        1006225,
      );
      assert.equal(
        (await q('select shop_private.balance_valid($1) x', [actor])).rows[0].x,
        true,
      );
      assert.equal(
        (await call('select public.get_shop($1) x', [actor])).enabled,
        true,
      );
    },
  );
  await check(
    '010 ratification keeps existing suspension of legacy sources without credit or opening',
    async () => {
      const coins = (
        await q('select coins from public.wallets where traveler_id=$1', [
          actor,
        ])
      ).rows[0].coins;
      assert.equal(
        (
          await call("select public.open_shop_chest($1,'common',$2) x", [
            actor,
            uid(90021),
          ])
        ).status,
        'suspended',
      );
      assert.equal(
        (
          await q('select coins from public.wallets where traveler_id=$1', [
            actor,
          ])
        ).rows[0].coins,
        coins,
      );
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where traveler_id=$1 and operation_type='open'",
            [actor],
          )
        ).rows[0].n,
        0,
      );
      await denied(
        () =>
          call(
            "select public.equip_shop_item($1,'helmet','traveler-helmet-rare',null) x",
            [actor],
          ),
        '42501',
      );
    },
  );
  await check(
    '010 containment targets only this avatar, preserves receipts QA and other players',
    async () => {
      const beforeHold = await data();
      await q(replace(read(files.containment)));
      assert.deepEqual(await data(), beforeHold);
      assert.equal(
        (await call('select public.get_shop($1) x', [actor])).reason,
        'suspended',
      );
      await denied(() => q(wrap(read(files.recovery))), '42501');
      await q('ROLLBACK');
      assert.equal(
        (
          await q(
            'select coins from economy_qa_private.profiles where traveler_id=$1',
            [actor],
          )
        ).rows[0].coins,
        9960,
      );
    },
  );
}
