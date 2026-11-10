import assert from 'node:assert/strict';
import { Client } from 'pg';
export async function run({
  q,
  as,
  check,
  denied,
  uid,
  tid,
  options,
  connections,
  read,
}) {
  if (process.env.RPG_ECONOMY_001C_RELEASE_ENV === 'TEST') {
    await (
      await import('./economy-001c-release-test-envelope.mjs')
    ).run({ q, as, check, denied, uid, tid, read });
    return;
  }
  const c1 = read(
      'supabase/migrations/20261103045257_economy_001c_community_chests_production.sql',
    ),
    shop = read(
      'supabase/migrations/20261103045303_economy_001c_shop_release_production.sql',
    ),
    equipmentFix = read(
      'supabase/migrations/20261110080001_rpg_equipment_fix_013_production.sql',
    );
  const wrapC = (s) =>
    "BEGIN;SET LOCAL economy001c.target_project='wspafhlbtlpabypzymjo';" +
    s +
    ';COMMIT;';
  const wrap = (s) =>
    "BEGIN;SET LOCAL shop001c.target_project='wspafhlbtlpabypzymjo';SET LOCAL shop001c.price_approval='common40-sword35-armor65-shield115';" +
    s +
    ';COMMIT;';
  const wrapEquipmentFix = (s) =>
    "BEGIN;SET LOCAL equipment013.target_project='wspafhlbtlpabypzymjo';" +
    s +
    ';COMMIT;';
  const definitions = async () =>
    (
      await q(
        "select oid::regprocedure::text signature,pg_get_functiondef(oid) body,proacl::text acl from pg_proc where pronamespace in('public'::regnamespace,'economy_private'::regnamespace) order by 1",
      )
    ).rows;
  const base = await definitions();
  await check(
    'Production community package refuses TEST baseline',
    async () => {
      await denied(() => q(wrapC(c1)), '42501');
      await q('ROLLBACK');
      assert.equal(
        (await q("select to_regnamespace('shop_private') x")).rows[0].x,
        null,
      );
    },
  );
  await q(
    "create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$",
  );
  await q(wrapC(c1));
  await check(
    'Production shop cannot apply before explicit price gate',
    async () => {
      await denied(
        () =>
          q(
            "BEGIN;SET LOCAL shop001c.target_project='wspafhlbtlpabypzymjo';" +
              shop +
              ';COMMIT;',
          ),
        '42501',
      );
      await q('ROLLBACK');
      assert.equal(
        (await q("select to_regnamespace('shop_private') x")).rows[0].x,
        null,
      );
    },
  );
  await q(wrap(shop));
  await check(
    'Empty recovery restores original routines and ACLs without QA schema',
    async () => {
      await q(
        wrap(
          read(
            'packages/database/proposals/economy-001c-shop-release-recovery-empty-prod.sql',
          ),
        ),
      );
      await q(
        wrapC(
          read(
            'packages/database/proposals/economy-001c-recovery-empty-production.sql',
          ),
        ),
      );
      const now = await definitions();
      for (const f of base)
        if (f.signature !== 'release_scope()')
          assert.deepEqual(
            now.find((x) => x.signature === f.signature),
            f,
          );
      assert.equal(
        (await q("select to_regnamespace('shop_private') x")).rows[0].x,
        null,
      );
      await q(wrapC(c1));
      await q(wrap(shop));
      assert.equal(
        (
          await q(
            "select to_regnamespace('shop_qa_private') x,to_regnamespace('arena_qa_private') y",
          )
        ).rows[0].x,
        null,
      );
    },
  );
  await q(
    read('tests/hosted/fixtures/rpg-equipment-fix-013-existing-wrapper.sql'),
  );
  const equipBeforeFix = (
    await q(
      "select pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure) body",
    )
  ).rows[0].body;
  await q(wrapEquipmentFix(equipmentFix));
  const fixedEquipDef = (
    await q(
      "select pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure) body",
    )
  ).rows[0].body;
  const oldAllowedList = equipBeforeFix.match(
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
  const call = async (n, name, args, client, session = uid(5000 + n)) => {
    const c = client ?? { query: q };
    try {
      await c.query('BEGIN');
      await c.query('SET LOCAL ROLE authenticated');
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
      const r = await c.query(name, args);
      await c.query('COMMIT');
      return r.rows[0].x;
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    }
  };
  const claim = (id) =>
    call(2, 'select public.claim_community_chest($1,$2) x', [tid(2), uid(id)]);
  const open = (type, id, c) =>
    call(
      2,
      'select public.open_shop_chest($1,$2,$3) x',
      [tid(2), type, uid(id)],
      c,
    );
  const buy = (kind, offer, id, c) =>
    call(
      2,
      'select public.purchase_shop($1,$2,$3,$4) x',
      [tid(2), kind, offer, uid(id)],
      c,
    );
  const state = (n) => call(n, 'select public.get_shop($1) x', [tid(n)]);
  const snap = async () =>
    (
      await q(
        "select jsonb_build_object('wallets',(select jsonb_agg(t order by traveler_id) from public.wallets t),'inventory',(select jsonb_agg(t order by id) from public.inventory t),'ledger',(select jsonb_agg(t order by id) from public.chest_operations t),'equipment',(select jsonb_agg(t order by traveler_id,slot) from public.equipped_items t)) x",
      )
    ).rows[0].x;
  await q(
    "update economy_private.community_chest_policy set activated_at='2026-01-01'",
  );
  await q(
    'update public.travelers set economic_verified_at=now() where id=$1',
    [tid(2)],
  );
  await q('update public.travelers set economic_verified_at=null where id=$1', [
    tid(3),
  ]);
  const source = async (id, category) => {
    await q(
      "insert into public.guild_missions(id,guild_id,created_by_traveler_id,title,description,mission_type,completion_mode,requires_leader_approval,reward_tier,status,starts_at,community_protocol) values($1,$2,$3,'Isolated source','','practical_activity','leader_approval',true,'normal','published','2026-11-03T03:01Z',1)",
      [uid(id), uid(100), tid(1)],
    );
    await q(
      "insert into guild_activity_private.details(mission_id,kind,category,theme,meeting_type,responsible_id,future_category) values($1,'activity','practical','','digital',$2,$3)",
      [uid(id), tid(1), category],
    );
    await q(
      "insert into public.guild_mission_progress(mission_id,traveler_id,participant_uid,status,approved_at,approved_by_traveler_id,community_revision) values($1,$2,$3,'approved',now(),$4,1)",
      [uid(id), tid(2), uid(2), tid(1)],
    );
    await q(
      'insert into guild_activity_private.future_eligibility(mission_id,owner_id,traveler_id,category,participation_revision,validated) values($1,$2,$3,$4,1,true)',
      [uid(id), uid(2), tid(2), category],
    );
  };
  await check(
    'Legacy unverified avatar stays blocked; no reconciliation or grant occurs',
    async () => {
      const b = await snap();
      assert.equal((await state(3)).reason, 'legacy-reconciliation-required');
      await denied(
        () =>
          call(3, 'select public.purchase_shop($1,$2,$3,$4) x', [
            tid(3),
            'chest',
            'common',
            uid(9000),
          ]),
        '42501',
      );
      await denied(
        () =>
          call(3, 'select public.equip_shop_item($1,$2,$3,$4) x', [
            tid(3),
            'boots',
            'traveler-boots',
            null,
          ]),
        '42501',
      );
      assert.deepEqual(await snap(), b);
    },
  );
  await check(
    'Anonymous service role foreign and stale session cannot purchase',
    async () => {
      for (const role of ['anon', 'service_role'])
        await denied(
          () =>
            as(
              2,
              'select public.purchase_shop($1,$2,$3,$4)',
              [tid(2), 'chest', 'common', uid(9000)],
              role,
            ),
          '42501',
        );
      await denied(
        () =>
          call(3, 'select public.purchase_shop($1,$2,$3,$4) x', [
            tid(2),
            'chest',
            'common',
            uid(9000),
          ]),
        '42501',
      );
      await denied(
        () =>
          call(
            2,
            'select public.purchase_shop($1,$2,$3,$4) x',
            [tid(2), 'chest', 'common', uid(9000)],
            undefined,
            uid(9999),
          ),
        '42501',
      );
    },
  );
  let earned;
  await source(700, 'epic');
  await check(
    'Only verified community opening establishes legitimate own coins',
    async () => {
      assert.equal((await claim(700)).status, 'awarded');
      earned = await open('epic', 800);
      assert([70, 190].includes(earned.coins));
      assert.equal((await state(2)).coins, earned.coins);
      assert((await state(2)).balanceVerified);
    },
  );
  let sword;
  await check(
    'Concurrent production purchases debit existing35 once with no QA budget',
    async () => {
      const c = new Client(options);
      connections.push(c);
      await c.connect();
      const r = await Promise.all([
        buy('equipment', 'traveler-sword-common', 9000),
        buy('equipment', 'traveler-sword-common', 9000, c),
      ]);
      sword = r[0];
      assert.equal(sword.pricePaid, 35);
      assert.equal(r[0].receiptId, r[1].receiptId);
      assert.equal((await state(2)).coins, earned.coins - 35);
      assert.equal(
        (await q("select to_regclass('shop_private.budget_receipts') x"))
          .rows[0].x,
        null,
      );
    },
  );
  await check(
    'Community opening remains eligible after legitimate shop debit',
    async () => {
      await source(701, 'common');
      assert.equal((await claim(701)).status, 'awarded');
      const r = await open('common', 801);
      assert([10, 25].includes(r.coins));
      assert.equal((await state(2)).coins, earned.coins - 35 + r.coins);
      assert((await state(2)).balanceVerified);
    },
  );
  await check(
    'Mixed source stack dispatches community first then purchased chest with one replay receipt',
    async () => {
      await source(702, 'common');
      assert.equal((await claim(702)).status, 'awarded');
      const b = await state(2);
      assert.equal((await buy('chest', 'common', 9001)).pricePaid, 40);
      const community = await open('common', 802);
      assert(community.source.startsWith('community001c:'));
      const shopResult = await open('common', 803);
      assert(shopResult.source.startsWith('shop001c:'));
      const before = await snap();
      const replay = await open('common', 803);
      assert.equal(replay.coins, shopResult.coins);
      assert(replay.duplicate);
      assert.deepEqual(await snap(), before);
      assert.equal(
        (await state(2)).coins,
        b.coins - 40 + community.coins + shopResult.coins,
      );
      assert((await state(2)).balanceVerified);
    },
  );
  await check(
    'Equipment preserves base and published expansion IDs with canonical receipt gates',
    async () => {
      // Isolated fixture for the published non-sale starter boots. This row is
      // seeded only in the ephemeral PostgreSQL test database.
      await q(
        "insert into public.inventory(traveler_id,item_id,quantity,metadata) values($1,'traveler-boots',1,null),($1,'wisdom-amulet',1,jsonb_build_object('source','phase:garden-choice')),($1,'traveler-helmet-rare',1,jsonb_build_object('source','garden-equipment')),($1,'traveler-shield-rare',1,null) on conflict(traveler_id,item_id) do nothing",
        [tid(2)],
      );
      await q(
        "insert into public.inventory(traveler_id,item_id,quantity,metadata) values($1,'equipment-apprentice-sword',1,null) on conflict(traveler_id,item_id) do nothing",
        [tid(2)],
      );
      await q(
        "insert into economy_private.journey_rewards(traveler_id,reward_key) values($1,'phase:garden-choice'),($1,'garden-equipment') on conflict do nothing",
        [tid(2)],
      );
      await q(
        "insert into public.chest_operations(traveler_id,account_id,operation_key,operation_type,chest_type,source,price_paid,rewards) values($1,$2,'equipment-purchase:013-other-owner','equipment-purchase',null,'shop001c:equipment',115,jsonb_build_object('itemId','traveler-shield-rare','catalogVersion','ECONOMY-001C:shop:v1')) on conflict do nothing",
        [tid(3), uid(3)],
      );
      await q(
        "insert into public.equipped_items(traveler_id,slot,item_id) values($1,'weapon','equipment-apprentice-sword') on conflict(traveler_id,slot) do update set item_id=excluded.item_id",
        [tid(2)],
      );
      const b = (
        await q(
          'select to_jsonb(t) x from public.traveler_stats t where traveler_id=$1',
          [tid(2)],
        )
      ).rows[0].x;
      const before = await snap();
      delete before.equipment;
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'boots',
        'traveler-boots',
        null,
      ]);
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'boots',
        null,
        'traveler-boots',
      ]);
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'boots',
        'traveler-boots',
        null,
      ]);
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'weapon',
        'traveler-sword-common',
        'equipment-apprentice-sword',
      ]);
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'amulet',
        'wisdom-amulet',
        null,
      ]);
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'amulet',
        null,
        'wisdom-amulet',
      ]);
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'helmet',
        'traveler-helmet-rare',
        null,
      ]);
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'helmet',
        null,
        'traveler-helmet-rare',
      ]);
      // Same-item replay exercises the current-slot compare-and-set path.
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'weapon',
        'traveler-sword-common',
        'traveler-sword-common',
      ]);
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'weapon',
        null,
        'traveler-sword-common',
      ]);
      await call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
        tid(2),
        'weapon',
        'traveler-sword-common',
        null,
      ]);
      await denied(
        () =>
          call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
            tid(2),
            'armor',
            'traveler-sword-common',
            null,
          ]),
        '42501',
      );
      await denied(
        () =>
          call(3, 'select public.equip_shop_item($1,$2,$3,$4) x', [
            tid(2),
            'boots',
            'traveler-boots',
            null,
          ]),
        '42501',
      );
      for (const role of ['anon', 'service_role'])
        await denied(
          () =>
            as(
              2,
              'select public.equip_shop_item($1,$2,$3,$4)',
              [tid(2), 'boots', 'traveler-boots', null],
              role,
            ),
          '42501',
        );
      await denied(
        () =>
          call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
            tid(2),
            'boots',
            'equipment-reinforced-tunic',
            null,
          ]),
        '42501',
      );
      await denied(
        () =>
          call(2, 'select public.equip_shop_item($1,$2,$3,$4) x', [
            tid(2),
            'shield',
            'traveler-shield-rare',
            null,
          ]),
        '42501',
      );
      const after = await snap();
      delete after.equipment;
      assert.deepEqual(after, before);
      assert.deepEqual(
        (
          await q(
            "select coalesce(jsonb_object_agg(slot,item_id),'{}'::jsonb) x from public.equipped_items where traveler_id=$1",
            [tid(2)],
          )
        ).rows[0].x,
        { boots: 'traveler-boots', weapon: 'traveler-sword-common' },
      );
      assert.deepEqual(
        (
          await q(
            'select to_jsonb(t) x from public.traveler_stats t where traveler_id=$1',
            [tid(2)],
          )
        ).rows[0].x,
        b,
      );
    },
  );
  await check(
    'Equipment fix recovery restores the exact prior wrapper and preserves grants',
    async () => {
      await q(
        wrapEquipmentFix(
          read(
            'packages/database/proposals/rpg-equipment-fix-013-recovery-production.sql',
          ),
        ),
      );
      assert.equal(
        (
          await q(
            "select pg_get_functiondef('shop_private.equip(uuid,text,text,text)'::regprocedure) body",
          )
        ).rows[0].body,
        equipBeforeFix,
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
  await check(
    'Receipt identity cannot change offer; cards and unapproved tiers stay closed',
    async () => {
      await denied(() => buy('chest', 'common', 9000), '22023');
      await denied(() => buy('card', 'healing', 9003), '22023');
      await denied(() => buy('chest', 'rare', 9003), '22023');
    },
  );
  await check(
    'Failure after purchase debit rolls back balance inventory and receipt',
    async () => {
      await source(703, 'epic');
      assert.equal((await claim(703)).status, 'awarded');
      await open('epic', 804);
      assert((await state(2)).coins >= 65);
      const b = await snap();
      await q(
        "create function public.isolated_release_failure() returns trigger language plpgsql as $$begin raise exception 'isolated failure' using errcode='PT500';end $$;create trigger isolated_release_failure before insert on public.chest_operations for each row when(new.operation_type='equipment-purchase') execute function public.isolated_release_failure()",
      );
      await denied(
        () => buy('equipment', 'traveler-armor-uncommon', 9003),
        'PT500',
      );
      await q(
        'drop trigger isolated_release_failure on public.chest_operations;drop function public.isolated_release_failure()',
      );
      assert.deepEqual(await snap(), b);
    },
  );
  await check(
    'Unexpected balance suspends once with private immutable reason and no auto release',
    async () => {
      await q('update public.wallets set coins=coins+1 where traveler_id=$1', [
        tid(2),
      ]);
      assert.equal((await buy('chest', 'common', 9004)).status, 'suspended');
      assert.equal((await buy('chest', 'common', 9004)).status, 'suspended');
      assert.equal(
        (await q('select count(*)::int n from shop_private.holds')).rows[0].n,
        1,
      );
      await denied(
        () => q("update shop_private.holds set reason='source-unavailable'"),
        '42501',
      );
      await q('update public.wallets set coins=coins-1 where traveler_id=$1', [
        tid(2),
      ]);
      assert.equal((await state(2)).reason, 'suspended');
      assert.equal((await buy('chest', 'common', 9005)).status, 'suspended');
    },
  );
  await check(
    'Containment preserves issued history; destructive recovery refuses it',
    async () => {
      await denied(
        () =>
          q(
            wrap(
              read(
                'packages/database/proposals/economy-001c-shop-release-recovery-empty-prod.sql',
              ),
            ),
          ),
        '42501',
      );
      await q('ROLLBACK');
      const b = await snap();
      await q(
        wrap(
          read(
            'packages/database/proposals/economy-001c-shop-release-containment-prod.sql',
          ),
        ),
      );
      assert.deepEqual(await snap(), b);
      await denied(() => buy('chest', 'common', 9006), '42501');
      assert.equal(
        (
          await q(
            "select has_function_privilege('authenticated','public.claim_community_chest(uuid,uuid)','execute') x",
          )
        ).rows[0].x,
        true,
      );
    },
  );
}
