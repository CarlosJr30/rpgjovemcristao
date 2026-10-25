import { chromium, webkit } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

// Credentials arrive on stdin, never arguments/files. Only an existing TEST Preview.
const input = JSON.parse(readFileSync(0, 'utf8'));
const { preview, accounts } = input;
const origin = 'https://' + preview.url;
const backend = 'wkdvdzfkbwvhyjmamrsg.supabase.co';
if (
  !preview.url.endsWith('.vercel.app') ||
  preview.url === 'rpgjovemcristao-web-inky.vercel.app' ||
  preview.target === 'production' ||
  preview.readyState !== 'READY' ||
  !/^[a-f0-9]{40}$/.test(preview.sha) ||
  !process.env.VERCEL_OIDC_TOKEN
)
  throw new Error('Verified TEST Preview and scoped OIDC required');
const out = { sha: preview.sha, origin, backend, realHosted: true, runs: [] };
const base = 'build/rpg-dev-004/';
const redact = (value) => {
  let text = String(value);
  for (const account of Object.values(accounts))
    for (const secret of [account.email, account.password])
      if (secret) text = text.split(secret).join('[redacted]');
  return text
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token]')
    .replace(/\?_rsc=[^\s)]+/g, '?_rsc=[nonce]');
};
const save = () =>
  writeFileSync(base + 'hosted-validation.json', JSON.stringify(out, null, 2));
for (const [engine, launcher, viewport] of [
  ['chromium', chromium, { width: 1440, height: 1000 }],
  ['webkit', webkit, { width: 390, height: 844 }],
]) {
  const browser = await launcher.launch();
  try {
    for (const role of input.roles ?? ['lider', 'professor', 'aluno']) {
      const account = accounts[role];
      const run = {
        engine,
        role,
        checks: [],
        pageErrors: [],
        domErrors: [],
        failedRequests: [],
        hosts: [],
        passed: false,
      };
      out.runs.push(run);
      const context = await browser.newContext({ viewport });
      await context.route(origin + '/**', (route) =>
        route.continue({
          headers: {
            ...route.request().headers(),
            'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN,
          },
        }),
      );
      await context.route('https://*.supabase.co/**', (route) =>
        new URL(route.request().url()).hostname === backend
          ? route.continue()
          : route.abort(),
      );
      await context.exposeBinding(
        '__rpgRuntimeObservation',
        (_source, event) => {
          run.domErrors.push({
            kind: event.kind,
            message: redact(event.message),
          });
        },
      );
      await context.addInitScript(() => {
        const report = (event) =>
          window.__rpgRuntimeObservation(event).catch(() => {});
        addEventListener('error', (event) =>
          report({ kind: 'error', message: event.message }),
        );
        addEventListener('unhandledrejection', (event) =>
          report({ kind: 'unhandledrejection', message: String(event.reason) }),
        );
      });
      const page = await context.newPage();
      page.setDefaultTimeout(25000);
      page.on('pageerror', (error) => {
        run.pageErrors.push({
          name: error.name,
          message: redact(error.message),
        });
        save();
      });
      page.on('requestfailed', (req) => {
        const u = new URL(req.url());
        run.failedRequests.push({
          host: u.hostname,
          path: u.pathname,
          rsc: u.searchParams.has('_rsc'),
          message: req.failure()?.errorText,
        });
      });
      const hosts = new Set();
      page.on('request', (req) => {
        const u = new URL(req.url());
        if (u.hostname.endsWith('.supabase.co')) hosts.add(u.hostname);
      });
      const check = (name, passed) => {
        run.checks.push({ name, passed });
        if (!passed) throw new Error('Check failed: ' + name);
      };
      const settled = () => page.waitForLoadState('networkidle');
      const select = async (traveler) => {
        await settled();
        await page
          .getByRole('button', { name: 'Trocar Viajante', exact: true })
          .click();
        await page
          .getByRole('heading', { name: 'Escolha seu Viajante', exact: true })
          .waitFor();
        const response = page.waitForResponse(
          (r) =>
            new URL(r.url()).pathname === '/rest/v1/rpc/set_active_traveler' &&
            r.request().method() === 'POST',
        );
        await page
          .getByRole('article')
          .filter({
            has: page.getByRole('heading', {
              name: traveler.name,
              exact: true,
            }),
          })
          .getByRole('button', {
            name: 'Entrar com este Viajante',
            exact: true,
          })
          .click();
        const result = await response;
        check(
          'selection RPC accepted for ' + traveler.id,
          result.ok() &&
            result.request().postDataJSON().p_traveler_id === traveler.id,
        );
        await page
          .getByRole('heading', { name: 'Minha Guilda', exact: true })
          .waitFor();
        await settled();
        await page
          .getByRole('link', { name: 'Meu avatar', exact: true })
          .click();
        await page
          .getByRole('heading', { name: traveler.name, exact: true })
          .waitFor();
        await settled();
        await page.reload();
        await page
          .getByRole('heading', { name: traveler.name, exact: true })
          .waitFor();
        await settled();
        check('selected avatar persists ' + traveler.id, true);
      };
      try {
        await page.goto(origin + '/auth');
        await settled();
        await page.getByLabel('E-mail').fill(account.email);
        await page.getByLabel('Senha', { exact: true }).fill(account.password);
        await page.getByRole('button', { name: 'Entrar', exact: true }).click();
        await page.waitForURL(origin + '/');
        await page
          .getByRole('heading', {
            name: 'Bem-vindo, ' + account.active.name,
            exact: true,
          })
          .waitFor();
        await settled();
        check('real login, original active avatar', true);
        await page
          .getByRole('link', { name: 'Meu avatar', exact: true })
          .click();
        await page
          .getByRole('heading', { name: account.active.name, exact: true })
          .waitFor();
        await settled();
        check('avatar read', true);
        if (!account.alternate)
          throw new Error(
            'BLOCKED: no second authorized TEST avatar for selection',
          );
        await select(account.alternate);
        await select(account.active);
        check('original active avatar restored', true);
        await page.getByRole('link', { name: 'Guilda', exact: true }).click();
        await page
          .getByRole('heading', { name: 'Minha Guilda', exact: true })
          .waitFor();
        await page
          .getByText('Carregando Guilda…', { exact: true })
          .waitFor({ state: 'hidden' });
        await settled();
        check(
          'Guilda read',
          !(await page
            .getByText('Não foi possível carregar a Guilda. Tente atualizar.', {
              exact: true,
            })
            .count()),
        );
        const ebd = page.waitForResponse(
          (r) =>
            new URL(r.url()).pathname === '/rest/v1/rpc/guild_ebd_workspace' &&
            r.request().method() === 'POST',
        );
        await page.getByRole('link', { name: 'EBD', exact: true }).click();
        const response = await ebd;
        check(
          'EBD workspace and existing permission',
          response.ok() && (await response.json()).teacher === account.teacher,
        );
        // The area selector is intentionally mobile-only; desktop uses tabs.
        await page
          .getByLabel('Área da Escola Bíblica')
          .waitFor({ state: 'attached' });
        await settled();
        check(
          'no horizontal overflow',
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.screenshot({
          path: base + `hosted-${engine}-${role}.png`,
          fullPage: true,
        });
        for (const path of [
          '/journey/arena',
          '/journey/tower',
          '/journey/equipment',
          '/journey/cards',
          '/journey/shop',
        ]) {
          await settled();
          const response = await page.goto(origin + path);
          await settled();
          check('economic route denied ' + path, response.status() === 403);
        }
        const authority = await page.evaluate(
          async () =>
            (
              await fetch('/api/authority', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ operation: 'starter' }),
              })
            ).status,
        );
        check('authority API denied', authority === 403);
        await page.goto(origin + '/journey');
        await settled();
        await page
          .getByRole('button', { name: 'Sair da conta', exact: true })
          .click();
        await page.waitForURL(origin + '/auth');
        await settled();
        await page.goto(origin + '/journey/guild/ebd');
        await page
          .getByRole('heading', { name: 'Entrar', exact: true })
          .waitFor();
        await settled();
        check('logout denies EBD', true);
        run.hosts = [...hosts];
        check('TEST only, never PROD', hosts.size === 1 && hosts.has(backend));
        check('no pageerror', run.pageErrors.length === 0);
        check('no DOM error/unhandledrejection', run.domErrors.length === 0);
        run.passed = true;
      } catch (error) {
        run.failure = redact(error.message);
      } finally {
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
    out.runs.map((run) => ({
      engine: run.engine,
      role: run.role,
      checks: run.checks.length,
      passed: run.passed,
      pageErrors: run.pageErrors.length,
      domErrors: run.domErrors.length,
      failure: run.failure,
    })),
  ),
);
if (out.runs.some((run) => !run.passed)) process.exitCode = 1;
