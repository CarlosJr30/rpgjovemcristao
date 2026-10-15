import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('..', import.meta.url));
const activation = process.argv.includes('--activation');
const dir = 'build/task-0075-body-fit-final-review',
  out = path.join(root, dir, activation ? 'activation' : 'continuation');
const read = (p) => readFile(path.join(root, p));
const json = async (p) =>
  JSON.parse((await read(p)).toString('utf8').replace(/^\uFEFF/, ''));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const baseline = await json(dir + '/preservation-before.json');
const inventory = await json(dir + '/inventory.json');
const authorized = activation
  ? (await json('docs/architecture/TASK-0075-ACTIVATION-SCOPE.json')).assets
  : [];
const approvedIds = new Set(authorized.map((a) => a.id));
approvedIds.add('armor_traveler_uncommon_female_v2');
const scopedCodeChanges = new Set(
  activation
    ? [
        'apps/web/features/journey/data/equipmentAssets.ts',
        'apps/web/features/journey/data/equipmentBodyFitV3.ts',
        'apps/web/features/journey/avatar-runtime.test.tsx',
        'apps/web/features/journey/equipment-assets.test.ts',
        'apps/web/features/journey/equipment-body-fit-v3.test.tsx',
        'apps/web/features/journey/equipment-v1-files.test.ts',
      ]
    : [],
);
const receipt = await json(
  'docs/architecture/TASK-0075-HUMAN-VISUAL-DECISIONS.json',
);
assert.equal(
  hash(await read(dir + '/review/index.html')),
  receipt.evidence.gallerySha256,
);
const reviews = await json(dir + '/visual-review.json');
const protectedChanges = [];
let protectedChecked = 0;
for (const [p, expected] of Object.entries(baseline.hashes)) {
  if (
    p.startsWith('apps/') ||
    p.startsWith('packages/') ||
    p.startsWith('assets-source/') ||
    /^build\/task-005[4589]/.test(p) ||
    p.includes('TASK-0054-HUMAN') ||
    p.includes('BAKED-ASSET-MANIFEST') ||
    p === 'package-lock.json'
  ) {
    if (scopedCodeChanges.has(p)) continue;
    protectedChecked++;
    if (hash(await read(p)) !== expected) protectedChanges.push(p);
  }
}
assert.deepEqual(protectedChanges, []);
assert.equal(receipt.decisions.length, 16);
assert.equal(
  receipt.decisions.filter((d) => d.decision === 'VISUALLY_APPROVED').length,
  12,
);
const eligibility = [];
const privateHashes = new Set();
for (const t of inventory.targets) {
  const d = receipt.decisions.find((d) => d.id === t.id);
  assert(d);
  assert.equal(hash(await read(t.staging)), t.sha256);
  assert.equal(hash(await read(t.source)), t.sourceSha256);
  assert.equal(hash(await read(t.avatar)), t.avatarSha256);
  assert.equal(d.sha256, t.sha256);
  assert.equal(d.sourceSha256, t.sourceSha256);
  assert.equal(d.avatar.sha256, t.avatarSha256);
  assert.equal(d.avatar.path, t.avatar);
  assert.equal(d.asset, t.staging);
  assert.equal(d.id, t.id);
  assert.equal(d.itemId, t.itemId);
  assert.equal(d.gender, t.gender);
  privateHashes.add(t.sourceSha256);
  if (!approvedIds.has(t.id)) privateHashes.add(t.sha256);
  const technicalConcern =
    reviews.targets.find((r) => r.id === t.id)?.visualResult === 'NEEDS_REWORK';
  const fitEligible =
    t.registered &&
    t.technical === 'FIT_PASS' &&
    d.decision === 'VISUALLY_APPROVED' &&
    !technicalConcern;
  eligibility.push({
    id: t.id,
    itemId: t.itemId,
    avatar: t.avatarId,
    avatarSha256: t.avatarSha256,
    assetSha256: t.sha256,
    visualDecision: d.decision,
    historicalTechnical: t.technical,
    assetEligibleForIntegrationReview: fitEligible,
    currentRuntimeEligible: activation
      ? approvedIds.has(t.id) && fitEligible
      : t.integrationEligible,
    currentRuntimeActive: activation ? approvedIds.has(t.id) : t.runtime,
    reason: !t.registered
      ? 'ARCHIVED_NO_PLAYABLE_CATALOG_ITEM'
      : d.decision === 'CORRECTION_REQUESTED'
        ? 'ORIGINAL_CORRECTION_REQUESTED'
        : t.technical !== 'FIT_PASS'
          ? 'TECHNICAL_FIT_NOT_PASSED'
          : technicalConcern
            ? 'SHIELD_FIXATION_REVIEW_STILL_OPEN'
            : (activation ? approvedIds.has(t.id) : t.runtime)
              ? 'EXACT_APPROVED_SCOPE_ALREADY_ACTIVE'
              : 'EXISTING_FIT_PASS_AND_EXACT_VISUAL_APPROVAL_VERIFIED_INTEGRATION_NOT_ACTIVATED',
  });
}
async function* files(dir) {
  for (const e of await readdir(path.join(root, dir), {
    withFileTypes: true,
  })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) yield* files(p);
    else if (e.isFile()) yield p;
  }
}
for (const d of [dir + '/alternatives', dir + '/size-rework'])
  for await (const p of files(d))
    if (p.endsWith('.png')) privateHashes.add(hash(await read(p)));
const findings = [];
let publicFilesScanned = 0,
  publicScriptsScanned = 0;
for (const d of [
  'apps/web/public',
  'apps/web/.next/static',
  'apps/web/.next/server/app',
])
  for await (const p of files(d)) {
    const b = await read(p);
    publicFilesScanned++;
    if (privateHashes.has(hash(b)))
      findings.push({ kind: 'PRIVATE_ASSET_EXPOSED', path: p });
    if (/\.(html|js|json|rsc|txt)$/.test(p)) {
      if (p.endsWith('.js')) publicScriptsScanned++;
      const text = b.toString('utf8');
      if (
        /\bsb_secret_[A-Za-z0-9]+|-----BEGIN [A-Z ]*PRIVATE KEY-----|\bsk-[A-Za-z0-9]{24,}/.test(
          text,
        )
      )
        findings.push({ kind: 'SECRET_PATTERN', path: p });
      for (const token of text.matchAll(
        /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      )) {
        let payload;
        try {
          payload = JSON.parse(
            Buffer.from(token[0].split('.')[1], 'base64url').toString('utf8'),
          );
        } catch {
          continue;
        }
        if (payload.role === 'service_role')
          findings.push({ kind: 'SERVICE_ROLE_JWT', path: p });
      }
      if (
        /TASK-0075 — superfície do calçado|TASK-0075 — Correções de elmos e botas/.test(
          text,
        )
      )
        findings.push({ kind: 'PRIVATE_GALLERY_EXPOSED', path: p });
    }
  }
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter(Boolean);
const trackedEnvs = tracked.filter(
  (p) => /(^|\/)\.env($|\.)/.test(p) && !p.endsWith('.example'),
);
assert.deepEqual(trackedEnvs, []);
assert.deepEqual(findings, []);
const result = {
  task: 'TASK-0075',
  recordedAt: new Date().toISOString(),
  status: 'PASS',
  protectedChecked,
  protectedChanges,
  receiptBindingsVerified: 16,
  visualApprovals: 12,
  assetEligibleForIntegrationReview: eligibility.filter(
    (e) => e.assetEligibleForIntegrationReview,
  ).length,
  currentRuntimeEligible: eligibility.filter((e) => e.currentRuntimeEligible)
    .length,
  runtimeActive: eligibility.filter((e) => e.currentRuntimeActive).length,
  eligibility,
  publicFilesScanned,
  publicScriptsScanned,
  privateHashesChecked: privateHashes.size,
  trackedEnvs,
  findings,
  remoteCalls: 0,
  runtimeStateChanged: activation,
  authorizedCodeChangePaths: [...scopedCodeChanges],
  technicalStatesPromoted: 0,
  notes: [
    'Asset integration review eligibility is not permission to activate or publish.',
    activation
      ? 'Historical FIT_PASS unchanged; three exact assets added locally under explicit release authorization. Production status requires deployment receipt.'
      : 'Historical FIT_PASS states and production resolver remain unchanged.',
    'No secret value or environment-file content is recorded.',
  ],
};
await writeFile(
  path.join(out, 'security-and-eligibility.json'),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify({ ...result, eligibility: undefined }));
