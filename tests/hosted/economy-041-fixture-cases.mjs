import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderFixture041 } from '../../packages/database/deployments/economy041/render-fixture.mjs';
export async function run({ q, check, denied, uid, tid }) {
  const owner = uid(2),
    actor = tid(2),
    nonce = uid(44100);
  // Disposable setup mirrors the prior 35 credit already spent on the legitimate sword.
  await q(
    'update public.travelers set economic_verified_at=clock_timestamp() where id=$1',
    [actor],
  );
  await q(
    "insert into shop_qa_private.profiles(account_id,traveler_id,approval_ref,enabled) values($1,$2,'FIX014:TEST-FIXTURE35:OWNER-APPROVED-2026-11-10',false)",
    [owner, actor],
  );
  await q(
    "insert into shop_qa_private.budget_receipts(account_id,traveler_id,amount,nonce,reason) values($1,$2,35,$3,'FIX014 funded TEST fixture; not earned resources; owner approved 2026-11-10')",
    [owner, actor, uid(44099)],
  );
  await q('select public.add_coins($1,35)', [actor]);
  const player = async (sql, args, { deterministicLoot = false } = {}) => {
    try {
      await q('BEGIN;SET LOCAL ROLE authenticated');
      await q(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          owner,
          JSON.stringify({
            sub: owner,
            session_id: uid(5002),
            is_anonymous: false,
          }),
        ],
      );
      if (deterministicLoot)
        await q("select set_config('fixture.random_counter','0',true)");
      const r = await q(sql, args);
      await q('COMMIT');
      return r.rows[0]?.x;
    } catch (e) {
      await q('ROLLBACK');
      throw e;
    }
  };
  await player(
    "select public.purchase_shop($1,'equipment','traveler-sword-common',$2) x",
    [actor, uid(44098)],
  );
  const snapshot = async () =>
    (await q('select shop_qa_private.fixture_snapshot_014($1) x', [actor]))
      .rows[0].x;
  const amounts = async () =>
    (await q('select coins from public.wallets where traveler_id=$1', [actor]))
      .rows[0].coins;
  const original = await snapshot();
  const preservedRows = async () =>
    (
      await q(
        "select jsonb_build_object('travelers',(select jsonb_agg(to_jsonb(v) order by id) from public.travelers v),'inventory',(select jsonb_agg(to_jsonb(v) order by id) from public.inventory v),'equipment',(select jsonb_agg(to_jsonb(v) order by traveler_id,slot) from public.equipped_items v),'chests',(select jsonb_agg(to_jsonb(v) order by traveler_id,chest_type) from public.traveler_chests v),'receipts',(select jsonb_agg(to_jsonb(v) order by id) from public.chest_operations v),'budgets',(select jsonb_agg(to_jsonb(v) order by id) from shop_qa_private.budget_receipts v where reason<>'ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11'),'profiles',(select jsonb_agg(to_jsonb(v) order by account_id) from shop_qa_private.profiles v)) x",
      )
    ).rows[0].x;
  const preservedBefore = await preservedRows();
  const functions = (
    await q(
      "select p.oid::regprocedure::text signature,pg_get_functiondef(p.oid) definition,p.proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('shop_private','shop_qa_private') order by 1",
    )
  ).rows;
  const constraints = (
    await q(
      "select conname name,pg_get_constraintdef(oid) def from pg_constraint where conrelid='shop_qa_private.budget_receipts'::regclass and conname in('budget_receipts_account_id_key','budget_receipts_traveler_id_key','budget_receipts_amount_check') order by 1",
    )
  ).rows;
  const pack = renderFixture041({
    owner,
    actor,
    functions,
    constraints,
    balance: functions.find(
      (f) => f.signature === 'shop_private.coin_balance(uuid)',
    ),
  });
  const wrap = (sql) =>
    "BEGIN;SET LOCAL economy041.target_project='wkdvdzfkbwvhyjmamrsg';" +
    sql +
    ';COMMIT;';
  const fund = async () => {
    const results = await q(
      wrap(
        "SET LOCAL economy041.fixture_approval='OWNER-APPROVED-TEST-FIXTURE-2000';SELECT shop_qa_private.fund_fixture_041('" +
          owner +
          "','" +
          actor +
          "','" +
          nonce +
          "','" +
          original +
          "') x",
      ),
    );
    return results.find((r) => r.rows?.[0]?.x)?.rows[0].x;
  };
  await check(
    'fixture rejects wrong environment and installs/restores without player changes',
    async () => {
      await denied(() => q('BEGIN;' + pack.sql + 'COMMIT;'), '42501');
      await q('ROLLBACK');
      await q(wrap(pack.sql));
      assert.equal(await snapshot(), original);
      await q(wrap(pack.recovery));
      assert.equal(await snapshot(), original);
      const after = (
        await q(
          "select pg_get_functiondef('shop_private.coin_balance(uuid)'::regprocedure) d",
        )
      ).rows[0].d;
      assert.equal(
        after,
        functions.find((f) => f.signature === 'shop_private.coin_balance(uuid)')
          .definition,
      );
      await q(wrap(pack.sql));
    },
  );
  await check(
    'fixture funding remains private and requires approved snapshot',
    async () => {
      await denied(
        () =>
          player('select shop_qa_private.fund_fixture_041($1,$2,$3,$4) x', [
            owner,
            actor,
            nonce,
            original,
          ]),
        '42501',
      );
      await denied(
        () =>
          q(
            wrap(
              "SELECT shop_qa_private.fund_fixture_041('" +
                owner +
                "','" +
                actor +
                "','" +
                nonce +
                "','" +
                original +
                "')",
            ),
          ),
        '42501',
      );
      await q('ROLLBACK');
      assert.equal(await amounts(), 0);
    },
  );
  let receipt;
  await check(
    'fixture credits exactly once and preserves prior receipt inventory XP and suspended sources',
    async () => {
      receipt = await fund();
      assert(receipt);
      assert.equal(await amounts(), 2000);
      assert.equal(await fund(), receipt);
      assert.equal(await amounts(), 2000);
      assert.equal(
        (await q('select shop_private.balance_valid($1) x', [actor])).rows[0].x,
        true,
      );
      assert.equal(
        (
          await q(
            'select count(*)::integer n from shop_qa_private.budget_receipts where account_id=$1',
            [owner],
          )
        ).rows[0].n,
        2,
      );
      assert.deepEqual(await preservedRows(), preservedBefore);
    },
  );
  await check(
    'fixture audit immutable; funded recovery refuses and canonical purchase remains valid',
    async () => {
      await denied(
        () =>
          q(
            'update shop_qa_private.budget_receipts set amount=2000 where id=$1',
            [receipt],
          ),
        '42501',
      );
      await denied(() => q(wrap(pack.recovery)), '42501');
      await q('ROLLBACK');
      const id = uid(44101);
      const first = await player(
        "select public.purchase_expansion_chest($1,'chest','common',$2) x",
        [actor, id],
      );
      assert.equal(
        (
          await player(
            "select public.purchase_expansion_chest($1,'chest','common',$2) x",
            [actor, id],
          )
        ).receiptId,
        first.receiptId,
      );
      assert.equal(await amounts(), 1960);
      assert.equal(
        (await q('select shop_private.balance_valid($1) x', [actor])).rows[0].x,
        true,
      );
    },
  );
  await check(
    'QA isolation permits only the reviewed single TEST resale; ledger, last copy and replay stay exact',
    async () => {
      // Deterministic PRNG exists only inside this disposable PostgreSQL test database.
      await q(`CREATE OR REPLACE FUNCTION shop_private.random_index_041(p_count integer)
        RETURNS integer LANGUAGE plpgsql VOLATILE SET search_path='' AS $$
        DECLARE n integer;
        BEGIN
          n:=coalesce(current_setting('fixture.random_counter',true),'0')::integer+1;
          PERFORM set_config('fixture.random_counter',n::text,true);
          RETURN (CASE WHEN n%2=1 THEN 99 ELSE 2 END)%p_count;
        END $$`);
      const openOwnedChest = (id) =>
        player(
          "select public.open_shop_chest($1,'common',$2) x",
          [actor, id],
          { deterministicLoot: true },
        );
      for (const [operation, expectedQuantity] of [
        [uid(44101), 1],
        [uid(44102), 2],
      ]) {
        await player(
          "select public.purchase_expansion_chest($1,'chest','common',$2) x",
          [actor, operation],
        );
        const opened = await openOwnedChest(operation);
        assert.equal(opened.itemId, 'equipment-leather-helmet');
        assert.equal(opened.quantity, expectedQuantity);
      }
      assert.equal(await amounts(), 1920);
      assert.equal(
        (
          await q(
            "select quantity from public.inventory where traveler_id=$1 and item_id='equipment-leather-helmet'",
            [actor],
          )
        ).rows[0].quantity,
        2,
      );

      const migration = fs.readFileSync(
        'supabase/migrations/20261113103956_economy_041_fixture_sale_qa_test.sql',
        'utf8',
      )
        .replaceAll(
          '575d92d9-2e5b-4fdc-8e02-3a4a096285a9',
          owner,
        )
        .replaceAll(
          '5558c6a7-2faf-4b6f-901f-bfc980c5c687',
          actor,
        )
        .replace('IS DISTINCT FROM 1875', 'IS DISTINCT FROM 1920');
      // The local fixture has two purchased/opened chests; hosted TEST has three.
      // Keep the reviewed live migration's exact counts while adapting only this disposable harness.
      const fixtureMigration = migration
        .replace(
          "operation_type='purchase' AND source LIKE 'economy041:%')<>3",
          "operation_type='purchase' AND source LIKE 'economy041:%')<>2",
        )
        .replace(
          "operation_type='open' AND source LIKE 'economy041:%')<>3",
          "operation_type='open' AND source LIKE 'economy041:%')<>2",
        );
      await q(
        "BEGIN;SET LOCAL economy041.target_project='wkdvdzfkbwvhyjmamrsg';" +
          fixtureMigration +
          ';COMMIT;',
      );

      await denied(
        () =>
          q(
            `INSERT INTO public.chest_operations
              (traveler_id,account_id,identity_key,operation_key,operation_type,source,price_paid,rewards)
             VALUES($1,$2::uuid,'economy041:sale:'||$2::text||':'||$3::text,'sale:'||$3::text,'duplicate-sale-041','economy041:sale',0,
               '{"catalogVersion":"economy041-chest-v1","itemId":"equipment-apprentice-shield","coins":10,"quantity":1,"replayed":false}')`,
            [actor, owner, uid(44103)],
          ),
        '42501',
      );
      assert.equal(
        (
          await q(
            "select count(*)::integer n from public.chest_operations where traveler_id=$1 and operation_type='duplicate-sale-041'",
            [actor],
          )
        ).rows[0].n,
        0,
      );
      await denied(
        () =>
          q(
            `INSERT INTO public.chest_operations
              (traveler_id,account_id,identity_key,operation_key,operation_type,chest_type,source,rewards)
             VALUES($1,$2,'economy041:grant:fixture-denied','grant:fixture-denied','grant','common',
               'economy041:fixture-denied','{"catalogVersion":"economy041-chest-v1","coins":25}')`,
            [actor, owner],
          ),
        '42501',
      );

      const walletBefore = await amounts();
      const operation = uid(44104);
      const sold = await player(
        'select public.sell_repeated_item($1,$2,$3,$4) x',
        [actor, 'equipment-leather-helmet', operation, 2],
      );
      assert.equal(sold.coins, 10);
      assert.equal(sold.quantity, 1);
      assert.equal(sold.replayed, false);
      assert.equal(await amounts(), walletBefore + 10);
      assert.equal(
        (
          await q(
            "select quantity from public.inventory where traveler_id=$1 and item_id='equipment-leather-helmet'",
            [actor],
          )
        ).rows[0].quantity,
        1,
      );
      const receipt = (
        await q(
          'select id,rewards,source,operation_type from public.chest_operations where id=$1 and traveler_id=$2',
          [sold.receiptId, actor],
        )
      ).rows[0];
      assert.equal(receipt.operation_type, 'duplicate-sale-041');
      assert.equal(receipt.source, 'economy041:sale');
      assert.equal(receipt.rewards.coins, 10);
      assert.equal(
        receipt.rewards.qaFixtureProvenance,
        'ECONOMY041-TEST-OWNER-APPROVED-2026-11-11',
      );
      assert.equal(
        (
          await q(
            "select count(*)::integer n from public.chest_operations where traveler_id=$1 and operation_type='duplicate-sale-041' and rewards->>'itemId'='equipment-leather-helmet'",
            [actor],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (await q('select shop_private.balance_valid($1) x', [actor])).rows[0].x,
        true,
      );
      assert.equal(
        (
          await q(
            'select enabled from shop_qa_private.profiles where account_id=$1 and traveler_id=$2',
            [owner, actor],
          )
        ).rows[0].enabled,
        false,
      );

      const replay = await player(
        'select public.sell_repeated_item($1,$2,$3,$4) x',
        [actor, 'equipment-leather-helmet', operation, 2],
      );
      assert.equal(replay.receiptId, sold.receiptId);
      assert.equal(replay.replayed, true);
      await denied(
        () =>
          player('select public.sell_repeated_item($1,$2,$3,$4) x', [
            actor,
            'equipment-leather-helmet',
            uid(44105),
            1,
          ]),
        '42501',
      );
      assert.equal(await amounts(), walletBefore + 10);
      await denied(
        () =>
          q('update public.chest_operations set rewards=rewards where id=$1', [
            sold.receiptId,
          ]),
        '42501',
      );
      await q('ROLLBACK');
    },
  );
}
