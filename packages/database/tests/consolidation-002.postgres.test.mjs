import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  prepareDatabasePackage,
  verifyDatabasePackage,
} from '../../../scripts/database/prepare-test-db-package.mjs';

const name = `rpg-consolidation002-${process.pid}`;
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
const query = (sql) =>
  run(
    [
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
    ],
    sql,
  ).trim();
const id = (kind, n) =>
  `${kind}0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const user = (n) => id('0', n),
  actor = (n) => id('1', n);
const as = (n, sql) =>
  query(
    `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${user(n)}';SET LOCAL request.jwt.claims='{"is_anonymous":${n === 6}}';${sql};COMMIT;`,
  );
const denied = (
  n,
  sql,
  pattern = /denied|permission|account|Account|Leader|leader|member|Member|teacher|Teacher/i,
) => assert.throws(() => as(n, sql), pattern);
const json = (v) => `'${JSON.stringify(v).replaceAll("'", "''")}'::jsonb`;
const ebd = (n, action, key, rev, data) =>
  `SELECT public.guild_ebd_command('${actor(n)}','${action}','${key}',${rev},${json(data)})`;
let created = false;
after(() => {
  if (!created) return;
  const info = JSON.parse(run(['inspect', name]))[0];
  assert.equal(info.Config.Labels.task, 'TASK-CONSOLIDATION-002');
  assert.equal(info.HostConfig.NetworkMode, 'none');
  run(['stop', '--time', '5', name]);
});

test('reviewed package installs on clean restrictive-default PostgreSQL, with scoped Guilda/EBD/Story authority', async (t) => {
  const prepared = prepareDatabasePackage();
  const manifest = verifyDatabasePackage(process.cwd(), prepared.output);
  run([
    'run',
    '-d',
    '--rm',
    '--pull=never',
    '--name',
    name,
    '--label',
    'task=TASK-CONSOLIDATION-002',
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
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      run(['exec', name, 'pg_isready', '-h', '/tmp', '-U', 'postgres']);
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  assert.ok(ready);
  const info = JSON.parse(run(['inspect', name]))[0];
  assert.equal(info.HostConfig.ReadonlyRootfs, true);
  assert.equal(Object.keys(info.HostConfig.PortBindings ?? {}).length, 0);
  assert.equal(info.Mounts.filter((m) => m.Type === 'bind').length, 0);
  query(`CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth;CREATE SCHEMA extensions;CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean DEFAULT false);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
    CREATE PUBLICATION supabase_realtime;`);
  await t.test(
    'all 13 copied files apply verbatim in order; no lesson or fake media is seeded',
    () => {
      for (const step of manifest.steps) {
        const sql = readFileSync(resolve(prepared.output, step.source), 'utf8');
        query(/^\s*BEGIN;\s*$/m.test(sql) ? sql : `BEGIN;\n${sql}\nCOMMIT;`);
      }
      assert.equal(query('SELECT count(*) FROM public.guild_lessons'), '0');
      assert.equal(
        query(
          'SELECT count(*) FROM public.story_definitions WHERE content_ready OR video_ready OR reward_ready',
        ),
        '0',
      );
      assert.equal(
        query(
          "SELECT bool_or(rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls) FROM pg_roles WHERE rolname IN ('anon','authenticated')",
        ),
        'f',
      );
    },
  );
  const catalog = JSON.parse(
    query(`SELECT jsonb_build_object(
    'tables',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'rls',c.relrowsecurity,'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notNull',a.attnotnull) ORDER BY a.attnum) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),'constraints',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',k.conname,'type',k.contype,'definition',pg_get_constraintdef(k.oid))),'[]') FROM pg_constraint k WHERE k.conrelid=c.oid)) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN ('public','story_private','guild_invite_private')),
    'indexes',(SELECT jsonb_agg(to_jsonb(i) ORDER BY schemaname,tablename,indexname) FROM pg_indexes i WHERE schemaname IN ('public','story_private','guild_invite_private')),
    'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY schemaname,tablename,policyname) FROM pg_policies p WHERE schemaname IN ('public','story_private','guild_invite_private')),
    'functions',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definer',p.prosecdef,'settings',p.proconfig,'anonExecute',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticatedExecute',has_function_privilege('authenticated',p.oid,'EXECUTE')) ORDER BY n.nspname,p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','story_private','guild_invite_private','guild_ops','ebd_ops')),
    'grants',(SELECT jsonb_agg(to_jsonb(g) ORDER BY table_schema,table_name,grantee,privilege_type) FROM information_schema.table_privileges g WHERE table_schema IN ('public','story_private','guild_invite_private') AND grantee IN ('anon','authenticated','service_role')))`),
  );
  mkdirSync('build/task-consolidation-002', { recursive: true });
  writeFileSync(
    'build/task-consolidation-002/catalog-audit.json',
    JSON.stringify(
      {
        packageId: prepared.packageId,
        restrictiveDefaults: true,
        hosted: false,
        ...catalog,
      },
      null,
      2,
    ),
  );
  await t.test(
    'private evidence/tokens/answer keys cannot be read or written; new definers keep an empty search_path',
    () => {
      for (const table of [
        'story_private.step_receipts',
        'guild_invite_private.link_invites',
        'public.guild_ebd_answers',
        'public.guild_ebd_teachers',
        'public.guild_ebd_reward_pending',
      ])
        assert.equal(
          query(
            `SELECT has_table_privilege('authenticated','${table}','INSERT') OR has_table_privilege('authenticated','${table}','UPDATE') OR has_table_privilege('anon','${table}','SELECT')`,
          ),
          'f',
          table,
        );
      for (const fn of catalog.functions.filter(
        (f) =>
          f.definer &&
          [
            'guild_invite_private',
            'story_private',
            'guild_ops',
            'ebd_ops',
          ].includes(f.schema),
      ))
        assert.ok(
          fn.settings?.includes('search_path=""'),
          `${fn.schema}.${fn.name}`,
        );
      assert.equal(
        query(
          "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('guild_ops','ebd_ops','story_private') AND has_function_privilege('anon',p.oid,'EXECUTE')",
        ),
        '0',
      );
    },
  );
  for (const n of [1, 2, 3, 4, 5, 6, 7]) {
    query(`INSERT INTO auth.users VALUES('${user(n)}',${n === 6})`);
    as(
      n,
      `INSERT INTO public.profiles(id,display_name) VALUES(auth.uid(),'Synthetic');SELECT public.create_traveler('${actor(n)}','Synthetic ${String.fromCharCode(64 + n)}','male','medio','curto','castanho','musgo')`,
    );
  }
  as(1, `SELECT public.create_guild('${actor(1)}','Synthetic Alfa',NULL)`);
  as(4, `SELECT public.create_guild('${actor(4)}','Synthetic Beta',NULL)`);
  const ga = query(
      `SELECT guild_id FROM public.guild_members WHERE traveler_id='${actor(1)}'`,
    ),
    gb = query(
      `SELECT guild_id FROM public.guild_members WHERE traveler_id='${actor(4)}'`,
    );
  for (const n of [2, 3, 6])
    query(
      `INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES('${ga}','${actor(n)}','member','active')`,
    );
  query(
    `INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES('${gb}','${actor(5)}','member','active')`,
  );
  const economic = () =>
    query(
      'SELECT jsonb_agg(jsonb_build_array(t.id,t.xp,t.level,w.coins) ORDER BY t.id) FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id',
    );
  const before = economic();
  await t.test(
    'QR creates a pending join request; no automatic membership or leadership, no cross-guild control',
    () => {
      const invite = JSON.parse(
        as(1, `SELECT public.create_guild_link_invite('${actor(1)}')`),
      );
      assert.match(invite.token, /^[a-f0-9]{64}$/);
      as(
        7,
        `SELECT public.request_guild_link_invite('${invite.token}','${actor(7)}')`,
      );
      assert.equal(
        query(
          `SELECT count(*) FROM public.guild_members WHERE traveler_id='${actor(7)}'`,
        ),
        '0',
      );
      assert.equal(
        query(
          `SELECT status FROM public.guild_join_requests WHERE traveler_id='${actor(7)}'`,
        ),
        'pending',
      );
      denied(
        4,
        `SELECT public.revoke_guild_link_invite('${invite.id}','${actor(4)}')`,
        /Invite unavailable/,
      );
      denied(6, `SELECT public.create_guild_link_invite('${actor(6)}')`);
      // Do not write invite.token to disk, console, catalog or assertion payloads.
    },
  );
  await t.test(
    'mission submission/approval stays pending economy and isolated between Guildas',
    () => {
      const key = id('3', 1),
        data = {
          title: 'Synthetic mission',
          description: 'Disposable test only',
          objective: 'Test evidence',
          instructions: 'Use synthetic evidence',
          evidenceCriterion: 'Short synthetic response',
          bibleReference: '',
          startsAt: '',
          dueAt: '',
          kind: 'mission',
          rewardTier: 'normal',
          audience: 'all',
          targetIds: [],
        };
      as(
        1,
        `SELECT public.save_guild_mission_v2('${actor(1)}','${key}',0,${json(data)})`,
      );
      as(
        1,
        `SELECT public.transition_guild_mission_v2('${actor(1)}','${key}',1,'publish')`,
      );
      as(
        3,
        `SELECT public.act_guild_mission_v2('${actor(3)}','${key}','start','','${id('8', 4)}',0)`,
      );
      as(
        3,
        `SELECT public.act_guild_mission_v2('${actor(3)}','${key}','submit','Synthetic evidence','${id('8', 1)}',0)`,
      );
      const attempt = query(
        `SELECT id FROM public.guild_mission_attempts WHERE mission_id='${key}'`,
      );
      denied(
        4,
        `SELECT public.review_guild_mission_v2('${actor(4)}','${attempt}',1,'approved','','${id('8', 2)}')`,
      );
      as(
        1,
        `SELECT public.review_guild_mission_v2('${actor(1)}','${attempt}',1,'approved','','${id('8', 3)}')`,
      );
      assert.equal(
        query(
          `SELECT status FROM public.guild_mission_progress WHERE mission_id='${key}' AND traveler_id='${actor(3)}'`,
        ),
        'approved',
      );
      assert.equal(
        as(5, `SELECT count(*) FROM public.guild_missions WHERE id='${key}'`),
        '0',
      );
      assert.equal(economic(), before);
    },
  );
  await t.test(
    'teacher authoring, questionnaire, answer privacy, attendance and reward-pending use the packaged schema',
    () => {
      as(
        1,
        ebd(1, 'teacher', actor(2), 0, {
          active: true,
          publish: true,
          attend: true,
        }),
      );
      const lesson = id('2', 1),
        activity = id('3', 2),
        answer = id('4', 1);
      const data = {
        title: 'Synthetic lesson',
        theme: 'Disposable test',
        description: 'Not seeded by package',
        content: 'Synthetic local fixture only',
        reference: '',
        scheduledAt: '2026-12-20T12:00:00Z',
        teacherId: actor(2),
        audience: 'all',
        targetIds: [],
        materials: [],
        objectives: '',
        rewardTier: 'normal',
      };
      as(2, ebd(2, 'lesson', lesson, 0, data));
      as(
        2,
        ebd(2, 'activity', activity, 0, {
          lessonId: lesson,
          title: 'Synthetic choice',
          kind: 'choice',
          prompt: 'Fixture question',
          options: ['First', 'Second'],
          answerKey: 1,
          deadline: '',
          attemptLimit: 2,
          criterion: 'correct',
        }),
      );
      as(2, ebd(2, 'state', lesson, 1, { state: 'published' }));
      denied(
        5,
        ebd(5, 'lesson', id('2', 2), 0, { ...data, teacherId: actor(5) }),
      );
      const pending = JSON.parse(
        as(3, `SELECT public.guild_ebd_workspace('${actor(3)}',0)`),
      );
      assert.equal(Object.hasOwn(pending.activities[0], 'answer_key'), false);
      as(
        3,
        ebd(3, 'submit', answer, 0, {
          activityId: activity,
          response: 'Second',
          choice: 1,
        }),
      );
      as(
        2,
        ebd(2, 'attendance', lesson, 0, {
          travelerId: actor(3),
          status: 'present',
          reason: 'Synthetic local check',
        }),
      );
      assert.equal(
        query(
          `SELECT count(*) FROM public.guild_ebd_reward_pending WHERE lesson_id='${lesson}' AND traveler_id='${actor(3)}'`,
        ),
        '1',
      );
      const student = JSON.parse(
        as(3, `SELECT public.guild_ebd_workspace('${actor(3)}',0)`),
      );
      assert.ok(student.activities.length > 0);
      // The existing contract deliberately reveals the key after a completed answer.
      assert.equal(student.activities[0].answer_key, 1);
      assert.equal(
        JSON.parse(as(5, `SELECT public.guild_ebd_workspace('${actor(5)}',0)`))
          .lessons.length,
        0,
      );
      denied(3, `SELECT * FROM public.guild_ebd_answers`, /permission denied/);
      assert.equal(economic(), before);
    },
  );
  await t.test(
    'Story remains individual and blocked without authorized receipts; legacy economy is not silently hardened',
    () => {
      denied(
        7,
        `SELECT public.complete_story('${actor(7)}','creation')`,
        /dependencies pending/,
      );
      denied(
        7,
        `INSERT INTO story_private.step_receipts(traveler_id,story_id,revision,step,source,proof_reference) VALUES('${actor(7)}','creation',1,'reading','self-report','fake')`,
        /permission denied/,
      );
      denied(5, `SELECT public.complete_story('${actor(7)}','creation')`);
      assert.equal(
        query(
          "SELECT has_table_privilege('authenticated','public.wallets','UPDATE')",
        ),
        't',
      );
      assert.equal(economic(), before);
      verifyDatabasePackage(process.cwd(), prepared.output);
    },
  );
});
