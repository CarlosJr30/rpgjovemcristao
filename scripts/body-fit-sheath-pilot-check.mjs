import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { bakeSwordBytes, sha256 } from './body-fit-bake.mjs';
import { inspectPng } from './body-fit-batch-bake.mjs';
import {
  OUTPUT,
  AVATAR,
  SWORD,
  retainHilt,
  occludeArm,
} from './body-fit-sheath-pilot-bake.mjs';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const results = [];
for (const attempt of ['attempt-01', 'attempt-02', 'attempt-03']) {
  const dir = OUTPUT + '/baked/' + attempt,
    m = await json(dir + '/bake-metadata.json');
  const sword = await readFile(SWORD),
    avatar = await readFile(AVATAR),
    sheath = await readFile(m.sheathSource.path);
  assert.equal(sha256(sword), m.originalSword.sha256);
  assert.equal(sha256(avatar), m.avatar.sha256);
  assert.equal(sha256(sheath), m.sheathSource.sha256);
  const hilt = await retainHilt(
    await bakeSwordBytes(sword, m.transforms.sword),
    m.settings.guard,
    m.transforms.sword.rotation,
    m.hilt.cutAxialLimit,
  );
  assert.equal(sha256(hilt.bytes), m.hilt.sha256);
  const leather = await bakeSwordBytes(sheath, m.transforms.sheath);
  const raw = await sharp(leather)
    .composite([{ input: hilt.bytes }])
    .png()
    .toBuffer();
  const reproduced = await occludeArm(raw, avatar, m.settings.maskMethod);
  assert.equal(sha256(reproduced.bytes), m.output.sha256);
  assert.equal(sha256(reproduced.mask), m.mask.sha256);
  const info = await inspectPng(await readFile(m.output.path));
  assert.equal(info.sha256, m.output.sha256);
  assert(m.landmarks.sheathTip[1] > m.landmarks.throat[1]);
  assert(m.landmarks.swordGrip[1] < m.landmarks.throat[1]);
  assert(m.landmarks.sheathTip[1] < 1495);
  assert.equal(m.runtime.transform, 'none');
  for (const [source, t] of [
    [sheath, m.transforms.sheath],
    [sword, m.transforms.sword],
  ]) {
    const rawSource = await sharp(source).ensureAlpha().raw().toBuffer(),
      a = (t.rotation * Math.PI) / 180;
    let clipped = 0;
    for (let y = 0; y < 1536; y++)
      for (let x = 0; x < 1024; x++)
        if (rawSource[(y * 1024 + x) * 4 + 3] >= 128) {
          const px =
              t.translateX + t.scale * (Math.cos(a) * x - Math.sin(a) * y),
            py = t.translateY + t.scale * (Math.sin(a) * x + Math.cos(a) * y);
          if (px < 0 || px >= 1024 || py < 0 || py >= 1536) clipped++;
        }
    assert.equal(clipped, 0);
  }
  const fit = await json(dir + '/fit-report.json');
  assert.equal(fit.outputSha256, info.sha256);
  for (const obj of [m, fit]) {
    assert.equal(obj.ready, false);
    assert.equal(obj.humanBodyFitApproved, false);
  }
  results.push({
    attempt,
    png: 'PASS',
    reproducedBakeSha: 'PASS',
    alpha128SourceClipping: 0,
    fit: fit.status,
    sha256: info.sha256,
  });
}
const dir = OUTPUT + '/baked/attempt-03',
  fit = await json(dir + '/fit-report.json'),
  receipt = await json(dir + '/receipt.json');
assert.equal(
  receipt.metadataSha256,
  sha256(await readFile(dir + '/bake-metadata.json')),
);
assert.equal(
  receipt.reportSha256,
  sha256(await readFile(dir + '/fit-report.json')),
);
assert.equal(fit.humanReviewStatus, 'HUMAN_BODY_FIT_REVIEW_PENDING');
for (const e of fit.evidence) {
  const bytes = await readFile(e.path),
    info = await sharp(bytes).metadata();
  assert.equal(sha256(bytes), e.sha256);
  assert.equal(info.width, e.width);
  assert.equal(info.height, e.height);
}
const before = await json(OUTPUT + '/preservation-before.json'),
  checks = [];
for (const f of before.files)
  checks.push({
    path: f.path,
    unchanged: sha256(await readFile(f.path)) === f.sha256,
  });
assert(
  checks.every((f) => f.unchanged),
  'A protected file changed',
);
await writeFile(
  OUTPUT + '/preservation-after.json',
  JSON.stringify(
    {
      files: checks.length,
      unchanged: checks.filter((f) => f.unchanged).length,
      checks,
    },
    null,
    2,
  ),
);
await writeFile(
  OUTPUT + '/asset-validation.json',
  JSON.stringify(
    {
      results,
      evidence: fit.evidence.length,
      preserved: checks.length,
      hdFiles: checks.filter((f) => /\/avatar\/hd\/.*\.png$/.test(f.path))
        .length,
      technical: 'PASS',
      visualClassificationByAuthor: fit.status,
      runtimeActivated: false,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    results,
    preserved: checks.length,
    evidence: fit.evidence.length,
  }),
);
