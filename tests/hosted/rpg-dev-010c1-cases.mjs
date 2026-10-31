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
  if (process.env.RPG_010C1_HISTORY_ONLY === '1') {
    return (await import('./rpg-dev-010c1-history-cases.mjs')).run({
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
    });
  }
  const ws = (n, g = 100) =>
    as(n, 'select public.guild_activity_workspace($1,$2,0) x', [
      tid(n),
      uid(g),
    ]).then((r) => r.rows[0].x);
  const cmd = (
    n,
    action,
    id,
    revision,
    data,
    nonce = randomUUID(),
    g = 100,
    client,
  ) =>
    as(
      n,
      'select public.guild_activity_command($1,$2,$3,$4,$5,$6,$7) x',
      [tid(n), uid(g), action, uid(id), nonce, revision, data],
      'authenticated',
      client,
    ).then((r) => r.rows[0].x);
  const draft = (extra = {}) => ({
    title: 'Synthetic technical meeting',
    description: 'Controlled QA fixture, not official biblical content.',
    objective: 'Confirm safe community participation.',
    instructions: 'Participation only, no private information.',
    evidenceCriterion: 'Authorized validator confirms actual participation.',
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
    accessDetails: 'https://example.invalid/controlled-test',
    futureCategory: 'none',
    ...extra,
  });
  await q(
    "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active) values($1,$2,'Alternate QA','male','medio','curto','musgo',false)",
    [tid(105), uid(4)],
  );
  for (const actor of [tid(4), tid(105)])
    await q(
      "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
      [uid(100), actor],
    );
  const before = async () =>
    (
      await q(
        "select jsonb_build_object('travelers',(select jsonb_agg(to_jsonb(t)-CASE WHEN t.id IN($1,$2) THEN 'updated_at' ELSE '__no_omission__' END order by id) from public.travelers t),'wallets',(select jsonb_agg(to_jsonb(t) order by traveler_id) from public.wallets t),'stats',(select jsonb_agg(to_jsonb(t) order by traveler_id) from public.traveler_stats t),'members',(select jsonb_agg(to_jsonb(t) order by guild_id,traveler_id) from public.guild_members t),'ebd',(select jsonb_agg(to_jsonb(t) order by id) from public.guild_lessons t),'rewards',(select jsonb_agg(to_jsonb(t) order by id) from public.guild_reward_claims t)) x",
        [tid(4), tid(105)],
      )
    ).rows[0].x;
  const original = await before();
  await check('wrong productive scope refuses TEST DDL', async () => {
    await q(
      "create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$",
    );
    await denied(() => tx(migration), 'P0001');
    await q(
      "create or replace function public.release_scope() returns text language sql immutable as $$select 'hero-equipment-006'::text$$",
    );
  });
  await check(
    'empty recovery removes only the new empty objects and restores baseline',
    async () => {
      await tx(migration);
      await tx(
        read('packages/database/proposals/rpg-dev-010c1-recovery-empty.sql'),
      );
      assert.deepEqual(await before(), original);
      assert.equal(
        (await q("select to_regnamespace('guild_activity_private')::text n"))
          .rows[0].n,
        null,
      );
    },
  );
  await tx(migration);
  await check(
    'private rows are deny-all and anon/service cannot execute wrappers',
    async () => {
      for (const role of ['anon', 'service_role'])
        await denied(
          () =>
            as(
              2,
              'select public.guild_activity_workspace($1,$2,0)',
              [tid(2), uid(100)],
              role,
            ),
          '42501',
        );
      for (const table of [
        'details',
        'delegations',
        'commands',
        'future_eligibility',
        'validation_history',
      ])
        await denied(
          () => as(2, 'select * from guild_activity_private.' + table),
          '42501',
        );
    },
  );
  await check(
    'null command revision and whitespace-only objective cannot bypass validation',
    async () => {
      await denied(() => cmd(1, 'save', 609, null, draft()), '22023');
      await denied(
        () => cmd(1, 'save', 609, 0, draft({ objective: '   ' })),
        '22023',
      );
      await denied(
        () =>
          as(1, 'select public.guild_activity_workspace($1,$2,NULL)', [
            tid(1),
            uid(100),
          ]),
        '22023',
      );
    },
  );
  await check(
    'only an authorized current leader creates meetings; another actor is denied',
    async () => {
      await denied(() => cmd(2, 'save', 600, 0, draft()), '42501');
      await denied(
        () =>
          as(2, 'select public.guild_activity_workspace($1,$2,0)', [
            tid(1),
            uid(100),
          ]),
        '42501',
      );
      await cmd(1, 'save', 600, 0, draft());
      assert.equal((await ws(1)).missions[0].kind, 'meeting');
    },
  );
  await check(
    'draft private access and all data of a foreign Guild stay hidden',
    async () => {
      assert.equal((await ws(2)).missions.length, 0);
      await cmd(
        1,
        'save',
        601,
        0,
        draft({ title: 'Other Guild meeting' }),
        randomUUID(),
        101,
      );
      await cmd(1, 'state', 601, 1, { state: 'published' }, randomUUID(), 101);
      await denied(
        () => cmd(2, 'participate', 601, 0, { declared: true }),
        '42501',
      );
      assert(!(await ws(2)).missions.some((x) => x.id === uid(601)));
    },
  );
  await check(
    'meeting HTTPS and date are enforced and no client economic amount is accepted',
    async () => {
      await denied(
        () =>
          cmd(1, 'save', 602, 0, draft({ accessDetails: 'javascript:bad' })),
        '22023',
      );
      await denied(
        () => cmd(1, 'save', 602, 0, draft({ startsAt: '' })),
        '22023',
      );
      await denied(
        () => cmd(1, 'save', 602, 0, { ...draft(), xp: 999 }),
        '22023',
      );
    },
  );
  await check(
    'leader edits draft and publishes; exact nonce replays once and conflicting payload is rejected',
    async () => {
      await cmd(1, 'save', 600, 1, draft({ theme: 'Safe technical fixture' }));
      const nonce = randomUUID();
      await cmd(1, 'state', 600, 2, { state: 'published' }, nonce);
      assert(
        (await cmd(1, 'state', 600, 2, { state: 'published' }, nonce)).replayed,
      );
      await denied(
        () => cmd(1, 'state', 600, 2, { state: 'cancelled' }, nonce),
        'PT409',
      );
      assert.equal(
        (await ws(2)).missions[0].accessDetails,
        'https://example.invalid/controlled-test',
      );
    },
  );
  await check(
    'published content is immutable and selected audience hides private access',
    async () => {
      await denied(() => cmd(1, 'save', 600, 3, draft()), 'PT409');
      await cmd(
        1,
        'save',
        603,
        0,
        draft({ audience: 'selected', targetIds: [tid(3)] }),
      );
      await cmd(1, 'state', 603, 1, { state: 'published' });
      assert(!(await ws(2)).missions.some((x) => x.id === uid(603)));
      assert((await ws(3)).missions.some((x) => x.id === uid(603)));
    },
  );
  await check(
    'participant sends a declaration only; forged personal text is refused',
    async () => {
      await denied(
        () =>
          cmd(2, 'participate', 600, 0, {
            declared: true,
            note: 'Private personal reflection',
          }),
        '22023',
      );
      const nonce = randomUUID();
      await cmd(2, 'participate', 600, 0, { declared: true }, nonce);
      assert(
        (await cmd(2, 'participate', 600, 0, { declared: true }, nonce))
          .replayed,
      );
      const p = (await ws(2)).progress;
      assert.equal(p.length, 1);
      assert.equal(p[0].status, 'pending_approval');
      assert(!JSON.stringify(await ws(2)).includes('participant_uid'));
    },
  );
  await check(
    'one account cannot validate itself even when leader',
    async () => {
      await cmd(1, 'participate', 600, 0, { declared: true });
      await denied(
        () =>
          cmd(1, 'review', 600, 1, {
            travelerId: tid(1),
            decision: 'approved',
            reason: '',
          }),
        '42501',
      );
    },
  );
  await check(
    'two avatars of one Auth identity cannot create duplicate participation',
    async () => {
      await cmd(1, 'save', 608, 0, draft());
      await cmd(1, 'state', 608, 1, { state: 'published' });
      await cmd(4, 'participate', 608, 0, { declared: true });
      await q('update public.travelers set is_active=false where id=$1', [
        tid(4),
      ]);
      await q('update public.travelers set is_active=true where id=$1', [
        tid(105),
      ]);
      await denied(
        () =>
          as(4, 'select public.guild_activity_command($1,$2,$3,$4,$5,0,$6)', [
            tid(105),
            uid(100),
            'participate',
            uid(608),
            randomUUID(),
            { declared: true },
          ]),
        'PT409',
      );
      assert.equal(
        (
          await q(
            'select count(*)::int n from public.guild_mission_progress where mission_id=$1 and participant_uid=$2',
            [uid(608), uid(4)],
          )
        ).rows[0].n,
        1,
      );
      await q('update public.travelers set is_active=false where id=$1', [
        tid(105),
      ]);
      await q('update public.travelers set is_active=true where id=$1', [
        tid(4),
      ]);
    },
  );
  await check(
    'authorized leader validates without issuing rewards and records future category only',
    async () => {
      await cmd(1, 'review', 600, 1, {
        travelerId: tid(2),
        decision: 'approved',
        reason: '',
      });
      const p = (await ws(2)).progress[0];
      assert.equal(p.status, 'approved');
      assert.equal(p.revision, 2);
      const e = (
        await q(
          'select * from guild_activity_private.future_eligibility where mission_id=$1 and owner_id=$2',
          [uid(600), uid(2)],
        )
      ).rows[0];
      assert.equal(e.xp_issued, 0);
      assert.equal(e.chests_issued, 0);
      assert.equal(e.state, 'pending_010d');
    },
  );
  await check(
    'temporary substitute validates only the explicitly delegated entity',
    async () => {
      await cmd(3, 'participate', 600, 0, { declared: true });
      await denied(
        () =>
          cmd(2, 'review', 600, 1, {
            travelerId: tid(3),
            decision: 'approved',
            reason: '',
          }),
        '42501',
      );
      await cmd(1, 'delegate', 600, 0, {
        travelerId: tid(2),
        active: true,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
      await cmd(2, 'review', 600, 1, {
        travelerId: tid(3),
        decision: 'approved',
        reason: '',
      });
      await denied(
        () =>
          cmd(2, 'review', 603, 0, {
            travelerId: tid(3),
            decision: 'approved',
            reason: '',
          }),
        '42501',
      );
    },
  );
  await check(
    'revocation takes effect with the same claims, including replay of an old validator command',
    async () => {
      const nonce = randomUUID();
      await cmd(
        2,
        'review',
        600,
        2,
        {
          travelerId: tid(3),
          decision: 'changes_requested',
          reason: 'Repeat the objective task.',
        },
        nonce,
      );
      await cmd(1, 'delegate', 600, 1, {
        travelerId: tid(2),
        active: false,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
      await denied(
        () =>
          cmd(
            2,
            'review',
            600,
            2,
            {
              travelerId: tid(3),
              decision: 'changes_requested',
              reason: 'Repeat the objective task.',
            },
            nonce,
          ),
        '42501',
      );
    },
  );
  await check(
    'expired substitution is rejected without a token refresh',
    async () => {
      await cmd(1, 'delegate', 600, 2, {
        travelerId: tid(2),
        active: true,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
      await q(
        "update guild_activity_private.delegations set expires_at=now()-interval '1 second' where mission_id=$1",
        [uid(600)],
      );
      await denied(
        () =>
          cmd(2, 'review', 600, 3, {
            travelerId: tid(3),
            decision: 'approved',
            reason: '',
          }),
        '42501',
      );
    },
  );
  await check(
    'two connections racing on one participation produce one winner and PT409',
    async () => {
      const a = new Client(options),
        b = new Client(options);
      await a.connect();
      await b.connect();
      connections.push(a, b);
      const outcomes = await Promise.allSettled([
        cmd(
          1,
          'review',
          600,
          2,
          {
            travelerId: tid(2),
            decision: 'changes_requested',
            reason: 'Clarify the objective.',
          },
          randomUUID(),
          100,
          a,
        ),
        cmd(
          1,
          'review',
          600,
          2,
          {
            travelerId: tid(2),
            decision: 'rejected',
            reason: 'Objective not met.',
          },
          randomUUID(),
          100,
          b,
        ),
      ]);
      assert.equal(outcomes.filter((x) => x.status === 'fulfilled').length, 1);
      assert.deepEqual(
        outcomes
          .filter((x) => x.status === 'rejected')
          .map((x) => x.reason.code),
        ['PT409'],
      );
    },
  );
  await check(
    'ended meeting stays immutable and corrections require an objective reason',
    async () => {
      await cmd(1, 'state', 600, 3, { state: 'closed' });
      await denied(() => cmd(1, 'save', 600, 4, draft()), 'PT409');
      await denied(
        () => cmd(2, 'participate', 600, 3, { declared: true }),
        '42501',
      );
      await denied(
        () =>
          cmd(1, 'review', 600, 3, {
            travelerId: tid(2),
            decision: 'approved',
            reason: '',
          }),
        '22023',
      );
      await cmd(1, 'review', 600, 3, {
        travelerId: tid(2),
        decision: 'approved',
        reason: '✦'.repeat(250),
      });
      assert.equal(
        (await ws(2)).missions.find((x) => x.id === uid(600)).accessDetails,
        '',
      );
      assert(
        (await ws(1)).validations.some((x) => x.reason === '✦'.repeat(250)),
      );
      assert(
        !(await ws(3)).validations.some((x) => x.reason === '✦'.repeat(250)),
      );
    },
  );
  await check(
    'validator revocation remains possible after closing and preserves historical decisions',
    async () => {
      await cmd(1, 'delegate', 600, 3, {
        travelerId: tid(2),
        active: false,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
      assert((await ws(2)).progress.length);
    },
  );
  await check(
    'activity reuses missions and can be attached to a published meeting',
    async () => {
      await cmd(
        1,
        'save',
        604,
        0,
        draft({
          kind: 'activity',
          meetingId: uid(603),
          accessDetails: '',
          category: 'solidarity',
          futureCategory: 'rare',
        }),
      );
      await cmd(1, 'state', 604, 1, { state: 'published' });
      await cmd(3, 'participate', 604, 0, { declared: true });
      await cmd(1, 'review', 604, 1, {
        travelerId: tid(3),
        decision: 'approved',
        reason: '',
      });
      assert.equal(
        (
          await q(
            'select category from guild_activity_private.future_eligibility where mission_id=$1',
            [uid(604)],
          )
        ).rows[0].category,
        'rare',
      );
    },
  );
  await check(
    'cancellation revokes pending future eligibility without deleting participation',
    async () => {
      await cmd(1, 'state', 603, 2, { state: 'cancelled' });
      assert.equal(
        (
          await q(
            'select validated from guild_activity_private.future_eligibility where mission_id=$1',
            [uid(604)],
          )
        ).rows[0].validated,
        false,
      );
      await denied(
        () => cmd(3, 'participate', 604, 2, { declared: true }),
        '42501',
      );
    },
  );
  await check(
    'issued recovery refuses removal and all legacy/economic data remain unchanged',
    async () => {
      await denied(
        () =>
          tx(
            read(
              'packages/database/proposals/rpg-dev-010c1-recovery-empty.sql',
            ),
          ),
        'P0001',
      );
      assert.deepEqual(await before(), original);
      for (const name of [
        'apply_guild_mission_reward',
        'review_guild_mission_v2',
      ])
        assert.equal(
          (
            await q(
              "select bool_or(has_function_privilege('authenticated',oid,'execute')) allowed from pg_proc where proname=$1",
              [name],
            )
          ).rows[0].allowed,
          false,
        );
    },
  );
  await check(
    'containment stops only new activity commands and retains reading and EBD permissions',
    async () => {
      await tx(
        read('packages/database/proposals/rpg-dev-010c1-containment.sql'),
      );
      await denied(() => cmd(1, 'state', 604, 2, { state: 'closed' }), '42501');
      assert((await ws(1)).missions.length);
      assert.equal(
        (
          await q(
            'select writes_enabled from guild_admin_private.multiguild_control',
          )
        ).rows[0].writes_enabled,
        true,
      );
    },
  );
}
