import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {
  selectProductionMigrations,
  validateProductionPlan,
} from './preflight.mjs';

const dir = fileURLToPath(new URL('.', import.meta.url));
const manifest = JSON.parse(
  readFileSync(resolve(dir, 'production-package.json'), 'utf8'),
);
const plan = [
  ...manifest.candidateMigrations.map((x) => ({
    order: x.order,
    version: x.file.slice(0, 14),
    path: `packages/database/deployments/community043b/sql/${x.file}`,
    sha256: x.sha256,
  })),
  ...manifest.supplementalInstallations.map((x) => ({
    order: x.order,
    version: x.migrationVersion,
    path: x.path,
    sha256: x.sha256,
  })),
];
const context = {
  project: 'wspafhlbtlpabypzymjo',
  releaseScope: 'guild-ebd-001',
  appliedVersions: ['20261113153902'],
};

test('validates exactly six pinned operations without authorizing installation', () => {
  const result = validateProductionPlan(plan, context);
  assert.equal(result.length, 6);
  assert.equal(new Set(result.map((x) => x.version)).size, 6);
  assert.equal(manifest.status, 'blocked');
});

test('rejects substituted, reordered, extra, TEST and historical operations', () => {
  for (const field of ['version', 'path', 'sha256', 'order']) {
    const altered = structuredClone(plan);
    altered[3][field] = field === 'order' ? 1 : 'supabase/migrations/test.sql';
    assert.throws(() => validateProductionPlan(altered, context), /mismatch/);
  }
  assert.throws(
    () => validateProductionPlan([...plan, plan[0]], context),
    /Exactly six/,
  );
  assert.throws(
    () => validateProductionPlan([...plan].reverse(), context),
    /mismatch/,
  );
  assert.throws(
    () =>
      validateProductionPlan(plan, {
        ...context,
        appliedVersions: [...context.appliedVersions, plan[0].version],
      }),
    /already applied/,
  );
});

test('rejects wrong scope, project and missing production history', () => {
  assert.throws(
    () =>
      validateProductionPlan(plan, {
        ...context,
        project: 'wkdvdzfkbwvhyjmamrsg',
      }),
    /identity/,
  );
  assert.throws(
    () =>
      validateProductionPlan(plan, {
        ...context,
        releaseScope: 'hero-equipment-006',
      }),
    /identity/,
  );
  assert.throws(
    () => validateProductionPlan(plan, { ...context, appliedVersions: [] }),
    /history/,
  );
});

test('pins three versioned supplements after the original migrations without authorizing activation', () => {
  assert.deepEqual(manifest.installationPlan.orders, [1, 2, 3, 4, 5, 6]);
  assert.equal(manifest.installationPlan.activationIncluded, false);
  assert.equal(manifest.installationPlan.status, 'blocked');
  assert.deepEqual(
    manifest.supplementalInstallations.map((x) => x.order),
    [4, 5, 6],
  );
  for (const entry of manifest.supplementalInstallations) {
    assert.deepEqual(entry.dependsOn, [entry.order - 1]);
    const contents = readFileSync(resolve(dir, '../../../..', entry.path));
    assert.equal(
      createHash('sha256').update(contents).digest('hex'),
      entry.sha256,
    );
  }
});

test('keeps PROD release list empty and pins current production project/scope', () => {
  assert.equal(manifest.status, 'blocked');
  assert.deepEqual(manifest.migrations, []);
  assert.equal(manifest.targetProject, 'wspafhlbtlpabypzymjo');
  assert.equal(
    manifest.observedProductionBaseline.releaseScope,
    'guild-ebd-001',
  );
  assert.equal(
    manifest.observedProductionBaseline.communityMigrationsApplied,
    false,
  );
});

test('preserves TEST sources outside the production package', () => {
  assert.deepEqual(
    readdirSync(resolve(dir, 'sql'))
      .filter((file) => file.endsWith('.sql'))
      .sort(),
    manifest.candidateMigrations.map((entry) => entry.file).sort(),
  );
  for (const source of manifest.testSources) {
    const contents = readFileSync(
      resolve(dir, '../../../..', source.path),
      'utf8',
    );
    assert.match(
      contents.slice(0, 180),
      /TEST ONLY|TEST\/local candidate|Local\/TEST candidate/,
    );
    assert.equal(source.path.includes('_production.sql'), false);
  }
});

test('pins all draft bytes and their order without making them deployable', () => {
  assert.deepEqual(
    manifest.candidateMigrations.map((entry) => entry.order),
    [1, 2, 3],
  );
  for (const entry of manifest.candidateMigrations) {
    const sql = readFileSync(resolve(dir, 'sql', entry.file));
    assert.equal(createHash('sha256').update(sql).digest('hex'), entry.sha256);
    assert.equal(entry.validation, 'postgresql17-isolated-pass');
    const text = sql.toString('utf8');
    assert.match(text, /session_user <> 'postgres'/);
    assert.match(text, /target_project.*wspafhlbtlpabypzymjo/);
    assert.match(text, /release_scope\(\).*guild-ebd-001/);
    assert.match(text, /advisory_xact_lock\(1010,1\)/);
    assert.doesNotMatch(text, /hero-equipment-006|local-test/);
    assert.match(text, /BEGIN;/);
    assert.match(text, /COMMIT;\s*$/);
  }
});

test('ties recorded PostgreSQL evidence to the exact candidate hashes', () => {
  const evidence = JSON.parse(
    readFileSync(resolve(dir, 'validation-summary.json'), 'utf8'),
  );
  assert.equal(evidence.postgresVersion, 'postgres (PostgreSQL) 17.10');
  assert.equal(evidence.checks.length, 49);
  assert(evidence.checks.every((entry) => entry.pass === true));
  assert.deepEqual(evidence.migrations, manifest.candidateMigrations);
  assert.equal(evidence.hostedProof, false);
});

test('draft defaults keep creation and new quota enforcement inactive', () => {
  const sql = manifest.candidateMigrations.map((entry) =>
    readFileSync(resolve(dir, 'sql', entry.file), 'utf8'),
  );
  assert.match(
    sql[0],
    /community_creation_enabled boolean NOT NULL DEFAULT false/,
  );
  assert.match(
    sql[0],
    /community_environment text NOT NULL DEFAULT 'disabled'/,
  );
  assert.match(
    sql[1],
    /IF NOT EXISTS .*community_creation_enabled.* THEN RETURN NEW/,
  );
  assert.match(
    sql[1],
    /CASE WHEN EXISTS .*community_creation_enabled.* THEN 1 ELSE NULL END/,
  );
  assert.match(
    sql[2],
    /IF NOT EXISTS .*community_creation_enabled.* THEN RETURN NEW/,
  );
});

test('fails closed while the COMMUNITY-043B production package is blocked', () => {
  assert.throws(
    () =>
      selectProductionMigrations({
        target: 'production',
        project: 'wspafhlbtlpabypzymjo',
      }),
    /package is blocked/,
  );
});

test('rejects TEST and implicit targets before selecting SQL', () => {
  for (const target of [undefined, 'test', 'preview', '']) {
    assert.throws(
      () =>
        selectProductionMigrations({ target, project: 'wspafhlbtlpabypzymjo' }),
      /Explicit production target required/,
    );
  }
});

test('rejects any project other than the pinned production project', () => {
  assert.throws(
    () =>
      selectProductionMigrations({
        target: 'production',
        project: 'wkdvdzfkbwvhyjmamrsg',
      }),
    /project identity mismatch/,
  );
});
