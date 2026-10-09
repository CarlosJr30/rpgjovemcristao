import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const out = 'build/task-0052b-body-fit-target-validation';
const inventory = JSON.parse(
  await readFile(out + '/target-inventory.json', 'utf8'),
);
const plan = JSON.parse(
  await readFile('docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json', 'utf8'),
).assets;
const errors = [];
for (const target of plan) {
  const asset = inventory.assets.find(
    (entry) => entry.filename === target.filename,
  );
  if (
    !asset ||
    asset.itemId !== target.itemId ||
    asset.gender !== target.gender ||
    asset.slot !== target.slot
  ) {
    errors.push('Target mismatch: ' + target.filename);
    continue;
  }
  if (
    asset.technicalStatus !== 'TECHNICALLY_VALIDATED' ||
    asset.mapping.status !== 'MAPPED' ||
    !asset.manifestHashMatches
  )
    errors.push('Prerequisite failed: ' + asset.filename);
  if (
    !['FIT_PASS', 'FIT_FAIL'].includes(asset.fitResult) ||
    !asset.observations ||
    !asset.assessedAt
  )
    errors.push('Incomplete author fit assessment: ' + asset.filename);
  if (asset.fitResult === 'FIT_FAIL' && asset.fitStatus !== 'NEEDS_REWORK')
    errors.push('Missing rework state: ' + asset.filename);
  if (!asset.referenceAvatar.id.startsWith(asset.gender + '_'))
    errors.push('Wrong reference gender: ' + asset.filename);
  if (asset.humanBodyFitApproved || asset.runtimeReady || asset.readyEligible)
    errors.push('Unapproved promotion: ' + asset.filename);
  const bytes = await readFile(asset.sourcePath);
  if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256)
    errors.push('Changed original: ' + asset.filename);
  for (const evidence of asset.evidence)
    try {
      await stat(out + '/' + evidence);
    } catch {
      errors.push('Missing evidence: ' + evidence);
    }
  if (
    asset.slot === 'boots' &&
    asset.geometry.sourceBottomMinusHDFootBaseline !==
      asset.sourceBoundsAlpha128.bottom - asset.referenceAvatar.footBaseline
  )
    errors.push('Invalid baseline measurement: ' + asset.filename);
}
const result = {
  at: new Date().toISOString(),
  result: errors.length ? 'FAIL' : 'PASS_ASSESSMENT_COMPLETE',
  evaluated: inventory.assets.length,
  fitPass: inventory.assets.filter((a) => a.fitResult === 'FIT_PASS').length,
  fitFail: inventory.assets.filter((a) => a.fitResult === 'FIT_FAIL').length,
  needsRework: inventory.assets.filter((a) => a.fitStatus === 'NEEDS_REWORK')
    .length,
  errors,
  semantics:
    'Validates complete evidence-backed author assessments, not an automated anatomical FIT_PASS',
  humanApproved: 0,
  ready: 0,
};
await writeFile(
  out + '/FIT-CHECK.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result));
if (errors.length) process.exitCode = 1;
