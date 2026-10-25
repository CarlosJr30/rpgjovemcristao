import { chromium, webkit } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { mockLocalReleaseAuth } from '../fixtures/local-release-auth.ts';
import { startLocalAuthSimulator } from '../fixtures/local-auth-http-server.mjs';

// Diagnostic matrix. Intentional cancellation errors are recorded, never suppressed.
const origin = 'http://127.0.0.1:3199';
const nativeBackend = process.argv.includes('--native-backend');
const simulator = nativeBackend ? await startLocalAuthSimulator() : null;
const settledOnly = process.argv.includes('--settled-only');
const outputOption = process.argv.indexOf('--output');
const selectedOutput =
  outputOption === -1 ? null : process.argv[outputOption + 1];
if (
  selectedOutput &&
  !/^build\/rpg-dev-00[45]\/[a-z0-9/-]+\.json$/.test(selectedOutput)
)
  throw new Error('Invalid diagnostic output path');
const output =
  selectedOutput ??
  (settledOnly
    ? 'build/rpg-dev-003/local-native-auth-settled.json'
    : nativeBackend
      ? 'build/rpg-dev-003/local-native-auth-rsc.json'
      : 'build/rpg-dev-003/local-webkit-rsc.json');
mkdirSync(dirname(output), { recursive: true });
const cases = settledOnly
  ? [{ transport: 'settled', navigation: 'goto', repeats: 3 }]
  : process.argv.includes('--smoke')
    ? [{ transport: 'fixture-only', navigation: 'links', repeats: 1 }]
    : [
        { transport: 'fixture-only', navigation: 'links', repeats: 3 },
        { transport: 'fixture-only', navigation: 'goto', repeats: 3 },
        { transport: 'continue', navigation: 'goto', repeats: 3 },
        { transport: 'delay-prefetch', navigation: 'goto', repeats: 3 },
      ];
const runs = [];
const save = () =>
  writeFileSync(
    output,
    JSON.stringify(
      { origin, syntheticBackend: true, productionProof: false, runs },
      null,
      2,
    ),
  );
for (const [engine, launcher] of [
  ['chromium', chromium],
  ['webkit', webkit],
]) {
  const browser = await launcher.launch();
  try {
    for (const cell of cases)
      for (let repeat = 0; repeat < cell.repeats; repeat++) {
        const run = {
          engine,
          ...cell,
          repeat,
          checks: [],
          errors: [],
          domErrors: [],
          consoleErrors: [],
          externalOrigins: [],
          failedRequests: [],
          responses: [],
          delayed: 0,
          functionalPassed: false,
          lifecycle: [],
        };
        runs.push(run);
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
        });
        await context.exposeBinding('__localRscError', (_source, event) =>
          run.domErrors.push(event),
        );
        await context.addInitScript(() => {
          addEventListener('error', (event) => {
            window
              .__localRscError({ kind: 'error', message: event.message })
              .catch(() => {});
          });
          addEventListener('unhandledrejection', (event) => {
            window
              .__localRscError({
                kind: 'unhandledrejection',
                message: String(event.reason),
              })
              .catch(() => {});
          });
        });
        if (process.argv.includes('--lifecycle')) {
          await context.exposeBinding('__localLifecycle', (_source, event) =>
            run.lifecycle.push(event),
          );
          await context.addInitScript(() => {
            const report = (detail) =>
              window
                .__localLifecycle({
                  at: performance.now(),
                  path: location.pathname,
                  ...detail,
                })
                .catch(() => {});
            window.__rpgRscObserve = report;
            const add = window.addEventListener.bind(window);
            add('beforeunload', () => report({ kind: 'beforeunload' }));
            add('pagehide', () => report({ kind: 'pagehide' }));
            window.addEventListener = function (type, ...args) {
              if (type === 'beforeunload')
                report({ kind: 'register', stack: new Error().stack });
              return add(type, ...args);
            };
          });
        }
        if (!nativeBackend) await mockLocalReleaseAuth(context, origin);
        if (!['fixture-only', 'settled'].includes(cell.transport))
          await context.route(origin + '/**', async (route) => {
            const req = route.request();
            if (
              cell.transport === 'delay-prefetch' &&
              req.headers()['next-router-prefetch'] === '1'
            ) {
              run.delayed++;
              // Delay only this synthetic local experiment, not the application.
              await new Promise((resolve) => setTimeout(resolve, 750));
            }
            try {
              await route.continue();
            } catch {
              run.failedRequests.push({
                path: new URL(req.url()).pathname,
                error: 'route closed during navigation',
              });
            }
          });
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        page.on('console', (message) => {
          if (message.type() === 'error')
            run.consoleErrors.push(message.text());
        });
        page.on('request', (request) => {
          const requestOrigin = new URL(request.url()).origin;
          if (
            nativeBackend &&
            ![origin, 'http://127.0.0.1:3202'].includes(requestOrigin)
          )
            run.externalOrigins.push(requestOrigin);
        });
        page.on('pageerror', (e) =>
          run.errors.push({ name: e.name, message: e.message }),
        );
        page.on('requestfailed', (req) =>
          run.failedRequests.push({
            path: new URL(req.url()).pathname,
            rsc: new URL(req.url()).searchParams.has('_rsc'),
            error: req.failure()?.errorText,
          }),
        );
        page.on('response', (res) => {
          const url = new URL(res.url());
          if (url.origin !== origin) return;
          run.responses.push({
            path: url.pathname,
            rsc: url.searchParams.has('_rsc'),
            status: res.status(),
            type: res.headers()['content-type'],
            prefetch: res.request().headers()['next-router-prefetch'] ?? null,
          });
        });
        const visit = async (path) => {
          if (cell.transport === 'settled')
            await page.waitForLoadState('networkidle');
          await page.goto(origin + path);
        };
        const navigate = async (path, name) => {
          if (cell.navigation === 'goto') await visit(path);
          else await page.getByRole('link', { name, exact: true }).click();
        };
        try {
          await visit('/auth');
          await page.getByLabel('E-mail').fill('local-only@fixture.invalid');
          await page
            .getByLabel('Senha', { exact: true })
            .fill('synthetic-local-only');
          await page
            .getByRole('button', { name: 'Entrar', exact: true })
            .click();
          await page.waitForURL(origin + '/');
          await page
            .getByRole('heading', {
              name: 'Bem-vindo, Local WebKit',
              exact: true,
            })
            .waitFor();
          run.checks.push('login');
          await navigate('/journey/hero', 'Meu avatar');
          await page
            .getByRole('heading', { name: 'Local WebKit', exact: true })
            .waitFor();
          run.checks.push('avatar');
          await navigate('/journey/guild', 'Guilda');
          await page
            .getByRole('heading', { name: 'Minha Guilda', exact: true })
            .waitFor();
          run.checks.push('Guilda');
          await navigate('/journey/guild/ebd', 'EBD');
          await page.getByLabel('Área da Escola Bíblica').waitFor();
          run.checks.push('EBD');
          if (cell.transport === 'settled')
            await page.waitForLoadState('networkidle');
          await page.reload();
          await page.getByLabel('Área da Escola Bíblica').waitFor();
          run.checks.push('reload');
          if (cell.transport === 'settled')
            await page.waitForLoadState('networkidle');
          await page
            .getByRole('button', { name: 'Sair da conta', exact: true })
            .click();
          await page.waitForURL(origin + '/auth');
          await page
            .getByRole('heading', { name: 'Entrar', exact: true })
            .waitFor();
          run.checks.push('logout');
          await visit('/journey/guild/ebd');
          await page
            .getByRole('heading', { name: 'Entrar', exact: true })
            .waitFor();
          run.checks.push('signed-out denial');
          run.functionalPassed = true;
        } catch (e) {
          run.failure = e.message;
        } finally {
          run.errorFree =
            run.errors.length === 0 &&
            run.domErrors.length === 0 &&
            run.consoleErrors.length === 0 &&
            run.externalOrigins.length === 0;
          await context.close();
          save();
        }
      }
  } finally {
    await browser.close();
  }
}
console.log(
  JSON.stringify(
    runs.map(
      ({
        engine,
        transport,
        navigation,
        repeat,
        functionalPassed,
        errorFree,
        delayed,
        errors,
        failure,
      }) => ({
        engine,
        transport,
        navigation,
        repeat,
        functionalPassed,
        errorFree,
        delayed,
        errors: errors.length,
        failure,
      }),
    ),
  ),
);
if (simulator) await new Promise((resolve) => simulator.close(resolve));
if (
  runs.some(
    (run) =>
      !run.functionalPassed ||
      (process.argv.includes('--require-stable') && !run.errorFree),
  )
)
  process.exitCode = 1;
