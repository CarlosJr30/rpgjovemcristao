import { createHash } from 'node:crypto';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { Client } from 'pg';

// Dedicated ephemeral PostgreSQL cluster on loopback; never connects remotely.
const root = path.resolve('build/story007-postgres');
const bin = path.resolve(
  process.env.RPG_POSTGRES_BIN ??
    'build/story007-postgres/postgres-tool/node_modules/@embedded-postgres/windows-x64/native/bin',
);
fs.mkdirSync(root, { recursive: true });
assert.ok(
  fs.existsSync(path.join(bin, 'postgres.exe')),
  'Pinned local PostgreSQL binary required',
);
const cluster = path.join(root, `isolated-${process.pid}`);
assert.ok(cluster.startsWith(root + path.sep));
const port = await new Promise((resolve) => {
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => {
    const assigned = server.address().port;
    server.close(() => resolve(assigned));
  });
});
const run = (name, args) =>
  execFileSync(path.join(bin, `${name}.exe`), args, {
    windowsHide: true,
    stdio: 'ignore',
    timeout: 30000,
  });
const options = {
  host: '127.0.0.1',
  port,
  user: 'postgres',
  database: 'postgres',
};
const db = new Client(options);
const query = async (sql) => {
  try {
    const results = await db.query(sql);
    const result = Array.isArray(results)
      ? [...results].reverse().find((entry) => entry.rows.length)
      : results;
    if (!result?.rows.length) return '';
    const value = result.rows.at(-1)[result.fields[0].name];
    return value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    await db.query('RESET ROLE').catch(() => {});
    throw error;
  }
};
const user = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const traveler = (n) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sessionId = (n) =>
  `30000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const canonicalManifest = JSON.parse(
  fs.readFileSync('apps/web/features/story/creation-content-v1.json', 'utf8'),
);
const fixtureManifest = (revision) =>
  JSON.stringify({ ...canonicalManifest, revision });
const manifestId = (revision) =>
  createHash('sha256').update(fixtureManifest(revision)).digest('hex');
const expectedMarkerIds = [
  'creation-day-1-marker-1',
  'creation-day-2-marker-1',
  'creation-day-3-marker-1',
  'creation-day-3-marker-2',
  'creation-day-3-marker-3',
  'creation-day-4-marker-1',
  'creation-day-5-marker-1',
  'creation-day-6-marker-1',
  'creation-day-7-marker-1',
];
const sqlLiteral = (value) => "'" + value.replaceAll("'", "''") + "'";
const session = (n, sql, anonymous = false, sid = sessionId(n)) =>
  `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${user(n)}';SET LOCAL request.jwt.claims='{"is_anonymous":${anonymous},"session_id":"${sid}"}';${sql};COMMIT;`;
const rpc = (n, sql) => query(session(n, sql));
const denied = (
  sql,
  pattern = /permission denied|denied|Active traveler|required|not found|query returned no rows/i,
) => assert.rejects(query(sql), pattern);
after(async () => {
  await db.end();
  if (fs.existsSync(path.join(cluster, 'postmaster.pid')))
    run('pg_ctl', ['-D', cluster, '-m', 'fast', '-w', 'stop']);
  if (fs.existsSync(cluster))
    fs.rmSync(cluster, { recursive: true, force: true });
});
async function concurrent(sql) {
  const client = new Client(options);
  await client.connect();
  try {
    const results = await client.query(sql);
    const result = Array.isArray(results)
      ? [...results].reverse().find((entry) => entry.rows.length)
      : results;
    assert.ok(
      result?.rows.length,
      'Concurrent request must return its receipt',
    );
    const value = result.rows.at(-1)[result.fields[0].name];
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  } finally {
    await client.end();
  }
}

test('STORY-007: local checkpoint RPCs isolate owners, enforce ordering and replay safely', async (t) => {
  run('initdb', [
    '-D',
    cluster,
    '-U',
    'postgres',
    '-A',
    'trust',
    '--encoding=UTF8',
    '--locale=C',
    '--no-sync',
  ]);
  run('pg_ctl', [
    '-D',
    cluster,
    '-l',
    path.join(cluster, 'server.log'),
    '-o',
    `-h 127.0.0.1 -p ${port}`,
    '-w',
    'start',
  ]);
  await db.connect();
  await query(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean NOT NULL DEFAULT false,deleted_at timestamptz,banned_until timestamptz);
    CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id),not_after timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;GRANT EXECUTE ON FUNCTION auth.uid(),auth.jwt() TO authenticated;
    CREATE TABLE public.travelers(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id),is_active boolean NOT NULL DEFAULT false);
    CREATE TABLE public.wallets(traveler_id uuid PRIMARY KEY,coins integer NOT NULL);
    CREATE FUNCTION public.owns_traveler(p_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_id AND user_id=auth.uid()) $$;
    INSERT INTO auth.users(id,is_anonymous) VALUES('${user(1)}',false),('${user(2)}',false),('${user(3)}',false),('${user(4)}',true);
    INSERT INTO auth.sessions(id,user_id) VALUES ${[1, 2, 3, 4].map((n) => `('${sessionId(n)}','${user(n)}')`).join(',')};
    INSERT INTO public.travelers VALUES('${traveler(1)}','${user(1)}',true),('${traveler(2)}','${user(2)}',true),('${traveler(3)}','${user(3)}',false),('${traveler(4)}','${user(4)}',true);
    INSERT INTO public.wallets VALUES('${traveler(1)}',7),('${traveler(2)}',11);
    ${fs.readFileSync('packages/database/proposals/task0081-story-progress.sql', 'utf8')}
    CREATE SCHEMA supabase_migrations;
    CREATE TABLE supabase_migrations.schema_migrations(version text, name text);
    INSERT INTO supabase_migrations.schema_migrations VALUES('20261021031958','deploy002_11_task0081_story_progress');`);
  const migration = fs.readFileSync(
    'supabase/migrations/20261124185354_story_007c_creation_checkpoints_test.sql',
    'utf8',
  );
  const proposal = fs.readFileSync(
    'packages/database/proposals/story007-creation-checkpoints.sql',
    'utf8',
  );
  assert.equal(
    migration.split('END $guard$;')[1].trim(),
    proposal.split('BEGIN;')[1].trim(),
  );
  await denied(migration, /Reviewed STORY-007C TEST baseline required/);
  await query("SET story007c.target_project='wkdvdzfkbwvhyjmamrsg'");
  await query(migration);
  await assert.rejects(
    query(
      "UPDATE story_private.creation_checkpoint_revisions SET manifest=NULL,status='published' WHERE revision=1",
    ),
    /Incomplete creation manifest/,
  );
  assert.equal(
    await query("SELECT manifest FROM story_private.creation_checkpoint_revisions WHERE revision=1"),
    fixtureManifest(1),
  );
  const incomplete = JSON.parse(fixtureManifest(1));
  incomplete.days.pop();
  await assert.rejects(
    query("UPDATE story_private.creation_checkpoint_revisions SET status='published',manifest=" + sqlLiteral(JSON.stringify(incomplete)) + " WHERE revision=1"),
    /Incomplete creation manifest/,
  );
  const missingRevision = JSON.parse(fixtureManifest(1));
  delete missingRevision.revision;
  await assert.rejects(
    query("UPDATE story_private.creation_checkpoint_revisions SET status='published',manifest=" + sqlLiteral(JSON.stringify(missingRevision)) + " WHERE revision=1"),
    /Incomplete creation manifest/,
  );
  const missingDayText = JSON.parse(fixtureManifest(1));
  delete missingDayText.days[0].title;
  await assert.rejects(
    query("UPDATE story_private.creation_checkpoint_revisions SET status='published',manifest=" + sqlLiteral(JSON.stringify(missingDayText)) + " WHERE revision=1"),
    /Invalid creation day content/,
  );
  const missingQuizText = JSON.parse(fixtureManifest(1));
  delete missingQuizText.quiz[0].question;
  await assert.rejects(
    query("UPDATE story_private.creation_checkpoint_revisions SET status='published',manifest=" + sqlLiteral(JSON.stringify(missingQuizText)) + " WHERE revision=1"),
    /Invalid creation quiz content/,
  );
  const inconsistent = JSON.parse(fixtureManifest(1));
  inconsistent.quiz[0].answer = 0;
  await assert.rejects(
    query("UPDATE story_private.creation_checkpoint_revisions SET status='published',manifest=" + sqlLiteral(JSON.stringify(inconsistent)) + " WHERE revision=1"),
    /Invalid creation quiz content/,
  );
  const invalidQuizIds = [
    ['numeric', (manifest) => { manifest.quiz[0].id = 17; }],
    ['null', (manifest) => { manifest.quiz[0].id = null; }],
    ['empty', (manifest) => { manifest.quiz[0].id = ''; }],
    ['whitespace', (manifest) => { manifest.quiz[0].id = '   '; }],
    ['duplicate', (manifest) => { manifest.quiz[1].id = manifest.quiz[0].id; }],
  ];
  for (const [name, mutate] of invalidQuizIds) {
    const invalid = JSON.parse(fixtureManifest(1));
    mutate(invalid);
    await assert.rejects(
      query("UPDATE story_private.creation_checkpoint_revisions SET status='published',manifest=" + sqlLiteral(JSON.stringify(invalid)) + " WHERE revision=1"),
      /Creation content identifiers must be unique|Invalid creation quiz content/,
      name,
    );
  }
  const invalidDay = JSON.parse(fixtureManifest(1));
  invalidDay.days[0].id = 1;
  await assert.rejects(
    query("UPDATE story_private.creation_checkpoint_revisions SET status='published',manifest=" + sqlLiteral(JSON.stringify(invalidDay)) + " WHERE revision=1"),
    /Creation content identifiers must be unique|Invalid creation day content/,
  );
  const markerIdFailures = [
    ['numeric', (manifest) => { manifest.days[0].markers[0].id = 17; }],
    ['null', (manifest) => { manifest.days[0].markers[0].id = null; }],
    ['empty', (manifest) => { manifest.days[0].markers[0].id = ''; }],
    ['invalid format', (manifest) => { manifest.days[0].markers[0].id = 'Marker One'; }],
    ['same-day duplicate', (manifest) => { manifest.days[2].markers[1].id = manifest.days[2].markers[0].id; }],
    ['cross-day duplicate', (manifest) => { manifest.days[1].markers[0].id = manifest.days[0].markers[0].id; }],
  ];
  for (const [name, mutate] of markerIdFailures) {
    const invalid = JSON.parse(fixtureManifest(1));
    mutate(invalid);
    await assert.rejects(
      query("UPDATE story_private.creation_checkpoint_revisions SET status='published',manifest=" + sqlLiteral(JSON.stringify(invalid)) + " WHERE revision=1"),
      /Creation marker IDs must be unique|Invalid creation marker/,
      name,
    );
  }
  await query(
    "UPDATE story_private.creation_checkpoint_revisions SET manifest=" + sqlLiteral(fixtureManifest(1)) + " WHERE revision=1",
  );
  const unavailableInitial = JSON.parse(
    await rpc(1, `SELECT public.read_creation_checkpoints('${traveler(1)}')`),
  );
  assert.equal(unavailableInitial.available, false);
  assert.equal(unavailableInitial.manifestText, null);
  assert.equal(unavailableInitial.manifestHash, null);
  // Synthetic publication exists only in this disposable database.
  await query(
    "INSERT INTO public.story_progress(traveler_id,story_id,completed_steps) VALUES('" +
      traveler(1) +
      "','garden-choice',ARRAY['reading']);UPDATE public.story_definitions SET content_ready=true WHERE id='creation';UPDATE story_private.creation_checkpoint_revisions SET status='published' WHERE revision=1;",
  );

  await t.test(
    'Auth ownership, active avatar and private evidence permissions are enforced',
    async () => {
      await denied(
        session(
          2,
          `SELECT public.submit_creation_day('${traveler(1)}',1,1::smallint,1::smallint)`,
        ),
      );
      await denied(
        session(
          3,
          `SELECT public.submit_creation_day('${traveler(3)}',1,1::smallint,1::smallint)`,
        ),
        { code: '42501' },
      );
      await denied(
        session(
          4,
          `SELECT public.submit_creation_day('${traveler(4)}',1,1::smallint,1::smallint)`,
          true,
        ),
      );
      await denied(
        "SET ROLE anon;SELECT public.read_creation_checkpoints('" +
          traveler(1) +
          "')",
      );
      await denied(
        session(1, 'SELECT * FROM story_private.creation_activity_receipts'),
      );
      await denied(
        session(
          1,
          `INSERT INTO story_private.creation_activity_receipts(traveler_id,revision,activity,activity_key,result) VALUES('${traveler(1)}',1,'day','day:1','{}')`,
        ),
      );
      await denied(
        session(
          1,
          `INSERT INTO story_private.creation_quiz_attempts(traveler_id,revision,operation_id,answers,score) VALUES('${traveler(1)}',1,'20000000-0000-4000-8000-000000000099',ARRAY[2,1,3,2,3],5)`,
        ),
      );
      await denied(
        session(
          1,
          `UPDATE public.story_progress SET completed_steps=ARRAY['explore','video'] WHERE story_id='garden-choice'`,
        ),
      );
      assert.equal(
        await rpc(1, 'SELECT count(*) FROM public.story_progress'),
        '1',
      );
      assert.equal(
        await rpc(2, 'SELECT count(*) FROM public.story_progress'),
        '0',
      );
      for (const owner of [1, 2]) {
        const initial = JSON.parse(
          await rpc(
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
    'blocks suspended, deleted and ended sessions across the RPCs',
    async () => {
      const id = traveler(2);
      const revision = '1';
      const calls = [
        `SELECT public.read_creation_checkpoints('${id}')`,
        `SELECT public.submit_creation_day('${id}',${revision},1::smallint,1::smallint)`,
        `SELECT public.submit_creation_harmony('${id}',${revision},ARRAY[1]::smallint[])`,
        `SELECT public.submit_creation_quiz('${id}',${revision},'${sessionId(2)}',ARRAY[1]::smallint[])`,
      ];
      const owner = `WHERE id='${user(2)}'`;
      for (const [column, value] of [
        ['banned_until', "now()+interval '1 hour'"],
        ['deleted_at', 'now()'],
      ]) {
        await query(`UPDATE auth.users SET ${column}=${value} ${owner}`);
        for (const call of calls)
          await denied(session(2, call), { code: '42501' });
        await query(`UPDATE auth.users SET ${column}=NULL ${owner}`);
      }
      for (const call of calls) {
        await denied(session(2, call, false, 'invalid'), { code: '42501' });
        await denied(session(2, call, false, sessionId(1)), { code: '42501' });
      }
      const target = `WHERE id='${sessionId(2)}'`;
      await query(
        `UPDATE auth.sessions SET not_after=now()-interval '1 second' ${target}`,
      );
      for (const call of calls)
        await denied(session(2, call), { code: '42501' });
      await query(`DELETE FROM auth.sessions ${target}`);
      for (const call of calls)
        await denied(session(2, call), { code: '42501' });
      await query(
        `INSERT INTO auth.sessions(id,user_id) VALUES ('${sessionId(2)}','${user(2)}')`,
      );
    },
  );

  await t.test('uses the published manifest and exposes no client hash argument', async () => {
    assert.deepEqual(
      canonicalManifest.days.flatMap((day) => day.markers.map(({ id }) => id)),
      expectedMarkerIds,
    );
    assert.equal(
      await query("SELECT to_regprocedure('public.submit_creation_day(uuid,integer,text,smallint,smallint)')"),
      '',
    );
    await denied(
      session(
        1,
        `SELECT public.submit_creation_day('${traveler(1)}',1,'${'0'.repeat(64)}',1::smallint,1::smallint)`,
      ),
      /function .*submit_creation_day.*does not exist/,
    );
    const snapshot = JSON.parse(
      await rpc(1, `SELECT public.read_creation_checkpoints('${traveler(1)}')`),
    );
    assert.equal(snapshot.available, true);
    assert.equal(snapshot.manifestHash, manifestId(1));
    assert.equal(snapshot.manifestText, fixtureManifest(1));
  });

  await t.test(
    'published challenge keys and video manifest cannot be silently rewritten',
    async () => {
      await assert.rejects(
        query(
          `UPDATE story_private.creation_checkpoint_revisions SET manifest=manifest||' ' WHERE revision=1`,
        ),
        /immutable/,
      );
      await assert.rejects(
        query(
          "UPDATE story_private.creation_checkpoint_revisions SET status='draft' WHERE revision=1",
        ),
        /only be revoked/,
      );
      await query(
        "UPDATE story_private.creation_video_publications SET status='published',provider='fixture',immutable_video_id='approved-id',media_sha256=repeat('a',64),duration_seconds=60,language='pt',captions_sha256=repeat('b',64),accessible_alternative='fixture',editorial_reference='fixture',license_reference='fixture',verification_policy_version='fixture-v1' WHERE revision=1",
      );
      await assert.rejects(
        query(
          "UPDATE story_private.creation_video_publications SET immutable_video_id='other-id' WHERE revision=1",
        ),
        /immutable/,
      );
      await query(
        "UPDATE story_private.creation_video_publications SET status='revoked' WHERE revision=1",
      );
      await assert.rejects(
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
      await denied(
        session(
          1,
          `SELECT public.submit_creation_day('${traveler(1)}',1,2::smallint,2::smallint)`,
        ),
        /Previous creation day incomplete/,
      );
      const wrong = JSON.parse(
        await rpc(
          1,
          `SELECT public.submit_creation_day('${traveler(1)}',1,1::smallint,2::smallint)`,
        ),
      );
      assert.equal(wrong.correct, false);
      assert.equal(
        await query(
          "SELECT count(*) FROM story_private.creation_activity_receipts WHERE activity='day'",
        ),
        '0',
      );
      const sql = session(
        1,
        `SELECT public.submit_creation_day('${traveler(1)}',1,1::smallint,1::smallint)`,
      );
      const results = await Promise.all([concurrent(sql), concurrent(sql)]);
      assert.equal(results.length, 2);
      for (const result of results) {
        const receipt = JSON.parse(result);
        assert.equal(receipt.completed, true);
        assert.equal(receipt.day, 1);
      }
      assert.equal(
        await query(
          "SELECT count(*) FROM story_private.creation_activity_receipts WHERE activity='day'",
        ),
        '1',
      );
    },
  );

  await t.test(
    'all seven server-checked days, Harmony and quiz attempts resume by revision',
    async () => {
      const keys = [1, 2, 1, 2, 1, 2, 1];
      for (let day = 2; day <= 7; day++)
        await rpc(
          1,
          `SELECT public.submit_creation_day('${traveler(1)}',1,${day}::smallint,${keys[day - 1]}::smallint)`,
        );
      const wrongOrder = JSON.parse(
        await rpc(
          1,
          `SELECT public.submit_creation_harmony('${traveler(1)}',1,ARRAY[2,1,3,4,5,6,7]::smallint[])`,
        ),
      );
      assert.equal(wrongOrder.correct, false);
      const harmony = JSON.parse(
        await rpc(
          1,
          `SELECT public.submit_creation_harmony('${traveler(1)}',1,ARRAY[1,2,3,4,5,6,7]::smallint[])`,
        ),
      );
      assert.equal(harmony.completed, true);
      const attempt = '20000000-0000-4000-8000-000000000001';
      const submission = session(
        1,
        `SELECT public.submit_creation_quiz('${traveler(1)}',1,'${attempt}',ARRAY[2,1,3,2,3]::smallint[])`,
      );
      const results = await Promise.all([
        concurrent(submission),
        concurrent(submission),
      ]);
      const receipts = results.map((result) => JSON.parse(result));
      assert.deepEqual(receipts.map(({ replayed }) => replayed).sort(), [
        false,
        true,
      ]);
      assert.ok(receipts.every(({ score, perfect }) => score === 5 && perfect));
      await denied(
        session(
          1,
          `SELECT public.submit_creation_quiz('${traveler(1)}',1,'${attempt}',ARRAY[1,1,1,1,1]::smallint[])`,
        ),
        /payload mismatch/,
      );
      const second = '20000000-0000-4000-8000-000000000002';
      const retry = JSON.parse(
        await rpc(
          1,
          `SELECT public.submit_creation_quiz('${traveler(1)}',1,'${second}',ARRAY[1,1,1,1,1]::smallint[])`,
        ),
      );
      assert.equal(retry.score, 1);
      assert.equal(retry.perfect, false);
      const state = JSON.parse(
        await rpc(
          1,
          `SELECT public.read_creation_checkpoints('${traveler(1)}')`,
        ),
      );
      assert.deepEqual(state.completedDays, [1, 2, 3, 4, 5, 6, 7]);
      assert.equal(state.harmonyCompleted, true);
      assert.equal(state.quizAttempts, 2);
      assert.equal(state.bestQuizScore, 5);
      assert.equal(state.videoCompleted, false);
      assert.equal(
        await query(
          "SELECT count(*) FROM public.story_progress WHERE story_id='creation'",
        ),
        '0',
      );
      assert.equal(
        await query(
          "SELECT completed_steps::text||':'||video_completed::text||':'||(completed_at IS NULL)::text FROM public.story_progress WHERE traveler_id='" +
            traveler(1) +
            "' AND story_id='garden-choice'",
        ),
        '{reading}:false:true',
      );
      assert.equal(
        await query(
          "SELECT content_ready::text||':'||video_ready::text||':'||reward_ready::text FROM public.story_definitions WHERE id='creation'",
        ),
        'true:false:false',
      );
      assert.equal(
        await query(
          `SELECT string_agg(coins::text,',' ORDER BY traveler_id) FROM public.wallets`,
        ),
        '7,11',
      );
    },
  );

  await t.test(
    'new content revision resumes independently and preserves old evidence',
    async () => {
      await query(
        "UPDATE story_private.creation_checkpoint_revisions SET status='revoked' WHERE revision=1",
      );
      await denied(
        session(
          1,
          `SELECT public.submit_creation_quiz('${traveler(1)}',1,'20000000-0000-4000-8000-000000000001',ARRAY[2,1,3,2,3]::smallint[])`,
        ),
        /Creation revision unavailable/,
      );
      await query(`INSERT INTO story_private.creation_checkpoint_revisions(revision,status,manifest) VALUES(2,'draft',${sqlLiteral(fixtureManifest(2))});
      INSERT INTO story_private.creation_video_publications(revision,status) VALUES(2,'draft');
      UPDATE public.story_definitions SET revision=2 WHERE id='creation';`);
      const draftState = JSON.parse(
        await rpc(1, `SELECT public.read_creation_checkpoints('${traveler(1)}')`),
      );
      assert.equal(draftState.available, false);
      assert.equal(draftState.manifestText, null);
      assert.equal(draftState.manifestHash, null);
      await query(
        "UPDATE story_private.creation_checkpoint_revisions SET status='published' WHERE revision=2",
      );
      const state = JSON.parse(
        await rpc(
          1,
          `SELECT public.read_creation_checkpoints('${traveler(1)}')`,
        ),
      );
      assert.equal(state.revision, 2);
      assert.deepEqual(state.completedDays, []);
      assert.equal(state.harmonyCompleted, false);
      assert.equal(state.quizAttempts, 0);
      assert.equal(state.available, true);
      await denied(
        session(
          1,
          `SELECT public.submit_creation_day('${traveler(1)}',1,1::smallint,1::smallint)`,
        ),
        /Stale creation revision/,
      );
      await query(
        "UPDATE story_private.creation_checkpoint_revisions SET status='revoked' WHERE revision=2",
      );
      const revokedState = JSON.parse(
        await rpc(1, `SELECT public.read_creation_checkpoints('${traveler(1)}')`),
      );
      assert.equal(revokedState.available, false);
      assert.equal(revokedState.manifestText, null);
      assert.equal(revokedState.manifestHash, null);
      await denied(
        session(
          1,
          `SELECT public.submit_creation_day('${traveler(1)}',2,1::smallint,1::smallint)`,
        ),
        /Creation revision unavailable/,
      );
      assert.equal(state.videoCompleted, false);
      assert.equal(
        await query(
          "SELECT count(*) FROM story_private.creation_activity_receipts WHERE traveler_id='" +
            traveler(1) +
            "' AND revision=1",
        ),
        '8',
      );
      assert.equal(
        await query(
          "SELECT count(*) FROM story_private.creation_quiz_attempts WHERE traveler_id='" +
            traveler(1) +
            "' AND revision=1",
        ),
        '2',
      );
    },
  );
});
