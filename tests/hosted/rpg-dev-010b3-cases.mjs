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
    'supabase/migrations/20261030221400_rpg_dev_010b3_lessons_test.sql',
  );
  const classCommand = (n, c, action, rev, data) =>
    as(n, 'select public.ebd_classes_command($1,$2,$3,$4,$5,$6,$7) x', [
      tid(n),
      uid(100),
      uid(c),
      action,
      randomUUID(),
      rev,
      data,
    ]).then((r) => r.rows[0].x);
  const command = (
    n,
    c,
    action,
    id,
    revision,
    data,
    request = randomUUID(),
    client,
  ) =>
    as(
      n,
      'select public.ebd_class_lessons_command($1,$2,$3,$4,$5,$6,$7,$8) x',
      [
        tid(n),
        uid(100),
        uid(c),
        action,
        typeof id === 'number' ? uid(id) : id,
        request,
        revision,
        data,
      ],
      'authenticated',
      client,
    ).then((r) => r.rows[0].x);
  const workspace = (n, c) =>
    as(n, 'select public.ebd_class_lessons_workspace($1,$2,$3,0) x', [
      tid(n),
      uid(100),
      uid(c),
    ]).then((r) => r.rows[0].x);
  const lesson = (teacher = 3) => ({
    title: 'Synthetic lesson',
    theme: '',
    description: 'Synthetic technical fixture',
    content: 'Controlled educational fixture, not official biblical content.',
    reference: '',
    scheduledAt: '',
    teacherId: tid(teacher),
    audience: 'all',
    targetIds: [],
    materials: [],
    objectives: '',
    rewardTier: '',
  });
  await as(1, 'select public.guild_scoped_ebd_command($1,$2,$3,$4,0,$5)', [
    tid(1),
    uid(100),
    'lesson',
    uid(299),
    { ...lesson(1), theme: 'Legacy fixture' },
  ]);
  const baseline = async () => {
    const r = await q(
      "select jsonb_build_object('travelers',(select jsonb_agg(to_jsonb(x) order by id) from public.travelers x),'wallets',(select jsonb_agg(to_jsonb(x) order by traveler_id) from public.wallets x),'stats',(select jsonb_agg(to_jsonb(x) order by traveler_id) from public.traveler_stats x),'lessons',(select jsonb_agg(to_jsonb(x)-'ebd_class_id' order by id) from public.guild_lessons x where id=$1),'pending',(select jsonb_agg(to_jsonb(x) order by lesson_id,traveler_id) from public.guild_ebd_reward_pending x)) x",
      [uid(299)],
    );
    return r.rows[0].x;
  };
  const before = await baseline();
  const defs = async () =>
    (
      await q(
        "select oid::regprocedure::text signature,pg_get_functiondef(oid) definition,proacl::text acl from pg_proc where pronamespace='ebd_ops'::regnamespace order by 1",
      )
    ).rows;
  const definitions = await defs();
  await check('010B3 rejects productive scope before any DDL', async () => {
    await q(
      "create or replace function public.release_scope() returns text language sql immutable as $$select 'guild-ebd-001'::text$$",
    );
    await denied(() => tx(migration), 'P0001');
    await q(
      "create or replace function public.release_scope() returns text language sql immutable as $$select 'hero-equipment-006'::text$$",
    );
  });
  await check(
    'empty recovery restores EBD definitions ACLs constraints and original lesson values',
    async () => {
      await tx(migration);
      await tx(
        read('packages/database/proposals/rpg-dev-010b3-recovery-empty.sql'),
      );
      assert.deepEqual(await defs(), definitions);
      assert.deepEqual(await baseline(), before);
    },
  );
  await tx(migration);
  for (const c of [200, 201])
    await classCommand(1, c, 'save', 0, {
      name: 'Fixture class ' + c,
      description: '',
    });
  for (const n of [2, 3])
    await classCommand(1, 200, 'member', 0, {
      travelerId: tid(n),
      active: true,
    });
  await classCommand(1, 200, 'teacher', 0, {
    travelerId: tid(3),
    active: true,
    publish: true,
    attend: true,
  });
  await check(
    'teacher creates flexible lesson without mandatory theme date or quiz, edits and publishes',
    async () => {
      await command(3, 200, 'lesson', 300, 0, lesson());
      await command(3, 200, 'lesson', 300, 1, {
        ...lesson(),
        title: 'Edited fixture',
      });
      await command(3, 200, 'state', 300, 2, { state: 'published' });
      const w = await workspace(2, 200);
      assert.equal(w.lessons[0].title, 'Edited fixture');
      assert.equal(w.lessons[0].content, lesson().content);
      assert.deepEqual(w.quizzes, []);
    },
  );
  await check(
    'class teacher cannot act in another class or impersonate an owner',
    async () => {
      await denied(() => command(3, 201, 'lesson', 301, 0, lesson()), '42501');
      await denied(
        () =>
          as(2, 'select public.ebd_class_lessons_workspace($1,$2,$3,0)', [
            tid(3),
            uid(100),
            uid(200),
          ]),
        '42501',
      );
    },
  );
  await check(
    'anonymous service and direct table access remain denied',
    async () => {
      for (const role of ['anon', 'service_role'])
        await denied(
          () =>
            as(
              null,
              'select public.ebd_class_lessons_workspace($1,$2,$3,0)',
              [tid(2), uid(100), uid(200)],
              role,
            ),
          '42501',
        );
      for (const role of ['anon', 'authenticated', 'service_role'])
        for (const table of [
          'quizzes',
          'quiz_questions',
          'quiz_results',
          'attendance_eligibility',
        ])
          await denied(
            () => as(2, 'select * from ebd_class_private.' + table, [], role),
            '42501',
          );
    },
  );
  await check(
    'legacy workspace omits class lessons and legacy command cannot bypass authorization',
    async () => {
      const w = (
        await as(1, 'select public.guild_scoped_ebd_workspace($1,$2,0) x', [
          tid(1),
          uid(100),
        ])
      ).rows[0].x;
      assert(w.lessons.every((x) => x.id !== uid(300)));
      await denied(
        () =>
          as(1, 'select public.guild_scoped_ebd_command($1,$2,$3,$4,3,$5)', [
            tid(1),
            uid(100),
            'state',
            uid(300),
            { state: 'archived' },
          ]),
        '42501',
      );
    },
  );
  await command(3, 200, 'lesson', 301, 0, lesson());
  const questions = Array.from({ length: 7 }, (_, i) => ({
    prompt: 'Synthetic question ' + (i + 1),
    options: ['First', 'Second', 'Third', 'Fourth'],
    answerKey: i % 4,
    reference: '',
    feedback: 'Educational fixture feedback',
  }));
  await check(
    'only exactly seven questions, four distinct choices and one valid key are accepted',
    async () => {
      for (const qs of [
        questions.slice(1),
        [...questions, questions[0]],
        questions.map((x, i) => (i === 0 ? { ...x, answerKey: 4 } : x)),
        questions.map((x, i) =>
          i === 0 ? { ...x, options: ['A', 'A', 'B', 'C'] } : x,
        ),
      ])
        await denied(
          () =>
            command(3, 200, 'quiz', 301, 1, {
              lessonId: uid(301),
              difficulty: 'easy',
              questions: qs,
            }),
          '22023',
        );
    },
  );
  await command(3, 200, 'quiz', 301, 1, {
    lessonId: uid(301),
    difficulty: 'medium',
    questions,
  });
  await command(3, 200, 'state', 301, 2, { state: 'published' });
  let quiz;
  await check(
    'student gets seven questions without answer key or pre-attempt feedback',
    async () => {
      const w = await workspace(2, 200);
      quiz = w.quizzes[0];
      assert.equal(quiz.questions.length, 7);
      assert(
        quiz.questions.every(
          (x) => x.answerKey === undefined && x.feedback === undefined,
        ),
      );
      assert.deepEqual(w.quizResults, []);
      assert.deepEqual(w.rewards, []);
    },
  );
  const choices = questions.map((x, i) =>
      i < 4 ? x.answerKey : (x.answerKey + 1) % 4,
    ),
    request = randomUUID();
  await check(
    'server rejects arbitrary score and computes official four of seven itself',
    async () => {
      await denied(
        () =>
          command(2, 200, 'quiz_submit', 301, quiz.revision, {
            quizId: quiz.id,
            choices,
            score: 7,
          }),
        '22023',
      );
      const result = await command(
        2,
        200,
        'quiz_submit',
        301,
        quiz.revision,
        { quizId: quiz.id, choices },
        request,
      );
      assert.equal(result.score, 4);
      assert.equal(result.total, 7);
      assert.equal(result.official, true);
    },
  );
  await check(
    'replay and free learning attempts preserve exactly one official result',
    async () => {
      const replay = await command(
        2,
        200,
        'quiz_submit',
        301,
        quiz.revision,
        { quizId: quiz.id, choices },
        request,
      );
      assert.equal(replay.replayed, true);
      await command(2, 200, 'quiz_submit', 301, quiz.revision, {
        quizId: quiz.id,
        choices: questions.map((x) => x.answerKey),
      });
      const w = await workspace(2, 200);
      assert.equal(w.quizResults.length, 1);
      assert.equal(w.quizResults[0].score, 4);
      assert.equal(w.quizResults[0].attempts, 2);
      assert(w.quizResults[0].latest.every((x) => x.correct));
    },
  );
  await check(
    'parallel learning submissions serialize without duplicating official result',
    async () => {
      const a = new Client(options),
        b = new Client(options);
      await a.connect();
      await b.connect();
      connections.push(a, b);
      const nonce = randomUUID();
      const results = await Promise.all([
        command(
          2,
          200,
          'quiz_submit',
          301,
          quiz.revision,
          { quizId: quiz.id, choices },
          nonce,
          a,
        ),
        command(
          2,
          200,
          'quiz_submit',
          301,
          quiz.revision,
          { quizId: quiz.id, choices },
          nonce,
          b,
        ),
      ]);
      assert.equal(results.filter((x) => x.replayed).length, 1);
      assert.equal((await workspace(2, 200)).quizResults[0].attempts, 3);
    },
  );
  await check(
    'another class sees no mixed results and another student cannot read personal answers',
    async () => {
      await classCommand(1, 201, 'member', 0, {
        travelerId: tid(2),
        active: true,
      });
      const w = await workspace(2, 201);
      assert.deepEqual(w.lessons, []);
      assert.deepEqual(w.quizResults, []);
      assert.deepEqual(
        (await workspace(3, 200)).quizResults.map((x) => x.traveler_id),
        [tid(2)],
      );
    },
  );
  await command(3, 200, 'lesson', 302, 0, lesson());
  const activity = {
    lessonId: uid(302),
    title: 'Participation fixture',
    kind: 'reflective',
    prompt: 'Participation only, do not submit personal content.',
    options: [],
    answerKey: null,
    deadline: '',
    attemptLimit: 5,
    criterion: 'manual',
  };
  await command(3, 200, 'activity', 400, 0, activity);
  await command(3, 200, 'state', 302, 1, { state: 'published' });
  await check(
    'practical participation stores no private reflection and teacher validates it',
    async () => {
      await denied(
        () =>
          command(2, 200, 'submit', 500, 0, {
            activityId: uid(400),
            response: 'Private reflection',
            choice: null,
          }),
        '22023',
      );
      await command(2, 200, 'submit', 500, 0, {
        activityId: uid(400),
        response: 'Participação declarada',
        choice: null,
      });
      await command(3, 200, 'grade', 500, 1, {
        status: 'completed',
        feedback: 'Participation checked',
      });
      const w = await workspace(2, 200);
      assert.equal(w.answers[0].response, 'Participação declarada');
      assert.equal(w.answers[0].status, 'completed');
    },
  );
  await check(
    'attendance four states use one row, audited revisions and eligibility50 with issued zero',
    async () => {
      for (const [rev, status] of [
        'pending',
        'present',
        'justified',
        'absent',
      ].entries())
        await command(3, 200, 'attendance', 302, rev, {
          travelerId: tid(2),
          status,
          reason: '',
        });
      const w = await workspace(2, 200);
      assert.equal(w.attendance.length, 1);
      assert.equal(w.attendance[0].status, 'absent');
      assert.equal(w.attendance[0].revision, 4);
      assert.equal(w.eligibility[0].xp_contract, 50);
      assert.equal(w.eligibility[0].xp_issued, 0);
      assert.equal(w.eligibility[0].eligible, false);
      await denied(
        () =>
          command(3, 200, 'attendance', 302, 0, {
            travelerId: tid(2),
            status: 'present',
            reason: '',
          }),
        'PT409',
      );
    },
  );
  await check(
    'revocation blocks teacher operations with the same synthetic authenticated subject immediately',
    async () => {
      await classCommand(1, 200, 'teacher', 1, {
        travelerId: tid(3),
        active: false,
        publish: true,
        attend: true,
      });
      await denied(
        () =>
          command(3, 200, 'attendance', 302, 4, {
            travelerId: tid(2),
            status: 'present',
            reason: '',
          }),
        '42501',
      );
      await denied(() => command(3, 200, 'lesson', 303, 0, lesson()), '42501');
    },
  );
  await check(
    'quiz results and attendance persist after reconnect while private answers stay scoped',
    async () => {
      const fresh = new Client(options);
      await fresh.connect();
      connections.push(fresh);
      const w = (
        await as(
          2,
          'select public.ebd_class_lessons_workspace($1,$2,$3,0) x',
          [tid(2), uid(100), uid(200)],
          'authenticated',
          fresh,
        )
      ).rows[0].x;
      assert.equal(w.quizResults[0].attempts, 3);
      assert.equal(w.attendance[0].revision, 4);
      const other = await workspace(3, 200);
      assert.deepEqual(other.quizResults, []);
      assert.deepEqual(other.attendance, []);
    },
  );
  await check(
    'parallel attendance corrections preserve one row and conflict rather than overwrite',
    async () => {
      const a = new Client(options),
        b = new Client(options);
      await a.connect();
      await b.connect();
      connections.push(a, b);
      const results = await Promise.allSettled([
        command(
          1,
          200,
          'attendance',
          302,
          4,
          { travelerId: tid(2), status: 'present', reason: '' },
          randomUUID(),
          a,
        ),
        command(
          1,
          200,
          'attendance',
          302,
          4,
          { travelerId: tid(2), status: 'justified', reason: '' },
          randomUUID(),
          b,
        ),
      ]);
      assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1);
      assert.deepEqual(
        results
          .filter((x) => x.status === 'rejected')
          .map((x) => x.reason.code),
        ['PT409'],
      );
      assert.equal((await workspace(2, 200)).attendance.length, 1);
    },
  );
  await check(
    'questionnaire removal keeps past official results while content-only republication remains possible',
    async () => {
      await command(1, 200, 'state', 301, 3, { state: 'draft' });
      await command(1, 200, 'quiz_remove', 301, 4, { lessonId: uid(301) });
      const w = await workspace(2, 200);
      assert.equal(w.quizResults[0].score, 4);
      assert(w.lessons.find((l) => l.id === uid(301)).content === '');
      await command(1, 200, 'state', 301, 5, { state: 'published' });
      assert.equal((await workspace(2, 200)).quizzes.length, 0);
    },
  );
  await check(
    'scheduled lesson exposes metadata before publication and rejects future attendance',
    async () => {
      await command(1, 200, 'lesson', 304, 0, {
        ...lesson(1),
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      await command(1, 200, 'state', 304, 1, { state: 'scheduled' });
      const item = (await workspace(2, 200)).lessons.find(
        (l) => l.id === uid(304),
      );
      assert.equal(item.content, '');
      assert.equal(item.status, 'scheduled');
      await command(1, 200, 'state', 304, 2, { state: 'published' });
      await denied(
        () =>
          command(1, 200, 'attendance', 304, 0, {
            travelerId: tid(2),
            status: 'present',
            reason: '',
          }),
        '42501',
      );
    },
  );
  await check(
    'creation nonce replay is stable and cannot be reused with a changed payload',
    async () => {
      const nonce = randomUUID(),
        data = lesson(1);
      await command(1, 200, 'lesson', 305, 0, data, nonce);
      assert.equal(
        (await command(1, 200, 'lesson', 305, 0, data, nonce)).replayed,
        true,
      );
      await denied(
        () =>
          command(
            1,
            200,
            'lesson',
            305,
            0,
            { ...data, title: 'Changed payload' },
            nonce,
          ),
        '22023',
      );
    },
  );
  await check(
    'manual grading and legacy APIs cannot alter server-scored quiz responses',
    async () => {
      const answer = (
        await q(
          'select b.id,b.revision from public.guild_ebd_answers b join ebd_class_private.quiz_questions x on x.activity_id=b.activity_id limit 1',
        )
      ).rows[0];
      await denied(
        () =>
          command(1, 200, 'grade', answer.id, answer.revision, {
            status: 'completed',
            feedback: 'Not allowed',
          }),
        '42501',
      );
      await denied(
        () =>
          as(1, 'select public.guild_scoped_ebd_command($1,$2,$3,$4,$5,$6)', [
            tid(1),
            uid(100),
            'grade',
            answer.id,
            answer.revision,
            { status: 'completed', feedback: 'Not allowed' },
          ]),
        '42501',
      );
    },
  );
  await check(
    'issued lessons make destructive empty recovery refuse; no game or legacy data changed',
    async () => {
      await denied(
        () =>
          tx(
            read(
              'packages/database/proposals/rpg-dev-010b3-recovery-empty.sql',
            ),
          ),
        'P0001',
      );
      assert.deepEqual(await baseline(), before);
      assert.equal(
        (
          await q(
            "select has_function_privilege('authenticated','public.economy_authority(uuid,uuid,text,jsonb)','EXECUTE') allowed",
          )
        ).rows[0].allowed,
        false,
      );
    },
  );
  await check(
    'legacy reflective content is masked for the teacher without modifying the original answer',
    async () => {
      await q(
        "insert into public.guild_ebd_activities(id,lesson_id,title,kind,prompt,options,answer_key,attempt_limit,criterion,creation_hash) values($1,$2,'Legacy reflection','reflective','Synthetic private reflection fixture','[]',NULL,1,'manual','fixture')",
        [uid(410), uid(299)],
      );
      await q(
        "insert into public.guild_ebd_answers(id,activity_id,traveler_id,attempt,response,status) values($1,$2,$3,1,'SYNTHETIC_PRIVATE_REFLECTION','pending')",
        [uid(510), uid(410), tid(2)],
      );
      const w = (
        await as(1, 'select public.guild_scoped_ebd_workspace($1,$2,0) x', [
          tid(1),
          uid(100),
        ])
      ).rows[0].x;
      assert(!JSON.stringify(w).includes('SYNTHETIC_PRIVATE_REFLECTION'));
      assert.equal(
        w.answers.find((x) => x.id === uid(510)).response,
        'Reflexão privada preservada; somente participação.',
      );
      assert.equal(
        (
          await q('select response from public.guild_ebd_answers where id=$1', [
            uid(510),
          ])
        ).rows[0].response,
        'SYNTHETIC_PRIVATE_REFLECTION',
      );
    },
  );
  await check(
    'preserving containment blocks new writes without removing lessons or results',
    async () => {
      const count = (
        await q('select count(*)::int n from ebd_class_private.quiz_results')
      ).rows[0].n;
      await tx(
        read('packages/database/proposals/rpg-dev-010b3-containment.sql'),
      );
      await denied(() => command(1, 200, 'lesson', 303, 0, lesson(1)), '42501');
      assert.equal((await workspace(2, 200)).quizResults.length, count);
    },
  );
}
