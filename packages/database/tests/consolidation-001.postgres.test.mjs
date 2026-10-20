import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Existing local image, no pull/network/ports/mounts. Never a remote SQL applier.
const name = `rpg-consolidation001-${process.pid}`;
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
    `BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='${user(n)}'; SET LOCAL request.jwt.claims='{"is_anonymous":${n === 5}}'; ${sql}; COMMIT;`,
  );
const denied = (
  n,
  sql,
  pattern = /denied|permission|account|Account|Leader|leader|member|Member/i,
) => assert.throws(() => as(n, sql), pattern);
const source = (path) => readFileSync(path, 'utf8');
let created = false;
after(() => {
  if (!created) return;
  const info = JSON.parse(run(['inspect', name]))[0];
  assert.equal(info.Config.Labels.task, 'TASK-CONSOLIDATION-001');
  assert.equal(info.HostConfig.NetworkMode, 'none');
  run(['stop', '--time', '5', name]);
});

test('cumulative offline baseline0080–0083: coexistence, identity, cutover and inherited economic boundary', async (t) => {
  run([
    'run',
    '-d',
    '--rm',
    '--pull=never',
    '--name',
    name,
    '--label',
    'task=TASK-CONSOLIDATION-001',
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
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  assert.ok(ready);
  const info = JSON.parse(run(['inspect', name]))[0];
  assert.equal(info.HostConfig.ReadonlyRootfs, true);
  assert.equal(Object.keys(info.HostConfig.PortBindings ?? {}).length, 0);
  assert.equal(info.Mounts.filter((m) => m.Type === 'bind').length, 0);
  const journal = JSON.parse(
    source('packages/database/migrations/meta/_journal.json'),
  );
  const baseline = journal.entries.map(
    (e) => `packages/database/migrations/${e.tag}.sql`,
  );
  const qr =
    'packages/database/migrations/20261019054314_guild_link_invites.sql';
  const proposals = [
    'task0081-story-progress',
    'task0082-guild-missions',
    'task0083-guild-ebd',
  ].map((n) => `packages/database/proposals/${n}.sql`);
  const files = [...baseline, qr, ...proposals].map((path) => ({
    path,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
    journaled: baseline.includes(path),
  }));
  mkdirSync('build/task-consolidation-001', { recursive: true });
  writeFileSync(
    'build/task-consolidation-001/sql-manifest.json',
    JSON.stringify(
      { localOnly: true, order: files, hostedSchemaVerified: false },
      null,
      2,
    ),
  );
  query(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA extensions; CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean DEFAULT false);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon,authenticated,service_role;
    CREATE PUBLICATION supabase_realtime;
    ${baseline.map(source).join('\n')}`);
  await t.test(
    'QR DDL can roll back before commit; all four additions then apply verbatim together',
    () => {
      query(`BEGIN; ${source(qr)} ROLLBACK;`);
      assert.equal(
        query("SELECT to_regnamespace('guild_invite_private') IS NULL"),
        't',
      );
      query(`BEGIN; ${source(qr)} COMMIT;`);
      for (const path of proposals) query(source(path));
      assert.equal(
        query(
          'SELECT count(*) FROM public.story_definitions WHERE content_ready OR video_ready OR reward_ready',
        ),
        '0',
      );
      assert.equal(
        query(
          "SELECT bool_and(c.relrowsecurity) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('guild_invite_private','story_private') AND c.relkind='r'",
        ),
        't',
      );
    },
  );
  for (const n of [1, 2, 3, 4, 5, 6]) {
    query(`INSERT INTO auth.users VALUES('${user(n)}',${n === 5})`);
    as(
      n,
      `INSERT INTO public.profiles(id,display_name) VALUES(auth.uid(),'Synthetic'); SELECT public.create_traveler('${actor(n)}','Synthetic ${String.fromCharCode(64 + n)}','male','medio','curto','castanho','musgo')`,
    );
  }
  as(1, `SELECT public.create_guild('${actor(1)}','Synthetic Alfa',NULL)`);
  as(3, `SELECT public.create_guild('${actor(3)}','Synthetic Beta',NULL)`);
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
  query(
    `INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES('${guildB}','${actor(4)}','member','active')`,
  );
  const before = query(
    'SELECT jsonb_agg(jsonb_build_array(t.id,t.xp,t.level,w.coins) ORDER BY t.id) FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id',
  );
  await t.test(
    'one account identity works through QR, mission and EBD workspaces after the full cutover',
    () => {
      assert.equal(
        as(1, `SELECT public.list_guild_link_invites('${actor(1)}')`),
        '[]',
      );
      const mission = JSON.parse(
        as(1, `SELECT public.guild_mission_workspace('${actor(1)}',0)`),
      );
      const school = JSON.parse(
        as(1, `SELECT public.guild_ebd_workspace('${actor(1)}',0)`),
      );
      assert.equal(mission.guildId, guildA);
      assert.equal(school.guildId, guildA);
      for (const n of [2, 4]) {
        const m = JSON.parse(
          as(n, `SELECT public.guild_mission_workspace('${actor(n)}',0)`),
        );
        const e = JSON.parse(
          as(n, `SELECT public.guild_ebd_workspace('${actor(n)}',0)`),
        );
        assert.equal(m.guildId, n === 2 ? guildA : guildB);
        assert.equal(e.guildId, n === 2 ? guildA : guildB);
      }
    },
  );
  await t.test(
    'cross-account actors, anonymous accounts and unassigned teacher mutation are refused',
    () => {
      denied(2, `SELECT public.guild_mission_workspace('${actor(1)}',0)`);
      denied(2, `SELECT public.guild_ebd_workspace('${actor(1)}',0)`);
      denied(5, `SELECT public.guild_mission_workspace('${actor(5)}',0)`);
      denied(5, `SELECT public.guild_ebd_workspace('${actor(5)}',0)`);
      denied(
        6,
        `SELECT public.guild_ebd_command('${actor(6)}','teacher','${actor(6)}',0,'{"active":true}'::jsonb)`,
      );
      denied(2, `SELECT public.list_guild_link_invites('${actor(1)}')`);
    },
  );
  await t.test(
    'legacy write RPCs remain revoked while new wrappers retain only intended ACLs',
    () => {
      const legacy = query(
        `SELECT p.oid::regprocedure::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('create_guild_mission','publish_guild_mission','start_guild_mission','submit_guild_mission','review_guild_mission','review_guild_mission_with_guidance','update_guild_mission_draft','delete_guild_mission_draft','close_guild_mission','save_guild_lesson','set_guild_lesson_status') ORDER BY p.proname`,
      ).split('\n');
      assert.ok(legacy.length >= 11);
      for (const signature of legacy) {
        assert.equal(
          query(
            `SELECT has_function_privilege('authenticated','${signature}','EXECUTE') OR has_function_privilege('anon','${signature}','EXECUTE')`,
          ),
          'f',
          signature,
        );
      }
      for (const signature of [
        'public.guild_ebd_workspace(uuid,integer)',
        'public.guild_ebd_command(uuid,text,uuid,integer,jsonb)',
        'public.create_guild_link_invite(uuid)',
      ]) {
        assert.equal(
          query(
            `SELECT prosecdef FROM pg_proc WHERE oid='${signature}'::regprocedure`,
          ),
          'f',
        );
        assert.equal(
          query(
            `SELECT has_function_privilege('anon','${signature}','EXECUTE')`,
          ),
          'f',
        );
      }
      assert.equal(
        query(
          "SELECT has_table_privilege('authenticated','story_private.step_receipts','INSERT') OR has_table_privilege('authenticated','guild_invite_private.link_invites','SELECT')",
        ),
        'f',
      );
    },
  );
  await t.test(
    'story has no Guilda gate, but cannot complete without content/video/economic receipts',
    () => {
      denied(
        1,
        `SELECT public.complete_story('${actor(1)}','creation')`,
        /dependencies pending/,
      );
      denied(
        1,
        'UPDATE public.story_definitions SET video_ready=true',
        /permission denied/,
      );
      denied(2, `SELECT public.complete_story('${actor(1)}','creation')`);
      assert.equal(
        query(
          'SELECT jsonb_agg(jsonb_build_array(t.id,t.xp,t.level,w.coins) ORDER BY t.id) FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id',
        ),
        before,
      );
    },
  );
  await t.test(
    'diagnostic: inherited baseline permits own XP/wallet mutation; rollback preserves fixtures',
    () => {
      const result = query(
        `BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='${user(2)}'; UPDATE public.travelers SET xp=123456 WHERE id='${actor(2)}'; UPDATE public.wallets SET coins=654321 WHERE traveler_id='${actor(2)}'; SELECT xp::text||':'||coins::text FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id WHERE t.id='${actor(2)}'; ROLLBACK;`,
      );
      assert.equal(result, '123456:654321');
      assert.equal(
        query(
          'SELECT jsonb_agg(jsonb_build_array(t.id,t.xp,t.level,w.coins) ORDER BY t.id) FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id',
        ),
        before,
      );
      writeFileSync(
        'build/task-consolidation-001/inherited-economic-boundary.json',
        JSON.stringify(
          {
            finding: 'inherited client writable economic fields',
            severity: 'P1_FEATURE_ENABLEMENT',
            observedOffline: true,
            ownXpWritable: true,
            ownWalletWritable: true,
            rolledBack: true,
            remoteVerified: false,
            securityAcceptance: 'BLOCKED until authority/deny surface gate',
            task0078Changed: false,
          },
          null,
          2,
        ),
      );
    },
  );
});
