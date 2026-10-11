import assert from 'node:assert/strict';
import { readFile, readdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(
  new URL('../build/task-0064-mobile-game-mode/', import.meta.url),
);
const records = [];
for (const file of await readdir(out)) {
  if (!file.endsWith('.json')) continue;
  const report = JSON.parse(await readFile(path.join(out, file), 'utf8'));
  if (!report.suites || !report.stats) continue;
  const visit = (suite, prefix = []) => {
    const titles = [...prefix, suite.title];
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests)
        records.push({
          key: [spec.file, ...titles, spec.title, test.projectName].join('|'),
          file: spec.file,
          title: spec.title,
          project: test.projectName,
          status: test.results.at(-1)?.status ?? test.status,
          started: report.stats.startTime,
          source: file,
        });
    }
    for (const child of suite.suites ?? []) visit(child, titles);
  };
  for (const suite of report.suites) visit(suite);
}
records.sort((a, b) => new Date(a.started) - new Date(b.started));
const accepted = [
  ...new Map(records.map((record) => [record.key, record])).values(),
];
const failures = accepted.filter(
  (record) => !['passed', 'skipped'].includes(record.status),
);
const html = await readFile(path.join(out, 'review/index.html'), 'utf8');
const links = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(
  (match) => match[1],
);
for (const link of links) await access(path.resolve(out, 'review', link));
const receipt = {
  scope: 'Local emulation only; physical device and publication pending',
  pass: failures.length === 0,
  passed: accepted.filter((record) => record.status === 'passed').length,
  skipped: accepted.filter((record) => record.status === 'skipped').length,
  failures,
  accepted,
  galleryLinksVerified: links.length,
  historicalRunsRetained: true,
};
await writeFile(
  path.join(out, 'qa-acceptance.json'),
  JSON.stringify(receipt, null, 2),
);
assert(receipt.pass, JSON.stringify(failures));
console.log(JSON.stringify({ ...receipt, accepted: undefined }));
