import { createHash } from 'node:crypto';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { validatePngChunks } from './body-fit-source-audit.mjs';
import { readyEligibility } from './body-fit-target-audit.mjs';

const output = 'build/task-0053-body-fit-pilot';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const save = (file, data) =>
  writeFile(file, JSON.stringify(data, null, 2) + '\n');
const landmarks = await json(`${output}/landmarks.json`);
const target = (
  await json('docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json')
).assets.find(
  (entry) => entry.filename === 'armor_traveler_uncommon_female_v2.png',
);
if (!target || target.gender !== 'female')
  throw Error('Pilot target binding invalid');
const attempts = [];
for (let number = 1; number <= 4; number++) {
  const folder = `${output}/attempt-${number}`;
  const receipt = await json(`${folder}/technical-receipt.json`);
  if (receipt.generatedAt) {
    receipt.validatedAt = receipt.generatedAt;
    delete receipt.generatedAt;
  }
  const assessment = await json(`${folder}/fit_report.json`);
  const bytes = await readFile(`${folder}/overlay_candidate.png`);
  validatePngChunks(bytes);
  const meta = await sharp(bytes, { failOn: 'warning' }).metadata();
  const { data, info } = await sharp(bytes, { failOn: 'warning' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (
    meta.format !== 'png' ||
    info.width !== 1024 ||
    info.height !== 1536 ||
    !meta.hasAlpha
  )
    throw Error(`Attempt ${number}: invalid native asset`);
  if (
    hash(bytes) !== receipt.sha256 ||
    hash(await readFile(receipt.generatorFile)) !== receipt.sha256
  )
    throw Error(`Attempt ${number}: generated candidate changed`);
  const diskCoverage = {};
  for (const [name, radius] of [
    ['neck_center', 35],
    ['left_hand_clearance', 45],
    ['right_hand_clearance', 45],
  ]) {
    const [cx, cy] = landmarks.points[name];
    let pixels = 0,
      coveredAlpha128 = 0;
    for (let y = cy - radius; y <= cy + radius; y++)
      for (let x = cx - radius; x <= cx + radius; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2) continue;
        pixels++;
        if (data[(y * info.width + x) * 4 + 3] >= 128) coveredAlpha128++;
      }
    diskCoverage[name] = { radius, pixels, coveredAlpha128 };
  }
  const regionValues = Object.values(assessment.regions);
  const derivedFit = regionValues.every((r) => r.status === 'PASS')
    ? 'FIT_PASS'
    : 'FIT_FAIL';
  if (
    assessment.fitStatus !== derivedFit ||
    receipt.status !== 'TECHNICALLY_VALIDATED'
  )
    throw Error(`Attempt ${number}: inconsistent classification`);
  const eligible = readyEligibility({
    technical: receipt.status,
    mapping: 'MAPPED',
    fit: derivedFit,
    humanBodyFitApproved: false,
  });
  if (eligible || assessment.ready || assessment.humanBodyFitApproved)
    throw Error('Unexpected approval or READY');
  receipt.fitStatus = derivedFit;
  receipt.finalStatus = assessment.finalStatus;
  receipt.mapping = { status: 'MAPPED', target };
  receipt.clearanceDiagnostics = diskCoverage;
  await save(`${folder}/technical-receipt.json`, receipt);
  await save(`${folder}/fit_report.json`, {
    ...assessment,
    technical: receipt,
    landmarks,
  });
  for (const file of [
    'combined.png',
    'overlay_50_50.png',
    'alignment_guides.png',
  ]) {
    const evidence = await sharp(
      await readFile(`${folder}/${file}`),
    ).metadata();
    if (evidence.width !== 1024 || evidence.height !== 1536)
      throw Error('Evidence canvas changed');
  }
  const lab = await json(`${folder}/lab-checks.json`);
  if (lab.status !== 'PASS' || lab.checks.length !== 6)
    throw Error('Incomplete DEV lab verification');
  attempts.push({
    attempt: number,
    technicalStatus: receipt.status,
    fitStatus: derivedFit,
    finalStatus: assessment.finalStatus,
    sha256: receipt.sha256,
    bboxAlpha128: receipt.bboxAlpha128,
    clearanceDiagnostics: diskCoverage,
    regions: assessment.regions,
  });
}
const baseline = await json(`${output}/preservation-before.json`);
const after = [];
for (const entry of baseline.files) {
  const actual = hash(await readFile(entry.path));
  after.push({
    ...entry,
    actualSha256: actual,
    status: actual === entry.sha256 ? 'PASS' : 'FAIL',
  });
}
await save(`${output}/preservation-after.json`, {
  timestamp: new Date().toISOString(),
  status: after.every((e) => e.status === 'PASS') ? 'PASS' : 'FAIL',
  count: after.length,
  files: after,
});
if (after.some((e) => e.status === 'FAIL'))
  throw Error('Protected project files changed');
for (const file of [
  'overlay_candidate.png',
  'combined.png',
  'overlay_50_50.png',
  'alignment_guides.png',
])
  await copyFile(`${output}/attempt-4/${file}`, `${output}/${file}`);
const report = {
  task: 'TASK-0053',
  timestamp: new Date().toISOString(),
  status: 'REWORK',
  pilotStatus: 'NEEDS_REWORK',
  stopReason: 'GENERATION_LIMIT_REACHED; native geometry method not validated',
  selectedAttempt: 4,
  selectionPurpose:
    'Closest candidate for diagnostic comparison only; not a passed candidate',
  references: {
    hd: {
      path: 'apps/web/public/assets/avatar/hd/female/female_short_moss_medium_hd.png',
      sha256: hash(await readFile(`${output}/avatar_base.png`)),
    },
    aesthetic: {
      path: 'assets-source/body-fit-v2-targets/armor_traveler_uncommon_female_v2.png',
      sha256: hash(await readFile(`${output}/source_reference.png`)),
    },
  },
  landmarks,
  attempts,
  counts: {
    attempts: 4,
    technicallyValidated: 4,
    fitPass: attempts.filter((a) => a.fitStatus === 'FIT_PASS').length,
    fitFail: attempts.filter((a) => a.fitStatus === 'FIT_FAIL').length,
    needsRework: attempts.filter((a) => a.finalStatus === 'NEEDS_REWORK')
      .length,
    humanBodyFitReviewPending: 0,
    humanBodyFitApproved: 0,
    ready: 0,
    otherAssetsGenerated: 0,
  },
  preservation: { status: 'PASS', count: after.length },
  limitations: [
    'Landmarks measured manually approximately ±12px, not copied alpha or runtime anchors',
    'Fit classifications are visual QA by author, not human approval or independent review',
    'Schematic guides are generation references, never corrected final equipment',
  ],
};
await save(`${output}/fit_report.json`, report);
const cards = attempts
  .map(
    (a) =>
      `<section><h2>Tentativa ${a.attempt} — ${a.finalStatus}</h2><a href="../attempt-${a.attempt}/index.html">Abrir seis vistas / zoom nativo / fit report</a><p><img width="360" height="540" src="../attempt-${a.attempt}/combined.png" alt="Composição sem correção da tentativa ${a.attempt}"></p><code>${a.sha256}</code></section>`,
  )
  .join('');
await writeFile(
  `${output}/review/index.html`,
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>TASK-0053 — Geometry-Locked Pilot Review</title><style>body{background:#17202a;color:#fff;font:16px system-ui;margin:24px}a{color:#9ef}main{display:flex;flex-wrap:wrap;gap:24px}section{width:380px}code{overflow-wrap:anywhere}pre{white-space:pre-wrap}</style><h1>TASK-0053 — NEEDS_REWORK</h1><p>Quatro tentativas; técnica4/4, FIT_PASS0. DEV-only. Sem aprovação humana, READY ou geração dos outros15.</p><p>A tentativa4 é a mais próxima, mas cintura baixa e peito plano ainda impedem método validado. Composições em canvas comum, sem transformações corretivas. Cada tentativa tem source/base/candidato/combinado/50%/guides.</p><a href="../fit_report.json">Fit report agregado e landmarks</a> · <a href="../preservation-after.json">Preservação281/281</a><main>${cards}</main></html>`,
);
console.log(
  JSON.stringify({
    status: 'VALIDATION_PIPELINE_PASS; PILOT_FIT_FAIL',
    ...report.counts,
    preservation: report.preservation,
  }),
);
