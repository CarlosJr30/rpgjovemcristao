import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { inspectPng } from './body-fit-batch-bake.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFile(path.join(root, p));
const json = async (p) => JSON.parse(await read(p));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const bundle = await build({
  stdin: {
    contents:
      "export * from './apps/web/features/journey/data/equipmentBodyFitV3.ts'",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const {
  APPROVED_BODY_FIT_V3: approved,
  APPROVED_BODY_FIT_V3_ASSETS: registry,
  APPROVED_ARMOR_COMPOSITION_3: composition3,
  APPROVED_SWORD_GRIP_COMPOSITION: grip,
} = await import(
  'data:text/javascript;base64,' +
    Buffer.from(bundle.outputFiles[0].text).toString('base64')
);
const receipt = await json(
  'docs/architecture/TASK-0054-HUMAN-BODY-FIT-APPROVAL.json',
);
const history = await json(
  'build/task-0059-equipment-recovery/current-targets.json',
);
const manifest = await json(
  'docs/architecture/TASK-0054-BAKED-ASSET-MANIFEST.json',
);
const target = history.targets.find((t) => t.id === approved.targetId);
const entry = manifest.assets.find(
  (t) => t.itemId === approved.itemId && t.gender === approved.gender,
);
assert(target && entry);
assert.equal(receipt.humanBodyFitApproved, true);
assert.equal(receipt.reviewStatus, 'HUMAN_BODY_FIT_APPROVED');
assert.equal(receipt.reviewedBy, 'Carlos Faustino');
assert(Number.isFinite(Date.parse(receipt.reviewedAt)));
assert.deepEqual(approved.sourceSize, { width: 1024, height: 1536 });
assert.equal(receipt.itemId, approved.itemId);
assert.equal(receipt.gender, approved.gender);
assert.equal(
  receipt.referenceAvatar.path,
  'apps/web/public' + approved.avatarSource,
);
assert.equal(
  receipt.referenceAvatar.id,
  path.basename(approved.avatarSource).replace('_hd.png', ''),
);
assert.equal(receipt.referenceAvatar.sha256, approved.avatarSha256);
assert.equal(
  hash(await read(receipt.referenceAvatar.path)),
  approved.avatarSha256,
);
assert.equal(receipt.sha256, approved.assetSha256);
assert.equal(hash(await read(target.staging)), approved.assetSha256);
assert.equal(hash(await read(target.source)), receipt.sourceSha256);
assert.equal(
  hash(await read(entry.bakeMetadataPath)),
  receipt.bakeMetadataSha256,
);
assert.equal(
  hash(await read('apps/web/public' + approved.asset)),
  approved.assetSha256,
);
assert.equal(target.technical, 'FIT_PASS');
const decisions = await json(
  'docs/architecture/TASK-0075-HUMAN-VISUAL-DECISIONS.json',
);
const release = await json('docs/architecture/TASK-0075-ACTIVATION-SCOPE.json');
assert.equal(release.task, 'TASK-0075');
assert.equal(release.assets.length, 3);
assert.equal(registry.length, 4);
assert.equal(new Set(registry.map((a) => a.targetId)).size, 4);
assert.deepEqual(registry[0], approved);
const publicAssets = new Map();
const compositionApproval = await json(
  'docs/architecture/FIX-PROD-007-HUMAN-COMPOSITION-APPROVAL.json',
);
assert.equal(compositionApproval.decision, 'VISUALLY_APPROVED');
assert.equal(compositionApproval.userStatement, 'Aprovar composição 3');
for (const key of [
  'approvalId',
  'itemId',
  'avatarSource',
  'avatarSha256',
  'asset',
  'assetSha256',
  'composition',
])
  assert.deepEqual(composition3[key], compositionApproval[key]);
assert.equal(composition3.gender, 'female');
assert.deepEqual(composition3.composition, {
  translateXPercent: -2.5,
  scaleX: 1.05,
});
assert.equal(
  hash(await read('apps/web/public' + composition3.avatarSource)),
  composition3.avatarSha256,
);
assert.equal(composition3.asset, approved.asset);
assert.equal(composition3.assetSha256, approved.assetSha256);
const gripApproval = await json(
  'docs/architecture/FIX-PROD-008-HUMAN-SWORD-GRIP-APPROVAL.json',
);
assert.equal(gripApproval.decision, 'VISUALLY_APPROVED');
assert.equal(
  gripApproval.userStatement,
  'Aprovar esta empunhadura neste corpo',
);
for (const key of [
  'approvalId',
  'itemId',
  'avatarSource',
  'avatarSha256',
  'asset',
  'assetSha256',
  'composition',
  'handClipPath',
])
  assert.deepEqual(grip[key], gripApproval[key]);
assert.equal(grip.avatarSource, composition3.avatarSource);
assert.equal(grip.avatarSha256, composition3.avatarSha256);
assert.equal(
  hash(await read('apps/web/public' + grip.asset)),
  grip.assetSha256,
);
const gripPng = await inspectPng(await read('apps/web/public' + grip.asset));
assert.equal(gripPng.hasAlpha, true);
assert.deepEqual(grip.sourceSize, { width: 1024, height: 1536 });
publicAssets.set(grip.assetSha256, 'apps/web/public' + grip.asset);
for (const a of registry) {
  const t = history.targets.find((t) => t.id === a.targetId);
  assert(t && t.registered && t.technical === 'FIT_PASS');
  assert.equal(a.itemId, t.itemId);
  assert.equal(a.gender, t.gender);
  assert.equal(a.assetSha256, t.sha256);
  assert.equal('apps/web/public' + a.avatarSource, t.avatar);
  assert.equal(hash(await read(t.avatar)), a.avatarSha256);
  assert.equal(hash(await read(t.staging)), a.assetSha256);
  const publicPath = 'apps/web/public' + a.asset;
  assert.equal(hash(await read(publicPath)), a.assetSha256);
  assert.deepEqual(a.sourceSize, { width: 1024, height: 1536 });
  const png = await inspectPng(await read(publicPath));
  assert.equal(png.hasAlpha, true);
  if (a.targetId !== approved.targetId) {
    const scope = release.assets.find((s) => s.id === a.targetId);
    const decision = decisions.decisions.find((d) => d.id === a.targetId);
    assert(scope && decision && decision.decision === 'VISUALLY_APPROVED');
    assert.equal(a.approvalId, 'TASK-0075-HUMAN-VISUAL-DECISIONS');
    for (const bound of [scope, decision]) {
      assert.equal(bound.sha256, a.assetSha256);
      assert.equal(bound.itemId, a.itemId);
      assert.equal(bound.gender, a.gender);
      assert.equal(bound.asset, t.staging);
      assert.equal(bound.avatar.path, t.avatar);
      assert.equal(bound.avatar.sha256, a.avatarSha256);
      assert.equal(hash(await read(t.source)), bound.sourceSha256);
    }
    assert.equal(scope.publicAsset, a.asset);
    assert.equal(hash(await read(scope.fitReport)), scope.fitReportSha256);
    const fit = await json(scope.fitReport);
    assert.equal(fit.status, 'FIT_PASS');
    assert.equal(fit.outputSha256 ?? fit.output?.sha256, a.assetSha256);
    assert.equal(decision.technicalAtReview, 'FIT_PASS');
  }
  publicAssets.set(a.assetSha256, publicPath);
}
const combinations = await json(
  'docs/architecture/TASK-0075-HUMAN-COMBINATION-APPROVAL.json',
);
assert.equal(combinations.task, 'TASK-0075');
assert.equal(combinations.userStatement, 'Aprovo as duas combinações');
assert.equal(combinations.pairs.length, 2);
for (const gender of ['female', 'male']) {
  const pair = combinations.pairs.find((p) => p.gender === gender);
  assert(pair && pair.decision === 'VISUALLY_APPROVED');
  const assets = registry.filter((a) => a.gender === gender);
  assert.equal(assets.length, 2);
  assert.deepEqual(
    pair.assets,
    assets.map((a) => ({ id: a.targetId, sha256: a.assetSha256 })),
  );
  assert.equal(pair.avatar.path, 'apps/web/public' + assets[0].avatarSource);
  assert.equal(pair.avatar.sha256, assets[0].avatarSha256);
}
const privateHashes = new Set();
for (const t of history.targets) {
  privateHashes.add(t.sourceSha256);
  if (!registry.some((a) => a.targetId === t.id)) privateHashes.add(t.sha256);
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
let checked = 0;
const dirs = ['apps/web/public'];
if (process.argv.includes('--artifact')) {
  const dist =
    process.env.RPG_MOBILE_E2E === '1'
      ? 'apps/web/.next/task-0062-mobile'
      : 'apps/web/.next';
  dirs.push(dist + '/static', dist + '/server/app');
}
for (const dir of dirs)
  for await (const p of files(dir)) {
    const b = await read(p),
      sha = hash(b);
    assert(
      !privateHashes.has(sha),
      'Unapproved body-fit art in distributable file: ' + p,
    );
    if (publicAssets.has(sha))
      assert.equal(
        p,
        publicAssets.get(sha),
        'Approved asset copied into unexpected public path',
      );
    assert(
      !/task-007[45].*review|assets-source|body-fit-v3-review\.html/i.test(p),
      'Private gallery/source path published: ' + p,
    );
    if (/\.(?:html|js|json|txt)$/.test(p))
      assert(
        !b.includes(Buffer.from('UNVERIFIED_HUMAN_DECISION_DRAFT')),
        'Private gallery payload published: ' + p,
      );
    checked++;
  }
console.log(
  JSON.stringify({
    gate: 'BODY_FIT_V3_PRODUCTION',
    pass: true,
    exactApprovedRuntimeAssets: registry.length + 1,
    exactApprovedCompositions: registry.length + 2,
    checked,
    pendingAssetsPublished: 0,
  }),
);
