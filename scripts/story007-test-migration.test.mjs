import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { Client } from 'pg';
import {
  prepareBody,
  requireTestConnection,
  requireOwnerConfirmation,
  redactConnectionDetails,
  runTransaction,
  verifyTestPreconditions,
  verifyMigrationHash,
} from './story007-test-migration.mjs';

const project = 'wkdvdzfkbwvhyjmamrsg';
const migrationPath = 'supabase/migrations/20261124185354_story_007c_creation_checkpoints_test.sql';
const postgresBin = path.resolve(
  'build/story007-postgres/postgres-tool/node_modules/@embedded-postgres/windows-x64/native/bin',
);

function runPostgresCommand(name, args) {
  execFileSync(path.join(postgresBin, `${name}.exe`), args, {
    windowsHide: true,
    stdio: 'ignore',
    timeout: 30_000,
  });
}

async function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

test('accepts direct TEST and the exact TEST Session pooler', () => {
  const testUrl = `postgresql://postgres:secret@db.${project}.supabase.co:5432/postgres`;
  const poolerUrl = `postgresql://postgres.${project}:secret@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`;
  assert.equal(requireTestConnection(testUrl).mode, 'direct');
  assert.equal(requireTestConnection(poolerUrl).mode, 'session-pooler');
});

test('rejects pooler PROD identity and unknown host', () => {
  const productionUrl = 'postgresql://audit:secret@db.wspafhlbtlpabypzymjo.supabase.co/postgres';
  const productionPoolerUrl = 'postgresql://postgres.wspafhlbtlpabypzymjo:secret@aws-1-sa-east-1.pooler.supabase.com:5432/postgres';
  const unknownHostUrl = 'postgresql://postgres.wkdvdzfkbwvhyjmamrsg:secret@pooler.invalid:5432/postgres';
  assert.throws(() => requireTestConnection(productionUrl), /Hostname não autorizado/);
  assert.throws(() => requireTestConnection(productionPoolerUrl), /identificar exclusivamente/);
  assert.throws(() => requireTestConnection(unknownHostUrl), /Hostname não autorizado/);
});

test('rejects a pooler port other than Session mode 5432', () => {
  const transactionPort = `postgresql://postgres.${project}:secret@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`;
  assert.throws(() => requireTestConnection(transactionPort), /Session pooler/);
});

test('checks effective TEST identity and baseline with read-only preflight queries', async () => {
  const responses = [
    { rows: [{ database: 'postgres', role: 'postgres', version_num: 170011, version: '17.11' }] },
    {
      rows: [{
        baseline_count: 1,
        target_migration_count: 0,
        creation_count: 1,
        expected_creation_count: 1,
        private_schema_exists: true,
        existing_tables: [],
      }],
    },
  ];
  const queries = [];
  const client = { query: async (sql) => { queries.push(sql); return responses.shift(); } };
  const connection = requireTestConnection(
    `postgresql://postgres.${project}:secret@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`,
  );

  assert.deepEqual(await verifyTestPreconditions(client, connection), {
    version: '17.11',
    database: 'postgres',
    role: 'postgres',
  });
  assert.equal(queries.length, 2);
  assert.ok(queries.every((sql) => /^\s*SELECT\b/i.test(sql)));
});

test('blocks preflight on a wrong effective identity before baseline query', async () => {
  let queryCount = 0;
  const client = {
    query: async () => {
      queryCount += 1;
      return { rows: [{ database: 'postgres', role: 'postgres', version_num: 160000, version: '16' }] };
    },
  };
  const connection = requireTestConnection(
    `postgresql://postgres.${project}:secret@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`,
  );
  await assert.rejects(
    verifyTestPreconditions(client, connection),
    /Identidade efetiva ou versão PostgreSQL/,
  );
  assert.equal(queryCount, 1);
});

test('verifies the full migration SHA-256 and rejects a modified file', () => {
  const migration = fs.readFileSync(migrationPath, 'utf8');
  assert.equal(
    verifyMigrationHash(migration),
    '7de7a45e8185765fbb6fe558ffa878fb4a612ef8e12bb1b88c97613d183ec6cc',
  );
  assert.throws(() => verifyMigrationHash(`${migration} `), /hash da migration diverge/);
});

test('keeps SET LOCAL inside one transaction and rejects embedded transaction delimiters', async () => {
  const migration = fs.readFileSync(migrationPath, 'utf8');
  const body = prepareBody(migration);
  assert.match(body, /SET LOCAL lock_timeout='5s'/);
  assert.match(body, /SET LOCAL statement_timeout='60s'/);
  assert.match(body, /story007c\.target_project/);
  assert.doesNotMatch(body, /^\s*(BEGIN|COMMIT|END)\s*;/im);
  assert.throws(() => prepareBody(migration.replace(/\r?\nCOMMIT;/, '\nBEGIN;\nCOMMIT;')), /delimitador/);
  await assert.rejects(runTransaction({}, 'COMMIT;'), /delimitador/);
});

test('requires explicit owner confirmation', async () => {
  assert.throws(() => requireOwnerConfirmation(false), /Autorização explícita/);
});

test('rolls back an intentional SQL error and never commits afterward', async (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'story007r-local-pg-'));
  const data = path.join(root, 'data');
  const port = await getAvailablePort();
  const client = new Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres' });
  let serverStarted = false;

  context.after(async () => {
    await client.end().catch(() => {});
    if (serverStarted)
      runPostgresCommand('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
    fs.rmSync(root, { recursive: true, force: true });
  });

  runPostgresCommand('initdb', [
    '-D', data,
    '-U', 'postgres',
    '-A', 'trust',
    '--encoding=UTF8',
    '--locale=C',
    '--no-sync',
  ]);
  runPostgresCommand('pg_ctl', [
    '-D', data,
    '-l', path.join(root, 'server.log'),
    '-o', `-h 127.0.0.1 -p ${port}`,
    '-w',
    'start',
  ]);
  serverStarted = true;
  await client.connect();
  await client.query('CREATE TABLE rollback_probe(value integer)');

  await assert.rejects(
    runTransaction(client, 'INSERT INTO rollback_probe VALUES (1); SELECT 1 / 0;'),
    /division by zero/,
  );

  const result = await client.query('SELECT count(*)::integer AS rows FROM rollback_probe');
  assert.equal(result.rows[0].rows, 0);
  assert.equal(client.getTransactionStatus(), 'I');
});

test('redacts connection URL, username, and password from error logs', () => {
  const password = 'should-never-appear-in-logs';
  const username = `postgres.${project}`;
  const url = `postgresql://${username}:${password}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`;
  const message = redactConnectionDetails(`failed ${url}; role=${username}; password=${password}`, url);
  assert.equal(message.includes(url), false);
  assert.equal(message.includes(username), false);
  assert.equal(message.includes(password), false);
});
