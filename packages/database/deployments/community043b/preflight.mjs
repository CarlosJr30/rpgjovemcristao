import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = fileURLToPath(new URL('.', import.meta.url));
const manifestPath = resolve(packageDir, 'production-package.json');

export function selectProductionMigrations({ target, project }) {
  if (target !== 'production') throw new Error('Explicit production target required');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.environment !== 'production' || manifest.targetProject !== project)
    throw new Error('Production project identity mismatch');
  if (manifest.status !== 'ready') throw new Error('COMMUNITY-043B production package is blocked');
  const expected = [
    '20261113215415_community_043b_controlled_creation_production.sql',
    '20261113232954_community_043b_membership_link_quotas_production.sql',
    '20261114110000_community_043b_join_request_quotas_production.sql',
  ];
  if (!Array.isArray(manifest.migrations) || manifest.migrations.length !== expected.length)
    throw new Error('Exactly three reviewed production migrations required');

  const migrations = manifest.migrations.map((entry, index) => {
    if (entry.file !== expected[index]) throw new Error('Production migration order or identity mismatch');
    const absolute = realpathSync(resolve(packageDir, 'sql', entry.file));
    const sqlDir = realpathSync(resolve(packageDir, 'sql')) + sep;
    if (!absolute.startsWith(sqlDir)) throw new Error('Migration path escapes production package');
    if (!/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('Reviewed SHA-256 is required');
    const actualHash = createHash('sha256').update(readFileSync(absolute)).digest('hex');
    if (actualHash !== entry.sha256) throw new Error('Production migration SHA-256 mismatch');
    return { path: absolute, sha256: entry.sha256 };
  });
  return migrations;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [target, project] = process.argv.slice(2);
    const migrations = selectProductionMigrations({ target, project });
    process.stdout.write(`${JSON.stringify(migrations, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`COMMUNITY-043B PROD preflight blocked: ${error.message}\n`);
    process.exitCode = 1;
  }
}
