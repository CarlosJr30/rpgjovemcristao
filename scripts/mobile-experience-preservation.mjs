import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(ROOT, 'build/task-0062-mobile-experience');
const baseline = JSON.parse(
  await readFile(path.join(OUT, 'preservation-before.json')),
);
const allowed = new Set([
  '.agent/memory/CURRENT_STATE.md',
  '.gitignore',
  'apps/web/next.config.ts',
  'apps/web/features/auth/auth.module.css',
  'apps/web/features/journey/journey.module.css',
  'apps/web/features/journey/components/diary-experience.module.css',
  'apps/web/features/journey/components/equipment-portal.module.css',
  'apps/web/features/journey/components/guild-experience.module.css',
  'tasks/active/TASK-0062-mobile-experience-responsive-layout.md',
]);
const protectedFiles = [],
  authorizedChanges = [],
  failures = [];
for (const file of baseline.files) {
  let actual;
  try {
    actual = createHash('sha256')
      .update(await readFile(path.join(ROOT, file.path)))
      .digest('hex');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if (allowed.has(file.path)) {
      // The same contract may move to completed only after its documented gates.
      await readFile(
        path.join(ROOT, file.path.replace('tasks/active/', 'tasks/completed/')),
      );
      actual = 'MOVED_TO_COMPLETED';
    } else actual = 'MISSING';
  }
  if (allowed.has(file.path)) {
    if (actual !== file.sha256) authorizedChanges.push(file.path);
  } else {
    if (actual !== file.sha256) failures.push(file.path);
    protectedFiles.push(file.path);
  }
}
const head = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim();
assert.equal(head, baseline.baseCommit, 'HEAD must remain unchanged');
assert.deepEqual(failures, [], 'Changes outside TASK-0062 scope');
const proof = {
  result: 'PASS',
  at: new Date().toISOString(),
  head,
  baselineFiles: baseline.files.length,
  protectedFiles: protectedFiles.length,
  protectedAssets: protectedFiles.filter((p) =>
    p.startsWith('apps/web/public/assets/'),
  ).length,
  protectedTask0059Artifacts: protectedFiles.filter(
    (p) => p.includes('task-0059') || p.includes('TASK-0059'),
  ).length,
  authorizedChanges,
  failures,
  physicalDevice: false,
};
await writeFile(
  path.join(OUT, 'preservation-final.json'),
  JSON.stringify(proof, null, 2) + '\n',
);
console.log(JSON.stringify(proof, null, 2));
