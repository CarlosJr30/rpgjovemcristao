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
  runTransaction,
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

test('accepts the exact TEST connection host and rejects PROD', () => {
  const testUrl = `postgresql://audit:secret@db.${project}.supabase.co/postgres`;
  const productionUrl = 'postgresql://audit:secret@db.wspafhlbtlpabypzymjo.supabase.co/postgres';
  assert.doesNotThrow(() => requireTestConnection(testUrl));
  assert.throws(() => requireTestConnection(productionUrl), /exclusivamente/);
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

test('does not print connection credentials on rejection', async () => {
  const secret = 'should-never-appear-in-logs';
  const url = `postgresql://audit:${secret}@db.wspafhlbtlpabypzymjo.supabase.co/postgres`;
  let message;
  try {
    requireTestConnection(url);
  } catch (error) {
    message = error.message;
  }
  assert.ok(message);
  assert.equal(message.includes(secret), false);
});
