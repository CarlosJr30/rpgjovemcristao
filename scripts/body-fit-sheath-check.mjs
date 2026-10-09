import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { OUTPUT, sheathState } from './body-fit-sheath-diagnostic.mjs';
import { sha256 } from './body-fit-bake.mjs';
import { inspectPng } from './body-fit-batch-bake.mjs';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const manifest = await json(
    'docs/architecture/TASK-0057-SHEATH-ASSET-MANIFEST.json',
  ),
  checks = [];
for (const m of manifest.assets) {
  const source = await readFile(m.source.path),
    avatar = await readFile(m.avatar.path),
    bytes = await readFile(m.diagnostic.output.path),
    report = await json(m.report),
    receipt = await json(m.receipt);
  assert.equal(sha256(source), m.source.sha256);
  assert.equal(sha256(avatar), m.avatar.sha256);
  assert.equal(
    sha256(await readFile(m.previousCandidate.path)),
    m.previousCandidate.sha256,
  );
  const info = await inspectPng(bytes);
  assert.equal(info.sha256, m.diagnostic.output.sha256);
  assert.equal(receipt.metadataSha256, sha256(await readFile(m.metadata)));
  assert.equal(receipt.reportSha256, sha256(await readFile(m.report)));
  assert.equal(
    m.status,
    sheathState({
      sheathPresent: false,
      supportPresent: false,
      fitReviewed: false,
    }),
  );
  for (const r of [m, report, receipt]) {
    assert.equal(r.ready, false);
    assert.equal(r.humanBodyFitApproved, false);
    assert.equal(r.runtimeActivated, false);
    assert.equal(r.runtimePath, null);
  }
  assert.equal(m.finalSheathedOutput, null);
  assert.equal(m.finalSheathedSha256, null);
  assert.equal(m.finalSheathedTransform, null);
  assert.equal(report.fixationVerified, false);
  const root = m.diagnostic.landmarks.root.projected,
    tip = m.diagnostic.landmarks.tip.projected,
    grip = m.diagnostic.landmarks.grip.projected,
    guard = m.diagnostic.landmarks.guard.projected;
  assert(Math.abs(root[0] - tip[0]) < 1e-8);
  assert(tip[1] > root[1]);
  assert(grip[1] < guard[1]);
  assert.equal(m.diagnostic.render.transform, 'none');
  const raw = await sharp(source).raw().toBuffer(),
    t = m.diagnostic.transform,
    a = (t.rotation * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  let clipped = 0;
  for (let y = 0; y < 1536; y++)
    for (let x = 0; x < 1024; x++)
      if (raw[(y * 1024 + x) * 4 + 3] >= 128) {
        const dx = t.translateX + t.scale * (c * (x + 0.5) - s * (y + 0.5)),
          dy = t.translateY + t.scale * (s * (x + 0.5) + c * (y + 0.5));
        if (dx < 0 || dx >= 1024 || dy < 0 || dy >= 1536) clipped++;
      }
  assert.equal(clipped, 0);
  for (const e of report.evidence) {
    const b = await readFile(e.path),
      meta = await sharp(b).metadata();
    assert.equal(sha256(b), e.sha256);
    assert.equal(meta.width, e.width);
    assert.equal(meta.height, e.height);
  }
  checks.push({
    id: m.id,
    diagnosticPng: 'PASS',
    diagnosticSha256: info.sha256,
    orientation: 'DOWN_BLADE_UP_GRIP',
    clippedAlpha128SourcePixels: clipped,
    fixation: 'FAIL_MISSING_SUPPORT',
    sheath: 'FAIL_MISSING_ART',
    status: m.status,
    finalSheathedSha256: null,
  });
}
const snapshot = await json(OUTPUT + '/preservation-before.json'),
  files = [];
for (const f of snapshot.files) {
  const actual = sha256(await readFile(f.path));
  assert.equal(actual, f.sha256, 'Protected file changed: ' + f.path);
  files.push({ ...f, actual, status: 'PASS' });
}
assert.equal(
  files.filter((f) => f.path.startsWith('apps/web/public/assets/avatar/hd/'))
    .length,
  54,
);
await writeFile(
  OUTPUT + '/preservation-after.json',
  JSON.stringify({ status: 'PASS', total: files.length, files }, null, 2) +
    '\n',
);
const result = {
  task: 'TASK-0057',
  technicalDiagnostic: 'PASS',
  acceptance: 'FAIL_NEEDS_NEW_SHEATH_ART',
  counts: manifest.counts,
  checks,
  preservation: {
    status: 'PASS',
    unchanged: files.length,
    total: files.length,
    hd: 54,
    oldCandidates: true,
    otherEquipment: true,
    runtime: true,
  },
};
await writeFile(
  OUTPUT + '/asset-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    diagnostics: checks.length,
    preservation: files.length,
    counts: manifest.counts,
    acceptance: result.acceptance,
  }),
);
