// Capture actual child exit codes and ALL stderr without PowerShell stream coercion.
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { finished } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('..', import.meta.url));
const run = process.argv[2];
assert(run && /^[a-z0-9-]+$/.test(run), 'Supply a unique run name');
const pinned = process.argv.includes('--pinned');
const production = process.argv.includes('--production');
const dir = path.join(
  root,
  'build/task-0075-body-fit-final-review/continuation',
);
await mkdir(dir, { recursive: true });
const cases = (
  production
    ? ['equipment-body-fit-activation', 'supabase-auth', 'mobile-game-mode']
    : [
        'equipment-body-fit-v3',
        'equipment-portal',
        'attributes',
        'home',
        'arena-v2',
        'gameplay-exploration',
        'mobile-game-mode',
        ...(process.argv.includes('--activation')
          ? ['equipment-body-fit-activation', 'supabase-auth']
          : []),
      ]
).map((n) => `tests/e2e/${n}.spec.ts`);
const args = [
  'node_modules/@playwright/test/cli.js',
  'test',
  '--config=playwright.body-fit-final.config.ts',
  ...(pinned ? ['--project=desktop'] : []),
  ...cases,
];
const sources = {};
for (const p of ['playwright.body-fit-final.config.ts', ...cases])
  sources[p] = createHash('sha256')
    .update(await readFile(path.join(root, p)))
    .digest('hex');
const log = createWriteStream(path.join(dir, `${run}.log`), { flags: 'wx' });
await new Promise((resolve, reject) => {
  log.once('open', resolve);
  log.once('error', reject);
});
const startedAt = new Date().toISOString();
const child = spawn(process.execPath, args, {
  cwd: root,
  env: {
    ...process.env,
    BODY_FIT_QA_RUN: run,
    ...(production
      ? { BODY_FIT_QA_URL: 'https://rpgjovemcristao-web-inky.vercel.app' }
      : { BODY_FIT_QA_URL: 'http://127.0.0.1:3175' }),
    ...(pinned
      ? { BODY_FIT_PINNED_DESKTOP: '1' }
      : { BODY_FIT_PINNED_DESKTOP: '0' }),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
child.stdout.pipe(log, { end: false });
child.stderr.pipe(log, { end: false });
child.once('error', (e) => {
  log.write(e.message);
});
const outcome = await new Promise((resolve) =>
  child.once('close', (exitCode, signal) => resolve({ exitCode, signal })),
);
log.end();
await finished(log);
let report;
try {
  report = JSON.parse(
    await readFile(
      path.join(root, `build/task-0075-body-fit-final-review/${run}.json`),
      'utf8',
    ),
  );
} catch {
  report = null;
}
const receipt = {
  run,
  startedAt,
  finishedAt: new Date().toISOString(),
  pinned,
  production,
  ...outcome,
  args,
  sources,
  stats: report?.stats ?? null,
  globalErrors: report?.errors ?? [],
  allStderrPreserved: true,
  status:
    outcome.exitCode === 0 &&
    report &&
    report.stats.unexpected === 0 &&
    report.stats.flaky === 0 &&
    report.errors.length === 0
      ? 'PASS'
      : 'FAIL',
};
await writeFile(
  path.join(dir, `${run}-receipt.json`),
  JSON.stringify(receipt, null, 2),
);
console.log(JSON.stringify(receipt));
if (receipt.status !== 'PASS') process.exitCode = 1;
