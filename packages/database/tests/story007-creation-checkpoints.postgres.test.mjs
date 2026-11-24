import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Disposable offline PostgreSQL only; no remote DB, network, ports or host mounts.
const name = `rpg-story007-${process.pid}`;
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
const user = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const traveler = (n) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const session = (n, sql, anonymous = false) =>
  `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${user(n)}';SET LOCAL request.jwt.claims='{"is_anonymous":${anonymous}}';${sql};COMMIT;`;
const rpc = (n, sql) => query(session(n, sql));
const denied = (
  sql,
  pattern = /permission denied|denied|Active traveler|required|not found/i,
) => assert.throws(() => query(sql), pattern);
let created = false;
after(() => {
  if (!created) return;
  const info = JSON.parse(run(['inspect', name]))[0];
  assert.equal(info.Config.Labels.task, 'STORY-007');
  assert.equal(info.HostConfig.NetworkMode, 'none');
  assert.equal(info.HostConfig.ReadonlyRootfs, true);
  assert.equal(Object.keys(info.HostConfig.PortBindings ?? {}).length, 0);
  assert.equal((info.Mounts ?? []).filter((m) => m.Type === 'bind').length, 0);
  run(['stop', '--time', '5', name]);
});
function concurrent(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('wsl.exe', [...prefix, ...psql], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '',
      error = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (error += d.toString()));
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error(error)),
    );
    child.stdin.end(sql);
  });
}

test('STORY-007: local checkpoint RPCs isolate owners, enforce ordering and replay safely', async (t) => {
  run([
    'run',
    '-d',
    '--rm',
    '--pull=never',
    '--name',
    name,
    '--label',
    'task=STORY-007',
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
    "initdb -D /tmp/db -U postgres --auth=trust >/tmp/init.log && exec postgres -D /tmp/db -h '' -k /tmp",
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
  query(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean NOT NULL DEFAULT false);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;GRANT EXECUTE ON FUNCTION auth.uid(),auth.jwt() TO authenticated;
    CREATE TABLE public.travelers(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id),is_active boolean NOT NULL DEFAULT false);
    CREATE TABLE public.wallets(traveler_id uuid PRIMARY KEY,coins integer NOT NULL);
    CREATE FUNCTION public.owns_traveler(p_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_id AND user_id=auth.uid()) $$;
    INSERT INTO auth.users VALUES('${user(1)}',false),('${user(2)}',false),('${user(3)}',false),('${user(4)}',true);
    INSERT INTO public.travelers VALUES('${traveler(1)}','${user(1)}',true),('${traveler(2)}','${user(2)}',true),('${traveler(3)}','${user(3)}',false),('${traveler(4)}','${user(4)}',true);
    INSERT INTO public.wallets VALUES('${traveler(1)}',7),('${traveler(2)}',11);
    ${readFileSync('packages/database/proposals/task0081-story-progress.sql', 'utf8')}
    ${readFileSync('packages/database/proposals/story007-creation-checkpoints.sql', 'utf8')}`);
  // Synthetic publication exists only in this disposable database.
  query(
    "UPDATE public.story_definitions SET content_ready=true WHERE id='creation';UPDATE story_private.creation_checkpoint_revisions SET status='published' WHERE revision=1;",
  );

  await t.test(
    'Auth ownership, active avatar and private evidence permissions are enforced',
    () => {
      denied(
        session(2, `SELECT public.submit_creation_day('${traveler(1)}',1,1)`),
      );
      denied(
        session(3, `SELECT public.submit_creation_day('${traveler(3)}',1,1)`),
        /Active traveler/,
      );
      denied(
        session(
          4,
          `SELECT public.submit_creation_day('${traveler(4)}',1,1)`,
          true,
        ),
      );
      denied(
        "SET ROLE anon;SELECT public.read_creation_checkpoints('" +
          traveler(1) +
          "')",
      );
      denied(
        session(1, 'SELECT * FROM story_private.creation_activity_receipts'),
      );
      denied(
        session(
          1,
          `INSERT INTO story_private.creation_activity_receipts(traveler_id,revision,activity,activity_key,result) VALUES('${traveler(1)}',1,'day','day:1','{}')`,
        ),
      );
      for (const owner of [1, 2]) {
        const initial = JSON.parse(
          rpc(
            owner,
            `SELECT public.read_creation_checkpoints('${traveler(owner)}')`,
          ),
        );
        assert.deepEqual(initial.completedDays, []);
        assert.equal(initial.harmonyCompleted, false);
        assert.equal(initial.quizAttempts, 0);
        assert.equal(initial.videoCompleted, false);
      }
    },
  );

  await t.test(
    'published challenge keys and video manifest cannot be silently rewritten',
    () => {
      assert.throws(
        () =>
          query(
            'UPDATE story_private.creation_day_content SET answer_index=2 WHERE revision=1 AND day_number=1',
          ),
        /immutable/,
      );
      assert.throws(
        () =>
          query(
            "UPDATE story_private.creation_checkpoint_revisions SET status='draft' WHERE revision=1",
          ),
        /only be revoked/,
      );
      query(
        "UPDATE story_private.creation_video_publications SET status='published',provider='fixture',immutable_video_id='approved-id',media_sha256=repeat('a',64),duration_seconds=60,language='pt',captions_sha256=repeat('b',64),accessible_alternative='fixture',editorial_reference='fixture',license_reference='fixture',verification_policy_version='fixture-v1' WHERE revision=1",
      );
      assert.throws(
        () =>
          query(
            "UPDATE story_private.creation_video_publications SET immutable_video_id='other-id' WHERE revision=1",
          ),
        /immutable/,
      );
      query(
        "UPDATE story_private.creation_video_publications SET status='revoked' WHERE revision=1",
      );
      assert.throws(
        () =>
          query(
            "UPDATE story_private.creation_video_publications SET status='published' WHERE revision=1",
          ),
        /cannot be reactivated/,
      );
    },
  );

  await t.test(
    'days reject wrong answers and skips; concurrent retries create one receipt',
    async () => {
      denied(
        session(1, `SELECT public.submit_creation_day('${traveler(1)}',2,2)`),
        /Previous creation day incomplete/,
      );
      const wrong = JSON.parse(
        rpc(1, `SELECT public.submit_creation_day('${traveler(1)}',1,2)`),
      );
      assert.equal(wrong.correct, false);
      assert.equal(
        query(
          "SELECT count(*) FROM story_private.creation_activity_receipts WHERE activity='day'",
        ),
        '0',
      );
      const sql = session(
        1,
        `SELECT public.submit_creation_day('${traveler(1)}',1,1)`,
      );
      const results = await Promise.all([concurrent(sql), concurrent(sql)]);
      assert.equal(results.length, 2);
      for (const result of results) {
        const receipt = JSON.parse(result);
        assert.equal(receipt.completed, true);
        assert.equal(receipt.day, 1);
      }
      assert.equal(
        query(
          "SELECT count(*) FROM story_private.creation_activity_receipts WHERE activity='day'",
        ),
        '1',
      );
    },
  );

  await t.test(
    'all seven server-checked days, Harmony and quiz attempts resume by revision',
    () => {
      const keys = [1, 2, 1, 2, 1, 2, 1];
      for (let day = 2; day <= 7; day++)
        rpc(
          1,
          `SELECT public.submit_creation_day('${traveler(1)}',${day},${keys[day - 1]})`,
        );
      const wrongOrder = JSON.parse(
        rpc(
          1,
          `SELECT public.submit_creation_harmony('${traveler(1)}',ARRAY[2,1,3,4,5,6,7]::smallint[])`,
        ),
      );
      assert.equal(wrongOrder.correct, false);
      const harmony = JSON.parse(
        rpc(
          1,
          `SELECT public.submit_creation_harmony('${traveler(1)}',ARRAY[1,2,3,4,5,6,7]::smallint[])`,
        ),
      );
      assert.equal(harmony.completed, true);
      const attempt = '20000000-0000-4000-8000-000000000001';
      const quiz = JSON.parse(
        rpc(
          1,
          `SELECT public.submit_creation_quiz('${traveler(1)}','${attempt}',ARRAY[2,1,3,2,3]::smallint[])`,
        ),
      );
      assert.equal(quiz.score, 5);
      assert.equal(quiz.perfect, true);
      assert.equal(quiz.replayed, false);
      const replay = JSON.parse(
        rpc(
          1,
          `SELECT public.submit_creation_quiz('${traveler(1)}','${attempt}',ARRAY[1,1,1,1,1]::smallint[])`,
        ),
      );
      assert.equal(replay.score, 5);
      assert.equal(replay.replayed, true);
      const second = '20000000-0000-4000-8000-000000000002';
      const retry = JSON.parse(
        rpc(
          1,
          `SELECT public.submit_creation_quiz('${traveler(1)}','${second}',ARRAY[1,1,1,1,1]::smallint[])`,
        ),
      );
      assert.equal(retry.score, 0);
      assert.equal(retry.perfect, false);
      const state = JSON.parse(
        rpc(1, `SELECT public.read_creation_checkpoints('${traveler(1)}')`),
      );
      assert.deepEqual(state.completedDays, [1, 2, 3, 4, 5, 6, 7]);
      assert.equal(state.harmonyCompleted, true);
      assert.equal(state.quizAttempts, 2);
      assert.equal(state.bestQuizScore, 5);
      assert.equal(state.videoCompleted, false);
      assert.equal(
        query(
          "SELECT count(*) FROM public.story_progress WHERE story_id='creation'",
        ),
        '0',
      );
      assert.equal(
        query(
          "SELECT content_ready::text||':'||video_ready::text||':'||reward_ready::text FROM public.story_definitions WHERE id='creation'",
        ),
        'true:false:false',
      );
      assert.equal(
        query(
          `SELECT string_agg(coins::text,',' ORDER BY traveler_id) FROM public.wallets`,
        ),
        '7,11',
      );
    },
  );
});
