import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const name = `rpg0083-ebd-${process.pid}`;
const prefix = [
  '-d',
  'RPG-0078-Restore',
  '-u',
  'root',
  '--',
  '/usr/sbin/podman',
  '--storage-driver',
  'overlay',
  '--cgroup-manager',
  'cgroupfs',
];
const run = (args, input) =>
  execFileSync('wsl.exe', [...prefix, ...args], {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30000,
  });
const psql = [
  'exec',
  '-i',
  name,
  'psql',
  '-X',
  '-q',
  '-h',
  '/tmp',
  '-U',
  'postgres',
  '-d',
  'postgres',
  '-v',
  'ON_ERROR_STOP=1',
  '-At',
];
const query = (sql) => run(psql, sql).trim();
const id = (prefix, n) =>
  `${prefix}0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const user = (n) => id('0', n);
const actor = (n) => id('1', n);
const mission = (n) => id('3', n);
const session = (n, sql) =>
  `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${user(n)}';${sql};COMMIT;`;
const as = (n, sql) => query(session(n, sql));
const denied = (n, sql, pattern) => assert.throws(() => as(n, sql), pattern);
function parallel(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('wsl.exe', [...prefix, ...psql], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '',
      err = '';
    child.stdout.on('data', (v) => {
      out += v;
    });
    child.stderr.on('data', (v) => {
      err += v;
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error(err)),
    );
    child.stdin.end(sql);
  });
}
let created = false;
after(() => {
  if (!created) return;
  const c = JSON.parse(run(['inspect', name]))[0];
  assert.equal(c.Config.Labels.task, 'TASK-0083');
  assert.equal(c.HostConfig.NetworkMode, 'none');
  run(['stop', '--time', '5', name]);
});
test('EBD against real complete baseline: authority, privacy and concurrency', async (t) => {
  run([
    'run',
    '-d',
    '--rm',
    '--name',
    name,
    '--label',
    'task=TASK-0083',
    '--network',
    'none',
    '--read-only',
    '--user',
    '100:101',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--tmpfs',
    '/tmp:rw,nosuid,nodev,size=256m,mode=1777',
    '--entrypoint',
    '/bin/sh',
    'docker.io/supabase/postgres:17.6.1.166',
    '-c',
    "initdb -D /tmp/db -U postgres --auth=trust >/tmp/init.log && exec postgres -D /tmp/db -h '' -k /tmp -c wal_level=logical",
  ]);
  created = true;
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      run(['exec', name, 'pg_isready', '-h', '/tmp', '-U', 'postgres']);
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  assert.ok(ready);
  const c = JSON.parse(run(['inspect', name]))[0];
  assert.equal(c.HostConfig.ReadonlyRootfs, true);
  assert.equal(Object.keys(c.HostConfig.PortBindings ?? {}).length, 0);
  assert.equal(c.Mounts.filter((m) => m.Type === 'bind').length, 0);
  const journal = JSON.parse(
    readFileSync('packages/database/migrations/meta/_journal.json', 'utf8'),
  );
  const baseline = journal.entries
    .map((e) =>
      readFileSync(`packages/database/migrations/${e.tag}.sql`, 'utf8'),
    )
    .concat(
      readFileSync(
        'packages/database/migrations/20261019054314_guild_link_invites.sql',
        'utf8',
      ),
    )
    .join('\n');
  query(`CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;
 CREATE SCHEMA auth;CREATE SCHEMA extensions;CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean DEFAULT false);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon,authenticated,service_role;
 CREATE PUBLICATION supabase_realtime;
 ${baseline}`);
  for (const n of [1, 2, 3, 4, 6, 7]) {
    query(`INSERT INTO auth.users VALUES('${user(n)}',${n === 6});`);
    as(
      n,
      `INSERT INTO public.profiles(id,display_name) VALUES(auth.uid(),'Fixture');SELECT public.create_traveler('${actor(n)}','Viajante ${String.fromCharCode(64 + n)}','male','medio','curto','castanho','musgo')`,
    );
  }
  as(
    1,
    `SELECT public.create_traveler('${actor(5)}','Outro Avatar','female','medio','curto','castanho','musgo')`,
  );
  as(1, `SELECT public.create_guild('${actor(1)}','Guilda Alfa',NULL)`);
  as(3, `SELECT public.create_guild('${actor(3)}','Guilda Beta',NULL)`);
  const guildA = query(
    `SELECT guild_id FROM public.guild_members WHERE traveler_id='${actor(1)}'`,
  );
  const guildB = query(
    `SELECT guild_id FROM public.guild_members WHERE traveler_id='${actor(3)}'`,
  );
  for (const n of [2, 5, 6])
    query(
      `INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES('${guildA}','${actor(n)}','member','active')`,
    );
  query(`INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES('${guildB}','${actor(4)}','member','active');
 INSERT INTO public.guild_missions(id,guild_id,created_by_traveler_id,title,mission_type,completion_mode,requires_leader_approval,reward_tier,status) VALUES('${mission(9)}','${guildA}','${actor(1)}','Legado pendente','practical_activity','leader_approval',true,'normal','published');
 INSERT INTO public.guild_mission_progress(mission_id,traveler_id,status) VALUES('${mission(9)}','${actor(2)}','pending_approval');
 ${readFileSync('packages/database/proposals/task0082-guild-missions.sql', 'utf8')}`);
  // Additional active students/teachers, same identity model as the existing Guilda.
  for (const n of [8, 9]) {
    query(`INSERT INTO auth.users VALUES('${user(n)}',false)`);
    as(
      n,
      `INSERT INTO public.profiles(id,display_name) VALUES(auth.uid(),'Fixture');SELECT public.create_traveler('${actor(n)}','Viajante ${String.fromCharCode(64 + n)}','male','medio','curto','castanho','musgo')`,
    );
    query(
      `INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES('${guildA}','${actor(n)}','member','active')`,
    );
  }
  // Legacy content survives; schema is applied verbatim, never rewritten by the harness.
  query(`INSERT INTO public.guild_lessons(id,guild_id,created_by_traveler_id,title,theme,bible_reference,content,status,scheduled_at)
    VALUES('${id('2', 99)}','${guildA}','${actor(1)}','Legacy fixture','Fixture theme','Fixture reference','Synthetic legacy text','published',now())`);
  query(
    readFileSync('packages/database/proposals/task0083-guild-ebd.sql', 'utf8'),
  );
  const balances = query(
    'SELECT jsonb_agg(to_jsonb(w) ORDER BY traveler_id)::text FROM public.wallets w',
  );
  const xp = query(
    'SELECT jsonb_agg(jsonb_build_array(id,xp,level) ORDER BY id)::text FROM public.travelers',
  );
  const lessonId = (n) => id('2', n),
    activityId = (n) => id('3', n),
    answerId = (n) => id('4', n);
  const cmd = (n, action, key, rev, data) =>
    `SELECT public.guild_ebd_command('${actor(n)}','${action}','${key}',${rev},'${JSON.stringify(data).replaceAll("'", "''")}'::jsonb)`;
  const load = (n) =>
    JSON.parse(as(n, `SELECT public.guild_ebd_workspace('${actor(n)}',0)`));
  const lessonData = (n, extra = {}) => ({
    title: 'Synthetic lesson',
    theme: 'Synthetic theme',
    description: 'Test only',
    content: 'Teacher authored synthetic content',
    reference: '',
    scheduledAt: '2026-12-20T12:00:00Z',
    teacherId: actor(n),
    audience: 'all',
    targetIds: [],
    materials: [],
    objectives: '',
    rewardTier: '',
    ...extra,
  });
  const save = (n, k, rev = 0, extra = {}) =>
    cmd(n, 'lesson', lessonId(k), rev, lessonData(n, extra));
  const state = (n, k, rev, status) =>
    cmd(n, 'state', lessonId(k), rev, { state: status });
  const grant = (n, k, rev = 0, extra = {}) =>
    cmd(n, 'teacher', actor(k), rev, {
      active: true,
      publish: false,
      attend: false,
      ...extra,
    });
  const activity = (n, k, l, rev = 0, extra = {}) =>
    cmd(n, 'activity', activityId(k), rev, {
      lessonId: lessonId(l),
      title: 'Synthetic activity',
      kind: 'choice',
      prompt: 'Test question',
      options: ['First', 'Second'],
      answerKey: 1,
      deadline: '',
      attemptLimit: 2,
      criterion: 'correct',
      ...extra,
    });
  const submit = (n, k, a, rev = 0, extra = {}) =>
    cmd(n, 'submit', answerId(k), rev, {
      activityId: activityId(a),
      response: 'Second',
      choice: 1,
      ...extra,
    });
  const grade = (n, k, rev, status = 'completed') =>
    cmd(n, 'grade', answerId(k), rev, {
      status,
      feedback: 'Synthetic feedback',
    });
  const attendance = (n, k, student, rev = 0, extra = {}) =>
    cmd(n, 'attendance', lessonId(k), rev, {
      travelerId: actor(student),
      status: 'present',
      reason: '',
      ...extra,
    });
  await t.test(
    'leader grants/revokes teachers; unauthorized, anonymous and foreign actors denied',
    () => {
      denied(2, save(2, 1), /access denied/);
      denied(2, grant(2, 8), /access denied/);
      denied(3, grant(3, 8), /Teacher unavailable/);
      denied(6, save(6, 1), /access denied/);
      denied(
        2,
        `SELECT public.guild_ebd_workspace('${actor(1)}',0)`,
        /access denied/,
      );
      as(1, grant(1, 2));
      as(1, grant(1, 8, 0, { publish: true, attend: true }));
      assert.equal(load(2).teacher, true);
      assert.equal(load(9).teacher, false);
      denied(
        2,
        `SELECT public.save_guild_lesson(NULL,'${actor(2)}','xx','xx','xx',NULL,'','', '[]','[]',NULL,NULL,NULL,false)`,
        /permission denied/,
      );
      denied(
        1,
        `SELECT public.set_guild_lesson_status('${lessonId(99)}','${actor(1)}','completed')`,
        /permission denied/,
      );
    },
  );
  await t.test(
    'reuse legacy lesson, blank drafts, teacher ownership and selected audience',
    () => {
      assert.ok(load(9).lessons.some((l) => l.id === lessonId(99)));
      as(2, save(2, 1));
      as(
        1,
        save(1, 2, 0, {
          audience: 'selected',
          targetIds: [actor(9)],
          rewardTier: 'normal',
        }),
      );
      as(2, save(2, 1)); // same creation retry, no second lesson/version
      assert.equal(
        query(
          `SELECT ebd_revision FROM public.guild_lessons WHERE id='${lessonId(1)}'`,
        ),
        '1',
      );
      denied(8, save(8, 1, 1), /access denied/);
      denied(9, save(9, 1, 1), /access denied/);
      denied(3, save(3, 1, 1), /access denied/);
      denied(2, save(2, 3, 0, { teacherId: actor(8) }), /access denied/);
      assert.ok(!load(9).lessons.some((l) => l.id === lessonId(1)));
      assert.equal(
        as(
          9,
          `SELECT count(*) FROM public.guild_lessons WHERE id='${lessonId(1)}'`,
        ),
        '0',
      );
      denied(2, state(2, 1, 1, 'published'), /access denied/);
      as(1, state(1, 1, 1, 'scheduled'));
      assert.ok(!load(9).lessons.some((l) => l.id === lessonId(1)));
      as(1, state(1, 1, 2, 'draft'));
      as(2, save(2, 1, 3, { title: 'Own edited draft' }));
      denied(2, save(2, 1, 3, { title: 'Stale overwrite' }), /conflict/);
      as(2, activity(2, 1, 1));
      as(1, activity(1, 2, 2));
      denied(2, activity(2, 3, 2), /access denied/);
      as(1, state(1, 2, 1, 'published'));
      assert.ok(load(9).lessons.some((l) => l.id === lessonId(2)));
      assert.ok(!load(2).lessons.some((l) => l.id === lessonId(2)));
      denied(2, submit(2, 50, 2), /access denied/);
      assert.equal(
        as(
          2,
          `SELECT count(*) FROM public.guild_lessons WHERE id='${lessonId(2)}'`,
        ),
        '0',
      );
      as(1, grant(1, 2, 1, { publish: true }));
      as(2, state(2, 1, 4, 'published'));
      denied(2, activity(2, 1, 1, 1), /access denied/);
      denied(2, save(2, 1, 5), /conflict/);
    },
  );
  await t.test(
    'raw tables/keys/answers private; objective grading and attempt limits are authoritative',
    () => {
      const a = load(9).activities.find((x) => x.id === activityId(1));
      assert.equal('answer_key' in a, false);
      for (const table of [
        'guild_ebd_activities',
        'guild_ebd_answers',
        'guild_ebd_teachers',
        'guild_ebd_attendance',
        'guild_ebd_history',
        'guild_ebd_reward_pending',
      ])
        denied(9, `SELECT * FROM public.${table}`, /permission denied/);
      as(9, submit(9, 1, 1, 0, { response: 'First', choice: 0 }));
      assert.equal(
        load(9).answers.find((x) => x.id === answerId(1)).status,
        'revise',
      );
      assert.equal(
        'answer_key' in load(9).activities.find((x) => x.id === activityId(1)),
        false,
      );
      denied(9, submit(9, 2, 1, 0), /Attempt unavailable/);
      as(9, submit(9, 2, 1, 1));
      as(9, submit(9, 2, 1, 1));
      assert.equal(
        load(9).activities.find((x) => x.id === activityId(1)).answer_key,
        1,
      );
      assert.equal(load(9).answers.length, 2);
      assert.equal(load(8).answers.length, 0);
      denied(8, submit(8, 2, 1), /key conflict/);
      denied(9, submit(9, 3, 1, 2), /Attempt unavailable/);
      denied(9, submit(9, 2, 1, 1, { response: 'Changed' }), /key conflict/);
      as(9, submit(9, 4, 2));
      assert.equal(
        load(9).rewards.filter((r) => r.lesson_id === lessonId(2)).length,
        1,
      );
    },
  );
  await t.test(
    'manual activities, teacher-specific evaluation, reward pending and no self review',
    () => {
      as(8, save(8, 3, 0, { rewardTier: 'great' }));
      as(
        8,
        activity(8, 3, 3, 0, {
          kind: 'reflective',
          options: [],
          answerKey: null,
          criterion: 'manual',
        }),
      );
      as(
        8,
        activity(8, 4, 3, 0, {
          kind: 'in_person',
          options: [],
          answerKey: null,
          criterion: 'manual',
        }),
      );
      as(8, state(8, 3, 1, 'published'));
      as(
        9,
        submit(9, 5, 3, 0, { response: 'Synthetic reflection', choice: null }),
      );
      denied(2, grade(2, 5, 1), /access denied/);
      denied(9, grade(9, 5, 1), /access denied/);
      denied(3, grade(3, 5, 1), /access denied/);
      denied(
        9,
        submit(9, 6, 3, 1, { response: 'Duplicate pending', choice: null }),
        /Attempt unavailable/,
      );
      as(8, grade(8, 5, 1, 'revise'));
      as(9, submit(9, 6, 3, 1, { response: 'Corrected text', choice: null }));
      as(8, grade(8, 6, 1));
      denied(8, grade(8, 6, 1), /conflict/);
      assert.equal(
        load(9).answers.find((x) => x.id === answerId(6)).feedback,
        'Synthetic feedback',
      );
      as(
        9,
        submit(9, 7, 4, 0, {
          response: 'Synthetic participation',
          choice: null,
        }),
      );
      as(8, grade(8, 7, 1));
      assert.equal(
        load(9).rewards.filter((r) => r.lesson_id === lessonId(3)).length,
        1,
      );
      as(8, submit(8, 8, 3, 0, { response: 'Own submission', choice: null }));
      denied(8, grade(8, 8, 1), /access denied/);
      denied(1, grade(1, 5, 2), /already evaluated/);
    },
  );
  await t.test(
    'attendance only authorized teacher/leader, own privacy and traceable corrections',
    () => {
      denied(9, attendance(9, 3, 9), /access denied/);
      denied(2, attendance(2, 1, 9), /access denied/);
      denied(8, attendance(8, 1, 9), /access denied/);
      denied(3, attendance(3, 3, 9), /access denied/);
      denied(8, attendance(8, 3, 4), /Student unavailable/);
      as(8, attendance(8, 3, 9));
      as(
        8,
        attendance(8, 3, 9, 1, {
          status: 'absent',
          reason: 'Synthetic correction',
        }),
      );
      denied(8, attendance(8, 3, 9, 1), /conflict/);
      assert.equal(load(9).attendance[0].status, 'absent');
      assert.equal(load(2).attendance.length, 0);
      const hist = JSON.parse(
        query(
          `SELECT snapshot::text FROM public.guild_ebd_history WHERE action='attendance' ORDER BY id DESC LIMIT 1`,
        ),
      );
      assert.equal(hist.before.status, 'present');
      assert.equal(hist.after.status, 'absent');
      denied(1, attendance(1, 2, 2), /Student unavailable/);
    },
  );
  await t.test(
    'unsafe URLs, input bounds, stale updates and actual concurrent writes',
    async () => {
      for (const value of [
        'javascript:alert(1)',
        'http://example.org/a',
        'https://user:pass@example.org/a',
        'https://127.0.0.1/a',
        'https://host.local/a',
        'https://example.org:443/a',
        'https://example.org/a\n',
      ])
        denied(
          8,
          save(8, 10, 0, {
            materials: [{ kind: 'link', title: 'Test', value }],
          }),
          /Unsafe material/,
        );
      denied(8, save(8, 10, 0, { title: 'x'.repeat(101) }), /Invalid lesson/);
      as(
        8,
        save(8, 10, 0, {
          materials: [
            {
              kind: 'pdf',
              title: 'Reference only',
              value: 'https://www.example.org/a.pdf',
            },
          ],
        }),
      );
      const outcomes = await Promise.allSettled([
        parallel(session(8, save(8, 10, 1, { title: 'Concurrent A' }))),
        parallel(session(8, save(8, 10, 1, { title: 'Concurrent B' }))),
      ]);
      assert.equal(outcomes.filter((x) => x.status === 'fulfilled').length, 1);
      assert.equal(outcomes.filter((x) => x.status === 'rejected').length, 1);
      assert.match(
        outcomes.find((x) => x.status === 'rejected').reason.message,
        /conflict/,
      );
      assert.equal(
        query(
          `SELECT ebd_revision FROM public.guild_lessons WHERE id='${lessonId(10)}'`,
        ),
        '2',
      );
      denied(
        8,
        activity(8, 10, 10, 0, { answerKey: null }),
        /check constraint/,
      );
      as(
        8,
        activity(8, 10, 10, 0, {
          kind: 'homework',
          options: [],
          answerKey: null,
          criterion: 'manual',
          deadline: '2020-01-01T00:00:00Z',
        }),
      );
      as(8, state(8, 10, 2, 'published'));
      denied(9, submit(9, 10, 10, 0, { choice: null }), /Activity closed/);
    },
  );
  await t.test(
    'revocation, inactive members, guild isolation, close/archive and economic independence',
    () => {
      as(1, grant(1, 8, 1, { active: false }));
      denied(8, save(8, 20), /access denied/);
      denied(8, attendance(8, 3, 9, 2), /access denied/);
      assert.equal(load(8).teacher, false);
      assert.equal(
        load(8).answers.some((x) => x.id === answerId(6)),
        false,
      );
      assert.ok(!load(3).lessons.some((l) => l.guild_id === guildA));
      query(
        `UPDATE public.guild_members SET status='removed' WHERE traveler_id='${actor(9)}'`,
      );
      denied(
        9,
        `SELECT public.guild_ebd_workspace('${actor(9)}',0)`,
        /access denied/,
      );
      assert.equal(as(9, 'SELECT count(*) FROM public.guild_lessons'), '0');
      as(1, state(1, 3, 2, 'closed'));
      as(1, state(1, 3, 3, 'archived'));
      assert.ok(!load(2).lessons.some((l) => l.id === lessonId(3)));
      assert.equal(
        query(
          'SELECT jsonb_agg(to_jsonb(w) ORDER BY traveler_id)::text FROM public.wallets w',
        ),
        balances,
      );
      assert.equal(
        query(
          'SELECT jsonb_agg(jsonb_build_array(id,xp,level) ORDER BY id)::text FROM public.travelers',
        ),
        xp,
      );
      assert.equal(
        query('SELECT count(*) FROM public.guild_reward_claims'),
        '0',
      );
      assert.equal(
        query('SELECT count(*) FROM public.guild_mission_attempts'),
        '1',
      ); // legacy0082 unchanged
      assert.equal(
        as(
          1,
          `SELECT has_function_privilege('authenticated','public.create_guild_link_invite(uuid)','EXECUTE')`,
        ),
        't',
      );
    },
  );
});
