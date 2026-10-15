import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const base = 'build/task-0075-body-fit-final-review';
const read = (p) => readFile(path.join(root, p));
const json = async (p) => JSON.parse(await read(p));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const run = process.argv[2];
assert(run && /^[a-z0-9-]+$/.test(run));
const receipt = await json(`${base}/continuation/${run}-receipt.json`);
assert.equal(receipt.status, 'PASS');
assert.equal(receipt.exitCode, 0);
assert.equal(receipt.production, false);
assert.equal(receipt.stats.unexpected, 0);
assert.equal(receipt.stats.flaky, 0);
assert.deepEqual(receipt.globalErrors, []);
for (const [p, expected] of Object.entries(receipt.sources))
  assert.equal(sha(await read(p)), expected, 'QA source changed: ' + p);
const report = await json(`${base}/${run}.json`);
const records = [];
function visit(suite) {
  for (const spec of suite.specs ?? [])
    for (const test of spec.tests)
      records.push({
        title: spec.title,
        project: test.projectName,
        status: test.status,
        results: test.results.map((r) => r.status),
      });
  for (const child of suite.suites ?? []) visit(child);
}
for (const suite of report.suites) visit(suite);
assert.equal(records.length, 195);
const old = await json(`${base}/e2e-final-failures.json`);
assert.equal(old.records.length, 14);
const formerFailures = old.records.map((record) => {
  const current = records.find(
    (r) => r.title === record.title && r.project === record.project,
  );
  assert(
    current &&
      current.status === 'expected' &&
      current.results.every((s) => s === 'passed'),
    'Former failure not PASS: ' + record.title,
  );
  return {
    file: record.file,
    project: record.project,
    title: record.title,
    result: 'PASS',
    rootCause:
      'See retained historical RCA; PASS does not prove the cause of non-reproduced transport timeouts.',
  };
});
const unit = await json(`${base}/activation/unit-verified.json`);
assert.equal(unit.success, true);
assert.equal(unit.numFailedTests, 0);
assert.equal(unit.numPassedTests, 452);
const security = await json(`${base}/activation/security-and-eligibility.json`);
const smoke = await json(`${base}/activation/local-smoke.json`);
assert.equal(security.status, 'PASS');
assert.deepEqual(security.protectedChanges, []);
assert.deepEqual(security.findings, []);
assert.equal(smoke.pass, true);
assert.equal(smoke.restrictedAudio404, 8);
assert.equal(smoke.approvedAssets.length, 3);
const combinations = await json(
  'docs/architecture/TASK-0075-HUMAN-COMBINATION-APPROVAL.json',
);
for (const pair of combinations.pairs)
  assert.equal(sha(await read(pair.reviewedFile)), pair.reviewedFileSha256);
const result = {
  task: 'TASK-0075',
  scope: 'Three exact authorized assets plus preserved female armor',
  status: 'PASS',
  run,
  stats: receipt.stats,
  unit: { passed: unit.numPassedTests, files: unit.testResults.length },
  formerFailures,
  security: {
    protectedChecked: security.protectedChecked,
    findings: security.findings,
  },
  localSmoke: smoke.pass,
  humanCombinationApproval: 'EXPLICIT_EXACT_PAIR_RECEIPT',
  physicalQAApproved: false,
  liveTwoAccountChatAcceptance: 'NOT_RETESTED',
  notes: [
    'Interrupted/failed diagnostic runs remain retained; no retry or error filtering.',
    'This local acceptance receipt does not claim a production deployment.',
  ],
};
await writeFile(
  path.join(root, `${base}/activation/local-acceptance.json`),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify({ ...result, formerFailures: result.formerFailures.length }),
);
