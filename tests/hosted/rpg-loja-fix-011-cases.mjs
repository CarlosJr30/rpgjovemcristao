import assert from 'node:assert/strict';
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
  project,
  env,
}) {
  const actor = tid(2),
    other = tid(3);
  const call = async (sql, args = [], who = 2, c = { query: q }) => {
    await c.query('BEGIN');
    try {
      await c.query('SET LOCAL ROLE authenticated');
      await c.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
        [
          uid(who),
          JSON.stringify({
            sub: uid(who),
            session_id: uid(5000 + who),
            is_anonymous: false,
          }),
        ],
      );
      const r = await c.query(sql, args);
      await c.query('COMMIT');
      return r.rows[0]?.x;
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    }
  };
  const buy = (id) =>
    call("select public.purchase_shop($1,'chest','common',$2) x", [
      actor,
      uid(id),
    ]);
  const open = (id, who = 2, c) =>
    call(
      "select public.open_shop_chest($1,'common',$2) x",
      [actor, uid(id)],
      who,
      c,
    );
  const state = async () =>
    (
      await q(
        "select jsonb_build_object('wallet',(select to_jsonb(t) from public.wallets t where traveler_id=$1),'stack',(select to_jsonb(t) from public.traveler_chests t where traveler_id=$1 and chest_type='common'),'ledger',(select jsonb_agg(t order by id) from public.chest_operations t where traveler_id=$1),'inventory',(select jsonb_agg(t order by id) from public.inventory t where traveler_id=$1),'holds',(select jsonb_agg(t order by id) from shop_private.holds t)) x",
        [actor],
      )
    ).rows[0].x;
  const defs = async () =>
    (
      await q(
        "select oid::regprocedure::text signature,pg_get_functiondef(oid) body,proacl::text acl from pg_proc where pronamespace in('public'::regnamespace,'shop_private'::regnamespace,'economy_private'::regnamespace,'economy_qa_private'::regnamespace) order by 1",
      )
    ).rows;
  const old = await defs(),
    before = await state();
  const migration = read(
    'packages/database/proposals/rpg-loja-fix-011-' + env + '.sql',
  );
  const install = (target) =>
    q(
      "BEGIN;SET LOCAL lojafix011.target_project='" +
        target +
        "';" +
        migration +
        ';COMMIT;',
    );
  await check('011 wrong environment refused without row changes', async () => {
    await denied(() => install('invalid'), '42501');
    await q('ROLLBACK');
    assert.deepEqual(await state(), before);
  });
  await install(project);
  await check(
    '011 installation changes only existing opener and retains all ACLs and data',
    async () => {
      assert.deepEqual(await state(), before);
      const now = await defs();
      for (const f of old) {
        const n = now.find((v) => v.signature === f.signature);
        if (f.signature === 'shop_private.open(uuid,text,uuid)')
          assert.equal(n.acl, f.acl);
        else assert.deepEqual(n, f);
      }
      assert.equal(now.length, old.length);
    },
  );
  // Controlled synthetic funds with legitimate ledger source. No hosted player data.
  await q(
    'update public.travelers set economic_verified_at=now() where id=$1',
    [actor],
  );
  await q('update public.wallets set coins=200 where traveler_id=$1', [actor]);
  await q(
    "insert into public.chest_operations(traveler_id,account_id,operation_key,operation_type,chest_type,source,rewards) values($1,$2,'open:seed-funds','open','common','community001c:synthetic','{\"coins\":200}')",
    [actor, uid(2)],
  );
  await q(
    'insert into public.traveler_chests(traveler_id,chest_type,quantity,sources) values($1,\'common\',2,\'["legacy-a","legacy-b"]\') on conflict(traveler_id,chest_type) do update set quantity=2,sources=\'["legacy-a","legacy-b"]\'',
    [actor],
  );
  const otherBefore = (
    await q('select to_jsonb(t) x from public.travelers t where id=$1', [other])
  ).rows[0].x;
  await buy(91101);
  await buy(91102);
  await check(
    '011 existing paid chest behind legacy opens by matching purchase without debit or reordering legacy',
    async () => {
      const b = await state();
      const r = await open(91102);
      assert.equal(r.source, 'shop001c:' + uid(91102));
      const a = await state();
      assert.equal(a.stack.quantity, 3);
      assert.deepEqual(a.stack.sources, [
        'legacy-a',
        'legacy-b',
        'shop001c:' + uid(91101),
      ]);
      assert.equal(a.wallet.coins, b.wallet.coins + r.coins);
      assert.equal(
        a.ledger.filter((r) => r.operation_type === 'purchase').length,
        2,
      );
    },
  );
  await check(
    '011 concurrent retries return one receipt and one reward',
    async () => {
      const b = await state();
      const c = new Client(options);
      await c.connect();
      connections.push(c);
      const r = await Promise.all([open(91102), open(91102, 2, c)]);
      assert.equal(r[0].source, r[1].source);
      assert.deepEqual(await state(), b);
    },
  );
  await check(
    '011 generic Backpack opening recovers remaining valid purchase only',
    async () => {
      const r = await open(91103);
      assert.equal(r.source, 'shop001c:' + uid(91101));
      const s = await state();
      assert.equal(s.stack.quantity, 2);
      assert.deepEqual(s.stack.sources, ['legacy-a', 'legacy-b']);
    },
  );
  await check(
    '011 consumed purchase cannot open another paid chest',
    async () => {
      await buy(91104);
      const b = await state();
      await denied(() => open(91101), '22023');
      assert.deepEqual(await state(), b);
    },
  );
  await check(
    '011 rollback after selection restores full stack wallet and receipt',
    async () => {
      await q(
        "create function public.fixture_fail_011() returns trigger language plpgsql as $$begin raise exception 'fixture failure' using errcode='P0001';end$$;create trigger fixture_fail_011 before update on public.wallets for each row execute function public.fixture_fail_011()",
      );
      const b = await state();
      await denied(() => open(91104), 'P0001');
      assert.deepEqual(await state(), b);
      await q(
        'drop trigger fixture_fail_011 on public.wallets;drop function public.fixture_fail_011()',
      );
    },
  );
  await check(
    '011 foreign identity cannot recover or replay paid chest',
    async () => {
      const b = await state();
      await denied(() => open(91104, 3), '42501');
      assert.deepEqual(await state(), b);
    },
  );
  await check(
    '011 opening confirmed new purchase once and replay never debit twice',
    async () => {
      const b = await state();
      const first = await open(91104);
      const a = await state();
      assert.equal(a.wallet.coins, b.wallet.coins + first.coins);
      await open(91104);
      assert.deepEqual(await state(), a);
    },
  );
  await check(
    '011 legacy-only attempt does not consume chest or add global hold',
    async () => {
      const b = await state();
      await denied(() => open(91105), '42501');
      assert.deepEqual(await state(), b);
    },
  );
  await check(
    '011 forged or duplicate purchased sources stay closed',
    async () => {
      await q(
        'update public.traveler_chests set quantity=4,sources=\'["legacy-a","legacy-b","shop001c:forged","shop001c:forged"]\' where traveler_id=$1 and chest_type=\'common\'',
        [actor],
      );
      const b = await state();
      await denied(() => open(91106), '42501');
      assert.deepEqual(await state(), b);
    },
  );
  await check(
    '011 no changes to other traveler or private QA profiles',
    async () => {
      assert.deepEqual(
        (
          await q('select to_jsonb(t) x from public.travelers t where id=$1', [
            other,
          ])
        ).rows[0].x,
        otherBefore,
      );
      assert.equal(
        (await q('select count(*)::int n from economy_qa_private.profiles'))
          .rows[0].n,
        0,
      );
    },
  );
  await check(
    '011 restoration of previous opener is exact and preserves all receipts',
    async () => {
      const b = await state();
      await q(
        read('packages/database/proposals/rpg-loja-fix-011-prior-open.sql'),
      );
      assert.deepEqual(await state(), b);
      assert.deepEqual(await defs(), old);
    },
  );
}
