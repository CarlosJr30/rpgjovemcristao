import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = fileURLToPath(new URL('.', import.meta.url));
const manifestPath = resolve(packageDir, 'production-package.json');
const repoRoot = resolve(packageDir, '../../../..');
const approved = [
  [
    '20261113215415',
    'packages/database/deployments/community043b/sql/20261113215415_community_043b_controlled_creation_production.sql',
    '47be11a66a089bd6eda0e224ab1cc2619a718c0bc01c1e5e47f8ce085bffa62f',
  ],
  [
    '20261113232954',
    'packages/database/deployments/community043b/sql/20261113232954_community_043b_membership_link_quotas_production.sql',
    '3c3141ce281fce3a20584130ea25762601a8409eb3b54fc36cf47eeae6260a93',
  ],
  [
    '20261114110000',
    'packages/database/deployments/community043b/sql/20261114110000_community_043b_join_request_quotas_production.sql',
    '4553e9e02992d2faa564d0303f44ea694c005ac79fe3696e9702c3494f04a70e',
  ],
  [
    '20261115150001',
    'packages/database/deployments/community043b/sql/community_own_guild_capability.sql.in',
    '8838d65d9488855b140ba547464f1c1f05c359c34801e6a74c00b019bf8e04d8',
  ],
  [
    '20261115150002',
    'packages/database/proposals/community-043b-production-control-v1.sql.in',
    '8ca257ce13ecfa20cdb49b405eacb20b89523a5b521986700eb97b84c2cfc414',
  ],
  [
    '20261115170001',
    'packages/database/deployments/community043b/sql/community_retention_v1.sql.in',
    '4bf1e9a181032acde0133ed3bf2f1ec7e24f134b1c542d479b6314c567d6c68f',
  ],
];

// Pure plan validation does not authorize installation or connect to a database.
export function validateProductionPlan(
  entries,
  { project, releaseScope, appliedVersions },
) {
  if (project !== 'wspafhlbtlpabypzymjo' || releaseScope !== 'guild-ebd-001')
    throw new Error('Production identity or release scope mismatch');
  if (
    !Array.isArray(appliedVersions) ||
    !appliedVersions.includes('20261113153902')
  )
    throw new Error('Reviewed remote migration history required');
  if (!Array.isArray(entries) || entries.length !== 6)
    throw new Error('Exactly six reviewed operations required');
  return entries.map((entry, index) => {
    const [version, path, sha256] = approved[index];
    if (
      entry.order !== index + 1 ||
      entry.version !== version ||
      entry.path !== path ||
      entry.sha256 !== sha256
    )
      throw new Error(
        'Production operation identity, order, version or hash mismatch',
      );
    if (appliedVersions.includes(version))
      throw new Error(
        'Operation already applied; reconcile history before continuing',
      );
    const absolute = realpathSync(resolve(repoRoot, path));
    if (absolute !== resolve(repoRoot, path))
      throw new Error('Operation path redirected');
    const actual = createHash('sha256')
      .update(readFileSync(absolute))
      .digest('hex');
    if (actual !== sha256) throw new Error('Production SQL SHA-256 mismatch');
    return { order: index + 1, version, path: absolute, sha256 };
  });
}

export function selectProductionMigrations({
  target,
  project,
  releaseScope,
  appliedVersions,
}) {
  if (target !== 'production')
    throw new Error('Explicit production target required');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (
    manifest.environment !== 'production' ||
    manifest.targetProject !== project
  )
    throw new Error('Production project identity mismatch');
  if (manifest.status !== 'ready')
    throw new Error('COMMUNITY-043B production package is blocked');
  return validateProductionPlan(manifest.migrations, {
    project,
    releaseScope,
    appliedVersions,
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const [target, project, releaseScope, historyFile] = process.argv.slice(2);
    const appliedVersions = historyFile
      ? JSON.parse(readFileSync(historyFile, 'utf8'))
      : undefined;
    const migrations = selectProductionMigrations({
      target,
      project,
      releaseScope,
      appliedVersions,
    });
    process.stdout.write(`${JSON.stringify(migrations, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(
      `COMMUNITY-043B PROD preflight blocked: ${error.message}\n`,
    );
    process.exitCode = 1;
  }
}
