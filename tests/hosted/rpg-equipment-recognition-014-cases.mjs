import assert from 'node:assert/strict';
import { Client } from 'pg';
import { renderRecognition } from '../../packages/database/deployments/equipmentfix014/render.mjs';
export async function run({
  q,
  check,
  denied,
  uid,
  tid,
  options,
  connections,
  read,
  project,
  env,
}) {
  const actor = tid(2),
    owner = uid(2),
    nonce = uid(901014),
    scope = env === 'production' ? 'guild-ebd-001' : 'hero-equipment-006';
  const scopeSQL = (sql) =>
    `BEGIN;SET LOCAL equipment014.target_project='${project}';${sql};COMMIT;`;
  const readSQL = read(
    'packages/database/proposals/rpg-equipment-fix-014.sql.in',
  )
    .replaceAll('{{TARGET_PROJECT}}', project)
    .replaceAll('{{RELEASE_SCOPE}}', scope);
  await q(scopeSQL(readSQL));
  const items = [
    ['traveler-armor-uncommon', 1],
    ['traveler-shield-rare', 1],
    ['traveler-helmet-rare', 4],
    ['wisdom-amulet', 6],
  ];
  for (const [id, quantity] of [...items, ['traveler-boots', 1]])
    await q(
      'insert into public.inventory(traveler_id,item_id,quantity,metadata) values($1,$2,$3,null) on conflict(traveler_id,item_id) do update set quantity=excluded.quantity,metadata=null',
      [actor, id, quantity],
    );
  for (const [id, n, type] of [
    ['traveler-helmet-rare', 3, 'epic'],
    ['wisdom-amulet', 5, 'extraordinary'],
  ])
    for (let k = 0; k < n; k++)
      await q(
        "insert into public.chest_operations(traveler_id,operation_key,operation_type,chest_type,source,rewards) values($1,$2,'open',$3,'task-0076-admin-test-profile',jsonb_build_object('itemId',$4::text,'coins',0))",
        [actor, 'open:014-admin-' + id + k, type, id],
      );
  await q(
    "delete from public.equipped_items where traveler_id=$1 and slot in('armor','shield','helmet','amulet')",
    [actor],
  );
  const financial = (
    await q(
      'select id,md5(to_jsonb(r)::text) as "rowMD5" from public.chest_operations r where traveler_id=$1 and operation_type=\'administrative-reconciliation\'',
      [actor],
    )
  ).rows[0];
  const manifest = {
    contract: 'RPG-EQUIPMENT-FIX-014:v1',
    approvalRef: 'OWNER-APPROVED-2026-11-10:FIX-014',
    actor,
    owner,
    financialApproval: financial,
    items: [],
  };
  for (const [itemId, quantity] of items)
    manifest.items.push({
      itemId,
      quantity,
      inventoryRowMD5: (
        await q(
          'select md5(to_jsonb(i)::text) x from public.inventory i where traveler_id=$1 and item_id=$2',
          [actor, itemId],
        )
      ).rows[0].x,
      legacyReceipts: (
        await q(
          "select id,md5(to_jsonb(r)::text) as \"rowMD5\" from public.chest_operations r where traveler_id=$1 and source='task-0076-admin-test-profile' and rewards->>'itemId'=$2 order by id",
          [actor, itemId],
        )
      ).rows,
    });
  const originMD5 = (
    await q(
      "select md5(replace(pg_get_functiondef('shop_private.equipment_origin_014(uuid,uuid,text)'::regprocedure),E'\\r\\n',E'\\n')) x",
    )
  ).rows[0].x;
  const constraintMD5 = (
    await q(
      "select md5(pg_get_constraintdef(oid)) x from pg_constraint where conrelid='public.chest_operations'::regclass and conname='chest_operations_type_check'",
    )
  ).rows[0].x;
  const rendered = renderRecognition({
    read,
    project,
    scope,
    manifest,
    originMD5,
    constraintMD5,
  });
  const snap = async () =>
    (await q('select shop_private.reconciliation_snapshot_010($1) x', [actor]))
      .rows[0].x;
  const state = async () =>
    (
      await q(`select jsonb_build_object(
 'travelers',(select jsonb_agg(to_jsonb(v) order by id) from public.travelers v),
 'wallets',(select jsonb_agg(to_jsonb(v) order by traveler_id) from public.wallets v),
 'stats',(select jsonb_agg(to_jsonb(v) order by traveler_id) from public.traveler_stats v),
 'inventory',(select jsonb_agg(to_jsonb(v) order by id) from public.inventory v),
 'equipped',(select jsonb_agg(to_jsonb(v) order by traveler_id,slot) from public.equipped_items v),
 'chests',(select jsonb_agg(to_jsonb(v) order by traveler_id,chest_type) from public.traveler_chests v),
 'qa',(select jsonb_agg(to_jsonb(v) order by account_id) from economy_qa_private.profiles v),
 'qaReceipts',(select jsonb_agg(to_jsonb(v) order by id) from economy_qa_private.receipts v),
 'oldReceipts',(select jsonb_agg(to_jsonb(v) order by id) from public.chest_operations v where operation_type<>'equipment-recognition')) x`)
    ).rows[0].x;
  const helper = async () =>
    (
      await q(
        "select pg_get_functiondef('shop_private.owned_equipment(uuid,text,text,text)'::regprocedure) body,proacl::text acl from pg_proc where oid='shop_private.owned_equipment(uuid,text,text,text)'::regprocedure",
      )
    ).rows[0];
  const before = await state(),
    oldHelper = await helper();
  let snapshot = await snap();
  const command = async ({
    target = actor,
    op = nonce,
    hash = snapshot,
    approval = true,
    client = { query: q },
  } = {}) => {
    try {
      await client.query('BEGIN');
      await client.query(`set local equipment014.target_project='${project}'`);
      if (approval)
        await client.query(
          "set local equipment014.approval='OWNER-APPROVED-2026-11-10:FIX-014'",
        );
      const r = await client.query(
        'select shop_private.recognize_equipment_014($1,$2,$3) x',
        [target, op, hash],
      );
      await client.query('COMMIT');
      return r.rows[0].x;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  };
  const call = async (sql, args = [], n = 2, role = 'authenticated') => {
    try {
      await q('BEGIN');
      await q('SET LOCAL ROLE ' + role);
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
  await check(
    '014R support installs without issuing recognition or changing any player data',
    async () => {
      await q(scopeSQL(rendered.support));
      assert.deepEqual(await state(), before);
      assert.deepEqual(await helper(), oldHelper);
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where operation_type='equipment-recognition'",
          )
        ).rows[0].n,
        0,
      );
      const s = await call('select public.get_equipment_access($1) x', [actor]);
      for (const [id] of items)
        assert.equal(
          s.items.find((i) => i.itemId === id).sourceConfirmed,
          false,
        );
    },
  );
  await check(
    '014R no client role can recognize sources or read the private approval manifest',
    async () => {
      for (const role of ['anon', 'authenticated', 'service_role'])
        for (const signature of [
          'shop_private.recognize_equipment_014(uuid,uuid,text)',
          'shop_private.recognition_manifest_014()',
          'shop_private.recognition_valid_014(uuid,uuid,text)',
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
      await denied(
        () =>
          call('select shop_private.recognize_equipment_014($1,$2,$3) x', [
            actor,
            nonce,
            snapshot,
          ]),
        '42501',
      );
    },
  );
  await check(
    '014R approval, active owner/avatar, homonym isolation and full snapshot are mandatory',
    async () => {
      await denied(() => command({ approval: false }), '42501');
      await denied(() => command({ target: tid(3) }), '42501');
      await denied(() => command({ target: tid(202) }), '42501');
      await denied(() => command({ hash: '0'.repeat(32) }), 'PT409');
      assert.deepEqual(await state(), before);
    },
  );
  const mutate = async (sql, args) => {
    try {
      await q('BEGIN');
      await q(sql, args);
      const changed = await snap();
      await q(`set local equipment014.target_project='${project}'`);
      await q(
        "set local equipment014.approval='OWNER-APPROVED-2026-11-10:FIX-014'",
      );
      await q('select shop_private.recognize_equipment_014($1,$2,$3)', [
        actor,
        nonce,
        changed,
      ]);
      throw Error('Mutation unexpectedly accepted');
    } finally {
      await q('ROLLBACK');
    }
  };
  await check(
    '014R mutated historical evidence and inventory cannot be blessed by a fresh snapshot',
    async () => {
      await denied(
        () =>
          mutate(
            'update public.chest_operations set rewards=rewards||\'{"coins":999}\' where id=$1',
            [manifest.items[2].legacyReceipts[0].id],
          ),
        'PT409',
      );
      await denied(
        () =>
          mutate(
            'update public.inventory set quantity=quantity+1 where traveler_id=$1 and item_id=$2',
            [actor, items[0][0]],
          ),
        'PT409',
      );
      assert.deepEqual(await state(), before);
    },
  );
  await check(
    '014R existing normal session is required even for the private operator',
    async () => {
      await denied(
        () => mutate('delete from auth.sessions where user_id=$1', [owner]),
        '42501',
      );
      assert.deepEqual(await state(), before);
    },
  );
  await check(
    '014R failure during receipt emission rolls back all four records atomically',
    async () => {
      await q(
        "create function public.fixture_fail_recognition014() returns trigger language plpgsql as $$begin if NEW.operation_type='equipment-recognition' and NEW.rewards->>'itemId'='traveler-helmet-rare' then raise exception 'isolated injected failure';end if;return NEW;end$$;create trigger fixture_fail_recognition014 before insert on public.chest_operations for each row execute function public.fixture_fail_recognition014()",
      );
      await denied(() => command(), 'P0001');
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where operation_type='equipment-recognition'",
          )
        ).rows[0].n,
        0,
      );
      assert.deepEqual(await state(), before);
      await q(
        'drop trigger fixture_fail_recognition014 on public.chest_operations;drop function public.fixture_fail_recognition014()',
      );
    },
  );
  let receiptIds;
  await check(
    '014R concurrent identical recognition creates four current audits with no resource changes',
    async () => {
      const clients = [new Client(options), new Client(options)];
      for (const c of clients) {
        connections.push(c);
        await c.connect();
      }
      const result = await Promise.all(
        clients.map((client) => command({ client })),
      );
      assert.deepEqual(result[0], result[1]);
      receiptIds = result[0];
      assert.equal(receiptIds.length, 4);
      assert.deepEqual(await state(), before);
      const rows = (
        await q(
          "select account_id,traveler_id,rewards from public.chest_operations where operation_type='equipment-recognition'",
        )
      ).rows;
      assert.equal(rows.length, 4);
      for (const r of rows) {
        assert.equal(r.account_id, owner);
        assert.equal(r.traveler_id, actor);
        assert.equal(r.rewards.newItemsGranted, 0);
        assert.equal(r.rewards.coins, 0);
        assert.equal(r.rewards.xp, 0);
      }
      assert.equal(
        (await q('select shop_private.balance_valid($1) x', [actor])).rows[0].x,
        true,
      );
    },
  );
  await check(
    '014R replay returns the same receipts while another request cannot duplicate recognition',
    async () => {
      assert.deepEqual(await command(), receiptIds);
      await denied(() => command({ op: uid(999014) }), 'PT409');
      assert.deepEqual(await state(), before);
    },
  );
  await check(
    '014R all four approved types equip/unequip/re-equip through the unchanged owned helper',
    async () => {
      const s = await call('select public.get_equipment_access($1) x', [actor]);
      for (const [id] of items)
        assert.equal(
          s.items.find((i) => i.itemId === id).sourceConfirmed,
          true,
        );
      for (const [slot, item] of [
        ['armor', items[0][0]],
        ['shield', items[1][0]],
        ['helmet', items[2][0]],
        ['amulet', items[3][0]],
      ]) {
        await call('select public.equip_shop_item($1,$2,$3,$4) x', [
          actor,
          slot,
          item,
          null,
        ]);
        await call('select public.equip_shop_item($1,$2,$3,$4) x', [
          actor,
          slot,
          null,
          item,
        ]);
        await call('select public.equip_shop_item($1,$2,$3,$4) x', [
          actor,
          slot,
          item,
          null,
        ]);
        await call('select public.equip_shop_item($1,$2,$3,$4) x', [
          actor,
          slot,
          null,
          item,
        ]);
      }
      assert.deepEqual(await state(), before);
      assert.deepEqual(await helper(), oldHelper);
    },
  );
  await check(
    '014R recognized audits remain immutable and invented payloads are refused',
    async () => {
      await denied(
        () =>
          q(
            'update public.chest_operations set rewards=rewards||\'{"coins":1}\' where id=$1',
            [receiptIds[0]],
          ),
        '42501',
      );
      await denied(
        () =>
          q('delete from public.chest_operations where id=$1', [receiptIds[0]]),
        '42501',
      );
      await denied(
        () =>
          q(
            "insert into public.chest_operations(traveler_id,account_id,identity_key,operation_key,operation_type,source,rewards) select traveler_id,account_id,'forged','forged',operation_type,source,rewards from public.chest_operations where id=$1",
            [receiptIds[0]],
          ),
        '42501',
      );
      assert.deepEqual(await state(), before);
    },
  );
  await check(
    '014R references detect tampering and tolerate unrelated future ledger columns',
    async () => {
      await q('BEGIN');
      try {
        await q(
          'update public.chest_operations set rewards=rewards||\'{"coins":999}\' where id=$1',
          [manifest.items[2].legacyReceipts[0].id],
        );
        assert.equal(
          (
            await q('select shop_private.recognition_valid_014($1,$2,$3) x', [
              owner,
              actor,
              items[2][0],
            ])
          ).rows[0].x,
          false,
        );
      } finally {
        await q('ROLLBACK');
      }
      await q('BEGIN');
      try {
        await q(
          'alter table public.chest_operations add column fixture_future_metadata text',
        );
        assert.equal(
          (
            await q('select shop_private.recognition_valid_014($1,$2,$3) x', [
              owner,
              actor,
              items[2][0],
            ])
          ).rows[0].x,
          true,
        );
      } finally {
        await q('ROLLBACK');
      }
    },
  );
  await check(
    '014R containment preserves all audits and removes only administrative source acceptance',
    async () => {
      const audits = (
        await q(
          "select to_jsonb(r) x from public.chest_operations r where operation_type='equipment-recognition' order by id",
        )
      ).rows;
      await q(scopeSQL(rendered.containment));
      assert.deepEqual(await state(), before);
      assert.deepEqual(
        (
          await q(
            "select to_jsonb(r) x from public.chest_operations r where operation_type='equipment-recognition' order by id",
          )
        ).rows,
        audits,
      );
      const s = await call('select public.get_equipment_access($1) x', [actor]);
      for (const [id] of items)
        assert.equal(
          s.items.find((i) => i.itemId === id).sourceConfirmed,
          false,
        );
      assert.equal(
        s.items.find((i) => i.itemId === 'traveler-boots').sourceConfirmed,
        true,
      );
      await denied(() => command(), '42501');
    },
  );
}
