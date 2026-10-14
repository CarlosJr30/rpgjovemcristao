import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const base = JSON.parse(
  await readFile(
    path.join(
      root,
      'build/task-0073-mobile-gameplay-exploration/before/chromium/preservation.json',
    ),
    'utf8',
  ),
);
const authorized = new Set([
  '.gitignore',
  'apps/web/features/journey/components/garden-exploration.tsx',
  'apps/web/features/journey/components/snake-chase-game.tsx',
  'apps/web/features/journey/components/snake-mobile.module.css',
  'apps/web/features/journey/journey.module.css',
  'apps/web/features/journey/screens/phase.tsx',
  'apps/web/features/journey/snake-chase-game.test.tsx',
  'tests/e2e/arena.spec.ts',
  'tests/e2e/audit-corrections.spec.ts',
  'tests/e2e/avatar-hd-activation.spec.ts',
  'tests/e2e/home.spec.ts',
  'tests/e2e/serpent-mobile-v2.spec.ts',
  'tests/e2e/snake-playthrough.spec.ts',
  'tests/e2e/snake-responsive.spec.ts',
  '.agent/memory/CURRENT_STATE.md',
]);
let preserved = 0;
const changed = [],
  unexpected = [];
for (const [file, expected] of Object.entries(base.hashes)) {
  // Generated route type imports are not a protected runtime asset.
  if (file === 'apps/web/next-env.d.ts') continue;
  let actual;
  try {
    actual = createHash('sha256')
      .update(await readFile(path.join(root, file)))
      .digest('hex');
  } catch {
    actual = null;
  }
  if (actual === expected) preserved++;
  else (authorized.has(file) ? changed : unexpected).push(file);
}
const engineFile = 'apps/web/features/journey/components/snake-chase-game.tsx';
const original = execFileSync('git', ['show', `${base.base}:${engineFile}`], {
  cwd: root,
})
  .toString()
  .replaceAll('\r\n', '\n');
const current = (
  await readFile(path.join(root, engineFile), 'utf8')
).replaceAll('\r\n', '\n');
const engineStart = '  useEffect(() => {\n    const element = canvas.current;';
const engineEnd = '  const pause =';
const section = (s) => s.slice(s.indexOf(engineStart), s.indexOf(engineEnd));
if (
  !original.includes(engineStart) ||
  !original.includes(engineEnd) ||
  section(original) !== section(current)
)
  unexpected.push(`${engineFile}:render-and-input-loop`);
const result = {
  base: base.base,
  trackedBaseline: Object.keys(base.hashes).length,
  preserved,
  authorizedChanges: changed,
  unexpected,
  generatedRouteTypesExcluded: 1,
  cameraSwipeEngineAuthDatabaseGuildChatAssets:
    unexpected.length === 0 ? 'PASS' : 'FAIL',
  renderAndInputLoopUnchanged: section(original) === section(current),
};
await writeFile(
  path.join(
    root,
    'build/task-0073-mobile-gameplay-exploration/preservation-summary.json',
  ),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
if (unexpected.length) process.exitCode = 1;
