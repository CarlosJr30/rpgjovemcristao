import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
export async function run({
  q,
  check,
  denied,
  uid,
  tid,
  options,
  connections,
  read,
}) {
  const wrap = (s) =>
    "BEGIN;SET LOCAL economyqa002.target_project='wkdvdzfkbwvhyjmamrsg';" +
    s +
    ';COMMIT;';
  // Reuse only previous bootstrap, never rerun its approved cases.
  for (const [file, setting] of [
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
  ]) {
    if (file.includes('034651'))
      await q(read('tests/hosted/fixtures/economy-001c-owned-equipment.sql'));
    await q(
      'BEGIN;SET LOCAL ' +
        setting +
        "='wkdvdzfkbwvhyjmamrsg';" +
        read(file) +
        ';COMMIT;',
    );
  }
  const compiled = read(
    'supabase/migrations/20261103093714_economy_qa_002_isolated_training_test.sql',
  );
  const designation = JSON.parse(
    read('packages/database/proposals/economy-qa-002-test-designation.json'),
  );
  assert(compiled.includes(designation.approval));
  assert(
    compiled.includes(designation.owner) &&
      compiled.includes(designation.actor),
  );
  // Technical identity substitution in a discarded loopback database only.
  const source = compiled.replace(
    new RegExp(designation.owner + '|' + designation.actor, 'g'),
    (id) => (id === designation.owner ? uid(3) : tid(3)),
  );
  const tables = [
    'travelers',
    'wallets',
    'traveler_stats',
    'inventory',
    'equipped_items',
    'traveler_chests',
    'chest_operations',
  ];
  const snapshot = async () => {
    const out = {};
    for (const name of tables)
      out[name] = (
        await q(
          `select md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' order by md5(to_jsonb(t)::text)),'')) hash from public.${name} t`,
        )
      ).rows[0].hash;
    return out;
  };
  const defs = async () =>
    (
      await q(
        "select oid::regprocedure::text signature,pg_get_functiondef(oid) body,proacl::text acl from pg_proc where pronamespace in('public'::regnamespace,'economy_private'::regnamespace,'shop_private'::regnamespace) order by 1",
      )
    ).rows;
  await q('update public.travelers set economic_verified_at=null where id=$1', [
    tid(3),
  ]);
  const canonical = await snapshot(),
    oldDefs = await defs();
  const call = async (
    n,
    name,
    args,
    client,
    session = uid(5000 + n),
    role = 'authenticated',
  ) => {
    const c = client ?? { query: q };
    try {
      await c.query('BEGIN');
      await c.query('SET LOCAL ROLE ' + role);
      await c.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          uid(n),
          JSON.stringify({
            sub: uid(n),
            session_id: session,
            is_anonymous: false,
          }),
        ],
      );
      const r = await c.query(
        'select public.' +
          name +
          '(' +
          args.map((_, i) => '$' + (i + 1)).join(',') +
          ') x',
        args,
      );
      await c.query('COMMIT');
      return r.rows[0]?.x;
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    }
  };
  const state = () => call(3, 'get_training_qa', [tid(3)]);
  const command = (name, payload, id = randomUUID(), client) =>
    call(3, 'command_training_qa', [tid(3), name, payload, id], client);
  await check(
    'QA002 rejects wrong environment before creating objects',
    async () => {
      await denied(() => q('BEGIN;' + source + ';COMMIT;'), '42501');
      await q('ROLLBACK');
      assert.equal(
        (await q("select to_regnamespace('economy_qa_private') x")).rows[0].x,
        null,
      );
    },
  );
  await q(wrap(source));
  await check(
    'QA002 empty recovery restores previous definitions and canonical data',
    async () => {
      await q(
        wrap(
          read(
            'packages/database/proposals/economy-qa-002-recovery-empty-test.sql',
          ),
        ),
      );
      assert.deepEqual(await defs(), oldDefs);
      assert.deepEqual(await snapshot(), canonical);
      await denied(
        () =>
          call(3, 'purchase_shop', [tid(3), 'chest', 'common', randomUUID()]),
        '42501',
      );
      await q(wrap(source));
    },
  );
  await check(
    'QA002 private tables deny direct access; grant is owner only and public wrappers are invokers',
    async () => {
      assert.equal(
        (
          await q(
            "select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='economy_qa_private' and c.relkind='r' and not c.relrowsecurity",
          )
        ).rows[0].n,
        0,
      );
      for (const role of ['anon', 'authenticated', 'service_role'])
        assert.equal(
          (
            await q(
              "select has_function_privilege($1,'economy_qa_private.activate(uuid,uuid,uuid,text)','execute') x",
              [role],
            )
          ).rows[0].x,
          false,
        );
      assert.equal(
        (
          await q(
            "select count(*)::int n from pg_proc where proname in('get_training_qa','command_training_qa','get_training_qa_receipt') and prosecdef",
          )
        ).rows[0].n,
        0,
      );
      await denied(
        () =>
          call(3, 'get_training_qa', [tid(3)], undefined, uid(5003), 'anon'),
        '42501',
      );
    },
  );
  await check(
    'QA002 no budget by login or by Admin; explicit designation and activation replay',
    async () => {
      assert.equal((await state()).enabled, false);
      assert.equal((await call(1, 'get_training_qa', [tid(1)])).enabled, false);
      await denied(
        () =>
          q('select economy_qa_private.activate($1,$2,$3,$4)', [
            uid(1),
            tid(1),
            randomUUID(),
            'Explicit synthetic activation',
          ]),
        '42501',
      );
      const activation = randomUUID(),
        args = [
          uid(3),
          tid(3),
          activation,
          'Explicit synthetic isolation proof',
        ];
      await q('select economy_qa_private.activate($1,$2,$3,$4)', args);
      await q('select economy_qa_private.activate($1,$2,$3,$4)', args);
      assert.equal((await state()).coins, 10000);
      assert.equal(
        (
          await q(
            "select count(*)::int n from economy_qa_private.receipts where command='budget'",
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await q(
            'select extract(epoch from expires_at-created_at)::int seconds from economy_qa_private.profiles',
          )
        ).rows[0].seconds,
        604800,
      );
      await denied(
        () =>
          q('select economy_qa_private.activate($1,$2,$3,$4)', [
            uid(3),
            tid(3),
            randomUUID(),
            args[3],
          ]),
        '42501',
      );
    },
  );
  await check(
    'QA002 session missing foreign avatar and service_role denied',
    async () => {
      await denied(() => call(3, 'get_training_qa', [tid(1)]), '42501');
      await denied(
        () => call(3, 'get_training_qa', [tid(3)], undefined, uid(9000)),
        '42501',
      );
      await denied(
        () =>
          call(
            3,
            'get_training_qa',
            [tid(3)],
            undefined,
            uid(5003),
            'service_role',
          ),
        '42501',
      );
    },
  );
  await check(
    'QA002 fixed offers reject price injection cards other chests without mutation',
    async () => {
      const before = await state();
      for (const payload of [
        { kind: 'card', offer: 'any' },
        { kind: 'chest', offer: 'epic' },
        { kind: 'chest', offer: 'common', price: 0 },
      ])
        await denied(() => command('purchase', payload), '22023');
      assert.deepEqual(await state(), before);
    },
  );
  const buyId = randomUUID();
  await check(
    'QA002 common purchase debits only private wallet and delivers one private chest',
    async () => {
      const r = await command(
        'purchase',
        { kind: 'chest', offer: 'common' },
        buyId,
      );
      assert.equal(r.pricePaid, 40);
      const s = await state();
      assert.equal(s.coins, 9960);
      assert.equal(s.chests, 1);
      assert.deepEqual(await snapshot(), canonical);
    },
  );
  await check(
    'QA002 replay concurrent same nonce creates only one debit and receipt',
    async () => {
      const a = new Client(options),
        b = new Client(options);
      await a.connect();
      await b.connect();
      connections.push(a, b);
      const rows = await Promise.all([
        command('purchase', { kind: 'chest', offer: 'common' }, buyId, a),
        command('purchase', { kind: 'chest', offer: 'common' }, buyId, b),
      ]);
      assert.equal(rows[0].receiptId, rows[1].receiptId);
      assert.equal((await state()).coins, 9960);
      await denied(
        () =>
          command(
            'equip',
            { slot: 'weapon', itemId: null, expectedItemId: null },
            buyId,
          ),
        '22023',
      );
    },
  );
  let opening;
  await check(
    'QA002 approved common loot persists privately and opening replay preserves result',
    async () => {
      const id = randomUUID();
      opening = await command('open', { type: 'common' }, id);
      assert([10, 25].includes(opening.coins));
      assert.equal(
        opening.itemId,
        opening.coins === 25 ? null : 'traveler-sword-common',
      );
      assert.equal(opening.remainingQuantity, 0);
      const replay = await command('open', { type: 'common' }, id);
      assert.deepEqual(
        { ...replay, replayed: undefined },
        { ...opening, replayed: undefined },
      );
      const receipt = await call(3, 'get_training_qa_receipt', [tid(3), id]);
      assert.deepEqual(receipt.result, opening);
      assert.deepEqual(await snapshot(), canonical);
    },
  );
  await check(
    'QA002 three existing equipment offers preserve slots; repeat does not duplicate quantity',
    async () => {
      for (const offer of [
        'traveler-sword-common',
        'traveler-armor-uncommon',
        'traveler-shield-rare',
      ])
        await command('purchase', { kind: 'equipment', offer });
      const before = await state();
      const r = await command('purchase', {
        kind: 'equipment',
        offer: 'traveler-armor-uncommon',
      });
      assert.equal(r.pricePaid, 0);
      assert.deepEqual((await state()).items, before.items);
      await command('equip', {
        slot: 'weapon',
        itemId: 'traveler-sword-common',
        expectedItemId: null,
      });
      assert.equal((await state()).equipped.weapon, 'traveler-sword-common');
      await denied(
        () =>
          command('equip', {
            slot: 'armor',
            itemId: 'traveler-sword-common',
            expectedItemId: null,
          }),
        '42501',
      );
      await denied(
        () =>
          command('equip', {
            slot: 'weapon',
            itemId: null,
            expectedItemId: null,
          }),
        'PT409',
      );
      assert.deepEqual(await snapshot(), canonical);
    },
  );
  await check(
    'QA002 failed receipt insert rolls back debit and delivery together',
    async () => {
      const before = await state();
      await q(
        "create function public.qa002_test_failure() returns trigger language plpgsql as $$begin raise exception 'Synthetic receipt failure';end$$;create trigger qa002_test_failure before insert on economy_qa_private.receipts for each row execute function public.qa002_test_failure()",
      );
      try {
        await denied(
          () => command('purchase', { kind: 'chest', offer: 'common' }),
          'P0001',
        );
        assert.deepEqual(await state(), before);
      } finally {
        await q(
          'drop trigger qa002_test_failure on economy_qa_private.receipts;drop function public.qa002_test_failure()',
        );
      }
    },
  );
  await check(
    'QA002 spending cannot create negative balance or canonical purchasing power',
    async () => {
      const count = Math.floor((await state()).coins / 40);
      await q('BEGIN;SET LOCAL ROLE authenticated');
      await q(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [uid(3), JSON.stringify({ sub: uid(3), session_id: uid(5003) })],
      );
      await q(
        'select public.command_training_qa($1,\'purchase\',\'{"kind":"chest","offer":"common"}\',gen_random_uuid()) from generate_series(1,$2)',
        [tid(3), count],
      );
      await q('COMMIT');
      const s = await state();
      assert(s.coins >= 0 && s.coins < 40);
      await denied(
        () => command('purchase', { kind: 'chest', offer: 'common' }),
        'P0001',
      );
      assert.deepEqual(await state(), s);
      assert.deepEqual(await snapshot(), canonical);
    },
  );
  await check(
    'QA002 designation and audit cannot be edited or deleted; no reactivation after expiry',
    async () => {
      await denied(
        () =>
          q(
            "update economy_qa_private.profiles set expires_at=expires_at+interval '1 day'",
          ),
        '42501',
      );
      await denied(
        () => q('update economy_qa_private.receipts set delta=0'),
        '42501',
      );
      await denied(() => q('delete from economy_qa_private.receipts'), '42501');
      // Only a local synthetic clock fixture, rolled back. Runtime guards stay exact.
      await q(
        "BEGIN;alter table economy_qa_private.profiles disable trigger training_profile_immutable;update economy_qa_private.profiles set created_at=created_at-interval '8 days',expires_at=expires_at-interval '8 days';alter table economy_qa_private.profiles enable trigger training_profile_immutable;SET LOCAL ROLE authenticated",
      );
      await q(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [uid(3), JSON.stringify({ sub: uid(3), session_id: uid(5003) })],
      );
      assert.equal(
        (await q('select public.get_training_qa($1) x', [tid(3)])).rows[0].x
          .enabled,
        false,
      );
      await denied(
        () =>
          q(
            'select public.command_training_qa($1,\'purchase\',\'{"kind":"chest","offer":"common"}\',$2)',
            [tid(3), buyId],
          ),
        '42501',
      );
      await q('ROLLBACK');
    },
  );
  await check(
    'QA002 revocation and containment preserve audit and all canonical records',
    async () => {
      const before = (
        await q('select count(*)::int n from economy_qa_private.receipts')
      ).rows[0].n;
      await q('update economy_qa_private.profiles set enabled=false');
      await denied(() => command('open', { type: 'common' }), '42501');
      await denied(
        () =>
          q(
            wrap(
              read(
                'packages/database/proposals/economy-qa-002-recovery-empty-test.sql',
              ),
            ),
          ),
        '42501',
      );
      await q('ROLLBACK');
      await q(
        wrap(
          read(
            'packages/database/proposals/economy-qa-002-containment-test.sql',
          ),
        ),
      );
      await denied(() => command('open', { type: 'common' }), '42501');
      assert.equal(
        (await q('select count(*)::int n from economy_qa_private.receipts'))
          .rows[0].n,
        before,
      );
      assert.deepEqual(await snapshot(), canonical);
      const current = await defs();
      for (const d of oldDefs)
        assert.deepEqual(
          current.find((x) => x.signature === d.signature),
          d,
        );
    },
  );
}
