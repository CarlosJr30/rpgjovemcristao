import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const before = JSON.parse(
  await readFile(
    path.join(
      root,
      'build/task-0074-equipment-body-fit-v3/preservation-before.json',
    ),
    'utf8',
  ),
);
const authorized = new Set([
  'apps/web/features/journey/components/avatar-runtime.tsx',
  'apps/web/features/journey/components/equipment-comparison.tsx',
  'apps/web/features/journey/components/equipment-portal.module.css',
  'apps/web/features/journey/data/avatarRuntime.ts',
  'apps/web/features/journey/data/equipmentAssets.ts',
  'apps/web/features/journey/equipment-assets.test.ts',
  'apps/web/features/journey/equipment-v1-files.test.ts',
  'apps/web/features/journey/screens/equipment.tsx',
  'apps/web/package.json',
  'apps/web/next-env.d.ts',
  'tests/e2e/equipment-animation-v2.spec.ts',
  'tests/e2e/attributes.spec.ts',
  'tests/e2e/home.spec.ts',
  '.agent/memory/CURRENT_STATE.md',
  'docs/architecture/EQUIPMENT-MASTER-CHECKLIST-V1.md',
  '.gitignore',
]);
const preserved = [],
  changed = [],
  findings = [];
for (const [p, sha] of Object.entries(before.hashes)) {
  try {
    const current = hash(await readFile(path.join(root, p)));
    if (current === sha) preserved.push(p);
    else {
      changed.push({ path: p, sha256: current });
      if (!authorized.has(p)) findings.push(p);
    }
  } catch {
    findings.push(p + ':missing');
  }
}
const result = {
  base: before.base,
  total: Object.keys(before.hashes).length,
  preserved: preserved.length,
  authorizedChanges: changed,
  unexpectedChanges: findings,
  hdPreserved: preserved.filter(
    (p) =>
      p.startsWith('apps/web/public/assets/avatar/hd/') && p.endsWith('.png'),
  ).length,
  sourcesPreserved: preserved.filter(
    (p) =>
      p.startsWith('assets-source/body-fit-v2-targets/') && p.endsWith('.png'),
  ).length,
  humanReceiptsUntouched: preserved.includes(
    'docs/architecture/TASK-0054-HUMAN-BODY-FIT-APPROVAL.json',
  ),
  pass: findings.length === 0,
};
await writeFile(
  path.join(
    root,
    'build/task-0074-equipment-body-fit-v3/preservation-final.json',
  ),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
if (findings.length) process.exitCode = 1;
