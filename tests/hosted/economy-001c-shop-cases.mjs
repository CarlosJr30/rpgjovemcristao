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
  const migration = read(
    'supabase/migrations/20261103034651_economy_001c_shop_qa_test.sql',
  );
  const wrap = (s) =>
    "BEGIN;SET LOCAL shop001c.target_project='wkdvdzfkbwvhyjmamrsg';" +
    s +
    ';COMMIT;';
  const snap = async () =>
    (
      await q(
        "select jsonb_build_object('wallets',(select jsonb_agg(t order by traveler_id) from public.wallets t),'inventory',(select jsonb_agg(t order by id) from public.inventory t),'receipts',(select jsonb_agg(t order by id) from public.chest_operations t),'equipment',(select jsonb_agg(t order by traveler_id,slot) from public.equipped_items t)) x",
      )
    ).rows[0].x;
  const defs = async () =>
    (
      await q(
        "select oid::regprocedure::text signature,pg_get_functiondef(oid) body,proacl::text acl from pg_proc where pronamespace in('public'::regnamespace,'economy_private'::regnamespace) order by 1",
      )
    ).rows;
  const original = await defs();
  await check('QA shop refuses wrong environment before DDL', async () => {
    await denied(() => q('BEGIN;' + migration + ';COMMIT;'), '42501');
    await q('ROLLBACK');
    assert.equal(
      (await q("select to_regnamespace('shop_qa_private') x")).rows[0].x,
      null,
    );
  });
  await q(wrap(migration));
  await check(
    'Empty QA recovery preserves all prior function definitions and ACLs',
    async () => {
      await q(
        wrap(
          read(
            'packages/database/proposals/economy-001c-shop-recovery-empty-test.sql',
          ),
        ),
      );
      assert.deepEqual(await defs(), original);
      await q(wrap(migration));
    },
  );
  const call = async (n, sql, args = [], client, session = uid(5000 + n)) => {
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
      const r = await c.query(sql, args);
      await c.query('COMMIT');
      return r.rows[0]?.x;
    } catch (e) {
      await c.query('ROLLBACK');
      throw e;
    }
  };
  const purchase = (kind, id, op, c) =>
    call(
      2,
      'select public.purchase_qa_shop($1,$2,$3,$4) x',
      [tid(2), kind, id, uid(op)],
      c,
    );
  const open = (op) =>
    call(2, 'select public.open_qa_shop_chest($1,$2) x', [tid(2), uid(op)]);
  const grant = () =>
    q(
      "select shop_qa_private.grant_budget($1,$2,'Owner approved isolated shop budget',$3) x",
      [uid(2), tid(2), uid(9000)],
    );
  await check(
    'No application role can grant QA funds or read private budgets',
    async () => {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        await denied(
          () =>
            as(2, 'select * from shop_qa_private.budget_receipts', [], role),
          '42501',
        );
        await denied(
          () =>
            as(
              2,
              'select shop_qa_private.grant_budget($1,$2,$3,$4)',
              [uid(2), tid(2), 'Forbidden request', uid(9000)],
              role,
            ),
          '42501',
        );
      }
    },
  );
  await check(
    'Unregistered profile refuses purchases without side effects',
    async () => {
      const b = await snap();
      await denied(() => purchase('chest', 'common', 9001), '42501');
      assert.deepEqual(await snap(), b);
    },
  );
  await q(
    "update public.travelers set name='QA Loja',economic_verified_at=now(),xp=0,level=1 where id=$1;",
    [tid(2)],
  );
  await q('delete from public.guild_members where traveler_id=$1', [tid(2)]);
  await q("set shop001c.target_project='wkdvdzfkbwvhyjmamrsg'");
  let budget;
  await check(
    'Explicit isolated budget credits exactly255 once by Auth and nonce',
    async () => {
      budget = (await grant()).rows[0].x;
      assert.equal((await grant()).rows[0].x, budget);
      assert.equal(
        (
          await q('select coins from public.wallets where traveler_id=$1', [
            tid(2),
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
  await check(
    'Budget audit is append only and refuses another nonce',
    async () => {
      await denied(
        () =>
          q(
            "update shop_qa_private.budget_receipts set reason='changed reason'",
          ),
        '42501',
      );
      await denied(
        () => q('delete from shop_qa_private.budget_receipts'),
        '42501',
      );
      await denied(
        () =>
          q(
            "select shop_qa_private.grant_budget($1,$2,'Owner approved isolated shop budget',$3)",
            [uid(2), tid(2), uid(9999)],
          ),
        '42501',
      );
    },
  );
  await check(
    'Foreign avatar and missing real session cannot purchase',
    async () => {
      await denied(
        () =>
          call(3, 'select public.purchase_qa_shop($1,$2,$3,$4) x', [
            tid(2),
            'chest',
            'common',
            uid(9001),
          ]),
        '42501',
      );
      await denied(
        () =>
          call(
            2,
            'select public.purchase_qa_shop($1,$2,$3,$4) x',
            [tid(2), 'chest', 'common', uid(9001)],
            undefined,
            uid(9999),
          ),
        '42501',
      );
    },
  );
  await check(
    'Server refuses cards and unapproved chest/catalog offers',
    async () => {
      for (const [kind, id] of [
        ['chest', 'rare'],
        ['card', 'healing'],
        ['equipment', 'traveler-helmet-rare'],
      ])
        await denied(() => purchase(kind, id, 9001), '22023');
    },
  );
  let chest;
  await check('Client roles cannot bypass the restricted purchase authority',async()=>{for(const role of ['anon','service_role'])await denied(()=>as(2,'select public.purchase_qa_shop($1,$2,$3,$4)',[tid(2),'chest','common',uid(9001)],role),'42501');});
  await check('Failure after equipment debit rolls back wallet inventory and receipt',async()=>{const b=await snap();await q("create function public.isolated_shop_failure() returns trigger language plpgsql as $$begin raise exception 'isolated receipt failure' using errcode='PT500';end $$;create trigger isolated_shop_failure before insert on public.chest_operations for each row when(new.operation_type='equipment-purchase') execute function public.isolated_shop_failure()");await denied(()=>purchase('equipment','traveler-sword-common',9090),'PT500');await q('drop trigger isolated_shop_failure on public.chest_operations;drop function public.isolated_shop_failure()');assert.deepEqual(await snap(),b);});
  await check(
    'Two independent concurrent purchases debit40 exactly once',
    async () => {
      const c = new Client(options);
      connections.push(c);
      await c.connect();
      const r = await Promise.all([
        purchase('chest', 'common', 9001),
        purchase('chest', 'common', 9001, c),
      ]);
      assert.equal(r[0].receiptId, r[1].receiptId);
      chest = r[0];
      assert.equal(chest.pricePaid, 40);
      assert.equal(
        (
          await q('select coins from public.wallets where traveler_id=$1', [
            tid(2),
          ])
        ).rows[0].coins,
        215,
      );
    },
  );
  await check(
    'Same nonce cannot change payload or acquire another item',
    async () => {
      await denied(
        () => purchase('equipment', 'traveler-sword-common', 9001),
        '22023',
      );
    },
  );
  await check(
    'Existing equipment authority delivers three approved items at fixed prices',
    async () => {
      for (const [id, price, n] of [
        ['traveler-sword-common', 35, 9002],
        ['traveler-armor-uncommon', 65, 9003],
        ['traveler-shield-rare', 115, 9004],
      ])
        assert.equal((await purchase('equipment', id, n)).pricePaid, price);
      assert.equal(
        (
          await q('select coins from public.wallets where traveler_id=$1', [
            tid(2),
          ])
        ).rows[0].coins,
        0,
      );
    },
  );
  await check(
    'Insufficient balance rejects whole purchase without new receipt',
    async () => {
      const b = await snap();
      await assert.rejects(() => purchase('chest', 'common', 9005));
      assert.deepEqual(await snap(), b);
    },
  );
  let opened;
  await check(
    'QA opening reuses approved RNG and replay never rerolls or repays',
    async () => {
      opened = await open(9010);
      assert([10, 25].includes(opened.coins));
      const b = await snap();
      await open(9010);
      assert.deepEqual(await snap(), b);
    },
  );
  await check(
    'Equipment ownership slot and optimistic concurrency remain enforced',
    async () => {
      const equip = (slot, item, expected) =>
        call(2, 'select public.equip_qa_shop($1,$2,$3,$4) x', [
          tid(2),
          slot,
          item,
          expected,
        ]);
      await equip('weapon', 'traveler-sword-common', null);
      await denied(
        () => equip('armor', 'traveler-sword-common', null),
        '42501',
      );
      await denied(() => equip('weapon', null, null), 'PT409');
      await equip('weapon', null, 'traveler-sword-common');
    },
  );
  await check('QA budget cannot enter official reward issuance', async () => {
    await denied(
      () =>
        q(
          "insert into public.chest_operations(traveler_id,operation_key,operation_type,chest_type,source,rewards) values($1,'forbidden-qa','community-xp',null,'community001b:test','{}')",
          [tid(2)],
        ),
      '42501',
    );
  });
  await check(
    'Issued QA history blocks destructive recovery; containment preserves canonical data',
    async () => {
      await denied(
        () =>
          q(
            wrap(
              read(
                'packages/database/proposals/economy-001c-shop-recovery-empty-test.sql',
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
            'packages/database/proposals/economy-001c-shop-containment-test.sql',
          ),
        ),
      );
      assert.deepEqual(await snap(), b);
      await denied(() => purchase('chest', 'common', 9020), '42501');
    },
  );
}
