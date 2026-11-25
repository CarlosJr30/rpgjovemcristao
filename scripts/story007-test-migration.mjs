import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import pg from 'pg';

const EXPECTED_PROJECT = 'wkdvdzfkbwvhyjmamrsg';
const EXPECTED_POOLER_HOST = 'aws-1-sa-east-1.pooler.supabase.com';
const EXPECTED_POOLER_USER = `postgres.${EXPECTED_PROJECT}`;
const EXPECTED_SHA256 = '7de7a45e8185765fbb6fe558ffa878fb4a612ef8e12bb1b88c97613d183ec6cc';
const BASELINE_VERSION = '20261021031958';
const BASELINE_NAME = 'deploy002_11_task0081_story_progress';
const MIGRATION_VERSION = '20261124185354';
const PRIVATE_TABLES = [
  'creation_checkpoint_revisions',
  'creation_video_publications',
  'creation_activity_receipts',
  'creation_quiz_attempts',
  'creation_day_attempts',
  'creation_quiz_budgets',
];
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

  const expectedDirectHost = `db.${EXPECTED_PROJECT}.supabase.co`;
  const port = url.port || '5432';
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const username = decodeURIComponent(url.username);

  if (url.hostname === expectedDirectHost) {
    if (!username || !database)
      throw new Error('A conexão direta TEST deve identificar usuário e banco.');
    return { mode: 'direct', host: url.hostname, port, username, database };
  }

  if (url.hostname === EXPECTED_POOLER_HOST) {
    if (port !== '5432' || username !== EXPECTED_POOLER_USER || database !== 'postgres')
      throw new Error('A conexão Session pooler deve identificar exclusivamente o projeto TEST.');
    return { mode: 'session-pooler', host: url.hostname, port, username, database };
  }

  throw new Error('Hostname não autorizado para o projeto Supabase TEST.');
}

export async function verifyTestPreconditions(client, connection) {
  const identityResult = await client.query(`
    SELECT current_database() AS database,
           current_user AS role,
           current_setting('server_version_num')::integer AS version_num,
           current_setting('server_version') AS version
  `);
  const identity = identityResult.rows[0];
  if (
    identity?.database !== 'postgres' ||
    identity?.role !== 'postgres' ||
    Math.floor(identity.version_num / 10000) !== 17
  ) {
    throw new Error('Identidade efetiva ou versão PostgreSQL fora do preflight TEST aprovado.');
  }

  // Pooler hostname is shared. The project-qualified pooler role above is
  // required, then this read-only baseline query verifies the target database.
  if (connection.mode === 'session-pooler' && connection.username !== EXPECTED_POOLER_USER)
    throw new Error('A identidade do Session pooler não corresponde ao projeto TEST.');

  const baselineResult = await client.query(
    `SELECT
       (SELECT count(*)::integer FROM supabase_migrations.schema_migrations
        WHERE version=$1 AND name=$2) AS baseline_count,
       (SELECT count(*)::integer FROM supabase_migrations.schema_migrations
        WHERE version=$3) AS target_migration_count,
       (SELECT count(*)::integer FROM public.story_definitions
        WHERE id='creation') AS creation_count,
       (SELECT count(*)::integer FROM public.story_definitions
        WHERE id='creation' AND revision=1
          AND NOT content_ready AND NOT video_ready AND NOT reward_ready) AS expected_creation_count,
       to_regnamespace('story_private') IS NOT NULL AS private_schema_exists,
       ARRAY_REMOVE(ARRAY[
         ${PRIVATE_TABLES.map((_, index) => `CASE WHEN to_regclass('story_private.${PRIVATE_TABLES[index]}') IS NOT NULL THEN '${PRIVATE_TABLES[index]}' END`).join(',\n         ')}
       ], NULL) AS existing_tables`,
    [BASELINE_VERSION, BASELINE_NAME, MIGRATION_VERSION],
  );
  const baseline = baselineResult.rows[0];
  if (
    baseline?.baseline_count !== 1 ||
    baseline?.target_migration_count !== 0 ||
    baseline?.creation_count !== 1 ||
    baseline?.expected_creation_count !== 1 ||
    baseline?.private_schema_exists !== true ||
    baseline?.existing_tables?.length !== 0
  ) {
    throw new Error('Baseline TEST incompatível ou tabelas de checkpoints já existentes.');
  }

  return { version: identity.version, database: identity.database, role: identity.role };
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

export function redactConnectionDetails(message, connectionString) {
  if (!connectionString) return message;
  try {
    const parsed = new URL(connectionString);
    const sensitiveValues = [
      connectionString,
      parsed.username,
      decodeURIComponent(parsed.username),
      parsed.password,
      decodeURIComponent(parsed.password),
    ];
    return sensitiveValues.reduce(
      (safe, secret) => (secret ? safe.replaceAll(secret, '[redigido]') : safe),
      message,
    );
  } catch {
    return 'Conexão inválida ou execução interrompida.';
  }
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
  const connection = requireTestConnection(connectionString);
  const migration = await readFile(MIGRATION_PATH, 'utf8');
  verifyMigrationHash(migration);
  const body = prepareBody(migration);

  const client = new pg.Client({ connectionString, application_name: 'story007-test-migration' });
  try {
    await client.connect();
    const preflight = await verifyTestPreconditions(client, connection);
    console.log(`Preflight TEST aprovado (${preflight.version}; ${connection.mode}).`);
    await runTransaction(client, body);
    console.log('Migration executada no projeto TEST validado.');
  } finally {
    await client.end().catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const connectionString = process.env.STORY007_TEST_DATABASE_URL;
  applyMigration(connectionString, process.argv[2] === '--apply-after-owner-authorization')
    .catch((error) => {
      const message = redactConnectionDetails(
        error instanceof Error ? error.message : 'erro desconhecido',
        connectionString,
      );
      console.error(`Execução interrompida: ${message}`);
      process.exitCode = 1;
    });
}
