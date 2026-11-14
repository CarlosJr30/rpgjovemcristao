// Disposable PostgreSQL only: TEST-only control package CAS, audit, isolation and recovery.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const pgModule = await import(process.env.RPG_PG_MODULE ?? 'pg');
const Client = pgModule.Client ?? pgModule.default?.Client;
assert.equal(typeof Client, 'function');

const root = path.resolve('build/community-043b-control-test');
const bin = path.resolve(
  process.env.RPG_POSTGRES_BIN ??
    '../rpgjovemcristao-rpg-dev-007/build/rpg-dev-007/postgres-tool/node_modules/@embedded-postgres/windows-x64/native/bin',
);
assert(fs.existsSync(path.join(bin, 'postgres.exe')));
fs.mkdirSync(root, { recursive: true });
const cluster = path.join(root, `isolated-${Date.now()}`);
assert(cluster.startsWith(root + path.sep));
const port = await new Promise((resolve) => {
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => {
    const value = server.address().port;
    server.close(() => resolve(value));
  });
});

execFileSync(
  path.join(bin, 'initdb.exe'),
  [
    '-D',
    cluster,
    '-U',
    'postgres',
    '-A',
    'trust',
    '--encoding=UTF8',
    '--locale=C',
    '--no-sync',
  ],
  { windowsHide: true, stdio: 'pipe' },
);
execFileSync(
  path.join(bin, 'pg_ctl.exe'),
  [
    '-D',
    cluster,
    '-l',
    path.join(cluster, 'server.log'),
    '-o',
    `-h 127.0.0.1 -p ${port}`,
    '-w',
    'start',
  ],
  { windowsHide: true, stdio: 'ignore', timeout: 10000 },
);

const options = {
  host: '127.0.0.1',
  port,
  user: 'postgres',
  database: 'postgres',
};
const db = new Client(options);
const peers = [];
const sql = fs
  .readFileSync(
    'packages/database/proposals/community-043b-test-control-v1.sql.in',
    'utf8',
  )
  .replaceAll('\r\n', '\n');
const operation = (
  id,
  enabled,
  revision,
  expectedEnabled,
  environment,
  operator = 'authorized-operator',
  reference = 'https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/12345',
) =>
  `select guild_admin_private.community_test_control_v1('${id}',${enabled},${revision},${expectedEnabled},'${environment}','${operator}','${reference}') result`;

try {
  await db.connect();
  await db.query(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
    CREATE FUNCTION public.release_scope() RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT 'hero-equipment-006'::text $$;
    CREATE SCHEMA guild_admin_private;
    CREATE TABLE guild_admin_private.multiguild_control(
      singleton boolean PRIMARY KEY,
      writes_enabled boolean NOT NULL,
      revision integer NOT NULL,
      community_creation_enabled boolean NOT NULL DEFAULT false,
      community_environment text NOT NULL DEFAULT 'disabled'
    );
    INSERT INTO guild_admin_private.multiguild_control VALUES(true,true,1,false,'disabled');
    CREATE FUNCTION guild_admin_private.enforce_membership_quotas() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
    CREATE FUNCTION guild_admin_private.enforce_join_request_quotas() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
    REVOKE ALL ON SCHEMA guild_admin_private FROM PUBLIC, anon, authenticated, service_role;
    REVOKE ALL ON guild_admin_private.multiguild_control FROM PUBLIC, anon, authenticated, service_role;
  `);

  await assert.rejects(
    db.query(
      `BEGIN; SET LOCAL rpg.community043b.control_install='local-test'; SET LOCAL rpg.community043b.target_project='wspafhlbtlpabypzymjo'; ${sql} COMMIT`,
    ),
    (error) => error.code === '42501',
  );
  await db.query('ROLLBACK');
  assert.equal(
    (
      await db.query(
        "select to_regclass('guild_admin_private.community_control_operations') relation",
      )
    ).rows[0].relation,
    null,
  );

  await db.query(
    `BEGIN; SET LOCAL rpg.community043b.control_install='local-test'; SET LOCAL rpg.community043b.target_project='wkdvdzfkbwvhyjmamrsg'; ${sql} COMMIT`,
  );
  const signature =
    'guild_admin_private.community_test_control_v1(uuid,boolean,integer,boolean,text,text,text)';
  const acl = (
    await db.query(
      `select has_function_privilege('postgres','${signature}','execute') owner_ok,has_function_privilege('authenticated','${signature}','execute') auth_ok,has_function_privilege('anon','${signature}','execute') anon_ok,has_table_privilege('authenticated','guild_admin_private.community_control_operations','select') table_read`,
    )
  ).rows[0];
  assert.equal(acl.owner_ok, true);
  assert.equal(acl.auth_ok, false);
  assert.equal(acl.anon_ok, false);
  assert.equal(acl.table_read, false);
  assert.equal(
    (
      await db.query(
        "select relrowsecurity from pg_class where oid='guild_admin_private.community_control_operations'::regclass",
      )
    ).rows[0].relrowsecurity,
    true,
  );

  await db.query("SET rpg.community043b.target_project='wspafhlbtlpabypzymjo'");
  await assert.rejects(
    db.query(
      operation(
        '10000000-0000-4000-8000-000000000001',
        true,
        1,
        false,
        'disabled',
      ),
    ),
    (e) => e.code === '42501',
  );
  await db.query(
    "SET rpg.community043b.target_project='wkdvdzfkbwvhyjmamrsg'; CREATE OR REPLACE FUNCTION public.release_scope() RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT 'guild-ebd-001'::text $$",
  );
  await assert.rejects(
    db.query(
      operation(
        '10000000-0000-4000-8000-000000000002',
        true,
        1,
        false,
        'disabled',
      ),
    ),
    (e) => e.code === '42501',
  );
  await db.query(
    "CREATE OR REPLACE FUNCTION public.release_scope() RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT 'hero-equipment-006'::text $$",
  );

  await assert.rejects(
    db.query(
      operation(
        '10000000-0000-4000-8000-000000000003',
        true,
        2,
        false,
        'disabled',
      ),
    ),
    (e) => e.code === '40001',
  );
  assert.equal(
    (
      await db.query(
        'select revision,community_creation_enabled,community_environment from guild_admin_private.multiguild_control',
      )
    ).rows[0].revision,
    1,
  );
  assert.equal(
    (
      await db.query(
        'select count(*)::int n from guild_admin_private.community_control_operations',
      )
    ).rows[0].n,
    0,
  );
  await assert.rejects(
    db.query(
      operation(
        '10000000-0000-4000-8000-000000000004',
        true,
        1,
        false,
        'disabled',
        'x',
      ),
    ),
    (e) => e.code === '22023',
  );

  const op1 = '10000000-0000-4000-8000-000000000010';
  const enabled = (await db.query(operation(op1, true, 1, false, 'disabled')))
    .rows[0].result;
  assert.deepEqual(enabled, {
    status: 'applied',
    enabled: true,
    environment: 'test',
    revision: 2,
    replayed: false,
  });
  assert.deepEqual(
    (await db.query(operation(op1, true, 1, false, 'disabled'))).rows[0].result,
    { ...enabled, replayed: true },
  );
  assert.equal(
    (
      await db.query(
        'select count(*)::int n from guild_admin_private.community_control_operations',
      )
    ).rows[0].n,
    1,
  );
  await assert.rejects(
    db.query(operation(op1, false, 2, true, 'test')),
    (e) => e.code === '22023',
  );
  await assert.rejects(
    db.query(
      operation('10000000-0000-4000-8000-000000000015', true, 2, true, 'test'),
    ),
    (e) => e.code === '22023',
  );
  assert.match(
    (
      await db.query(
        'select database_session from guild_admin_private.community_control_operations',
      )
    ).rows[0].database_session,
    /^postgres:pid=[0-9]+:tx=[0-9]+$/,
  );

  const op2 = '10000000-0000-4000-8000-000000000011';
  const disabled = (await db.query(operation(op2, false, 2, true, 'test')))
    .rows[0].result;
  assert.deepEqual(disabled, {
    status: 'applied',
    enabled: false,
    environment: 'disabled',
    revision: 3,
    replayed: false,
  });
  assert.equal(
    (
      await db.query(
        'select writes_enabled from guild_admin_private.multiguild_control',
      )
    ).rows[0].writes_enabled,
    true,
  );
  assert.equal(
    (
      await db.query(
        'select count(*)::int n from guild_admin_private.community_control_operations',
      )
    ).rows[0].n,
    2,
  );
  await assert.rejects(
    db.query(
      "update guild_admin_private.community_control_operations set operator_label='rewritten'",
    ),
    (e) => e.code === '42501',
  );
  await db.query('ROLLBACK');

  const rolledBack = '10000000-0000-4000-8000-000000000012';
  await db.query('BEGIN');
  await db.query(
    "SET LOCAL rpg.community043b.target_project='wkdvdzfkbwvhyjmamrsg'",
  );
  await db.query(operation(rolledBack, true, 3, false, 'disabled'));
  await db.query('ROLLBACK');
  assert.deepEqual(
    (
      await db.query(
        'select revision,community_creation_enabled,community_environment from guild_admin_private.multiguild_control',
      )
    ).rows[0],
    {
      revision: 3,
      community_creation_enabled: false,
      community_environment: 'disabled',
    },
  );
  assert.equal(
    (
      await db.query(
        'select count(*)::int n from guild_admin_private.community_control_operations',
      )
    ).rows[0].n,
    2,
  );

  const race = async (id) => {
    const client = new Client(options);
    peers.push(client);
    await client.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        "SET LOCAL rpg.community043b.target_project='wkdvdzfkbwvhyjmamrsg'",
      );
      const result = await client.query(
        operation(id, true, 3, false, 'disabled'),
      );
      await client.query('COMMIT');
      return result.rows[0].result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  };
  const raced = await Promise.allSettled([
    race('10000000-0000-4000-8000-000000000013'),
    race('10000000-0000-4000-8000-000000000014'),
  ]);
  assert.equal(raced.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal(
    raced.filter((x) => x.status === 'rejected' && x.reason.code === '40001')
      .length,
    1,
  );
  const current = (
    await db.query(
      'select revision,community_creation_enabled,community_environment from guild_admin_private.multiguild_control',
    )
  ).rows[0];
  assert.equal(current.revision, 4);
  assert.equal(current.community_creation_enabled, true);
  assert.equal(current.community_environment, 'test');
  assert.equal(
    (
      await db.query(
        'select count(*)::int n from guild_admin_private.community_control_operations',
      )
    ).rows[0].n,
    3,
  );

  console.log(
    'COMMUNITY-043B control package: 16 focused PostgreSQL assertions PASS (disposable cluster only).',
  );
} finally {
  await Promise.all(peers.map((client) => client.end().catch(() => {})));
  await db.end().catch(() => {});
  if (fs.existsSync(cluster))
    execFileSync(
      path.join(bin, 'pg_ctl.exe'),
      ['-D', cluster, '-m', 'immediate', '-w', 'stop'],
      { windowsHide: true, stdio: 'ignore' },
    );
}
