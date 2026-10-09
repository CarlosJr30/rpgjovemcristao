import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import {
  OUTPUT,
  PILOT_SOURCE,
  PILOT_AVATAR,
  sha256,
} from './body-fit-bake.mjs';
import { validatePngChunks } from './body-fit-source-audit.mjs';
import { readyEligibility } from './body-fit-target-audit.mjs';
import { approvalMatches } from './body-fit-bake-approval.mjs';

const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const save = (file, data) =>
  writeFile(file, JSON.stringify(data, null, 2) + '\n');
const meta = await json(OUTPUT + '/fit-metadata.json');
const report = await json(OUTPUT + '/fit-report.json');
let approval = null;
try {
  approval = await json(
    'docs/architecture/TASK-0054-HUMAN-BODY-FIT-APPROVAL.json',
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const approved = approvalMatches(
  approval,
  meta,
  sha256(await readFile(OUTPUT + '/fit-metadata.json')),
);
const ready = readyEligibility({
  technical: 'TECHNICALLY_VALIDATED',
  mapping: 'MAPPED',
  fit: report.status,
  humanBodyFitApproved: approved,
});
for (const [file, copy, expected] of [
  [PILOT_SOURCE, 'source.png', meta.source.sha256],
  [PILOT_AVATAR, 'avatar_base.png', meta.avatar.sha256],
]) {
  if (
    sha256(await readFile(file)) !== expected ||
    sha256(await readFile(OUTPUT + '/' + copy)) !== expected
  )
    throw Error('Reference source/base bytes changed');
}
const bytes = await readFile(OUTPUT + '/baked_overlay.png');
const crc = validatePngChunks(bytes),
  png = await sharp(bytes, { failOn: 'warning' }).metadata();
if (
  bytes[25] !== 6 ||
  png.width !== 1024 ||
  png.height !== 1536 ||
  png.channels !== 4 ||
  !png.hasAlpha
)
  throw Error('Output must be native RGBA PNG');
const actual = sha256(bytes);
if (
  actual !== meta.output.sha256 ||
  actual !== report.output.sha256 ||
  sha256(await readFile(meta.output.path)) !== actual
)
  throw Error('Baked output, receipt or fit assessment hash mismatch');
if (
  report.status !== 'FIT_PASS' ||
  !Object.values(report.regions).every((r) => r.status === 'PASS') ||
  report.ready !== ready ||
  report.humanBodyFitApproved !== approved
)
  throw Error('Pilot fit/review state inconsistent');
if (approved && report.reviewStatus !== 'HUMAN_BODY_FIT_APPROVED')
  throw Error('Approved review status mismatch');
for (const file of [
  'before.png',
  'combined.png',
  'overlay_50_50.png',
  'alignment_guides.png',
]) {
  const image = await sharp(await readFile(OUTPUT + '/' + file)).metadata();
  if (image.width !== 1024 || image.height !== 1536)
    throw Error('Evidence canvas mismatch');
}
const baseline = await json(OUTPUT + '/preservation-before.json'),
  files = [];
for (const entry of baseline.files) {
  const actual = sha256(await readFile(entry.path));
  files.push({
    ...entry,
    actualSha256: actual,
    status: actual === entry.sha256 ? 'PASS' : 'FAIL',
  });
}
const preservation = {
  timestamp: new Date().toISOString(),
  status: files.every((f) => f.status === 'PASS') ? 'PASS' : 'FAIL',
  count: files.length,
  files,
};
await save(OUTPUT + '/preservation-after.json', preservation);
if (preservation.status !== 'PASS')
  throw Error('Protected project files changed');
const result = {
  timestamp: new Date().toISOString(),
  assetStatus: 'TECHNICALLY_VALIDATED',
  integrity: crc,
  output: meta.output,
  fitStatus: report.status,
  reviewStatus: report.reviewStatus,
  humanBodyFitApproved: approved,
  ready,
  runtime: { activated: false, correctiveTransform: false },
  sourcePreserved: true,
  avatarPreserved: true,
  protectedFiles: files.length,
  otherTargetsProcessed: 0,
};
await save(OUTPUT + '/asset-check.json', result);
console.log(JSON.stringify(result));
