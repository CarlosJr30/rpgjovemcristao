import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { OUTPUT } from './body-fit-sword-bake.mjs';
import { sha256 } from './body-fit-bake.mjs';
import { inspectPng } from './body-fit-batch-bake.mjs';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const manifest = await json(
  'docs/architecture/TASK-0056-BAKED-ASSET-MANIFEST.json',
);
const reports = [];
for (const run of [OUTPUT, OUTPUT + '/attempt-02']) {
  const inv = await json(run + '/inventory.json');
  for (const m of inv.assets) {
    const source = await readFile(m.source.path),
      avatar = await readFile(m.avatar.path),
      baked = await readFile(m.output.path);
    const dir = m.output.path.substring(0, m.output.path.lastIndexOf('/')),
      fit = await json(dir + '/fit-report.json'),
      receipt = await json(dir + '/receipt.json');
    assert.equal(sha256(source), m.source.sha256);
    assert.equal(sha256(avatar), m.avatar.sha256);
    assert.equal(sha256(await readFile(m.previous.path)), m.previous.sha256);
    const info = await inspectPng(baked);
    assert.equal(info.sha256, m.output.sha256);
    assert.equal(
      sha256(await readFile(dir + '/avatar_base.png')),
      m.avatar.sha256,
    );
    assert.equal(sha256(await readFile(dir + '/source.png')), m.source.sha256);
    assert.equal(
      receipt.metadataSha256,
      sha256(await readFile(dir + '/fit-metadata.json')),
    );
    assert.equal(
      receipt.reportSha256,
      sha256(await readFile(dir + '/fit-report.json')),
    );
    assert.equal(fit.outputSha256, info.sha256);
    assert.equal(fit.status, 'NEEDS_REWORK');
    assert.equal(fit.actualHandHoldsGrip, false);
    assert.equal(m.runtime.render.transform, 'none');
    for (const r of [m, fit, receipt]) {
      assert.equal(r.ready, false);
      assert.equal(r.humanBodyFitApproved, false);
    }
    assert.equal(m.runtime.activated, false);
    assert.equal(receipt.runtimePath, null);
    assert.equal(
      sha256(await readFile(m.occlusionExperiment.maskPath)),
      m.occlusionExperiment.maskSha256,
    );
    assert.equal(
      sha256(await readFile(m.occlusionExperiment.path)),
      m.occlusionExperiment.sha256,
    );
    assert.equal(m.occlusionExperiment.selectedAsFinal, false);
    assert(
      Math.abs(m.landmarks.root.projected[0] - m.landmarks.tip.projected[0]) <
        1e-8,
    );
    assert(m.landmarks.tip.projected[1] > m.landmarks.root.projected[1]);
    assert(m.landmarks.tip.projected[1] < m.avatar.footBaseline);
    const raw = await sharp(source).raw().toBuffer(),
      a = (m.transform.rotation * Math.PI) / 180,
      c = Math.cos(a),
      s = Math.sin(a),
      t = m.transform;
    let clipped = 0;
    for (let y = 0; y < 1536; y++)
      for (let x = 0; x < 1024; x++)
        if (raw[(y * 1024 + x) * 4 + 3] >= 128) {
          const dx = t.translateX + t.scale * (c * (x + 0.5) - s * (y + 0.5)),
            dy = t.translateY + t.scale * (s * (x + 0.5) + c * (y + 0.5));
          if (dx < 0 || dx >= 1024 || dy < 0 || dy >= 1536) clipped++;
        }
    assert.equal(clipped, 0);
    for (const e of fit.evidence) {
      const bytes = await readFile(e.path),
        image = await sharp(bytes, { failOn: 'warning' }).metadata();
      assert.equal(sha256(bytes), e.sha256);
      assert.equal(image.width, e.width);
      assert.equal(image.height, e.height);
    }
    reports.push({
      id: m.id,
      attempt: run.endsWith('attempt-02') ? 2 : 1,
      technical: 'PASS',
      fit: fit.status,
      sha256: info.sha256,
      clippedAlpha128SourcePixels: clipped,
      bladeAxisDeltaX:
        m.landmarks.tip.projected[0] - m.landmarks.root.projected[0],
      tip: m.landmarks.tip.projected,
      evidenceFiles: fit.evidence.length,
    });
  }
}
assert.equal(manifest.counts.FIT_PASS, 0);
assert.equal(manifest.counts.NEEDS_REWORK, 4);
assert.equal(manifest.counts.READY, 0);
const snapshot = await json(OUTPUT + '/preservation-before.json'),
  allowed = ['scripts/body-fit-bake.mjs', 'scripts/body-fit-sword-inspect.mjs'],
  files = [];
for (const f of snapshot.files) {
  const actual = sha256(await readFile(f.path));
  if (!allowed.includes(f.path))
    assert.equal(actual, f.sha256, 'Protected file changed: ' + f.path);
  files.push({
    ...f,
    actual,
    status:
      actual === f.sha256
        ? 'UNCHANGED'
        : 'AUTHORIZED_PIPELINE_OR_INSPECTION_CHANGE',
  });
}
assert.equal(
  files.filter((f) => f.path.startsWith('apps/web/public/assets/avatar/hd/'))
    .length,
  54,
);
await writeFile(
  OUTPUT + '/preservation-after.json',
  JSON.stringify(
    {
      status: 'PASS',
      checked: files.length,
      unchanged: files.filter((f) => f.status === 'UNCHANGED').length,
      files,
    },
    null,
    2,
  ) + '\n',
);
const result = {
  task: 'TASK-0056',
  technicalStatus: 'PASS',
  acceptance: 'FAIL_OPEN_HAND_REQUIRES_REWORK',
  counts: manifest.counts,
  reports,
  preservation: {
    checked: files.length,
    unchanged: files.filter((f) => f.status === 'UNCHANGED').length,
    authorizedChanged: files
      .filter((f) => f.status !== 'UNCHANGED')
      .map((f) => f.path),
    avatars: 54,
    originalsPreserved: true,
    oldCandidatesPreserved: true,
    runtimePreserved: true,
  },
};
await writeFile(
  OUTPUT + '/asset-validation.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    technical: result.technicalStatus,
    acceptance: result.acceptance,
    preservation: result.preservation,
  }),
);
