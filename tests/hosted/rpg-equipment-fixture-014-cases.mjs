import assert from 'node:assert/strict';
export async function run({ q, check, denied, uid, tid, read }) {
  const project = 'wkdvdzfkbwvhyjmamrsg';
  const wrap = (s) =>
    `BEGIN;SET LOCAL equipment014.target_project='${project}';${s};COMMIT;`;
  const resolve = (s) =>
    s
      .replaceAll('{{TARGET_PROJECT}}', project)
      .replaceAll('{{RELEASE_SCOPE}}', 'hero-equipment-006');
  await q(
    wrap(
      resolve(read('packages/database/proposals/rpg-equipment-fix-014.sql.in')),
    ),
  );
  await q(
    'update public.travelers set level=1,xp=0,economic_verified_at=now() where id=$1',
    [tid(2)],
  );
  await q('delete from public.equipped_items where traveler_id=$1', [tid(2)]);
  await q('delete from public.inventory where traveler_id=$1', [tid(2)]);
  const coinBefore = (
    await q(
      "select pg_get_functiondef('shop_private.coin_balance(uuid)'::regprocedure) body,proacl::text acl from pg_proc where oid='shop_private.coin_balance(uuid)'::regprocedure",
    )
  ).rows[0];
  const helperBefore = (
    await q(
      "select pg_get_functiondef('shop_private.owned_equipment(uuid,text,text,text)'::regprocedure) body",
    )
  ).rows[0].body;
  const hash = (
    await q('select md5($1) x', [coinBefore.body.replaceAll('\r\n', '\n')])
  ).rows[0].x;
  const sql = read(
    'packages/database/proposals/rpg-equipment-fix-014-fixture-test.sql.in',
  )
    .replaceAll('{{ACTOR}}', tid(2))
    .replaceAll('{{OWNER}}', uid(2))
    .replaceAll('{{BALANCE_MD5}}', hash);
  const snap = async () =>
    (await q('select shop_qa_private.fixture_snapshot_014($1) x', [tid(2)]))
      .rows[0].x;
  const budgetState = async () =>
    (
      await q(
        "select jsonb_build_object('wallets',(select jsonb_agg(to_jsonb(w) order by traveler_id) from public.wallets w),'profiles',(select jsonb_agg(to_jsonb(p) order by account_id) from shop_qa_private.profiles p),'budgets',(select jsonb_agg(to_jsonb(b) order by id) from shop_qa_private.budget_receipts b)) x",
      )
    ).rows[0].x;
  const grant = async (
    operation = uid(14001),
    snapshot = null,
    owner = uid(2),
    actor = tid(2),
  ) => {
    try {
      await q(
        "begin;set local equipment014.target_project='wkdvdzfkbwvhyjmamrsg';set local equipment014.fixture_approval='OWNER-APPROVED-TEST-FIXTURE-35'",
      );
      const result = await q(
        'select shop_qa_private.fund_fixture_014($1,$2,$3,$4) x',
        [owner, actor, operation, snapshot],
      );
      await q('commit');
      return result;
    } catch (e) {
      await q('rollback');
      throw e;
    }
  };
  const denyGrant = async (...args) => {
    await denied(() => grant(...args), '42501');
    await q('rollback');
  };
  const call = async (sql, args = []) => {
    try {
      await q('begin');
      await q('set local role authenticated');
      await q(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          uid(2),
          JSON.stringify({
            sub: uid(2),
            session_id: uid(5002),
            is_anonymous: false,
          }),
        ],
      );
      const result = await q(sql, args);
      await q('commit');
      return result.rows[0]?.x;
    } catch (e) {
      await q('rollback');
      throw e;
    }
  };
  await check(
    '014 fixture rejects wrong project before installation and issues no credit on install',
    async () => {
      const before = await budgetState();
      await denied(() => q('begin;' + sql + ';commit'), '42501');
      await q('rollback');
      await q(wrap(sql));
      assert.deepEqual(await budgetState(), before);
      assert.equal(
        (
          await q(
            "select proacl::text x from pg_proc where oid='shop_private.coin_balance(uuid)'::regprocedure",
          )
        ).rows[0].x,
        coinBefore.acl,
      );
      for (const role of ['authenticated', 'anon', 'service_role'])
        assert.equal(
          (
            await q(
              "select has_function_privilege($1,'shop_qa_private.fund_fixture_014(uuid,uuid,uuid,text)','execute') x",
              [role],
            )
          ).rows[0].x,
          false,
        );
      await q(
        wrap(
          read(
            'packages/database/proposals/rpg-equipment-fix-014-fixture-recovery-empty-test.sql.in',
          ).replaceAll('{{BALANCE_MD5}}', hash),
        ),
      );
      assert.deepEqual(
        (
          await q(
            "select pg_get_functiondef('shop_private.coin_balance(uuid)'::regprocedure) body,proacl::text acl from pg_proc where oid='shop_private.coin_balance(uuid)'::regprocedure",
          )
        ).rows[0],
        coinBefore,
      );
      assert.deepEqual(await budgetState(), before);
      await q(wrap(sql));
    },
  );
  await check(
    '014 fixture rejects changed snapshot, wrong identity and missing approval',
    async () => {
      const before = await budgetState();
      await denyGrant(uid(14001), 'stale');
      await denyGrant(uid(14001), await snap(), uid(3));
      const snapshot = await snap();
      await denied(
        () =>
          q('select shop_qa_private.fund_fixture_014($1,$2,$3,$4)', [
            uid(2),
            tid(2),
            uid(14001),
            snapshot,
          ]),
        '42501',
      );
      assert.deepEqual(await budgetState(), before);
    },
  );
  await check(
    '014 fixture rolls back profile, receipt and credit together on credit failure',
    async () => {
      const before = await budgetState();
      await q(
        "create function public.fixture014_fail() returns trigger language plpgsql as $$begin raise exception 'injected credit failure';end$$;create trigger fixture014_fail before update on public.wallets for each row execute function public.fixture014_fail()",
      );
      const snapshot = await snap();
      await assert.rejects(
        () => grant(uid(14001), snapshot),
        /injected credit failure/,
      );
      await q('rollback');
      await q(
        'drop trigger fixture014_fail on public.wallets;drop function public.fixture014_fail()',
      );
      assert.deepEqual(await budgetState(), before);
    },
  );
  await check(
    '014 fixture emits exactly 35 once, replays safely and isolates other avatars',
    async () => {
      const original = await snap();
      await grant(uid(14001), original);
      const before = await budgetState();
      await grant(uid(14001), original);
      assert.deepEqual(await budgetState(), before);
      await denyGrant(uid(14002), original);
      await denyGrant(uid(14001), original, uid(2), tid(3));
      assert.equal(
        (await q('select shop_private.balance_valid($1) x', [tid(2)])).rows[0]
          .x,
        true,
      );
      assert.equal(
        (await q('select shop_qa_private.fixture_credit_014($1) x', [tid(2)]))
          .rows[0].x,
        '35',
      );
      assert.equal(
        (await q('select shop_qa_private.fixture_credit_014($1) x', [tid(3)]))
          .rows[0].x,
        '0',
      );
      assert.equal(
        (await call('select public.get_qa_shop($1) x', [tid(2)])).enabled,
        false,
      );
      await denied(
        () =>
          call('select public.purchase_qa_shop($1,$2,$3,$4) x', [
            tid(2),
            'equipment',
            'traveler-sword-common',
            uid(14009),
          ]),
        '42501',
      );
    },
  );
  await check(
    '014 fixture buys through unchanged official authority and equips via corrected wrapper',
    async () => {
      await call('select public.purchase_shop($1,$2,$3,$4) x', [
        tid(2),
        'equipment',
        'traveler-sword-common',
        uid(14003),
      ]);
      assert.equal(
        (
          await q('select coins from public.wallets where traveler_id=$1', [
            tid(2),
          ])
        ).rows[0].coins,
        0,
      );
      assert.equal(
        (
          await q(
            "select count(*)::int n from public.chest_operations where traveler_id=$1 and source='shop001c:equipment' and operation_type='equipment-purchase' and price_paid=35",
            [tid(2)],
          )
        ).rows[0].n,
        1,
      );
      const preserved = async () =>
        (
          await q(
            "select jsonb_build_object('stats',(select to_jsonb(s) from public.traveler_stats s where traveler_id=$1),'wallet',(select to_jsonb(w) from public.wallets w where traveler_id=$1),'inventory',(select jsonb_agg(to_jsonb(i) order by id) from public.inventory i where traveler_id=$1),'receipts',(select jsonb_agg(to_jsonb(r) order by id) from public.chest_operations r where traveler_id=$1),'chests',(select jsonb_agg(to_jsonb(c) order by chest_type) from public.traveler_chests c where traveler_id=$1),'xp',(select jsonb_build_object('xp',xp,'level',level) from public.travelers where id=$1)) x",
            [tid(2)],
          )
        ).rows[0].x;
      const beforeEquip = await preserved();
      for (const [item, expected] of [
        ['traveler-sword-common', null],
        [null, 'traveler-sword-common'],
        ['traveler-sword-common', null],
        [null, 'traveler-sword-common'],
      ]) {
        await call('select public.equip_shop_item($1,$2,$3,$4) x', [
          tid(2),
          'weapon',
          item,
          expected,
        ]);
        assert.equal(
          (
            await q(
              "select item_id from public.equipped_items where traveler_id=$1 and slot='weapon'",
              [tid(2)],
            )
          ).rows[0]?.item_id ?? null,
          item,
        );
      }
      assert.deepEqual(await preserved(), beforeEquip);
      assert.equal(
        (
          await q(
            "select pg_get_functiondef('shop_private.owned_equipment(uuid,text,text,text)'::regprocedure) body",
          )
        ).rows[0].body,
        helperBefore,
      );
      assert.equal(
        (await q('select shop_private.balance_valid($1) x', [tid(2)])).rows[0]
          .x,
        true,
      );
    },
  );
  await check(
    '014 fixture containment blocks new issuance but preserves audited spent credit',
    async () => {
      const before = await budgetState();
      await q(
        wrap(
          read(
            'packages/database/proposals/rpg-equipment-fix-014-fixture-containment-test.sql.in',
          ),
        ),
      );
      await denyGrant(uid(14001), await snap());
      assert.deepEqual(await budgetState(), before);
      assert.equal(
        (await q('select shop_private.balance_valid($1) x', [tid(2)])).rows[0]
          .x,
        true,
      );
      await denied(
        () =>
          q(
            'update shop_qa_private.budget_receipts set amount=34 where traveler_id=$1',
            [tid(2)],
          ),
        '42501',
      );
      await denied(
        () =>
          q(
            wrap(
              read(
                'packages/database/proposals/rpg-equipment-fix-014-fixture-recovery-empty-test.sql.in',
              ).replaceAll('{{BALANCE_MD5}}', hash),
            ),
          ),
        '42501',
      );
      await q('rollback');
      assert.deepEqual(await budgetState(), before);
    },
  );
}
