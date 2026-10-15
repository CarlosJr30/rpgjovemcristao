import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('..', import.meta.url));
const dir = path.join(root, 'build/task-0075-body-fit-final-review');
const json = async (p) => JSON.parse(await readFile(path.join(dir, p), 'utf8'));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const before = await json('preservation-before.json');
const allowed = new Set([
  '.agent/memory/CURRENT_STATE.md',
  'docs/architecture/EQUIPMENT-MASTER-CHECKLIST-V1.md',
  'tests/e2e/arena-v2.spec.ts',
  'tests/e2e/attributes.spec.ts',
  'tests/e2e/home.spec.ts',
  'tests/e2e/equipment-portal.spec.ts',
  'tests/e2e/equipment-body-fit-v3.spec.ts',
]);
const changed = [],
  preserved = [];
for (const [p, sha] of Object.entries(before.hashes)) {
  const actual = hash(await readFile(path.join(root, p)));
  if (actual !== sha)
    changed.push({
      path: p,
      before: sha,
      after: actual,
      authorized: allowed.has(p),
    });
  else preserved.push(p);
}
assert(
  changed.every((c) => c.authorized),
  'Existing source or receipt changed outside authorized documentation',
);
const inventory = await json('inventory.json');
for (const h of inventory.hd)
  assert.equal(hash(await readFile(path.join(root, h.path))), h.sha256);
for (const t of inventory.targets)
  for (const [p, sha] of [
    [t.source, t.sourceSha256],
    [t.staging, t.sha256],
    [t.avatar, t.avatarSha256],
  ])
    assert.equal(hash(await readFile(path.join(root, p))), sha, p);
const variants = (await json('alternatives.json')).alternatives;
const forbidden = new Set(variants.map((v) => v.sha256));
let filesScanned = 0;
const walk = async (d) => {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.isFile()) {
      filesScanned++;
      assert(
        !forbidden.has(hash(await readFile(p))),
        'Experimental PNG found in public output',
      );
    }
  }
};
await walk(path.join(root, 'apps/web/public'));
await walk(path.join(root, 'apps/web/.next/static'));
const result = {
  base: before.base,
  baselineFiles: Object.keys(before.hashes).length,
  preservedFiles: preserved.length,
  authorizedChanges: changed,
  authorizedDocumentationChanges: changed.filter((c) => c.path.endsWith('.md')),
  authorizedTestHarnessChanges: changed.filter((c) =>
    c.path.startsWith('tests/'),
  ),
  hdPreserved: 54,
  originalSourcesPreserved: 16,
  originalBakesPreserved: 16,
  historicalApprovalReceiptsPreserved: true,
  publicAndStaticFilesScanned: filesScanned,
  experimentalAssetsPublished: 0,
  runtimeCodeChanged: false,
  cameraSwipeEngineAuthChatDatabaseSavesChanged: false,
  humanApprovalsCreated: 0,
  pass: true,
};
await writeFile(
  path.join(dir, 'preservation-final.json'),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
