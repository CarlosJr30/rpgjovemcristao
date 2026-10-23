import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Existing offline image/runtime; synthetic database only, no host mount or ports.
const name = `rpg0081-story-${process.pid}`;
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
const complete = (id) =>
  `SELECT public.complete_story('${traveler(1)}','${id}')`;
const denied = (sql, pattern) => assert.throws(() => query(sql), pattern);
let created = false;
after(() => {
  if (!created) return;
  const info = JSON.parse(run(['inspect', name]))[0];
  assert.equal(info.Config.Labels.task, 'TASK-0081');
  assert.equal(info.HostConfig.NetworkMode, 'none');
  run(['stop', '--time', '5', name]);
});
function concurrent(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('wsl.exe', [...prefix, ...psql], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    let error = '';
    child.stdout.on('data', (data) => {
      out += data.toString();
    });
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(out.trim()) : reject(new Error(error)),
    );
    child.stdin.end(sql);
  });
}
function receipts(story, steps, n = 1) {
  for (const step of steps)
    query(
      `SET ROLE service_role;INSERT INTO story_private.step_receipts(traveler_id,story_id,revision,step,source,proof_reference,observed_seconds,duration_seconds) VALUES('${traveler(n)}','${story}',1,'${step}','${step === 'reward' ? 'economic-ledger' : step === 'video' ? 'provider-api' : 'server-activity'}','synthetic:${story}:${step}:${n}',${step === 'video' ? '100,100' : 'NULL,NULL'});`,
    );
}
test('PostgreSQL: individual story order, authoritative receipts, RLS, video gates and concurrent idempotency', async (t) => {
  run([
    'run',
    '-d',
    '--rm',
    '--name',
    name,
    '--label',
    'task=TASK-0081',
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
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  assert.ok(ready);
  const info = JSON.parse(run(['inspect', name]))[0];
  assert.equal(info.HostConfig.ReadonlyRootfs, true);
  assert.equal(Object.keys(info.HostConfig.PortBindings ?? {}).length, 0);
  assert.equal((info.Mounts ?? []).filter((m) => m.Type === 'bind').length, 0);
  query(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean NOT NULL DEFAULT false);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;GRANT EXECUTE ON FUNCTION auth.uid(),auth.jwt() TO authenticated;
    CREATE TABLE public.travelers(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id));
    CREATE TABLE public.wallets(traveler_id uuid PRIMARY KEY,coins integer NOT NULL);
    CREATE FUNCTION public.owns_traveler(p_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_id AND user_id=auth.uid()) $$;
    INSERT INTO auth.users VALUES('${user(1)}',false),('${user(2)}',false),('${user(3)}',true);
    INSERT INTO public.travelers VALUES('${traveler(1)}','${user(1)}'),('${traveler(2)}','${user(2)}'),('${traveler(3)}','${user(3)}');
    INSERT INTO public.wallets VALUES('${traveler(1)}',7);
    ${readFileSync('packages/database/proposals/task0081-story-progress.sql', 'utf8')}`);
  await t.test('definitions start blocked; no fabricated dependencies', () => {
    assert.equal(
      query(
        'SELECT count(*) FROM public.story_definitions WHERE content_ready OR video_ready OR reward_ready',
      ),
      '0',
    );
    denied(session(1, complete('creation')), /dependencies pending/);
  });
  await t.test(
    'anonymous, unauthenticated and cross-owner completion rejected',
    () => {
      denied('SET ROLE anon;' + complete('creation'), /permission denied/);
      denied(session(2, complete('creation')), /access denied/);
      denied(
        session(
          3,
          `SELECT public.complete_story('${traveler(3)}','creation')`,
          false,
        ),
        /access denied/,
      );
    },
  );
  await t.test(
    'clients cannot edit catalog, progress or private evidence',
    () => {
      denied(
        session(1, 'UPDATE public.story_definitions SET video_ready=true'),
        /permission denied/,
      );
      denied(
        session(
          1,
          `INSERT INTO public.story_progress(traveler_id,story_id,video_completed) VALUES('${traveler(1)}','creation',true)`,
        ),
        /permission denied/,
      );
      denied(
        session(1, 'SELECT * FROM story_private.step_receipts'),
        /permission denied/,
      );
      denied(
        session(1, `UPDATE public.story_progress SET completed_at=now()`),
        /permission denied/,
      );
      denied(
        session(1, `DELETE FROM public.story_progress`),
        /permission denied/,
      );
    },
  );
  await t.test(
    'trusted receipts create a resumable snapshot visible only to owner',
    () => {
      receipts('creation', ['explore']);
      assert.equal(
        query(session(1, 'SELECT count(*) FROM public.story_progress')),
        '1',
      );
      assert.equal(
        query(session(2, 'SELECT count(*) FROM public.story_progress')),
        '0',
      );
      assert.equal(
        query(session(1, 'SELECT count(*) FROM public.story_progress', true)),
        '0',
      );
      assert.equal(
        query(
          session(1, 'SELECT completed_steps::text FROM public.story_progress'),
        ),
        '{explore}',
      );
    },
  );
  await t.test('open-only, partial and stale video receipts rejected', () => {
    const base = `INSERT INTO story_private.step_receipts(traveler_id,story_id,revision,step,source,proof_reference,observed_seconds,duration_seconds)`;
    denied(
      `${base} VALUES('${traveler(1)}','creation',1,'video','browser-events','open',NULL,NULL)`,
      /check constraint/,
    );
    denied(
      `${base} VALUES('${traveler(1)}','creation',1,'video','browser-events','partial',30,100)`,
      /check constraint/,
    );
    denied(
      `${base} VALUES('${traveler(1)}','creation',2,'video','provider-api','stale',100,100)`,
      /Stale story revision/,
    );
  });
  query(
    'UPDATE public.story_definitions SET content_ready=true,video_ready=true,reward_ready=true',
  ); // synthetic activation only
  await t.test(
    'out-of-order story remains blocked even with every trusted receipt',
    () => {
      receipts('garden-choice', [
        'explore',
        'reading',
        'activity',
        'quiz',
        'reflection',
        'video',
        'reward',
      ]);
      denied(
        session(1, complete('garden-choice')),
        /Previous story incomplete/,
      );
    },
  );
  await t.test('mandatory video and reward are independently required', () => {
    receipts('creation', ['reading', 'activity', 'quiz', 'reflection']);
    denied(session(1, complete('creation')), /requirements incomplete/);
    receipts('creation', ['video']);
    denied(session(1, complete('creation')), /requirements incomplete/);
    receipts('creation', ['reward']);
  });
  await t.test(
    'parallel confirmations finish once without any economic mutation',
    async () => {
      const results = await Promise.all([
        concurrent(session(1, complete('creation'))),
        concurrent(session(1, complete('creation'))),
      ]);
      assert.deepEqual(results.sort(), ['f', 't']);
      assert.equal(
        query(
          "SELECT count(*) FROM public.story_progress WHERE story_id='creation' AND completed_at IS NOT NULL",
        ),
        '1',
      );
      assert.equal(query('SELECT coins FROM public.wallets'), '7');
      assert.equal(
        query(
          "SELECT count(*) FROM story_private.step_receipts WHERE story_id='creation' AND step='reward'",
        ),
        '1',
      );
    },
  );
  await t.test('next story unlocks without Guild; replay is idempotent', () => {
    assert.equal(query(session(1, complete('garden-choice'))), 't');
    assert.equal(query(session(1, complete('garden-choice'))), 'f');
    assert.equal(
      query(session(2, 'SELECT count(*) FROM public.story_progress')),
      '0',
    );
  });
  await t.test(
    'completed receipt cannot be rewritten or reused for another reward',
    () => {
      denied(
        "UPDATE story_private.step_receipts SET proof_reference='changed' WHERE story_id='creation' AND step='reward'",
        /already completed/,
      );
      denied(
        `INSERT INTO story_private.step_receipts(traveler_id,story_id,revision,step,source,proof_reference) VALUES('${traveler(2)}','creation',1,'reward','economic-ledger','synthetic:creation:reward:1')`,
        /unique constraint/,
      );
    },
  );
});
