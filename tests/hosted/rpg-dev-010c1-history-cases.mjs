// Additional history/authorization cases only. Original 23-case artifact is retained.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
export async function run({
  q,
  tx,
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
    'supabase/migrations/20261031033721_rpg_dev_010c1_meetings_test.sql',
  );
  const recovery = read(
    'packages/database/proposals/rpg-dev-010c1-recovery-empty.sql',
  );
  const ws = (n, g = 100) =>
    as(n, 'select public.guild_activity_workspace($1,$2,0) x', [
      tid(n),
      uid(g),
    ]).then((r) => r.rows[0].x);
  const cmd = (n, action, revision, data, nonce = randomUUID(), client) =>
    as(
      n,
      'select public.guild_activity_command($1,$2,$3,$4,$5,$6,$7) x',
      [tid(n), uid(100), action, uid(700), nonce, revision, data],
      'authenticated',
      client,
    ).then((r) => r.rows[0].x);
  const snapshot = async () =>
    (
      await q(
        "select jsonb_build_object('wallets',(select jsonb_agg(to_jsonb(t)) from public.wallets t),'stats',(select jsonb_agg(to_jsonb(t)) from public.traveler_stats t),'claims',(select jsonb_agg(to_jsonb(t)) from public.guild_reward_claims t)) x",
      )
    ).rows[0].x;
  const original = await snapshot();
  const logs = (
    await q(
      'select id,to_jsonb(t) x from public.guild_activity_log t order by id',
    )
  ).rows;
  await check(
    'history empty recovery preserves legacy rows and the 512-byte constraint',
    async () => {
      const constraints = (
        await q(
          "select pg_get_constraintdef(oid) d from pg_constraint where conrelid='public.guild_activity_log'::regclass order by oid",
        )
      ).rows;
      await tx(migration);
      await tx(recovery);
      assert.deepEqual(
        (
          await q(
            'select id,to_jsonb(t) x from public.guild_activity_log t order by id',
          )
        ).rows,
        logs,
      );
      assert.deepEqual(
        (
          await q(
            "select pg_get_constraintdef(oid) d from pg_constraint where conrelid='public.guild_activity_log'::regclass order by oid",
          )
        ).rows,
        constraints,
      );
      assert(constraints.some((x) => x.d.includes('512')));
      await tx(migration);
    },
  );
  await cmd(1, 'save', 0, {
    title: 'History QA meeting',
    description: 'Synthetic technical fixture only.',
    objective: 'Confirm participation safely.',
    instructions: 'No personal information.',
    evidenceCriterion: 'Authorized confirmation.',
    bibleReference: '',
    startsAt: new Date(Date.now() - 3600000).toISOString(),
    dueAt: '',
    audience: 'all',
    targetIds: [],
    kind: 'meeting',
    meetingId: '',
    category: 'group',
    theme: '',
    meetingType: 'digital',
    responsibleId: tid(1),
    accessDetails: 'https://example.invalid/qa',
    futureCategory: 'none',
  });
  await cmd(1, 'state', 1, { state: 'published' });
  await cmd(2, 'participate', 0, { declared: true });
  const reason = '✦'.repeat(250),
    nonce = randomUUID();
  await check(
    'complete Unicode correction stays private and legacy log remains compact',
    async () => {
      await cmd(
        1,
        'review',
        1,
        { travelerId: tid(2), decision: 'changes_requested', reason },
        nonce,
      );
      assert.equal((await ws(1)).validations[0].reason, reason);
      const rows = (
        await q(
          "select metadata,octet_length(metadata::text) bytes from public.guild_activity_log where entity_id=$1 and event_type='community_review'",
          [uid(700)],
        )
      ).rows;
      assert.equal(rows.length, 1);
      assert(rows[0].bytes <= 512);
      assert(!JSON.stringify(rows[0]).includes(reason));
      assert(rows[0].metadata.reasonDigest);
    },
  );
  await check(
    'full history is restricted to current responsible validators, not beneficiaries or other Guilds',
    async () => {
      assert.deepEqual((await ws(2)).validations, []);
      assert.equal((await ws(2)).progress[0].reviewNote, reason);
      assert.deepEqual((await ws(3)).validations, []);
      assert.deepEqual((await ws(1, 101)).validations, []);
      for (const n of [1, 2, 3])
        await denied(
          () =>
            as(n, 'select * from guild_activity_private.validation_history'),
          '42501',
        );
      for (const role of ['anon', 'service_role'])
        await denied(
          () =>
            as(
              1,
              'select public.guild_activity_workspace($1,$2,0)',
              [tid(1), uid(100)],
              role,
            ),
          '42501',
        );
    },
  );
  const counts = async () =>
    (
      await q(
        'select (select count(*) from guild_activity_private.validation_history) h,(select count(*) from public.guild_activity_log where entity_id=$1) a',
        [uid(700)],
      )
    ).rows[0];
  await check(
    'request replay appends neither a second private record nor a legacy audit event',
    async () => {
      const before = await counts();
      assert.equal(
        (
          await cmd(
            1,
            'review',
            1,
            { travelerId: tid(2), decision: 'changes_requested', reason },
            nonce,
          )
        ).replayed,
        true,
      );
      assert.deepEqual(await counts(), before);
    },
  );
  await check(
    'concurrent corrections retain the prior reason and accept exactly one new revision',
    async () => {
      const clients = [new Client(options), new Client(options)];
      for (const c of clients) {
        await c.connect();
        connections.push(c);
      }
      const results = await Promise.allSettled(
        clients.map((c, i) =>
          cmd(
            1,
            'review',
            2,
            {
              travelerId: tid(2),
              decision: 'approved',
              reason: 'Verified correction ' + i,
            },
            randomUUID(),
            c,
          ),
        ),
      );
      assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
      assert.equal(
        results.find((r) => r.status === 'rejected').reason.code,
        'PT409',
      );
      const history = (await ws(1)).validations;
      assert.equal(history.length, 2);
      assert(history.some((h) => h.reason === reason));
    },
  );
  await check(
    'delegated read and correction privileges disappear immediately on revocation',
    async () => {
      const data = {
        travelerId: tid(3),
        active: true,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
      await cmd(1, 'delegate', 0, data);
      assert.equal((await ws(3)).validations.length, 2);
      await cmd(1, 'delegate', 1, { ...data, active: false });
      assert.deepEqual((await ws(3)).validations, []);
      await denied(
        () =>
          cmd(3, 'review', 3, {
            travelerId: tid(2),
            decision: 'rejected',
            reason: 'No longer authorized',
          }),
        '42501',
      );
    },
  );
  await check(
    'history is append-only even for direct owner UPDATE and DELETE attempts',
    async () => {
      await denied(
        () =>
          q(
            "update guild_activity_private.validation_history set reason='changed'",
          ),
        '42501',
      );
      await denied(
        () => q('delete from guild_activity_private.validation_history'),
        '42501',
      );
      await denied(
        () => as(1, 'delete from guild_activity_private.validation_history'),
        '42501',
      );
      assert.equal((await counts()).h, '2');
    },
  );
  await check(
    'credential and contact-shaped reasons are refused before changing records',
    async () => {
      const before = await counts();
      for (const reason of [
        'Bearer synthetic-secret',
        'senha=synthetic',
        'qa@example.invalid',
      ])
        await denied(
          () =>
            cmd(1, 'review', 3, {
              travelerId: tid(2),
              decision: 'rejected',
              reason,
            }),
          '22023',
        );
      assert.deepEqual(await counts(), before);
      assert.equal((await ws(1)).progress[0].status, 'approved');
    },
  );
  await check(
    'issued recovery is refused and containment preserves history, legacy data and zero economics',
    async () => {
      await denied(() => tx(recovery), 'P0001');
      assert.deepEqual(await snapshot(), original);
      for (const old of logs)
        assert.deepEqual(
          (
            await q(
              'select to_jsonb(t) x from public.guild_activity_log t where id=$1',
              [old.id],
            )
          ).rows[0].x,
          old.x,
        );
      assert.equal(
        (
          await q(
            'select count(*) n from guild_activity_private.future_eligibility where xp_issued<>0 or chests_issued<>0',
          )
        ).rows[0].n,
        '0',
      );
      await tx(
        read('packages/database/proposals/rpg-dev-010c1-containment.sql'),
      );
      await denied(() => cmd(1, 'state', 2, { state: 'closed' }), '42501');
      assert.equal((await ws(1)).validations.length, 2);
    },
  );
}
