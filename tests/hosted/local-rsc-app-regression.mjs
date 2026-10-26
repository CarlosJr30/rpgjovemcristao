import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Actual application production bundle, offline Auth/API simulator. No hosted
// credentials, modified Auth/RLS rules, external services or fixture-only UI.
const root = resolve(import.meta.dirname, '../..');
const mobileReview = process.argv.includes('--ui-mobile');
const prefix = mobileReview ? 'ui-mobile-001-' : '';
const base = resolve(root, 'build/rpg-dev-005');
mkdirSync(base, { recursive: true });
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !/SUPABASE|TOKEN|SECRET|PASSWORD|VERCEL|^NEXT_PUBLIC_/i.test(key),
  ),
);
Object.assign(env, {
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_ENV: 'production',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3202',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'synthetic-local-public-key',
});
const next = resolve(root, 'node_modules/next/dist/bin/next');
const appRoot = resolve(root, 'apps/web');
const build = spawn(process.execPath, [next, 'build'], {
  cwd: appRoot,
  env,
  stdio: 'inherit',
});
assert.equal((await once(build, 'exit'))[0], 0, 'Application build failed');
const app = spawn(
  process.execPath,
  [next, 'start', '--hostname', '127.0.0.1', '--port', '3199'],
  { cwd: appRoot, env, stdio: ['ignore', 'pipe', 'pipe'] },
);
let log = '';
app.stdout.on('data', (chunk) => {
  log += chunk;
});
app.stderr.on('data', (chunk) => {
  log += chunk;
});
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Application startup timeout')),
      20000,
    );
    const inspect = (chunk) => {
      if (String(chunk).includes('Ready in')) {
        clearTimeout(timer);
        resolve();
      }
    };
    app.stdout.on('data', inspect);
    app.once('exit', () => {
      clearTimeout(timer);
      reject(new Error('Application exited before readiness'));
    });
  });
  const output =
    prefix +
    (process.argv.includes('--repeat')
      ? 'app-regression-repeat.json'
      : 'app-regression.json');
  const probe = spawn(
    process.execPath,
    [
      resolve(root, 'tests/hosted/local-webkit-rsc-probe.mjs'),
      '--native-backend',
      '--require-stable',
      '--output',
      'build/rpg-dev-005/' + output,
    ],
    { cwd: root, env, stdio: 'inherit' },
  );
  assert.equal(
    (await once(probe, 'exit'))[0],
    0,
    'Actual application RSC regression failed',
  );
  if (mobileReview) {
    const ui = spawn(
      process.execPath,
      [resolve(root, 'tests/hosted/ui-mobile-validation.mjs')],
      { cwd: root, env, stdio: 'inherit' },
    );
    assert.equal((await once(ui, 'exit'))[0], 0, 'Mobile UI regression failed');
  }
} finally {
  app.kill();
  writeFileSync(resolve(base, prefix + 'app-regression-server.log'), log);
}
