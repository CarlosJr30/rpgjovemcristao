import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createServer, request as httpRequest } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, webkit } from '@playwright/test';

// Real Next production prefetches, no browser routing or fetch/Promise wrapper.
// A successful diagnostic does not approve the reproduced browser defect.
const root = resolve(import.meta.dirname, '../..');
const fixture = resolve(root, 'tests/fixtures/rsc-lifecycle-harness');
const next = resolve(root, 'node_modules/next/dist/bin/next');
const origin = 'http://127.0.0.1:3206';
const base = resolve(root, 'build/rpg-dev-004/concurrency');
mkdirSync(base, { recursive: true });
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !/SUPABASE|TOKEN|SECRET|PASSWORD|VERCEL|^NEXT_PUBLIC_/i.test(key),
  ),
);
env.NEXT_TELEMETRY_DISABLED = '1';
env.NODE_ENV = 'production';
if (process.argv.includes('--build')) {
  const build = spawn(process.execPath, [next, 'build'], {
    cwd: fixture,
    env,
    stdio: 'inherit',
  });
  const [code] = await once(build, 'exit');
  assert.equal(code, 0, 'Isolated fixture build failed');
}
assert.ok(readFileSync(resolve(fixture, '.next/BUILD_ID'), 'utf8').trim());
const app = spawn(
  process.execPath,
  [next, 'start', '--hostname', '127.0.0.1', '--port', '3205'],
  { cwd: fixture, env, stdio: ['ignore', 'pipe', 'pipe'] },
);
let appLog = '';
app.stdout.on('data', (chunk) => {
  appLog += chunk;
});
app.stderr.on('data', (chunk) => {
  appLog += chunk;
});
const changes = new EventEmitter();
function until(predicate, label, timeout = 15000) {
  if (predicate()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Precondition timeout: ' + label));
    }, timeout);
    const check = () => {
      if (predicate()) {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      clearTimeout(timer);
      changes.off('change', check);
    };
    changes.on('change', check);
  });
}
let active;
const safeHeaders = (headers) =>
  Object.fromEntries(
    Object.entries(headers).filter(([key]) =>
      [
        'rsc',
        'next-router-prefetch',
        'next-router-segment-prefetch',
        'content-type',
        'cache-control',
        'vary',
      ].includes(key.toLowerCase()),
    ),
  );
const proxy = createServer((req, res) => {
  if (!active || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  const state = active;
  const url = new URL(req.url, origin);
  const row = {
    url: url.href,
    method: req.method,
    headers: safeHeaders(req.headers),
    status: null,
    completed: false,
    canceled: false,
  };
  state.server.push(row);
  const tree =
    url.pathname.startsWith('/target/') &&
    req.headers['next-router-prefetch'] === '1' &&
    req.headers['next-router-segment-prefetch'] === '/_tree';
  const forward = () => {
    if (res.destroyed) return;
    const upstream = httpRequest(
      {
        hostname: '127.0.0.1',
        port: 3205,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (reply) => {
        row.status = reply.statusCode;
        row.responseHeaders = safeHeaders(reply.headers);
        res.writeHead(reply.statusCode, reply.headers);
        reply.pipe(res);
      },
    );
    upstream.on('error', (error) => {
      row.proxyError = error.code;
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    res.on('close', () => upstream.destroy());
    req.pipe(upstream);
  };
  res.on('finish', () => {
    row.completed = true;
    changes.emit('change');
  });
  res.on('close', () => {
    row.canceled = !row.completed;
    changes.emit('change');
  });
  if (tree && state.holdTrees && state.held.length < 4)
    state.held.push(forward);
  else if (url.pathname === '/replacement' && state.holdReplacement) {
    state.replacement = forward;
  } else forward();
  changes.emit('change');
});
const out = {
  origin,
  nextVersion: '16.4.2',
  noAuth: true,
  noBrowserRouting: true,
  noFetchWrapper: true,
  runs: [],
  releaseAccepted: false,
};
const save = () =>
  writeFileSync(
    resolve(base, 'next-rsc-concurrency.json'),
    JSON.stringify(out, null, 2),
  );
const release = (state) => {
  state.holdTrees = false;
  state.holdReplacement = false;
  for (const start of state.held.splice(0)) start();
  const replacement = state.replacement;
  state.replacement = null;
  replacement?.();
};
try {
  await new Promise((resolve) => proxy.listen(3206, '127.0.0.1', resolve));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Fixture startup timeout')),
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
      reject(new Error('Fixture exited before readiness'));
    });
    if (appLog.includes('Ready in')) {
      clearTimeout(timer);
      resolve();
    }
  });
  for (const [engine, launcher] of [
    ['webkit', webkit],
    ['chromium', chromium],
  ]) {
    if (process.argv.includes('--smoke') && engine !== 'webkit') continue;
    const browser = await launcher.launch();
    try {
      for (const mode of [
        'hard-six',
        'hard-four',
        'spa-six',
        'state-six',
        'guard-hard-six',
        'guard-spa-six',
        'guard-state-six',
        'guard-cancel-six',
      ]) {
        for (
          let repeat = 0;
          repeat < (process.argv.includes('--smoke') ? 1 : 3);
          repeat++
        ) {
          const run = {
            engine,
            mode,
            repeat,
            checks: [],
            pageErrors: [],
            domErrors: [],
            failedRequests: [],
            lifecycle: [],
            externalRequests: [],
            server: [],
            passedDiagnostic: false,
            releaseStable: false,
          };
          out.runs.push(run);
          const guarded = mode.startsWith('guard-');
          const navigationMode = mode.replace(/^guard-/, '');
          const state = {
            server: run.server,
            held: [],
            holdTrees: true,
            holdReplacement: navigationMode.startsWith('hard'),
          };
          active = state;
          const context = await browser.newContext({
            viewport: { width: 1280, height: 900 },
            serviceWorkers: 'block',
          });
          await context.exposeBinding('__rscObserve', (_source, event) => {
            run.lifecycle.push(event);
            if (event.kind === 'error' || event.kind === 'unhandledrejection')
              run.domErrors.push(event);
            changes.emit('change');
          });
          await context.addInitScript(() => {
            const report = (event) =>
              window
                .__rscObserve({
                  path: location.pathname,
                  at: performance.now(),
                  ...event,
                })
                .catch(() => {});
            for (const kind of ['beforeunload', 'pagehide', 'pageshow'])
              addEventListener(kind, (event) =>
                report({ kind, persisted: event.persisted === true }),
              );
            addEventListener('error', (e) =>
              report({ kind: 'error', message: e.message }),
            );
            addEventListener('unhandledrejection', (e) =>
              report({ kind: 'unhandledrejection', message: String(e.reason) }),
            );
          });
          const page = await context.newPage();
          page.setDefaultTimeout(15000);
          page.on('pageerror', (error) => {
            run.pageErrors.push({
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
            changes.emit('change');
          });
          page.on('requestfailed', (req) => {
            run.failedRequests.push({
              url: req.url(),
              headers: safeHeaders(req.headers()),
              error: req.failure()?.errorText,
            });
            changes.emit('change');
          });
          page.on('request', (req) => {
            if (new URL(req.url()).origin !== origin)
              run.externalRequests.push(new URL(req.url()).origin);
          });
          const check = (name, passed) => {
            run.checks.push({ name, passed });
            assert.ok(passed, name);
          };
          try {
            const count = navigationMode === 'hard-four' ? 4 : 6;
            await page.goto(
              origin + '/?links=' + count + '&guard=' + Number(guarded),
            );
            await page
              .getByRole('heading', { name: 'RSC lifecycle fixture' })
              .waitFor();
            check(
              'all automatic target links present',
              (await page.getByRole('navigation').getByRole('link').count()) ===
                count,
            );
            await until(
              () => state.held.length === 4,
              'four genuine tree prefetch requests pending',
            );
            check(
              'four real Next prefetches held before action',
              state.held.length === 4,
            );
            check('no Auth cookies', (await context.cookies()).length === 0);
            if (navigationMode.startsWith('hard')) {
              const navigation = page.goto(origin + '/replacement').then(
                () => ({ ok: true }),
                (error) => ({ ok: false, error: error.message }),
              );
              await until(
                () => !!state.replacement,
                'replacement document requested',
              );
              // Chromium retains old loads until the replacement can commit.
              // WebKit cancels them while the replacement response is held.
              if (engine === 'chromium') {
                state.holdReplacement = false;
                const start = state.replacement;
                state.replacement = null;
                start();
              }
              await until(
                () =>
                  run.server.filter(
                    (row) =>
                      row.canceled &&
                      row.headers['next-router-prefetch'] === '1',
                  ).length >= 4,
                'four prefetch cancellations',
              );
              check('old RSC canceled by document replacement', true);
              if (!guarded && mode === 'hard-six' && engine === 'webkit')
                await until(
                  () => run.pageErrors.length > 0,
                  'queued old-document fetch refused',
                );
              release(state);
              const result = await navigation;
              check('document navigation completed', result.ok);
              await page
                .getByRole('heading', { name: 'Replacement completed' })
                .waitFor();
              if (guarded) {
                await page.goBack();
                await page
                  .getByRole('heading', { name: 'RSC lifecycle fixture' })
                  .waitFor();
                await page
                  .getByRole('button', { name: 'Change local state' })
                  .click();
                check(
                  'history return remains interactive',
                  (await page.getByTestId('revision').textContent()) === '1',
                );
              }
            } else if (navigationMode === 'cancel-six') {
              await page
                .getByRole('button', { name: 'Protect unsaved form' })
                .click();
              let dialogSeen = false;
              let dismissed;
              const dialogDismissed = new Promise((resolve) => {
                dismissed = resolve;
              });
              page.once('dialog', async (dialog) => {
                dialogSeen = dialog.type() === 'beforeunload';
                await dialog.dismiss();
                dismissed();
              });
              const navigation = page.evaluate(() => {
                location.assign(new URL('/replacement', location.origin).href);
              });
              await dialogDismissed;
              await navigation;
              check(
                'unsaved form can cancel navigation',
                dialogSeen && new URL(page.url()).pathname === '/',
              );
              await page
                .getByRole('button', { name: 'Change local state' })
                .click();
              release(state);
              await until(
                () =>
                  new Set(
                    run.server
                      .filter(
                        (row) =>
                          row.status === 200 &&
                          row.headers['next-router-prefetch'] === '1',
                      )
                      .map((row) => new URL(row.url).pathname),
                  ).size === 6,
                'prefetch resumed after canceled navigation',
              );
              check(
                'prefetch resumes after canceled document navigation',
                true,
              );
            } else if (navigationMode === 'spa-six') {
              const click = page
                .getByRole('link', { name: 'Client navigation' })
                .click();
              // Intent is dispatched with all four prefetches still pending.
              await click;
              release(state);
              await page
                .getByRole('heading', { name: 'Replacement completed' })
                .waitFor();
            } else {
              await page
                .getByRole('button', { name: 'Change local state' })
                .click();
              check(
                'local state changed without route/session navigation',
                (await page.getByTestId('revision').textContent()) === '1' &&
                  new URL(page.url()).pathname === '/',
              );
              release(state);
            }
            await page.waitForLoadState('networkidle');
            check(
              'no external service requests',
              run.externalRequests.length === 0,
            );
            check(
              'no DOM unhandled error or rejection',
              run.domErrors.length === 0,
            );
            run.releaseStable = run.pageErrors.length === 0;
            check(
              'expected diagnostic signature',
              mode === 'hard-six' && engine === 'webkit'
                ? !run.releaseStable
                : run.releaseStable,
            );
            run.passedDiagnostic = true;
          } catch (error) {
            run.failure = error.message;
          } finally {
            release(state);
            await context.close();
            save();
          }
          console.log(
            JSON.stringify({
              engine,
              mode,
              repeat,
              diagnostic: run.passedDiagnostic,
              releaseStable: run.releaseStable,
              pageErrors: run.pageErrors.length,
              canceled: run.server.filter((r) => r.canceled).length,
              failure: run.failure,
            }),
          );
        }
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  if (active) release(active);
  proxy.closeAllConnections();
  await new Promise((resolve) => proxy.close(resolve));
  app.kill();
  writeFileSync(resolve(base, 'next-server.log'), appLog);
}
save();
if (out.runs.some((run) => !run.passedDiagnostic)) process.exitCode = 1;
