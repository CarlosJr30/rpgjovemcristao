import { createServer } from 'node:http';
import { chromium, webkit } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

// Reduced lifecycle experiment. No framework, routing, cookies, Auth or CORS rules.
const origin = 'http://127.0.0.1:3204';
mkdirSync('build/rpg-dev-004', { recursive: true });
let replacementSeen, releaseReplacement;
const apiRequests = [];
const server = createServer((req, res) => {
  const url = new URL(req.url, origin);
  if (req.method !== 'GET') {
    res.writeHead(405);
    res.end();
    return;
  }
  if (url.pathname === '/api') {
    apiRequests.push(url.searchParams.get('id'));
    res.end('ok');
    return;
  }
  if (url.pathname === '/replacement') {
    replacementSeen();
    void new Promise((resolve) => {
      releaseReplacement = resolve;
    }).then(() => {
      res.setHeader('Content-Type', 'text/html');
      res.end('<h1>Replacement</h1>');
    });
    return;
  }
  res.setHeader('Content-Type', 'text/html');
  res.end(
    '<!doctype html><h1>Lifecycle control</h1><script>window.domEvents=[]; addEventListener("error",e=>domEvents.push({kind:"error",message:e.message})); addEventListener("unhandledrejection",e=>domEvents.push({kind:"unhandledrejection",message:String(e.reason)}));</script>',
  );
});
await new Promise((resolve) => server.listen(3204, '127.0.0.1', resolve));
const runs = [];
try {
  for (const [engine, launcher] of [
    ['chromium', chromium],
    ['webkit', webkit],
  ]) {
    const browser = await launcher.launch();
    try {
      for (
        let repeat = 0;
        repeat < (process.argv.includes('--smoke') ? 1 : 3);
        repeat++
      ) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const run = {
          engine,
          repeat,
          pageErrors: [],
          failures: [],
          functionalPassed: false,
        };
        runs.push(run);
        page.on('pageerror', (e) =>
          run.pageErrors.push({
            name: e.name,
            message: e.message,
            stack: e.stack,
          }),
        );
        page.on('requestfailed', (req) =>
          run.failures.push({
            path: new URL(req.url()).pathname,
            message: req.failure()?.errorText,
          }),
        );
        try {
          await page.goto(origin + '/page');
          const document = await page.evaluateHandle(() => window.document);
          const fetchFromDocument = (id) =>
            document.evaluate(async (doc, id) => {
              try {
                const response = await doc.defaultView.fetch('/api?id=' + id);
                return {
                  status: response.status,
                  domEvents: [...doc.defaultView.domEvents],
                };
              } catch (error) {
                return {
                  caught: true,
                  name: error.name,
                  message: error.message,
                  domEvents: [...doc.defaultView.domEvents],
                };
              }
            }, id);
          run.control = await fetchFromDocument(engine + repeat + '-control');
          let reached;
          const seen = new Promise((resolve) => {
            reached = resolve;
          });
          replacementSeen = reached;
          const navigation = page.goto(origin + '/replacement');
          await seen;
          const id = engine + repeat + '-provisional';
          const attempt = fetchFromDocument(id).then(
            (result) => ({ result }),
            (error) => ({ evaluationError: error.message }),
          );
          run.provisionalBeforeCommit = await Promise.race([
            attempt,
            new Promise((resolve) =>
              setTimeout(() => resolve({ pending: true }), 250),
            ),
          ]);
          run.apiReachedBeforeCommit = apiRequests.includes(id);
          run.domEventsBeforeCommit =
            run.provisionalBeforeCommit.result?.domEvents ?? null;
          releaseReplacement();
          await navigation;
          run.provisionalAfterCommit = await Promise.race([
            attempt,
            new Promise((resolve) =>
              setTimeout(() => resolve({ pending: true }), 1500),
            ),
          ]);
          run.functionalPassed =
            run.control.status === 200 &&
            (await page
              .getByRole('heading', { name: 'Replacement' })
              .count()) === 1;
        } catch (error) {
          if (releaseReplacement) releaseReplacement();
          run.failure = error.message;
        } finally {
          await context.close();
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
  'build/rpg-dev-004/provisional-fetch.json',
  JSON.stringify(
    { origin, browserRouting: false, synthetic: true, runs },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    runs.map(
      ({
        engine,
        repeat,
        control,
        provisionalBeforeCommit,
        apiReachedBeforeCommit,
        domEventsBeforeCommit,
        pageErrors,
        functionalPassed,
        failure,
      }) => ({
        engine,
        repeat,
        control,
        provisionalBeforeCommit,
        apiReachedBeforeCommit,
        domEventsBeforeCommit,
        pageErrors: pageErrors.length,
        functionalPassed,
        failure,
      }),
    ),
  ),
);
if (runs.some((run) => !run.functionalPassed)) process.exitCode = 1;
