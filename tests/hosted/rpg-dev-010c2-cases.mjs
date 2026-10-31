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
  const production = process.env.RPG_010C2_PRODUCTION_PACKAGE === '1';
  const expectedScope = production ? 'guild-ebd-001' : 'hero-equipment-006';
  const rejectedScope = production ? 'hero-equipment-006' : 'guild-ebd-001';
  const migration = read(
      'supabase/migrations/20261031061321_rpg_dev_010c2_challenges_test.sql',
    ),
    recovery = read(
      'packages/database/proposals/rpg-dev-010c2-recovery-empty.sql',
    );
  const ws = (n, event = null, g = 100) =>
    as(n, 'select public.guild_challenges_workspace($1,$2,$3,0) x', [
      tid(n),
      uid(g),
      event === null ? null : uid(event),
    ]).then((r) => r.rows[0].x);
  const cmd = (
    n,
    action,
    event,
    revision,
    data,
    request = randomUUID(),
    g = 100,
    client,
  ) =>
    as(
      n,
      'select public.guild_challenges_command($1,$2,$3,$4,$5,$6,$7) x',
      [tid(n), uid(g), action, uid(event), request, revision, data],
      'authenticated',
      client,
    ).then((r) => r.rows[0].x);
  const current = async (id) => (await ws(1, id)).event.revision;
  const change = (id, state, reason = '') =>
    current(id).then((rev) => cmd(1, 'state', id, rev, { state, reason }));
  const questions = () =>
    Array.from({ length: 7 }, (_, i) => ({
      prompt: 'Technical fixture ' + (i + 1),
      options: ['First', 'Second', 'Third', 'Fourth'],
      answerKey: i % 4,
      reference: '',
      feedback: 'Synthetic explanation ' + i,
      difficulty: ['easy', 'medium', 'hard'][i % 3],
    }));
  const draft = (extra = {}) => ({
    title: 'Synthetic educational challenge',
    description: 'Technical fixture only, not biblical content.',
    theme: 'Controlled fixture',
    reference: '',
    criteria: 'Seven answers and all declared manual objectives.',
    mode: 'competitive',
    startsAt: new Date(Date.now() - 60000).toISOString(),
    endsAt: new Date(Date.now() + 3600000).toISOString(),
    meetingId: '',
    manualIds: [],
    teams: ['Team A', 'Team B'],
    questions: questions(),
    ...extra,
  });
  const snapshot = async () =>
    (
      await q(
        "select jsonb_build_object('travelers',(select jsonb_agg(to_jsonb(t) order by id) from public.travelers t),'wallets',(select jsonb_agg(to_jsonb(t) order by traveler_id) from public.wallets t),'stats',(select jsonb_agg(to_jsonb(t) order by traveler_id) from public.traveler_stats t),'inventory',(select jsonb_agg(to_jsonb(t) order by id) from public.inventory t),'members',(select jsonb_agg(to_jsonb(t) order by guild_id,traveler_id) from public.guild_members t),'lessons',(select jsonb_agg(to_jsonb(t) order by id) from public.guild_lessons t),'rewards',(select jsonb_agg(to_jsonb(t) order by id) from public.guild_reward_claims t)) x",
      )
    ).rows[0].x;
  const metadata = async () =>
    (
      await q(
        "select jsonb_build_object('functions',(select jsonb_agg(jsonb_build_object('name',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid),'acl',p.proacl) order by p.oid::regprocedure::text) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname not in('pg_catalog','information_schema') and p.prokind='f'),'columns',(select jsonb_agg(jsonb_build_array(table_schema,table_name,column_name,data_type,is_nullable,column_default) order by table_schema,table_name,ordinal_position) from information_schema.columns where table_schema not in('pg_catalog','information_schema')),'triggers',(select jsonb_agg(pg_get_triggerdef(oid) order by pg_get_triggerdef(oid)) from pg_trigger where not tgisinternal),'policies',(select jsonb_agg(to_jsonb(t) order by schemaname,tablename,policyname) from pg_policies t)) x",
      )
    ).rows[0].x;
  await q(
    "insert into public.travelers(id,user_id,name,body_type,skin_tone,hair_style,avatar_variant,is_active) values($1,$2,'QA alternate','male','medio','curto','musgo',false)",
    [tid(105), uid(3)],
  );
  await q(
    "insert into public.guild_members(guild_id,traveler_id,role,status) values($1,$2,'member','active')",
    [uid(100), tid(105)],
  );
  const baseline = await snapshot(),
    originalMetadata = await metadata();
  await check('010C2 refuses the wrong environment before DDL', async () => {
    await q(
      `create or replace function public.release_scope() returns text language sql immutable as $$select '${rejectedScope}'::text$$`,
    );
    await denied(() => tx(migration), 'P0001');
    await q(
      `create or replace function public.release_scope() returns text language sql immutable as $$select '${expectedScope}'::text$$`,
    );
  });
  await check(
    'empty recovery restores all prior function ACLs, columns, triggers, policies and game data',
    async () => {
      await tx(migration);
      await tx(recovery);
      assert.deepEqual(await metadata(), originalMetadata);
      assert.deepEqual(await snapshot(), baseline);
    },
  );
  await tx(migration);
  await check(
    'private data and helpers are denied to application, anon and service roles',
    async () => {
      for (const role of ['anon', 'service_role'])
        await denied(
          () =>
            as(
              1,
              'select public.guild_challenges_workspace($1,$2,NULL,0)',
              [tid(1), uid(100)],
              role,
            ),
          '42501',
        );
      for (const table of [
        'events',
        'teams',
        'roster',
        'results',
        'practice',
        'commands',
        'audit',
      ])
        await denied(
          () => as(1, 'select * from guild_challenge_private.' + table),
          '42501',
        );
      await denied(
        () =>
          as(1, 'select guild_challenge_private.grade($1,$2)', [
            JSON.stringify(questions()),
            JSON.stringify([0, 1, 2, 3, 0, 1, 2]),
          ]),
        '42501',
      );
    },
  );
  await check(
    'member cannot create and forged active avatar cannot read leader context',
    async () => {
      await denied(async () => cmd(2, 'save', 800, 0, draft()), '42501');
      await denied(
        () =>
          as(2, 'select public.guild_challenges_workspace($1,$2,NULL,0)', [
            tid(1),
            uid(100),
          ]),
        '42501',
      );
    },
  );
  await check(
    'question contract requires exactly seven, four distinct alternatives and reviewed keys',
    async () => {
      for (const patch of [
        { questions: questions().slice(0, 6) },
        {
          questions: questions().map((v, i) =>
            i === 0 ? { ...v, options: ['A', 'A', 'B', 'C'] } : v,
          ),
        },
        {
          questions: questions().map((v, i) =>
            i === 0 ? { ...v, answerKey: 4 } : v,
          ),
        },
        {
          questions: questions().map((v, i) =>
            i === 0 ? { ...v, feedback: '' } : v,
          ),
        },
      ])
        await denied(async () => cmd(1, 'save', 800, 0, draft(patch)), '22023');
    },
  );
  await cmd(1, 'save', 800, 0, draft());
  await check(
    'draft key is leader-only and publishing freezes content without a reward',
    async () => {
      await denied(() => ws(2, 800), '42501');
      assert.equal((await ws(1, 800)).questions[0].answerKey, 0);
      assert.equal((await change(800, 'published')).economicIssued, false);
      assert.deepEqual((await ws(2, 800)).questions, []);
      await denied(
        async () =>
          cmd(
            1,
            'save',
            800,
            await current(800),
            draft({ title: 'Changed after publish' }),
          ),
        'PT409',
      );
    },
  );
  await check(
    'explicit account consent is required and leader cannot enrol another player',
    async () => {
      await denied(
        async () => cmd(2, 'enrol', 800, 0, { accept: true }),
        'PT409',
      );
      for (const n of [1, 2, 3])
        await cmd(1, 'invite', 800, await current(800), { avatarId: tid(n) });
      for (const n of [1, 2, 3]) {
        const r = (await ws(n, 800)).roster.find((x) => x.own);
        await cmd(n, 'enrol', 800, r.revision, { accept: true });
      }
      assert.equal(
        (await ws(1, 800)).roster.filter((x) => x.status === 'accepted').length,
        3,
      );
    },
  );
  await check(
    'two avatars of the same Auth identity cannot occupy two roster places',
    async () => {
      await denied(
        async () =>
          cmd(1, 'invite', 800, await current(800), { avatarId: tid(105) }),
        'PT409',
      );
      assert.equal(
        (
          await q(
            'select count(*) n from guild_challenge_private.roster where event_id=$1 and owner_id=$2',
            [uid(800), uid(3)],
          )
        ).rows[0].n,
        '1',
      );
    },
  );
  await check(
    'balanced teams and explicit assignment are required before starting',
    async () => {
      const w = await ws(1, 800);
      await denied(() => change(800, 'running'), '22023');
      for (let i = 0; i < w.roster.length; i++)
        await cmd(1, 'team', 800, await current(800), {
          rosterId: w.roster[i].id,
          teamId: w.teams[0].id,
        });
      await denied(() => change(800, 'running'), '22023');
      await cmd(1, 'team', 800, await current(800), {
        rosterId: w.roster[2].id,
        teamId: w.teams[1].id,
      });
      await change(800, 'running');
      assert((await ws(1, 800)).roster.every((x) => x.frozen));
    },
  );
  await check(
    'frozen roster blocks direct team changes, assignment APIs and late invitations',
    async () => {
      const w = await ws(1, 800);
      await denied(
        async () =>
          cmd(1, 'team', 800, w.event.revision, {
            rosterId: w.roster[0].id,
            teamId: w.teams[1].id,
          }),
        '42501',
      );
      await denied(
        async () =>
          cmd(1, 'invite', 800, await current(800), { avatarId: tid(4) }),
        '42501',
      );
      await denied(
        () =>
          q(
            'update guild_challenge_private.roster set team_id=$1 where id=$2',
            [w.teams[1].id, w.roster[0].id],
          ),
        '42501',
      );
    },
  );
  await check(
    'running participants see questions without keys, scores or educational answer leakage',
    async () => {
      const w = await ws(2, 800);
      assert.equal(w.questions.length, 7);
      assert(
        w.questions.every((q) => !('answerKey' in q) && !('feedback' in q)),
      );
      assert.equal(w.board, null);
      await denied(
        async () =>
          cmd(2, 'practice', 800, 1, { choices: [0, 1, 2, 3, 0, 1, 2] }),
        '42501',
      );
      await denied(
        async () =>
          cmd(2, 'answer', 800, 1, {
            choices: [0, 1, 2, 3, 0, 1, 2],
            score: 7,
          }),
        '22023',
      );
      await denied(
        async () =>
          cmd(2, 'answer', 800, 0, { choices: [0, 1, 2, 3, 0, 1, 2] }),
        'PT409',
      );
    },
  );
  const nonce = randomUUID(),
    valid = questions().map((q) => q.answerKey);
  await check(
    'server grading records one official result and replay never duplicates results or history',
    async () => {
      await cmd(1, 'answer', 800, 1, { choices: valid }, nonce);
      const counts = (
        await q(
          'select (select count(*) from guild_challenge_private.results) results,(select count(*) from guild_challenge_private.audit) history',
        )
      ).rows[0];
      assert.equal(
        (await cmd(1, 'answer', 800, 1, { choices: valid }, nonce)).replayed,
        true,
      );
      assert.deepEqual(
        (
          await q(
            'select (select count(*) from guild_challenge_private.results) results,(select count(*) from guild_challenge_private.audit) history',
          )
        ).rows[0],
        counts,
      );
      await denied(
        async () =>
          cmd(1, 'answer', 800, 1, { choices: [1, 1, 1, 1, 1, 1, 1] }),
        'PT409',
      );
      assert.equal(
        (
          await q(
            'select score from guild_challenge_private.results where event_id=$1 and owner_id=$2',
            [uid(800), uid(1)],
          )
        ).rows[0].score,
        7,
      );
    },
  );
  await check(
    'two concurrent official submissions yield one row and one PT409',
    async () => {
      const a = new Client(options),
        b = new Client(options);
      await a.connect();
      await b.connect();
      connections.push(a, b);
      const settled = await Promise.allSettled([
        cmd(2, 'answer', 800, 1, { choices: valid }, randomUUID(), 100, a),
        cmd(
          2,
          'answer',
          800,
          1,
          { choices: [0, 0, 0, 0, 0, 0, 0] },
          randomUUID(),
          100,
          b,
        ),
      ]);
      assert.equal(settled.filter((x) => x.status === 'fulfilled').length, 1);
      assert.equal(
        settled.find((x) => x.status === 'rejected').reason.code,
        'PT409',
      );
      assert.equal(
        (
          await q(
            'select count(*) n from guild_challenge_private.results where event_id=$1 and owner_id=$2',
            [uid(800), uid(2)],
          )
        ).rows[0].n,
        '1',
      );
    },
  );
  await check(
    'team averages retain the frozen denominator and absent player contributes zero',
    async () => {
      assert.equal((await ws(1, 800)).board, null);
      const board = (
        await q('select guild_challenge_private.scores($1) x', [uid(800)])
      ).rows[0].x;
      for (const t of board.teams) {
        const own = board.persons.filter((p) => p.teamId === t.id);
        assert.equal(t.eligible, own.length);
        assert.equal(
          Number(t.average),
          own.reduce((n, p) => n + p.points, 0) / own.length,
        );
      }
      assert.equal(board.persons.find((p) => p.avatarId === tid(3)).points, 0);
      await denied(() => change(800, 'closed'), '42501');
    },
  );
  await check(
    'cross-Guild event mixing and forged client score are refused',
    async () => {
      await denied(() => ws(2, 800, 101), '42501');
      await denied(
        async () =>
          cmd(2, 'answer', 800, 1, { choices: valid }, randomUUID(), 101),
        '42501',
      );
    },
  );
  await cmd(3, 'answer', 800, 1, { choices: valid });
  await change(800, 'closed');
  await check(
    'final score and official first result survive educational retries and reconnection',
    async () => {
      const frozen = (
        await q(
          'select to_jsonb(r) x from guild_challenge_private.results r where event_id=$1 order by owner_id',
          [uid(800)],
        )
      ).rows;
      const board = (await ws(2, 800)).board;
      const before = (await ws(2, 800)).myResult.score;
      await cmd(2, 'practice', 800, 1, { choices: valid });
      const w = await ws(2, 800);
      assert.equal(w.myResult.score, before);
      assert.deepEqual(w.board, board);
      assert.deepEqual(
        (
          await q(
            'select to_jsonb(r) x from guild_challenge_private.results r where event_id=$1 order by owner_id',
            [uid(800)],
          )
        ).rows,
        frozen,
      );
      assert.equal(w.latestPractice.score, 7);
      assert(w.questions.every((q) => 'answerKey' in q));
      assert.equal(w.event.status, 'closed');
      assert(w.board.teams.length);
    },
  );
  await check(
    'official results and audit history reject direct modifications even as owner',
    async () => {
      await denied(
        () => q('update guild_challenge_private.results set score=0'),
        '42501',
      );
      await denied(
        () => q('delete from guild_challenge_private.audit'),
        '42501',
      );
    },
  );
  await check(
    'confirmed ranking cannot be rectified, replaced or changed by subsequent learning',
    async () => {
      await denied(
        async () =>
          cmd(1, 'rectify', 800, await current(800), {
            reason: 'Changed ranking',
          }),
        '22023',
      );
      await denied(
        () =>
          q(
            "update guild_challenge_private.events set final_result='{}'::jsonb where id=$1",
            [uid(800)],
          ),
        '42501',
      );
    },
  );
  await check(
    'no role or alternate API exposes keys, explanations or any early score',
    async () => {
      await cmd(1, 'save', 802, 0, draft({ mode: 'individual', teams: [] }));
      await change(802, 'published');
      for (const n of [1, 2]) {
        await cmd(1, 'invite', 802, await current(802), { avatarId: tid(n) });
        const own = (await ws(n, 802)).roster.find((r) => r.own);
        await cmd(n, 'enrol', 802, own.revision, { accept: true });
      }
      await change(802, 'running');
      await cmd(2, 'answer', 802, 1, { choices: valid });
      for (const n of [1, 2, 3]) {
        const w = await ws(n, 802);
        assert.equal(w.board, null);
        assert.equal(w.latestPractice, null);
        assert(
          w.questions.every((q) => !('answerKey' in q) && !('feedback' in q)),
        );
        if (w.myResult) assert.equal(w.myResult.score, null);
        assert(!('score' in w.event));
      }
      for (const role of ['anon', 'service_role'])
        await denied(
          () =>
            as(
              2,
              'select public.guild_challenges_workspace($1,$2,$3,0)',
              [tid(2), uid(100), uid(802)],
              role,
            ),
          '42501',
        );
      await cmd(1, 'answer', 802, 1, { choices: valid });
      await change(802, 'closed');
      const b = (await ws(2, 802)).board;
      assert.equal(b.teams.length, 2);
      assert(b.teams.every((t) => t.place === 1));
    },
  );
  await check(
    'withdrawal cannot shrink a frozen denominator or reactivate an official attempt',
    async () => {
      await cmd(1, 'save', 803, 0, draft({ mode: 'individual', teams: [] }));
      await change(803, 'published');
      await cmd(1, 'invite', 803, await current(803), { avatarId: tid(2) });
      let r = (await ws(2, 803)).roster.find((x) => x.own);
      await cmd(2, 'enrol', 803, r.revision, { accept: true });
      await change(803, 'running');
      r = (await ws(2, 803)).roster.find((x) => x.own);
      await cmd(2, 'enrol', 803, r.revision, { accept: false });
      await denied(() => cmd(2, 'answer', 803, 1, { choices: valid }), '42501');
      const b = (
        await q('select guild_challenge_private.scores($1) x', [uid(803)])
      ).rows[0].x;
      assert.equal(b.teams[0].eligible, 1);
      assert.equal(b.teams[0].average, 0);
      await change(
        803,
        'cancelled',
        'Participant withdrew from technical fixture',
      );
    },
  );
  await check(
    'current leadership revocation denies existing-session commands immediately',
    async () => {
      await q(
        'insert into guild_admin_private.leadership_revocations(user_id,revoked_by,revoked_at,revision) values($1,$2,clock_timestamp(),1)',
        [uid(1), uid(2)],
      );
      await denied(() => cmd(1, 'save', 804, 0, draft()), '42501');
      assert.equal((await ws(1, 800)).leader, false);
      await q(
        'update guild_admin_private.leadership_revocations set cleared_at=clock_timestamp(),revision=revision+1 where user_id=$1',
        [uid(1)],
      );
      assert.equal((await ws(1, 800)).leader, true);
    },
  );
  await check(
    'a nonce cannot be reused with changed payload or by another account',
    async () => {
      await denied(
        () =>
          cmd(1, 'answer', 800, 1, { choices: [0, 0, 0, 0, 0, 0, 0] }, nonce),
        'PT409',
      );
      await denied(
        () => cmd(2, 'answer', 800, 1, { choices: valid }, nonce),
        'PT409',
      );
    },
  );
  const cell = (n, action, id, revision, payload) =>
    as(n, 'select public.guild_activity_command($1,$2,$3,$4,$5,$6,$7) x', [
      tid(n),
      uid(100),
      action,
      uid(id),
      randomUUID(),
      revision,
      payload,
    ]);
  const cellDraft = (kind, meeting = '') => ({
    title: 'Synthetic manual source',
    description: 'Technical fixture only',
    objective: 'Verify objective participation',
    instructions: 'Declare participation without personal text',
    evidenceCriterion: 'Responsible confirms actual participation',
    bibleReference: '',
    startsAt: new Date(Date.now() - 60000).toISOString(),
    dueAt: '',
    audience: 'all',
    targetIds: [],
    kind,
    meetingId: meeting,
    category: 'group',
    theme: '',
    meetingType: 'digital',
    responsibleId: tid(1),
    accessDetails: '',
    futureCategory: 'none',
  });
  await check(
    'manual objectives require a new verified participation after challenge start',
    async () => {
      await cell(1, 'save', 900, 0, cellDraft('meeting'));
      await cell(1, 'state', 900, 1, { state: 'published' });
      await cell(1, 'save', 901, 0, cellDraft('activity', uid(900)));
      await cell(1, 'state', 901, 1, { state: 'published' });
      await cell(2, 'participate', 901, 0, { declared: true });
      await cell(1, 'review', 901, 1, {
        travelerId: tid(2),
        decision: 'approved',
        reason: '',
      });
      await cmd(
        1,
        'save',
        805,
        0,
        draft({
          mode: 'cooperative',
          teams: ['Technical team'],
          meetingId: uid(900),
          manualIds: [uid(901)],
        }),
      );
      await change(805, 'published');
      await cmd(1, 'invite', 805, await current(805), { avatarId: tid(2) });
      let w = await ws(2, 805);
      await cmd(2, 'enrol', 805, w.roster.find((r) => r.own).revision, {
        accept: true,
      });
      w = await ws(1, 805);
      await cmd(1, 'team', 805, w.event.revision, {
        rosterId: w.roster[0].id,
        teamId: w.teams[0].id,
      });
      await change(805, 'running');
      await cmd(2, 'answer', 805, 1, { choices: valid });
      let b = (
        await q('select guild_challenge_private.scores($1) x', [uid(805)])
      ).rows[0].x;
      assert.equal(b.persons[0].manualPoints, 0);
      await denied(() => change(805, 'closed'), '42501');
      await cell(1, 'review', 901, 2, {
        travelerId: tid(2),
        decision: 'changes_requested',
        reason: 'New participation required for this challenge',
      });
      await cell(2, 'participate', 901, 3, { declared: true });
      await cell(1, 'review', 901, 4, {
        travelerId: tid(2),
        decision: 'approved',
        reason: '',
      });
      b = (await q('select guild_challenge_private.scores($1) x', [uid(805)]))
        .rows[0].x;
      assert.equal(b.persons[0].manualPoints, 1);
      assert.equal(b.persons[0].points, 8);
      assert.equal(b.teams[0].completed, true);
    },
  );
  await check(
    'parent meeting cannot close with an open challenge; cancellation preserves official rows',
    async () => {
      await cell(1, 'state', 901, 2, { state: 'closed' });
      await denied(
        () => cell(1, 'state', 900, 2, { state: 'closed' }),
        '42501',
      );
      const before = (
        await q(
          'select count(*) n from guild_challenge_private.results where event_id=$1',
          [uid(805)],
        )
      ).rows[0].n;
      await cell(1, 'state', 900, 2, { state: 'cancelled' });
      assert.equal((await ws(2, 805)).event.status, 'cancelled');
      assert.equal(
        (
          await q(
            'select count(*) n from guild_challenge_private.results where event_id=$1',
            [uid(805)],
          )
        ).rows[0].n,
        before,
      );
      assert(
        (await ws(1, 805)).history.some((h) => h.action === 'parent_cancel'),
      );
    },
  );
  await check(
    'existing game and EBD data are unchanged and issued recovery refuses deletion',
    async () => {
      assert.deepEqual(await snapshot(), baseline);
      await denied(() => tx(recovery), 'P0001');
    },
  );
  await check(
    'containment retains reading, official history and prior Guild writes',
    async () => {
      await tx(
        read('packages/database/proposals/rpg-dev-010c2-containment.sql'),
      );
      await denied(async () => cmd(1, 'save', 801, 0, draft()), '42501');
      assert((await ws(2, 800)).board);
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
