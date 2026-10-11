import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { webkit, devices } from '@playwright/test';
const out = fileURLToPath(
  new URL(
    '../build/task-0064-mobile-game-mode/webkit-navigation/',
    import.meta.url,
  ),
);
await mkdir(out, { recursive: true });
const browser = await webkit.launch();
const events = [];
let phase = 'setup';
try {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
  });
  await context.route(
    (url) =>
      url.origin !== 'http://127.0.0.1:3165' && url.protocol.startsWith('http'),
    (route) => route.abort(),
  );
  await context.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  const page = await context.newPage();
  page.on('pageerror', (error) =>
    events.push({
      phase,
      kind: 'pageerror',
      message: error.message,
      stack: error.stack,
      url: page.url(),
      at: Date.now(),
    }),
  );
  page.on('requestfailed', (request) =>
    events.push({
      phase,
      kind: 'requestfailed',
      url: request.url(),
      resource: request.resourceType(),
      failure: request.failure(),
      page: page.url(),
      at: Date.now(),
    }),
  );
  await page.goto('http://127.0.0.1:3165/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Navegação QA');
  await page
    .getByRole('button', { name: 'Criar Viajante', exact: true })
    .click();
  await page.waitForURL('**/journey/intro');
  await page.goto('http://127.0.0.1:3165/', { waitUntil: 'networkidle' });
  phase = 'touch-SPA';
  for (const name of ['Equipar', 'Arena', 'Guilda', 'Diário', 'Jornada']) {
    await page
      .getByRole('navigation', { name: 'Navegação do jogo', exact: true })
      .getByRole('link', { name, exact: true })
      .tap();
    await page.locator('main h1').first().waitFor();
    await page.waitForLoadState('networkidle');
  }
  phase = 'hard-navigation';
  for (const route of [
    '/journey/equipment',
    '/journey/arena',
    '/journey/guild',
    '/journey/diary',
    '/',
  ]) {
    await page.goto('http://127.0.0.1:3165' + route, {
      waitUntil: 'networkidle',
    });
    await page.locator('main h1').first().waitFor();
  }
  phase = 'resize-and-hard-navigation';
  for (const width of [1440, 390, 1920, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://127.0.0.1:3165/journey/diary', {
      waitUntil: 'networkidle',
    });
    await page.locator('main h1').first().waitFor();
  }
  await writeFile(
    out + 'events.json',
    JSON.stringify(
      {
        events,
        physicalDevice: false,
        browser: 'Playwright WebKit Windows',
        task: 'Correlate cancelled requests with page errors; do not suppress unclassified errors.',
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(events));
} finally {
  await browser.close();
}
