import assert from 'node:assert/strict';
export async function run({ q, as, check, denied, uid, tid, read }) {
  const wrap = (s, setting) =>
    'BEGIN;SET LOCAL ' + setting + "='wkdvdzfkbwvhyjmamrsg';" + s + ';COMMIT;';
  await q(
    wrap(
      read(
        'supabase/migrations/20261102135323_economy_001c_community_chests_test.sql',
      ),
      'economy001c.target_project',
    ),
  );
  await q(read('tests/hosted/fixtures/economy-001c-owned-equipment.sql'));
  await q(
    wrap(
      read('supabase/migrations/20261103034651_economy_001c_shop_qa_test.sql'),
      'shop001c.target_project',
    ),
  );
  await q(
    "update public.travelers set name='QA Loja',xp=0,level=1,economic_verified_at=now() where id=$1",
    [tid(3)],
  );
  await q('delete from public.guild_members where traveler_id=$1', [tid(3)]);
  await q("SET shop001c.target_project='wkdvdzfkbwvhyjmamrsg'");
  await q(
    "select shop_qa_private.grant_budget($1,$2,'Isolated previously approved QA setup',$3)",
    [uid(3), tid(3), uid(9990)],
  );
  const defs = async () =>
    (
      await q(
        "select oid::regprocedure::text signature,pg_get_functiondef(oid) body,proacl::text acl from pg_proc where pronamespace in('public'::regnamespace,'economy_private'::regnamespace,'shop_qa_private'::regnamespace) order by 1",
      )
    ).rows;
  const original = await defs();
  await check(
    'Incremental TEST release preserves existing QA authority and budget',
    async () => {
      await q(
        wrap(
          read(
            'supabase/migrations/20261103045300_economy_001c_shop_release_test.sql',
          ),
          'shop001c.target_project',
        ),
      );
      const now = await defs();
      for (const f of original)
        if (
          f.signature !==
          'economy_private.open_community_chest_001c(uuid,text,uuid)'
        )
          assert.deepEqual(
            now.find((x) => x.signature === f.signature),
            f,
          );
      assert.equal(
        (
          await q('select coins from public.wallets where traveler_id=$1', [
            tid(3),
          ])
        ).rows[0].coins,
        255,
      );
      assert.equal(
        (await q('select count(*)::int n from shop_qa_private.budget_receipts'))
          .rows[0].n,
        1,
      );
    },
  );
  await q(
    read('tests/hosted/fixtures/rpg-equipment-fix-013-existing-wrapper.sql'),
  );
  const oldEquipDef = (
    await q(
      "select pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure) body",
    )
  ).rows[0].body;
  await q(
    wrap(
      read('supabase/migrations/20261110121538_rpg_equipment_fix_013_test.sql'),
      'equipment013.target_project',
    ),
  );
  const fixedEquipDef = (
    await q(
      "select pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure) body",
    )
  ).rows[0].body;
  const oldAllowedList = oldEquipDef.match(
    /p_item\s+NOT\s+IN\s*\(([^)]*)\)/s,
  )?.[1];
  const newAllowedList = fixedEquipDef.match(
    /p_item\s+NOT\s+IN\s*\(([^)]*)\)/s,
  )?.[1];
  assert(oldAllowedList);
  assert(newAllowedList);
  const previouslySupportedIds = [...oldAllowedList.matchAll(/'([^']+)'/g)].map(
    (match) => match[1],
  );
  const currentlySupportedIds = new Set(
    [...newAllowedList.matchAll(/'([^']+)'/g)].map((match) => match[1]),
  );
  assert.equal(new Set(previouslySupportedIds).size, 40);
  for (const id of previouslySupportedIds)
    assert(currentlySupportedIds.has(id));
  const equip = async (
    slot,
    item,
    expected,
    actor = 2,
    target = tid(actor),
  ) => {
    try {
      await q('BEGIN');
      await q('SET LOCAL ROLE authenticated');
      await q(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          uid(actor),
          JSON.stringify({
            sub: uid(actor),
            session_id: uid(5000 + actor),
            is_anonymous: false,
          }),
        ],
      );
      const r = await q('select public.equip_shop_item($1,$2,$3,$4)', [
        target,
        slot,
        item,
        expected,
      ]);
      await q('COMMIT');
      return r.rows[0];
    } catch (error) {
      await q('ROLLBACK');
      throw error;
    }
  };
  await check(
    '013 equips and re-equips only owned base items; deny paths preserve player state',
    async () => {
      await q(
        'update public.travelers set economic_verified_at=now() where id=$1',
        [tid(2)],
      );
      await q(
        "insert into public.inventory(traveler_id,item_id,quantity,metadata) values($1,'traveler-boots',1,null),($1,'traveler-sword-common',1,null),($1,'traveler-shield-rare',1,null),($1,'wisdom-amulet',1,jsonb_build_object('source','phase:garden-choice')),($1,'traveler-helmet-rare',1,jsonb_build_object('source','garden-equipment'))",
        [tid(2)],
      );
      await q(
        "insert into public.inventory(traveler_id,item_id,quantity,metadata) values($1,'equipment-apprentice-sword',1,null)",
        [tid(2)],
      );
      await q(
        "insert into economy_private.journey_rewards(traveler_id,reward_key) values($1,'phase:garden-choice'),($1,'garden-equipment') on conflict do nothing",
        [tid(2)],
      );
      await q(
        "insert into public.chest_operations(traveler_id,account_id,operation_key,operation_type,chest_type,source,price_paid,rewards) values($1,$2,'shop-open:013-fixture','open','common','shop001c:equipment-fix-013',null,jsonb_build_object('itemId','traveler-sword-common','catalogVersion','ECONOMY-001C:shop:v1','chestType','common'))",
        [tid(2), uid(2)],
      );
      await q(
        "insert into public.chest_operations(traveler_id,account_id,operation_key,operation_type,chest_type,source,price_paid,rewards) values($1,$2,'equipment-purchase:013-other-owner','equipment-purchase',null,'shop001c:equipment',115,jsonb_build_object('itemId','traveler-shield-rare','catalogVersion','ECONOMY-001C:shop:v1'))",
        [tid(3), uid(3)],
      );
      await q(
        "insert into public.equipped_items(traveler_id,slot,item_id) values($1,'weapon','equipment-apprentice-sword') on conflict(traveler_id,slot) do update set item_id=excluded.item_id",
        [tid(2)],
      );
      const before = (
        await q(
          "select jsonb_build_object('wallet',(select to_jsonb(w) from public.wallets w where traveler_id=$1),'inventory',(select jsonb_agg(to_jsonb(i) order by id) from public.inventory i where traveler_id=$1),'receipts',(select jsonb_agg(to_jsonb(r) order by id) from public.chest_operations r where traveler_id=$1),'equipment',(select jsonb_agg(to_jsonb(e) order by slot) from public.equipped_items e where traveler_id=$1),'stats',(select to_jsonb(s) from public.traveler_stats s where traveler_id=$1)) x",
          [tid(2)],
        )
      ).rows[0].x;
      delete before.equipment;
      await equip('boots', 'traveler-boots', null);
      await denied(() => equip('boots', null, null), 'PT409');
      await equip('boots', null, 'traveler-boots');
      await equip('boots', 'traveler-boots', null);
      await equip('boots', null, 'traveler-boots');
      await equip(
        'weapon',
        'traveler-sword-common',
        'equipment-apprentice-sword',
      );
      await denied(() => equip('weapon', null, null), 'PT409');
      await equip('weapon', null, 'traveler-sword-common');
      await equip('weapon', 'traveler-sword-common', null);
      await equip('amulet', 'wisdom-amulet', null);
      await equip('amulet', null, 'wisdom-amulet');
      await equip('helmet', 'traveler-helmet-rare', null);
      await equip('helmet', null, 'traveler-helmet-rare');
      await denied(
        () => equip('armor', 'traveler-sword-common', null),
        '42501',
      );
      await denied(
        () => equip('shield', 'traveler-shield-rare', null),
        '42501',
      );
      await denied(() => equip('boots', 'traveler-boots', null, 3), '42501');
      await denied(
        () => equip('boots', 'traveler-boots', null, 3, tid(2)),
        '42501',
      );
      await denied(
        () => equip('armor', 'equipment-reinforced-tunic', null),
        '42501',
      );
      const after = (
        await q(
          "select jsonb_build_object('wallet',(select to_jsonb(w) from public.wallets w where traveler_id=$1),'inventory',(select jsonb_agg(to_jsonb(i) order by id) from public.inventory i where traveler_id=$1),'receipts',(select jsonb_agg(to_jsonb(r) order by id) from public.chest_operations r where traveler_id=$1),'equipment',(select jsonb_agg(to_jsonb(e) order by slot) from public.equipped_items e where traveler_id=$1),'stats',(select to_jsonb(s) from public.traveler_stats s where traveler_id=$1)) x",
          [tid(2)],
        )
      ).rows[0].x;
      delete after.equipment;
      assert.deepEqual(after, before);
      assert.deepEqual(
        (
          await q(
            "select coalesce(jsonb_object_agg(slot,item_id),'{}'::jsonb) x from public.equipped_items where traveler_id=$1",
            [tid(2)],
          )
        ).rows[0].x,
        { weapon: 'traveler-sword-common' },
      );
    },
  );
  await check(
    '013 recovery restores the exact prior TEST wrapper and ACL without data changes',
    async () => {
      await q(
        wrap(
          read(
            'packages/database/proposals/rpg-equipment-fix-013-recovery-test.sql',
          ),
          'equipment013.target_project',
        ),
      );
      const restoredEquipDef = (
        await q(
          "select pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure) body",
        )
      ).rows[0].body;
      assert.equal(restoredEquipDef, oldEquipDef);
      assert.equal(
        (
          await q(
            "select md5(replace(pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure),E'\\r\\n',E'\\n')) hash",
          )
        ).rows[0].hash,
        'c7512be2cccaf6d4d9438c76bd8bbff2',
      );
      assert.equal(
        (
          await q(
            "select proacl::text acl from pg_proc where oid='shop_private.equip(uuid,text,text,text)'::regprocedure",
          )
        ).rows[0].acl,
        '{postgres=X/postgres,authenticated=X/postgres}',
      );
    },
  );
  const call = async (name, args) => {
    try {
      await q('BEGIN');
      await q('SET LOCAL ROLE authenticated');
      await q(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          uid(3),
          JSON.stringify({
            sub: uid(3),
            session_id: uid(5003),
            is_anonymous: false,
          }),
        ],
      );
      const r = await q(name, args);
      await q('COMMIT');
      return r.rows[0].x;
    } catch (e) {
      await q('ROLLBACK');
      throw e;
    }
  };
  await check(
    'QA balance cannot fund release purchases; original QA access remains separate',
    async () => {
      const state = await call('select public.get_shop($1) x', [tid(3)]);
      assert(!state.enabled);
      assert.equal(
        (
          await call('select public.purchase_shop($1,$2,$3,$4) x', [
            tid(3),
            'chest',
            'common',
            uid(9991),
          ])
        ).status,
        'suspended',
      );
      assert.equal(
        (
          await q('select coins from public.wallets where traveler_id=$1', [
            tid(3),
          ])
        ).rows[0].coins,
        255,
      );
      assert((await call('select public.get_qa_shop($1) x', [tid(3)])).enabled);
      await denied(() => as(3, 'select * from shop_private.holds'), '42501');
    },
  );
}
