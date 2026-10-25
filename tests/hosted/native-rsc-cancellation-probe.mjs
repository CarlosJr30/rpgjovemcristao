import { chromium, webkit } from '@playwright/test';
import { createServer, request as httpRequest } from 'node:http';
import { writeFileSync } from 'node:fs';

// Public pages only. No Playwright routing, accounts, tokens or API writes.
const origin = 'http://127.0.0.1:3201';
const serverEvents = [];
let delayRsc = false;
const server = createServer((req, res) => {
  const path = new URL(req.url, origin).pathname;
  if (
    req.method !== 'GET' ||
    !(
      path === '/' ||
      path === '/auth' ||
      path === '/auth/recover' ||
      path.startsWith('/_next/') ||
      path.startsWith('/assets/')
    )
  ) {
    res.writeHead(403);
    res.end();
    return;
  }
  const entry = {
    path,
    rsc: req.headers.rsc === '1',
    delayed: false,
    status: null,
    cancelled: false,
  };
  serverEvents.push(entry);
  res.on('close', () => {
    entry.cancelled = !res.writableFinished;
  });
  const upstream = httpRequest(
    {
      hostname: '127.0.0.1',
      port: 3199,
      path: req.url,
      method: 'GET',
      headers: req.headers,
    },
    (response) => {
      entry.status = response.statusCode;
      const chunks = [];
      response.on('data', (c) => chunks.push(c));
      response.on('end', () => {
        const send = () => {
          if (!res.destroyed) {
            res.writeHead(response.statusCode, response.headers);
            res.end(Buffer.concat(chunks));
          }
        };
        if (delayRsc && entry.rsc) {
          entry.delayed = true;
          setTimeout(send, 1500);
        } else send();
      });
    },
  );
  upstream.on('error', () => {
    if (!res.destroyed) {
      res.writeHead(502);
      res.end();
    }
  });
  upstream.end();
});
await new Promise((resolve) => server.listen(3201, '127.0.0.1', resolve));
const runs = [];
try {
  for (const [engine, launcher] of [
    ['chromium', chromium],
    ['webkit', webkit],
  ]) {
    const browser = await launcher.launch();
    try {
      for (const delayed of [false, true])
        for (let repeat = 0; repeat < 3; repeat++) {
          delayRsc = delayed;
          const start = serverEvents.length;
          const context = await browser.newContext();
          const page = await context.newPage();
          const run = {
            engine,
            delayed,
            repeat,
            errors: [],
            failures: [],
            externalRequests: [],
            functionalPassed: false,
          };
          runs.push(run);
          page.on('pageerror', (e) =>
            run.errors.push({ name: e.name, message: e.message }),
          );
          page.on('requestfailed', (req) =>
            run.failures.push({
              path: new URL(req.url()).pathname,
              error: req.failure()?.errorText,
            }),
          );
          page.on('request', (req) => {
            if (new URL(req.url()).origin !== origin)
              run.externalRequests.push(new URL(req.url()).origin);
          });
          try {
            await page.goto(origin + '/auth');
            await page
              .getByRole('heading', { name: 'Entrar', exact: true })
              .waitFor();
            await page
              .getByRole('link', { name: 'Esqueci minha senha', exact: true })
              .hover();
            await page.waitForTimeout(80);
            await page.goto(origin + '/auth/recover');
            await page
              .getByRole('heading', { name: 'Recuperar acesso', exact: true })
              .waitFor();
            await page
              .getByRole('link', { name: 'Voltar para entrar', exact: true })
              .hover();
            await page.waitForTimeout(80);
            await page.goto(origin + '/auth');
            await page
              .getByRole('heading', { name: 'Entrar', exact: true })
              .waitFor();
            await page.waitForTimeout(200);
            run.functionalPassed = true;
          } catch (e) {
            run.failure = e.message;
          } finally {
            await context.close();
            run.serverEvents = serverEvents.slice(start);
          }
        }
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}
writeFileSync(
  'build/rpg-dev-003/native-rsc-cancellation.json',
  JSON.stringify(
    {
      noBrowserInterception: true,
      noSession: true,
      productionProof: false,
      runs,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    runs.map(
      ({
        engine,
        delayed,
        repeat,
        errors,
        functionalPassed,
        externalRequests,
        serverEvents,
        failure,
      }) => ({
        engine,
        delayed,
        repeat,
        errors: errors.length,
        functionalPassed,
        externalRequests,
        cancelledRsc: serverEvents.filter((x) => x.rsc && x.cancelled).length,
        failure,
      }),
    ),
  ),
);
if (runs.some((run) => !run.functionalPassed || run.externalRequests.length))
  process.exitCode = 1;
