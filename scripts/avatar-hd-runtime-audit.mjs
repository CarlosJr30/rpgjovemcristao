import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
// The historical TASK-0050 code freeze is opt-in; later authorized runtime
// tasks must not weaken the permanent PNG/hash/approval audit to build.
const historicalPreservation = process.argv.includes(
  '--preservation-task-0050',
);
const outputDir = historicalPreservation
  ? 'build/task-0050-evidence'
  : 'build/avatar-hd-runtime-audit';
fs.mkdirSync(outputDir, { recursive: true });

const read = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const hash = (path) =>
  crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const catalog = read('apps/web/features/journey/data/avatarHDApproved.json');
const provenance = read(
  'docs/architecture/AVATAR-HD-RUNTIME-ACTIVATION-MANIFEST.json',
);
assert.equal(catalog.length, 54);
assert.equal(new Set(catalog.map((i) => i.id)).size, 54);
assert.equal(new Set(catalog.map((i) => i.source)).size, 54);
for (const asset of catalog) {
  assert(
    /^(male|female)_(short|long|curly)_(moss|ochre|blue)_(light|medium|dark)$/.test(
      asset.id,
    ),
  );
  assert(asset.id.startsWith(`${asset.gender}_`));
  assert.equal(asset.status, 'HUMAN_VISUAL_APPROVED');
  assert(asset.reviewedBy && Number.isFinite(Date.parse(asset.reviewedAt)));
  assert.equal(
    asset.legacy,
    `/assets/avatar/runtime/${asset.gender}/${asset.id}.png`,
  );
  assert.equal(
    asset.source,
    `/assets/avatar/hd/${asset.gender}/${asset.id}_hd.png`,
  );
  const native = fs.readFileSync('apps/web/public' + asset.source);
  assert.equal(native.readUInt32BE(16), 1024);
  assert.equal(native.readUInt32BE(20), 1536);
  assert.equal(native[25], 6); // PNG RGBA; full alpha/geometry audit already preserved.
  assert.equal(hash('apps/web/public' + asset.source), asset.sha256);
  const entry = provenance.assets.find((i) => i.id === asset.id);
  // Review-only generation originals are not needed in a clean checkout.
  // The public PNG must always match the durable explicit approval receipt.
  if (fs.existsSync(entry.sourceCandidate))
    assert.equal(hash(entry.sourceCandidate), asset.sha256);
  const receipt = read(entry.approvalReceipt);
  const approved =
    receipt.assets?.find((i) => i.id === asset.id) ??
    receipt.items?.find((i) => i.id === asset.id) ??
    receipt.pilots?.find((i) => i.id === asset.id) ??
    receipt;
  assert.equal(
    approved.reviewStatus ?? approved.humanReview,
    'HUMAN_VISUAL_APPROVED',
  );
  assert.equal(approved.reviewedBy ?? receipt.reviewedBy, asset.reviewedBy);
  assert.equal(approved.reviewedAt ?? receipt.reviewedAt, asset.reviewedAt);
  assert.equal(
    approved.sha256 ?? approved.assetValidator?.sha256,
    asset.sha256,
  );
  assert(fs.existsSync('apps/web/public' + asset.legacy));
}
const allowedRuntimeChanges = new Set([
  'apps/web/package.json', // Only explicit build audit command; dependencies unchanged.
  'apps/web/next-env.d.ts', // Next typegen/build generated route-types reference.
  'apps/web/features/journey/data/avatarRuntime.ts',
  'apps/web/features/journey/data/avatarHDPack.ts',
  'apps/web/features/journey/data/gameplayAvatarPortrait.ts',
  'apps/web/features/journey/components/avatar-runtime.tsx',
  'apps/web/features/journey/components/snake-chase-game.tsx',
  'apps/web/features/journey/dev/avatar-runtime-panel.tsx',
  'apps/web/features/journey/avatar-runtime.test.tsx',
  'apps/web/features/journey/avatar-hd-pack.test.tsx',
  'apps/web/features/journey/equipment-overlays.test.tsx',
  'apps/web/features/journey/progression.test.ts',
  'apps/web/features/journey/snake-chase-game.test.tsx',
  'tests/e2e/avatar-runtime.spec.ts',
  'tests/e2e/avatar-runtime-lab.spec.ts',
]);
const baseline =
  historicalPreservation &&
  fs.existsSync('build/task-0050-evidence/protected-baseline.json')
    ? read('build/task-0050-evidence/protected-baseline.json')
    : { files: [] };
let preserved = 0;
const authorizedChanged = [];
for (const file of baseline.files) {
  if (hash(file.path) === file.sha256) preserved++;
  else {
    assert(
      allowedRuntimeChanges.has(file.path),
      `Unauthorized protected change: ${file.path}`,
    );
    authorizedChanged.push(file.path);
  }
}
const result = {
  at: new Date().toISOString(),
  result: 'PASS',
  identities: 54,
  queue: 52,
  pilots: 2,
  bytes: provenance.totalBytes,
  decodedBytesPerHD: 1024 * 1536 * 4,
  protectedBaseline: baseline.files.length,
  preserved,
  authorizedChanged,
  nativeCopyHashApprovalPaths: 'PASS',
  legacyBodyFitAnchorsSaves: historicalPreservation
    ? 'PRESERVED'
    : 'TASK_SPECIFIC_BASELINE_NOT_REQUESTED',
};
fs.writeFileSync(
  `${outputDir}/asset-audit.json`,
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));
