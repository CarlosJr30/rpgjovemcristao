import assert from 'node:assert/strict';
export async function run({ q, check, denied, uid, tid, read }) {
  const test = process.env.RPG_ECONOMY_001C_RELEASE_ENV === 'TEST';
  const project = test ? 'wkdvdzfkbwvhyjmamrsg' : 'wspafhlbtlpabypzymjo';
  const scope = test ? 'hero-equipment-006' : 'guild-ebd-001';
  const resolve = (file) =>
    read(file)
      .replaceAll('{{TARGET_PROJECT}}', project)
      .replaceAll('{{RELEASE_SCOPE}}', scope);
  const migration = resolve(
    'packages/database/proposals/rpg-equipment-fix-014.sql.in',
  );
  const wrap = (sql) =>
    `BEGIN;SET LOCAL equipment014.target_project='${project}';${sql};COMMIT;`;
  const call = async (
    n,
    sql,
    args = [],
    role = 'authenticated',
    session = uid(5000 + n),
  ) => {
    try {
      await q('BEGIN');
      await q('SET LOCAL ROLE ' + role);
      await q(
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
      const r = await q(sql, args);
      await q('COMMIT');
      return r.rows[0]?.x;
    } catch (e) {
      await q('ROLLBACK');
      throw e;
    }
  };
  const readAccess = (n = 2, target = tid(n)) =>
    call(n, 'select public.get_equipment_access($1) x', [target]);
  const equip = (slot, item, expected, n = 2) =>
    call(n, 'select public.equip_shop_item($1,$2,$3,$4) x', [
      tid(n),
      slot,
      item,
      expected,
    ]);
  const snap = async () =>
    (
      await q(`select jsonb_build_object(
    'travelers',(select jsonb_agg(to_jsonb(v) order by id) from public.travelers v),
    'wallets',(select jsonb_agg(to_jsonb(v) order by traveler_id) from public.wallets v),
    'inventory',(select jsonb_agg(to_jsonb(v) order by id) from public.inventory v),
    'stats',(select jsonb_agg(to_jsonb(v) order by traveler_id) from public.traveler_stats v),
    'equipment',(select jsonb_agg(to_jsonb(v) order by traveler_id,slot) from public.equipped_items v),
    'chests',(select jsonb_agg(to_jsonb(v) order by traveler_id,chest_type) from public.traveler_chests v),
    'receipts',(select jsonb_agg(to_jsonb(v) order by id) from public.chest_operations v)) x`)
    ).rows[0].x;
  const helper = async () =>
    (
      await q(
        "select pg_get_functiondef('shop_private.owned_equipment(uuid,text,text,text)'::regprocedure) body,proacl::text acl from pg_proc where oid='shop_private.owned_equipment(uuid,text,text,text)'::regprocedure",
      )
    ).rows[0];
  const oldWrapper = (
    await q(
      "select pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure) body,proacl::text acl from pg_proc where oid='shop_private.equip(uuid,text,text,text)'::regprocedure",
    )
  ).rows[0];
  const helperBefore = await helper();
  await check('014 rejects an unscoped installation before DDL', async () => {
    await denied(() => q('BEGIN;' + migration + ';COMMIT;'), '42501');
    await q('ROLLBACK');
    assert.equal(
      (await q("select to_regprocedure('public.get_equipment_access(uuid)') x"))
        .rows[0].x,
      null,
    );
  });
  await check(
    '014 installs only a shared predicate and read; player data/helper/ACL remain exact',
    async () => {
      const before = await snap();
      await q(wrap(migration));
      assert.deepEqual(await snap(), before);
      assert.deepEqual(await helper(), helperBefore);
      assert.equal(
        (
          await q(
            "select proacl::text x from pg_proc where oid='shop_private.equip(uuid,text,text,text)'::regprocedure",
          )
        ).rows[0].x,
        oldWrapper.acl,
      );
      assert.equal(
        (
          await q(
            "select prosecdef x from pg_proc where oid='public.get_equipment_access(uuid)'::regprocedure",
          )
        ).rows[0].x,
        false,
      );
      const oldIds = [
        ...oldWrapper.body
          .match(/p_item\s+NOT\s+IN\s*\(([^)]*)\)/s)[1]
          .matchAll(/'([^']+)'/g),
      ].map((m) => m[1]);
      const newBody = (
        await q(
          "select pg_get_functiondef('shop_private.equipment_origin_014(uuid,uuid,text)'::regprocedure) x",
        )
      ).rows[0].x;
      assert.deepEqual(
        [
          ...newBody
            .match(/p_item\s+NOT\s+IN\s*\(([^)]*)\)/s)[1]
            .matchAll(/'([^']+)'/g),
        ].map((m) => m[1]),
        oldIds,
      );
    },
  );
  // Synthetic state equivalent to the six source categories, with no player data imported.
  const ids = [
    'traveler-boots',
    'traveler-sword-common',
    'traveler-armor-uncommon',
    'traveler-shield-rare',
    'traveler-helmet-rare',
    'wisdom-amulet',
  ];
  await q(
    'update public.travelers set economic_verified_at=now() where id=$1',
    [tid(2)],
  );
  for (const id of ids)
    await q(
      'insert into public.inventory(traveler_id,item_id,quantity,metadata) values($1,$2,1,null) on conflict(traveler_id,item_id) do update set quantity=1,metadata=null',
      [tid(2), id],
    );
  await q('delete from public.equipped_items where traveler_id=$1', [tid(2)]);
  await q(
    "insert into public.chest_operations(traveler_id,account_id,operation_key,operation_type,source,price_paid,rewards) values($1,$2,'equipment-purchase:014-valid','equipment-purchase','shop001c:equipment',35,jsonb_build_object('itemId','traveler-sword-common','catalogVersion','ECONOMY-001C:shop:v1'))",
    [tid(2), uid(2)],
  );
  for (const [type, item] of [
    ['epic', 'traveler-helmet-rare'],
    ['extraordinary', 'wisdom-amulet'],
  ])
    await q(
      "insert into public.chest_operations(traveler_id,operation_key,operation_type,chest_type,source,rewards) values($1,$2,'open',$3,'task-0076-admin-test-profile',jsonb_build_object('itemId',$4::text,'coins',0))",
      [tid(2), 'open:014-' + item, type, item],
    );
  await q(
    "insert into public.chest_operations(traveler_id,account_id,operation_key,operation_type,source,price_paid,rewards) values($1,$2,'equipment-purchase:014-wrong-owner','equipment-purchase','shop001c:equipment',115,jsonb_build_object('itemId','traveler-shield-rare','catalogVersion','ECONOMY-001C:shop:v1'))",
    [tid(2), uid(3)],
  );
  await check(
    '014 distinguishes all six owned items from source authorization without writing',
    async () => {
      const before = await snap();
      const state = await readAccess();
      assert.equal(state.actor, tid(2));
      for (const id of ids) {
        const item = state.items.find((x) => x.itemId === id);
        assert(item);
        assert.equal(
          item.sourceConfirmed,
          ['traveler-boots', 'traveler-sword-common'].includes(id),
        );
        assert.equal(
          item.reason,
          item.sourceConfirmed ? null : 'acquisition-unconfirmed',
        );
      }
      assert.deepEqual(await snap(), before);
    },
  );
  await check(
    '014 authorized equip/unequip/re-equip/CAS preserve all non-slot data',
    async () => {
      const before = await snap();
      delete before.equipment;
      for (const [slot, item] of [
        ['weapon', 'traveler-sword-common'],
        ['boots', 'traveler-boots'],
      ]) {
        assert.equal((await equip(slot, item, null))[slot], item);
        assert.equal((await equip(slot, item, item))[slot], item);
        await denied(() => equip(slot, null, 'stale'), 'PT409');
        await equip(slot, null, item);
        assert.equal((await equip(slot, item, null))[slot], item);
      }
      const after = await snap();
      delete after.equipment;
      assert.deepEqual(after, before);
    },
  );
  await check(
    '014 never treats admin records, mere possession or another account receipt as authorization',
    async () => {
      const before = await snap();
      for (const [slot, item] of [
        ['helmet', 'traveler-helmet-rare'],
        ['amulet', 'wisdom-amulet'],
        ['armor', 'traveler-armor-uncommon'],
        ['shield', 'traveler-shield-rare'],
      ])
        await denied(() => equip(slot, item, null), '42501');
      assert.deepEqual(await snap(), before);
    },
  );
  await check(
    '014 denies foreign avatar, invalid session, anon/service_role and direct helper execution',
    async () => {
      const before = await snap();
      await denied(() => readAccess(3, tid(2)), '42501');
      await denied(
        () =>
          call(
            2,
            'select public.get_equipment_access($1) x',
            [tid(2)],
            'authenticated',
            uid(999999),
          ),
        '42501',
      );
      for (const role of ['anon', 'service_role'])
        await denied(
          () =>
            call(2, 'select public.get_equipment_access($1) x', [tid(2)], role),
          '42501',
        );
      await denied(
        () =>
          call(
            2,
            "select shop_private.equipment_origin_014($1,$2,'traveler-boots') x",
            [uid(2), tid(2)],
          ),
        '42501',
      );
      assert.deepEqual(await snap(), before);
    },
  );
  await check(
    '014 keeps a legitimately blocked economy blocked without hiding owned items',
    async () => {
      const stamp = (
        await q(
          'select economic_verified_at x from public.travelers where id=$1',
          [tid(2)],
        )
      ).rows[0].x;
      await q(
        'update public.travelers set economic_verified_at=null where id=$1',
        [tid(2)],
      );
      assert(
        (await readAccess()).items.every(
          (x) => x.reason === 'economy-unverified',
        ),
      );
      await denied(
        () => equip('boots', 'traveler-boots', 'traveler-boots'),
        '42501',
      );
      await q(
        'update public.travelers set economic_verified_at=$2 where id=$1',
        [tid(2), stamp],
      );
    },
  );
  await check(
    '014 policy and slot refusals retain precise causes',
    async () => {
      await q('update shop_private.policy set enabled=false where singleton');
      assert(
        (await readAccess()).items.every(
          (item) => item.reason === 'equipment-disabled',
        ),
      );
      await assert.rejects(
        () => equip('boots', 'traveler-boots', 'traveler-boots'),
        (error) =>
          error.code === '42501' &&
          error.message === 'Equipment policy disabled',
      );
      await q('update shop_private.policy set enabled=true where singleton');
      await assert.rejects(
        () => equip('invalid', 'traveler-boots', null),
        (error) =>
          error.code === '42501' && error.message === 'Equipment slot denied',
      );
    },
  );
  await check(
    '014 recovery restores exact wrapper/helper/ACL and preserves all issued history',
    async () => {
      const before = await snap();
      await q(
        wrap(
          resolve(
            'packages/database/proposals/rpg-equipment-fix-014-recovery.sql.in',
          ),
        ),
      );
      assert.deepEqual(await snap(), before);
      assert.deepEqual(await helper(), helperBefore);
      assert.deepEqual(
        (
          await q(
            "select pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure) body,proacl::text acl from pg_proc where oid='shop_private.equip(uuid,text,text,text)'::regprocedure",
          )
        ).rows[0],
        oldWrapper,
      );
    },
  );
}
