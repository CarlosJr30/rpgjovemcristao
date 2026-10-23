// Opt-in Windows/WSL fixture; never imported by product code or migration package.
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const execAsync = promisify(execFile);
export const literal = (value: unknown) =>
  `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
export const uid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const tid = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export function offlinePostgres(
  options: {
    beforeMigrations?: (query: (sql: string) => string) => void;
    transformMigration?: (sql: string) => string;
  } = {},
) {
  const name = `rpg-consolidation004-${process.pid}`;
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
  const run = (args: string[], input?: string) =>
    execFileSync('wsl.exe', [...prefix, ...args], {
      input,
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  const sqlArgs = [
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
  const query = (sql: string) => run(sqlArgs, sql).trim();
  async function queryAsync(sql: string) {
    const child = execAsync('wsl.exe', [...prefix, ...sqlArgs], {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 4 * 1024 * 1024,
    });
    child.child.stdin!.end(sql);
    return (await child).stdout.trim();
  }
  const as = (n: number, sql: string) =>
    query(
      `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${uid(n)}';SET LOCAL request.jwt.claims='{"is_anonymous":false}';${sql};COMMIT;`,
    );
  const rpcSql = (u: string, t: string, op: string, p: object = {}) =>
    `SELECT public.arena_authority_v3('${u}','${t}','${op}',${literal(p)})`;
  const rpc = async <T>(u: string, t: string, op: string, p: object = {}) =>
    JSON.parse(
      await queryAsync(
        `BEGIN;SET LOCAL ROLE service_role;${rpcSql(u, t, op, p)};COMMIT;`,
      ),
    ) as T;
  let created = false;
  return {
    query,
    queryAsync,
    as,
    rpc,
    rpcSql,
    async start() {
      run([
        'run',
        '-d',
        '--rm',
        '--pull=never',
        '--name',
        name,
        '--label',
        'task=TASK-CONSOLIDATION-004',
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
      for (let n = 0; n < 40; n++) {
        try {
          run(['exec', name, 'pg_isready', '-h', '/tmp', '-U', 'postgres']);
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      const info = JSON.parse(run(['inspect', name]))[0];
      if (
        info.HostConfig.NetworkMode !== 'none' ||
        !info.HostConfig.ReadonlyRootfs ||
        Object.keys(info.HostConfig.PortBindings ?? {}).length ||
        info.Mounts.some((m: { Type: string }) => m.Type === 'bind')
      )
        throw Error('Unsafe test container');
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
      options.beforeMigrations?.(query);
      const lock = JSON.parse(
        readFileSync(
          'packages/database/reviewed/consolidation-002.lock.json',
          'utf8',
        ),
      );
      // Lock schema uses ordered steps; use the frozen source paths, not a glob.
      const steps = lock.steps;
      for (const step of steps) {
        const sql = readFileSync(resolve(step.source), 'utf8');
        if (
          createHash('sha256')
            .update(sql.replaceAll('\r\n', '\n'))
            .digest('hex') !== step.sha256
        )
          throw Error('Unreviewed baseline SQL');
        const prepared = options.transformMigration?.(sql) ?? sql;
        query(
          /^\s*BEGIN;\s*$/m.test(prepared)
            ? prepared
            : `BEGIN;${prepared}\nCOMMIT;`,
        );
      }
    },
    apply(name: string) {
      const reviewed = JSON.parse(
        readFileSync(
          'packages/database/reviewed/consolidation-004.lock.json',
          'utf8',
        ),
      );
      const path = `packages/database/proposals/${name}`;
      const step = reviewed.steps.find(
        (s: { source: string }) => s.source === path,
      );
      if (
        !step ||
        createHash('sha256')
          .update(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'))
          .digest('hex') !== step.sha256
      )
        throw Error('Unreviewed authority SQL');
      query(
        `BEGIN;${readFileSync(`packages/database/proposals/${name}`, 'utf8')}\nCOMMIT;`,
      );
    },
    create(n: number, owner = n) {
      query(
        `INSERT INTO auth.users(id) VALUES('${uid(owner)}') ON CONFLICT DO NOTHING`,
      );
      as(
        owner,
        `INSERT INTO public.profiles(id,display_name) VALUES(auth.uid(),'Synthetic') ON CONFLICT DO NOTHING;SELECT public.create_traveler('${tid(n)}','Synthetic ${String.fromCharCode(65 + (n % 26))}','male','medio','curto','castanho','musgo')`,
      );
    },
    stop() {
      if (!created) return;
      const info = JSON.parse(run(['inspect', name]))[0];
      if (
        info.Config.Labels.task !== 'TASK-CONSOLIDATION-004' ||
        info.HostConfig.NetworkMode !== 'none'
      )
        throw Error('Wrong test cleanup target');
      run(['stop', '--time', '5', name]);
      created = false;
    },
  };
}
