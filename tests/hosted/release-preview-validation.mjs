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
const out = {
  sha: preview.sha,
  origin,
  backend,
  realHosted: true,
  isolatedNegativeChecks: input.isolatedNegativeChecks === true,
  provisionalReplay: input.provisionalReplay === true,
  runs: [],
};
const task = input.task ?? 'rpg-dev-004';
if (!['rpg-dev-004', 'rpg-dev-005'].includes(task))
  throw new Error('Invalid task');
const base = 'build/' + task + '/';
const artifact = input.artifact ?? 'hosted-validation';
if (!/^[a-z0-9-]+$/.test(artifact)) throw new Error('Invalid artifact name');
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
  writeFileSync(base + artifact + '.json', JSON.stringify(out, null, 2));
for (const [engine, launcher, viewport] of [
  ['chromium', chromium, { width: 1440, height: 1000 }],
  ['webkit', webkit, { width: 390, height: 844 }],
]) {
  if (input.engines && !input.engines.includes(engine)) continue;
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
        timeline: [],
      };
      const started = performance.now();
      let phase = 'setup';
      const event = (kind, detail = {}) =>
        run.timeline.push({
          ms: Math.round(performance.now() - started),
          phase,
          kind,
          ...detail,
        });
      const safeUrl = (value) => {
        const url = new URL(value);
        return (
          url.origin +
          url.pathname +
          (url.searchParams.has('_rsc')
            ? '?_rsc=' + url.searchParams.get('_rsc')
            : '')
        );
      };
      const safeHeaders = (headers) =>
        Object.fromEntries(
          Object.entries(headers).filter(([name]) =>
            [
              'content-type',
              'cache-control',
              'vary',
              'rsc',
              'next-router-prefetch',
              'next-router-segment-prefetch',
              'access-control-allow-origin',
              'access-control-allow-credentials',
              'x-vercel-cache',
              'sec-fetch-mode',
              'sec-fetch-site',
              'sec-fetch-dest',
            ].includes(name.toLowerCase()),
          ),
        );
      out.runs.push(run);
      const context = await browser.newContext({ viewport });
      let holdPrefetches = false;
      const heldPrefetches = [];
      let fourPending;
      const prefetchBarrier = new Promise((resolve) => {
        fourPending = resolve;
      });
      const releasePrefetches = () => {
        holdPrefetches = false;
        for (const release of heldPrefetches.splice(0)) release();
      };
      await context.route(origin + '/**', async (route) => {
        const headers = route.request().headers();
        if (
          holdPrefetches &&
          headers['next-router-prefetch'] === '1' &&
          headers['next-router-segment-prefetch'] === '/_tree' &&
          heldPrefetches.length < 4
        ) {
          await new Promise((resolve) => {
            heldPrefetches.push(resolve);
            if (heldPrefetches.length === 4) fourPending();
          });
        }
        try {
          await route.continue({
            headers: {
              ...headers,
              'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN,
            },
          });
        } catch (error) {
          event('route-closed', { message: redact(error.message) });
        }
      });
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
      if (input.diagnostic) {
        await context.exposeBinding('__rpgLifecycle', (_source, detail) =>
          event('document', detail),
        );
        await context.addInitScript(() => {
          const report = (detail) =>
            window
              .__rpgLifecycle({
                at: performance.now(),
                location: location.pathname,
                readyState: document.readyState,
                ...detail,
              })
              .catch(() => {});
          for (const kind of ['beforeunload', 'pagehide', 'pageshow'])
            addEventListener(kind, () => report({ type: kind }));
          const original = window.fetch;
          window.fetch = async function (...args) {
            const url = new URL(
              typeof args[0] === 'string'
                ? args[0]
                : args[0] instanceof URL
                  ? args[0].href
                  : args[0].url,
              location.href,
            );
            const rsc =
              url.origin === location.origin && url.searchParams.has('_rsc');
            if (rsc) {
              const headers = Object.fromEntries(
                new Headers(
                  args[1]?.headers ??
                    (args[0] instanceof Request ? args[0].headers : undefined),
                ),
              );
              report({
                type: 'fetch-start',
                url: url.href,
                stack: new Error().stack,
                headers: Object.fromEntries(
                  Object.entries(headers).filter(([name]) =>
                    [
                      'rsc',
                      'next-router-prefetch',
                      'next-router-segment-prefetch',
                    ].includes(name),
                  ),
                ),
              });
            }
            try {
              return await original.apply(this, args);
            } catch (error) {
              if (rsc)
                report({
                  type: 'fetch-reject',
                  url: url.href,
                  error: String(error),
                });
              throw error;
            }
          };
        });
      }
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
      // Every tab remains subject to the same strict error gate.
      context.on('page', (observed) =>
        observed.on('pageerror', (error) => {
          event('pageerror', { message: redact(error.message) });
          run.pageErrors.push({
            name: error.name,
            message: redact(error.message),
          });
          save();
        }),
      );
      const page = await context.newPage();
      page.setDefaultTimeout(25000);
      page.on('requestfailed', (req) => {
        if (new URL(req.url()).origin === origin)
          event('requestfailed', {
            url: safeUrl(req.url()),
            failure: req.failure()?.errorText,
          });
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
        if (
          u.origin === origin &&
          (u.searchParams.has('_rsc') || req.isNavigationRequest())
        )
          event('request', {
            url: safeUrl(req.url()),
            method: req.method(),
            navigation: req.isNavigationRequest(),
            headers: safeHeaders(req.headers()),
          });
      });
      page.on('response', (response) => {
        const req = response.request();
        if (
          new URL(response.url()).origin === origin &&
          (new URL(response.url()).searchParams.has('_rsc') ||
            req.isNavigationRequest())
        )
          event('response', {
            url: safeUrl(response.url()),
            status: response.status(),
            headers: safeHeaders(response.headers()),
          });
      });
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame())
          event('commit', { url: safeUrl(frame.url()) });
      });
      const check = (name, passed) => {
        run.checks.push({ name, passed });
        if (!passed) throw new Error('Check failed: ' + name);
      };
      const settled = () => page.waitForLoadState('networkidle');
      const select = async (traveler) => {
        phase = 'select-' + traveler.id;
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
        phase = 'login';
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
        phase = 'guild';
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
        phase = 'ebd';
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
          path: base + `${artifact}-${engine}-${role}.png`,
          fullPage: true,
        });
        if (input.concurrentReplacement) {
          if (input.isolatedNegativeChecks)
            throw new Error(
              'Concurrent replacement requires the original document',
            );
          phase = 'concurrent-rsc-barrier';
          holdPrefetches = true;
          await page.reload();
          await page
            .getByLabel('Área da Escola Bíblica')
            .waitFor({ state: 'attached' });
          let timer;
          try {
            await Promise.race([
              prefetchBarrier,
              new Promise((_, reject) => {
                timer = setTimeout(
                  () =>
                    reject(
                      new Error('Four real hosted RSC prefetches not observed'),
                    ),
                  25000,
                );
              }),
            ]);
          } finally {
            clearTimeout(timer);
          }
          check(
            'four real hosted RSC prefetches pending before replacement',
            heldPrefetches.length === 4,
          );
        }
        if (input.provisionalReplay) {
          // Diagnostic replay, not a normal user flow or a successful release gate.
          const prefetch = run.timeline.find(
            (e) =>
              e.kind === 'request' &&
              e.url.includes('/journey/guild/manage?_rsc='),
          );
          if (!prefetch)
            throw new Error('BLOCKED: real leader prefetch not observed');
          const document = await page.evaluateHandle(() => window.document);
          const replay = () =>
            document.evaluate(
              async (doc, request) => {
                try {
                  const response = await doc.defaultView.fetch(request.url, {
                    headers: request.headers,
                  });
                  return {
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                  };
                } catch (error) {
                  return { caught: true, error: String(error) };
                }
              },
              { url: prefetch.url, headers: prefetch.headers },
            );
          phase = 'controlled-prefetch-before-navigation';
          event('replay-control', { result: await replay() });
          let release, seen;
          const held = new Promise((resolve) => {
            seen = resolve;
          });
          await context.route(
            origin + '/journey/arena',
            async (route) => {
              seen();
              await new Promise((resolve) => {
                release = resolve;
              });
              await route.fallback();
            },
            { times: 1 },
          );
          phase = 'controlled-provisional-prefetch';
          const navigation = page.goto(origin + '/journey/arena');
          try {
            await held;
            event('navigation-held-before-response');
            event('replay-provisional', {
              result: await Promise.race([
                replay(),
                new Promise((resolve) =>
                  setTimeout(() => resolve({ pending: true }), 500),
                ),
              ]),
            });
          } finally {
            release();
          }
          await navigation;
          event('diagnostic-navigation-completed');
        }
        const negativePage = input.isolatedNegativeChecks
          ? await context.newPage()
          : page;
        try {
          for (const path of [
            '/journey/arena',
            '/journey/tower',
            '/journey/equipment',
            '/journey/cards',
            '/journey/shop',
          ]) {
            phase = 'negative-' + path;
            if (!holdPrefetches)
              await negativePage.waitForLoadState('networkidle');
            const navigation = negativePage.goto(origin + path);
            if (holdPrefetches) {
              await negativePage.waitForRequest(
                (request) =>
                  request.isNavigationRequest() &&
                  new URL(request.url()).pathname === path,
              );
              releasePrefetches();
            }
            const response = await navigation;
            await negativePage.waitForLoadState('networkidle');
            check('economic route denied ' + path, response.status() === 403);
          }
        } finally {
          if (negativePage !== page) await negativePage.close();
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
        if (input.isolatedNegativeChecks)
          await page.getByRole('link', { name: 'Início', exact: true }).click();
        else await page.goto(origin + '/journey');
        await settled();
        phase = 'logout';
        await page
          .getByRole('button', { name: 'Sair da conta', exact: true })
          .click();
        await page.waitForURL(origin + '/auth');
        await settled();
        const signedOutPage = input.isolatedNegativeChecks
          ? await context.newPage()
          : page;
        await signedOutPage.goto(origin + '/journey/guild/ebd');
        await signedOutPage
          .getByRole('heading', { name: 'Entrar', exact: true })
          .waitFor();
        await signedOutPage.waitForLoadState('networkidle');
        if (signedOutPage !== page) await signedOutPage.close();
        check('logout denies EBD', true);
        run.hosts = [...hosts];
        check('TEST only, never PROD', hosts.size === 1 && hosts.has(backend));
        check('no pageerror', run.pageErrors.length === 0);
        check('no DOM error/unhandledrejection', run.domErrors.length === 0);
        run.passed = true;
      } catch (error) {
        run.failure = redact(error.message);
      } finally {
        releasePrefetches();
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
