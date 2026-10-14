import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
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
const { APPROVED_BODY_FIT_V3: approved } = await import(
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
const privateHashes = new Set();
for (const t of history.targets) {
  privateHashes.add(t.sourceSha256);
  if (t.id !== approved.targetId) privateHashes.add(t.sha256);
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
    if (sha === approved.assetSha256)
      assert.equal(
        p,
        'apps/web/public' + approved.asset,
        'Approved asset copied into unexpected public path',
      );
    assert(
      !/task-0074.*review|assets-source|body-fit-v3-review\.html/i.test(p),
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
    exactApprovedRuntimeAssets: 1,
    checked,
    pendingAssetsPublished: 0,
  }),
);
