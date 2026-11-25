import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import pg from 'pg';

const EXPECTED_PROJECT = 'wkdvdzfkbwvhyjmamrsg';
const EXPECTED_SHA256 = '7de7a45e8185765fbb6fe558ffa878fb4a612ef8e12bb1b88c97613d183ec6cc';
const MIGRATION_PATH = resolve(
  'supabase/migrations/20261124185354_story_007c_creation_checkpoints_test.sql',
);

export function requireTestConnection(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('A conexão PostgreSQL não tem formato válido.');
  }

  const expectedHost = `db.${EXPECTED_PROJECT}.supabase.co`;
  if (url.hostname !== expectedHost)
    throw new Error('O executor aceita exclusivamente o hostname Supabase TEST aprovado.');
  if (!url.username || !url.pathname || url.pathname === '/')
    throw new Error('A conexão deve identificar usuário e banco.');
}

export function prepareBody(migration) {
  const normalized = migration.replace(/^\uFEFF/, '');
  const match = normalized.match(/^(?:--[^\r\n]*\r?\n)*BEGIN;\r?\n([\s\S]*)\r?\nCOMMIT;\s*$/);
  if (!match) throw new Error('Delimitadores externos esperados não encontrados.');

  const body = match[1];
  if (/^\s*(BEGIN|COMMIT|END)\s*;/im.test(body))
    throw new Error('O corpo possui delimitador de transação interno.');

  return body;
}

export function verifyMigrationHash(migration, expectedHash = EXPECTED_SHA256) {
  const actualHash = createHash('sha256').update(migration, 'utf8').digest('hex');
  if (actualHash !== expectedHash)
    throw new Error('O hash da migration diverge do SHA aprovado.');
  return actualHash;
}

export function requireOwnerConfirmation(authorized) {
  if (!authorized)
    throw new Error('Autorização explícita do proprietário é obrigatória.');
}

export async function runTransaction(client, body, targetProject = EXPECTED_PROJECT) {
  if (targetProject !== EXPECTED_PROJECT)
    throw new Error('O destino solicitado não é o projeto TEST aprovado.');
  if (/^\s*(BEGIN|COMMIT|END)\s*;/im.test(body))
    throw new Error('O corpo possui delimitador de transação interno.');

  let transactionStarted = false;
  try {
    await client.query('BEGIN');
    transactionStarted = true;
    await client.query("SET LOCAL story007c.target_project='wkdvdzfkbwvhyjmamrsg'");
    const identity = await client.query("SELECT current_setting('story007c.target_project', true) AS target");
    if (identity.rows[0]?.target !== EXPECTED_PROJECT)
      throw new Error('A guarda de projeto não foi aplicada nesta transação.');
    await client.query(body);
    await client.query('COMMIT');
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

export async function applyMigration(connectionString, authorized) {
  requireOwnerConfirmation(authorized);
  requireTestConnection(connectionString);
  const migration = await readFile(MIGRATION_PATH, 'utf8');
  verifyMigrationHash(migration);
  const body = prepareBody(migration);

  const client = new pg.Client({ connectionString, application_name: 'story007-test-migration' });
  await client.connect();
  try {
    await runTransaction(client, body);
    console.log('Migration executada no projeto TEST validado.');
  } catch (error) {
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

if (process.argv[1] && new URL(import.meta.url).pathname === new URL(`file://${resolve(process.argv[1])}`).pathname) {
  const connectionString = process.env.STORY007_TEST_DATABASE_URL;
  applyMigration(connectionString, process.argv[2] === '--apply-after-owner-authorization')
    .catch((error) => {
      console.error(`Execução interrompida: ${error.message}`);
      process.exitCode = 1;
    });
}
