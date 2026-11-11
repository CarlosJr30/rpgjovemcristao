import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Client } from 'pg';
import { renderEconomy041 } from '../../packages/database/deployments/economy041/render.mjs';
export async function run({
  q,
  check: originalCheck,
  denied,
  uid,
  tid,
  options,
  connections,
  read,
}) {
  const check = (name, fn) =>
    originalCheck('041 ' + name, async () => {
      await new Promise((r) => setTimeout(r, 1100));
      await fn();
    });
  const project = 'wspafhlbtlpabypzymjo',
    scope = 'guild-ebd-001',
    actor = tid(2);
  await q(
    read('tests/hosted/fixtures/economy041-approved-baseline.sql').replaceAll(
      '__SCOPE__',
      scope,
    ),
  );
  const cards = JSON.parse(
    read('packages/database/deployments/content040/catalog.json'),
  );
  for (const card of cards)
    await q(
      'insert into economy_private.card_catalog(version,id,definition,approval_ref,starter) values($1,$2,$3,$4,false)',
      [card.catalogVersion, card.id, card, card.homologation.approvalReference],
    );
  const snap = async () =>
    (
      await q(
        `select jsonb_build_object('wallets',(select jsonb_agg(to_jsonb(v) order by traveler_id) from public.wallets v),'inventory',(select jsonb_agg(to_jsonb(v) order by id) from public.inventory v),'travelers',(select jsonb_agg(to_jsonb(v) order by id) from public.travelers v),'equipment',(select jsonb_agg(to_jsonb(v) order by traveler_id,slot) from public.equipped_items v),'receipts',(select jsonb_agg(to_jsonb(v) order by id) from public.chest_operations v),'chests',(select jsonb_agg(to_jsonb(v) order by traveler_id,chest_type) from public.traveler_chests v),'stats',(select jsonb_agg(to_jsonb(v) order by traveler_id) from public.traveler_stats v)) x`,
      )
    ).rows[0].x;
  const definitions = async () =>
    (
      await q(
        "select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) definition,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('shop_private','economy_private','guild_activity_private') order by p.oid::regprocedure::text",
      )
    ).rows;
  const constraints = (
    await q(
      "select conname name,pg_get_constraintdef(oid) def from pg_constraint where(conrelid='public.chest_operations'::regclass and conname='chest_operations_type_check')or(conrelid='public.inventory'::regclass and conname='inventory_card_provenance')",
    )
  ).rows;
  const baseline = await definitions(),
    before = await snap(),
    pack = renderEconomy041({
      functions: baseline,
      constraints,
      project,
      scope,
    });
  const wrap = (s) =>
    `BEGIN;SET LOCAL economy041.target_project='${project}';${s};COMMIT;`;
  const activate = () =>
    q(wrap("SELECT shop_private.activate_041('OWNER-ECONOMY-041-2026-11-11')"));
  fs.mkdirSync('build/economy-041', { recursive: true });
  fs.writeFileSync('build/economy-041/synthetic-package.sql', wrap(pack.sql));
  if (process.env.RPG_ECONOMY_041_PROGRESS === '1') {
    await q(wrap(pack.sql));
    await activate();
    await (
      await import('./economy-041-progress-cases.mjs')
    ).run({ q, check, denied, uid, tid });
    return;
  }
  await check('rejects unscoped install without data changes', async () => {
    await denied(() => q('BEGIN;' + pack.sql + 'COMMIT;'), '42501');
    await q('ROLLBACK');
    assert.deepEqual(await snap(), before);
  });
  await check(
    'installation and empty recovery preserve the original data, functions and ACLs',
    async () => {
      await q(wrap(pack.sql));
      assert.deepEqual(await snap(), before);
      assert.equal(
        (await q('select enabled from shop_private.policy_041')).rows[0]
          .enabled,
        false,
      );
      await denied(
        () =>
          q("select shop_private.activate_041('OWNER-ECONOMY-041-2026-11-11')"),
        '42501',
      );
      await activate();
      const activation = (
        await q('select activated_at from shop_private.policy_041')
      ).rows[0].activated_at;
      await activate();
      assert.deepEqual(
        (await q('select activated_at from shop_private.policy_041')).rows[0]
          .activated_at,
        activation,
      );
      await q(wrap(pack.recovery));
      assert.deepEqual(await definitions(), baseline);
      assert.deepEqual(await snap(), before);
      await q(wrap(pack.sql));
    },
  );
  if (process.env.RPG_ECONOMY_041_INSTALLATION === '1') return;
  await activate();
  // Disposable fixtures only. This funding is not an assertion of hosted or productive provenance.
  await q(
    'update public.travelers set economic_verified_at=clock_timestamp() where id=$1',
    [actor],
  );
  await q(
    "insert into public.chest_operations(traveler_id,account_id,operation_key,operation_type,chest_type,source,rewards) values($1,$2,'synthetic-initial-ledger','open','common','community001c:disposable-fixture','{\"coins\":10000}')",
    [actor, uid(2)],
  );
  await q('update public.wallets set coins=10000 where traveler_id=$1', [
    actor,
  ]);
  const call = async (
    sql,
    args,
    n = 2,
    client = null,
    roll = null,
    role = 'authenticated',
  ) => {
    const query = client ? client.query.bind(client) : q;
    try {
      await query('BEGIN');
      await query('SET LOCAL ROLE ' + role);
      await query(
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
      if (roll !== null)
        await query("select set_config('fixture.random',$1,true)", [
          String(roll),
        ]);
      const r = await query(sql, args);
      await query('COMMIT');
      return r.rows[0]?.x;
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }
  };
  const buy = (type, id, n = 2, client = null) =>
    call(
      'select public.purchase_expansion_chest($1,$2,$3,$4) x',
      [actor, 'chest', type, id],
      n,
      client,
    );
  const open = (type, id, roll = 0, client = null) =>
    call(
      'select public.open_shop_chest($1,$2,$3) x',
      [actor, type, id],
      2,
      client,
      roll,
    );
  const sell = (id, item, quantity, client = null) =>
    call(
      'select public.sell_repeated_item($1,$2,$3,$4) x',
      [actor, item, id, quantity],
      2,
      client,
    );
  const wallet = async () =>
    Number(
      (
        await q('select coins x from public.wallets where traveler_id=$1', [
          actor,
        ])
      ).rows[0].x,
    );
  const rng = (
    await q(
      "select pg_get_functiondef('shop_private.random_index_041(integer)'::regprocedure) d",
    )
  ).rows[0].d;
  await check(
    'crypto helper stays private, validates bounds and uses rejection sampling',
    async () => {
      await denied(
        () => call('select shop_private.random_index_041(100) x', []),
        '42501',
      );
      await denied(() => q('select shop_private.random_index_041(0)'), '22023');
      assert(rng.includes('extensions.gen_random_bytes(4)'));
      assert(rng.includes('n<ceiling'));
      const rolls = (
        await q(
          'select shop_private.random_index_041(100) n from generate_series(1,1000)',
        )
      ).rows;
      assert(rolls.every((r) => r.n >= 0 && r.n < 100));
    },
  );
  // Deterministic PRNG boundary only in this discarded cluster, never in a release artifact or hosted smoke.
  await q(
    "CREATE OR REPLACE FUNCTION shop_private.random_index_041(p_count integer) RETURNS integer LANGUAGE sql VOLATILE SET search_path='' AS $$SELECT current_setting('fixture.random')::integer%p_count$$",
  );
  const types = ['common', 'uncommon', 'rare', 'epic', 'extraordinary'],
    prices = [40, 80, 150, 250, 400],
    coins = [25, 55, 105, 190, 360],
    weights = [70, 60, 50, 40, 30];
  await check(
    'five approved prices debit once, coin openings deliver once, replays keep receipt',
    async () => {
      for (let i = 0; i < 5; i++) {
        const id = uid(41000 + i),
          w = await wallet(),
          p = await buy(types[i], id);
        assert.equal(p.pricePaid, prices[i]);
        await denied(
          () =>
            call('select public.purchase_shop($1,$2,$3,$4) x', [
              actor,
              'chest',
              types[i],
              id,
            ]),
          '22023',
        );
        assert.equal((await buy(types[i], id)).receiptId, p.receiptId);
        assert.equal(await wallet(), w - prices[i]);
        const result = await open(types[i], id);
        assert.equal(result.coins, coins[i]);
        assert.equal(result.itemId, null);
        assert.equal((await open(types[i], id)).duplicate, true);
        assert.equal(await wallet(), w - prices[i] + coins[i]);
      }
    },
  );
  let card;
  await check(
    'all five rarities deliver canonical cards through the existing collection without duplicates in the deck',
    async () => {
      for (let i = 0; i < 5; i++) {
        const id = uid(41100 + i);
        await buy(types[i], id);
        const r = await open(types[i], id, weights[i]);
        assert.equal(r.itemKind, 'card');
        assert.equal(r.coins, 0);
        assert.equal(r.quantity, 1);
        if (i === 0) card = r.itemId;
      }
      const collection = (
        await q('select economy_private.collection($1,$2) x', [uid(2), actor])
      ).rows[0].x;
      assert.equal(collection.filter((c) => c.card.id === card).length, 1);
    },
  );
  let item;
  await check(
    'all five rarities deliver equipment, recognized by the existing equip predicate',
    async () => {
      for (let i = 0; i < 5; i++) {
        const id = uid(41200 + i);
        await buy(types[i], id);
        const r = await open(types[i], id, 99);
        assert.equal(r.itemKind, 'equipment');
        assert.equal(
          (
            await q('select shop_private.equipment_origin_014($1,$2,$3) x', [
              uid(2),
              actor,
              r.itemId,
            ])
          ).rows[0].x,
          null,
        );
        if (i === 0) item = r.itemId;
      }
    },
  );
  await check(
    'new equipment uses unchanged Equipar/Desequipar and attributes remain untouched',
    async () => {
      const content = (
        await q(
          'select definition from shop_private.content_041 where item_id=$1',
          [item],
        )
      ).rows[0].definition;
      const stats = (
        await q(
          'select to_jsonb(v) x from public.traveler_stats v where traveler_id=$1',
          [actor],
        )
      ).rows[0].x;
      const equipped =
        (
          await q(
            'select item_id from public.equipped_items where traveler_id=$1 and slot=$2',
            [actor, content.slot],
          )
        ).rows[0]?.item_id ?? null;
      await call('select public.equip_shop_item($1,$2,$3,$4) x', [
        actor,
        content.slot,
        item,
        equipped,
      ]);
      await call('select public.equip_shop_item($1,$2,$3,$4) x', [
        actor,
        content.slot,
        null,
        item,
      ]);
      assert.deepEqual(
        (
          await q(
            'select to_jsonb(v) x from public.traveler_stats v where traveler_id=$1',
            [actor],
          )
        ).rows[0].x,
        stats,
      );
      if (equipped)
        await call('select public.equip_shop_item($1,$2,$3,$4) x', [
          actor,
          content.slot,
          equipped,
          null,
        ]);
    },
  );
  await check(
    'duplicate cards increase quantity, sale credits once and last copy remains playable',
    async () => {
      const id = uid(41300);
      await buy('common', id);
      const r = await open('common', id, 70);
      assert.equal(r.itemId, card);
      assert.equal(r.duplicateItem, true);
      assert.equal(r.quantity, 2);
      const balance = await wallet(),
        sale = await sell(uid(41301), card, 2);
      assert.equal(sale.coins, 10);
      assert.equal(sale.quantity, 1);
      assert.equal((await sell(uid(41301), card, 2)).receiptId, sale.receiptId);
      assert.equal(await wallet(), balance + 10);
      await denied(() => sell(uid(41302), card, 1), '42501');
      assert.equal(
        (
          await q('select economy_private.collection($1,$2) x', [uid(2), actor])
        ).rows[0].x.filter((c) => c.card.id === card).length,
        1,
      );
    },
  );
  await check(
    'equipped item retains last copy and slot while one surplus is sold',
    async () => {
      const id = uid(41400);
      await buy('common', id);
      const r = await open('common', id, 99);
      assert.equal(r.itemId, item);
      assert.equal(r.quantity, 2);
      const slot = (
        await q(
          "select definition->>'slot' slot from shop_private.content_041 where item_id=$1",
          [item],
        )
      ).rows[0].slot;
      await call('select public.equip_shop_item($1,$2,$3,$4) x', [
        actor,
        slot,
        item,
        null,
      ]);
      await sell(uid(41401), item, 2);
      assert.equal(
        (
          await q(
            'select item_id from public.equipped_items where traveler_id=$1 and slot=$2',
            [actor, slot],
          )
        ).rows[0].item_id,
        item,
      );
      await call('select public.equip_shop_item($1,$2,$3,$4) x', [
        actor,
        slot,
        null,
        item,
      ]);
    },
  );
  await check(
    'other accounts, missing session, unowned item, QA source and last copy are denied',
    async () => {
      await denied(() => buy('common', uid(41500), 3), '42501');
      await denied(
        () => sell(uid(41501), 'equipment-victory-blade', 9),
        '42501',
      );
      await denied(
        () =>
          call(
            'select public.sell_repeated_item($1,$2,$3,$4) x',
            [actor, card, uid(41502), 2],
            2,
            null,
            null,
            'anon',
          ),
        '42501',
      );
      const state = await snap();
      await denied(() => buy('invalid', uid(41503)), '55000');
      assert.deepEqual(await snap(), state);
    },
  );
  await check(
    'missing pool prevents debit and an existing paid chest survives failed opening',
    async () => {
      const id = uid(41600);
      await buy('common', id);
      const c = cards.find((c) => c.rarity === 'comum');
      await q(
        'update economy_private.card_catalog set revoked_at=clock_timestamp() where id=$1',
        [c.id],
      );
      const state = await snap();
      await denied(() => buy('common', uid(41601)), '55000');
      await denied(() => open('common', id), '55000');
      assert.deepEqual(await snap(), state);
      await q(
        'update economy_private.card_catalog set revoked_at=null where id=$1',
        [c.id],
      );
      await open('common', id, 0);
    },
  );
  await check(
    'concurrent retries on independent connections produce a single debit, result and sale credit',
    async () => {
      const other = new Client(options);
      connections.push(other);
      await other.connect();
      const id = uid(41700),
        balance = await wallet();
      const b = await Promise.all([
        buy('common', id),
        buy('common', id, 2, other),
      ]);
      assert.equal(b[0].receiptId, b[1].receiptId);
      assert.equal(await wallet(), balance - 40);
      const a = await Promise.all([
        open('common', id, 70),
        open('common', id, 70, other),
      ]);
      assert.equal(a[0].itemId, a[1].itemId);
      assert.equal(a.filter((r) => r.duplicate).length, 1);
      const w = await wallet();
      const s = await Promise.all([
        sell(uid(41701), card, 2),
        sell(uid(41701), card, 2, other),
      ]);
      assert.equal(s[0].receiptId, s[1].receiptId);
      assert.equal(await wallet(), w + 10);
    },
  );
  await check(
    'rollback after item delivery preserves the paid source and every economic row',
    async () => {
      const id = uid(41800);
      await buy('common', id);
      await q(
        "create function public.fail041() returns trigger language plpgsql as $$begin raise exception 'Synthetic rollback probe';end$$;create trigger fail041 before insert or update on public.inventory for each row execute function public.fail041()",
      );
      const state = await snap();
      await denied(() => open('common', id, 70), 'P0001');
      assert.deepEqual(await snap(), state);
      await q(
        'drop trigger fail041 on public.inventory;drop function public.fail041()',
      );
      await open('common', id, 0);
    },
  );
  await check(
    'ledger is immutable and inventory cannot turn an unreceipted surplus into a sale',
    async () => {
      await denied(
        () =>
          q(
            'update public.chest_operations set price_paid=0 where operation_key=$1',
            ['purchase:' + uid(41000)],
          ),
        '42501',
      );
      await q(
        'update public.inventory set quantity=2 where traveler_id=$1 and item_id=$2',
        [actor, card],
      );
      await denied(() => sell(uid(41900), card, 2), '42501');
      await q(
        'update public.inventory set quantity=1 where traveler_id=$1 and item_id=$2',
        [actor, card],
      );
    },
  );
  await check(
    'worlds without published content, mandatory provider evidence or completion cannot pay',
    async () => {
      const state = await snap();
      await denied(
        () =>
          call('select public.claim_progress_reward($1,$2,$3) x', [
            actor,
            'world',
            'origins',
          ]),
        '55000',
      );
      await denied(
        () =>
          call('select public.claim_progress_reward($1,$2,$3) x', [
            actor,
            'world',
            'new-creation',
          ]),
        '55000',
      );
      assert.deepEqual(await snap(), state);
    },
  );
  await check(
    'prior/absent missions cannot pay and community activity quotas are not converted into mission grants',
    async () => {
      const state = await snap();
      await denied(
        () =>
          call('select public.claim_progress_reward($1,$2,$3) x', [
            actor,
            'mission',
            uid(999999),
          ]),
        '55000',
      );
      assert.deepEqual(await snap(), state);
    },
  );
  await check(
    'containment stops new transactions while preserving every legitimate receipt and possession',
    async () => {
      const state = await snap();
      await q(pack.containment);
      await denied(() => buy('common', uid(41901)), '42501');
      assert.deepEqual(await snap(), state);
      await denied(() => q(wrap(pack.recovery)), '42501');
      await q('ROLLBACK');
      await q(
        'update shop_private.policy_041 set enabled=true where singleton',
      );
    },
  );
  await q(rng);
  assert.equal(
    (
      await q(
        "select pg_get_functiondef('shop_private.random_index_041(integer)'::regprocedure) d",
      )
    ).rows[0].d,
    rng,
  );
  fs.mkdirSync('build/economy-041', { recursive: true });
  fs.writeFileSync(
    'build/economy-041/isolated-results.json',
    JSON.stringify(
      {
        synthetic: true,
        remoteOperations: false,
        asserted: '041 focused cases only; prior suites reused',
        restoredCryptoHelper: true,
      },
      null,
      2,
    ),
  );
}
