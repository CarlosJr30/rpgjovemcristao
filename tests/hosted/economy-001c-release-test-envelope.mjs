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
