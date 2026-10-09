import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import {
  OUTPUT,
  PILOT,
  inspectPng,
  validateBatchSettings,
} from './body-fit-batch-bake.mjs';
import { sha256, projectPoint, validateTransform } from './body-fit-bake.mjs';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const inventory = await json(OUTPUT + '/inventory.json');
const plan = (await json('docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json'))
  .assets;
const settings = await json(OUTPUT + '/settings.json');
validateBatchSettings(settings, plan);
assert.equal(inventory.assets.length, 15);
assert(!inventory.assets.some((a) => a.filename === PILOT));
const reports = [];
for (const a of inventory.assets) {
  const dir = OUTPUT + '/' + a.id,
    meta = await json(dir + '/fit-metadata.json'),
    fit = await json(dir + '/fit-report.json'),
    receipt = await json(dir + '/receipt.json');
  const expected = plan.find((t) => t.filename === a.filename);
  const source = await readFile(meta.source.path),
    avatar = await readFile(meta.avatar.path),
    baked = await readFile(meta.output.path);
  const sourceInfo = await inspectPng(source),
    info = await inspectPng(baked);
  assert.equal(sourceInfo.sha256, a.sourceSha256);
  assert.equal(info.sha256, a.sha256);
  assert.equal(meta.output.path, dir + '/' + a.id + '_baked.png');
  assert.equal(
    meta.source.path,
    'assets-source/body-fit-v2-targets/' + expected.filename,
  );
  assert.equal(
    meta.avatar.path,
    'apps/web/public' + expected.referenceAvatar.source,
  );
  assert.equal(sha256(avatar), expected.referenceAvatar.sha256);
  assert.equal(meta.gender, expected.gender);
  assert.equal(meta.slot, expected.slot);
  assert.equal(meta.itemId, expected.itemId);
  assert.equal(sha256(await readFile(dir + '/baked_overlay.png')), a.sha256);
  assert.equal(sha256(await readFile(dir + '/source.png')), a.sourceSha256);
  assert.equal(
    sha256(await readFile(dir + '/avatar_base.png')),
    meta.avatar.sha256,
  );
  assert.equal(
    sha256(await readFile(dir + '/fit-metadata.json')),
    a.metadataSha256,
  );
  assert.equal(fit.outputSha256, a.sha256);
  assert.equal(fit.status, a.fitStatus);
  assert(['FIT_PASS', 'NEEDS_REWORK'].includes(fit.status));
  for (const record of [a, meta, fit, receipt]) {
    assert.equal(record.humanBodyFitApproved, false);
    assert.equal(record.ready, false);
  }
  assert.equal(meta.runtime.activated, false);
  assert.equal(receipt.runtimePath, null);
  assert.equal(fit.runtimeActivated, false);
  assert.equal(meta.pipeline.mask, 'NONE');
  assert.equal(meta.pipeline.warp, 'NONE');
  assert.equal(meta.pipeline.uniform, true);
  assert.equal(meta.runtime.render.transform, 'none');
  assert.equal(
    fit.reviewStatus,
    fit.status === 'FIT_PASS'
      ? 'HUMAN_BODY_FIT_REVIEW_PENDING'
      : 'NEEDS_REWORK',
  );
  const t = validateTransform(meta.transform),
    s = settings.find((s) => s.filename === a.filename);
  assert.deepEqual(meta.landmarks, s.landmarks);
  for (const [name, p] of Object.entries(meta.landmarkResiduals))
    assert.deepEqual(p.projected, projectPoint(p.source, t), name);
  const raw = await sharp(source).raw().toBuffer();
  let clippedAlpha128SourcePixels = 0;
  const angle = (t.rotation * Math.PI) / 180,
    c = Math.cos(angle),
    sn = Math.sin(angle);
  for (let y = 0; y < 1536; y++)
    for (let x = 0; x < 1024; x++)
      if (raw[(y * 1024 + x) * 4 + 3] >= 128) {
        const px = t.translateX + t.scale * (c * (x + 0.5) - sn * (y + 0.5)),
          py = t.translateY + t.scale * (sn * (x + 0.5) + c * (y + 0.5));
        if (px < 0 || px >= 1024 || py < 0 || py >= 1536)
          clippedAlpha128SourcePixels++;
      }
  // Technical PNG validity is separate from body fit: clipped art can never PASS.
  if (fit.status === 'FIT_PASS')
    assert.equal(
      clippedAlpha128SourcePixels,
      0,
      'Visible art clipped on FIT_PASS',
    );
  for (const p of fit.evidence) {
    const bytes = await readFile(p);
    const evidence = await sharp(bytes, { failOn: 'warning' }).metadata();
    assert.equal(evidence.width, 1024);
    assert.equal(evidence.height, 1536);
  }
  const result = {
    id: a.id,
    status: 'PASS',
    technical: 'TECHNICALLY_VALIDATED',
    mapping: 'MAPPED',
    fitStatus: fit.status,
    sha256: a.sha256,
    clippedAlpha128SourcePixels,
    alpha128Bounds: info.alpha128Bounds,
    footBaselineDelta:
      a.slot === 'boots'
        ? info.alpha128Bounds.bottom - meta.avatar.footBaseline
        : null,
    maxLandmarkResidual: Math.max(
      ...Object.values(meta.landmarkResiduals).map((p) => p.distance),
    ),
    humanBodyFitApproved: false,
    ready: false,
    runtimeActivated: false,
  };
  reports.push(result);
  await writeFile(
    dir + '/asset-check.json',
    JSON.stringify(result, null, 2) + '\n',
  );
}
const before = await json(OUTPUT + '/preservation-before.json');
const files = [];
for (const f of before.files) {
  const actual = sha256(await readFile(f.path));
  assert.equal(actual, f.sha256, 'Protected file changed: ' + f.path);
  files.push({ ...f, actual, status: 'PASS' });
}
await writeFile(
  OUTPUT + '/preservation-after.json',
  JSON.stringify(
    {
      at: new Date().toISOString(),
      status: 'PASS',
      total: files.length,
      files,
    },
    null,
    2,
  ) + '\n',
);
const result = {
  task: 'TASK-0055',
  at: new Date().toISOString(),
  status: 'PASS',
  technicalValidated: 15,
  mapped: 15,
  counts: inventory.counts,
  reports,
  preservation: files.length,
  pilotUnchanged: true,
  scope: 'STAGING_ONLY; no READY, human approval or runtime activation',
};
await writeFile(
  OUTPUT + '/asset-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    status: result.status,
    counts: result.counts,
    preservation: result.preservation,
    clipping: reports
      .filter((r) => r.clippedAlpha128SourcePixels)
      .map((r) => [r.id, r.clippedAlpha128SourcePixels]),
  }),
);
