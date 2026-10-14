import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const mode = process.argv[2] ?? 'before';
assert(['before', 'after'].includes(mode));
const baseURL = process.env.MOBILE_QA_URL ?? 'http://127.0.0.1:3162';
assert.equal(new URL(baseURL).hostname, '127.0.0.1');
const OUT = path.join(ROOT, 'build/task-0062-mobile-experience', mode);
await mkdir(OUT, { recursive: true });
const bundle = await build({
  stdin: {
    contents:
      "export { EQUIPMENT_CATALOG } from './apps/web/features/journey/data/equipmentCatalog.ts';",
    resolveDir: ROOT,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { EQUIPMENT_CATALOG } = await import(
  'data:text/javascript;base64,' +
    Buffer.from(bundle.outputFiles[0].text).toString('base64')
);
const sizes = [
  [360, 800],
  [375, 812],
  [390, 844],
  [412, 915],
  [430, 932],
  [844, 390],
  [915, 412],
  [768, 1024],
  [1440, 900],
  [1920, 1080],
];
const routes = [
  ['home', '/'],
  ['journey', '/journey'],
  ['hero', '/journey/hero'],
  ['equipment', '/journey/equipment'],
  ['arena', '/journey/arena'],
  ['guild', '/journey/guild'],
  ['diary', '/journey/diary'],
  ['backpack', '/journey/backpack'],
  ['shop', '/journey/shop'],
  ['act', '/journey/acts/as-origens'],
  ['preview', '/journey/phases/o-jardim-e-a-escolha/preview'],
];
// Optional named screens refresh only affected measurements after a localized fix.
const selected = new Set(process.argv.slice(3));
assert(
  selected.size === 0 || mode === 'after',
  'Partial refresh is only allowed for after',
);
const wanted = (name) => selected.size === 0 || selected.has(name);
const previous = selected.size
  ? JSON.parse(await readFile(path.join(OUT, 'metrics.json')))
  : null;
if (previous) assert(!previous.partial && previous.samples.length === 200);
const samples = previous
    ? previous.samples.filter((s) => !selected.has(s.name))
    : [],
  errors = [],
  blockedExternal = [];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.protocol.startsWith('http') && url.hostname !== '127.0.0.1') {
      blockedExternal.push(url.hostname);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  const visit = async (route) => {
    await page.goto(baseURL + route, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    // Exploration intentionally hides the phase heading while keeping its DOM semantics.
    await page.locator('h1').first().waitFor({ state: 'attached' });
  };
  const measure = async (name) => {
    const metric = await page.evaluate(() => {
      const visible = (n) =>
        n.getBoundingClientRect().width > 0 &&
        n.getBoundingClientRect().height > 0 &&
        getComputedStyle(n).visibility !== 'hidden';
      const texts = [
        ...document.querySelectorAll(
          'main p,main label,main dt,main small,main button,main a,main summary',
        ),
      ]
        .filter(visible)
        .map((n) => ({
          tag: n.tagName,
          className: n.className,
          text: n.textContent.trim().slice(0, 65),
          fontSize: parseFloat(getComputedStyle(n).fontSize),
          width: n.getBoundingClientRect().width,
        }));
      const targets = [
        ...document.querySelectorAll(
          'main button,main a,main select,main summary,header button',
        ),
      ]
        .filter(visible)
        .map((n) => ({
          tag: n.tagName,
          text: (n.getAttribute('aria-label') || n.textContent)
            .trim()
            .slice(0, 50),
          width: n.getBoundingClientRect().width,
          height: n.getBoundingClientRect().height,
        }));
      const main = document.querySelector('main')?.getBoundingClientRect();
      const img = [...document.images]
        .filter((i) => i.src.includes('/avatar/hd/'))
        .map((i) => ({
          path: new URL(i.src).pathname,
          loaded: i.complete && i.naturalWidth > 0,
          width: i.width,
          height: i.height,
          fit: getComputedStyle(i).objectFit,
        }));
      const overflow = [...document.querySelectorAll('main *')]
        .filter(visible)
        .filter((n) => n.getBoundingClientRect().right > innerWidth + 1)
        .map((n) => ({
          tag: n.tagName,
          className: n.className,
          right: n.getBoundingClientRect().right,
          text: n.textContent.trim().slice(0, 60),
        }))
        .slice(0, 8);
      return {
        innerWidth,
        viewport: document.querySelector('meta[name="viewport"]')?.content,
        scrollWidth: document.documentElement.scrollWidth,
        mainWidth: main?.width,
        textBelow14: texts.filter((t) => t.fontSize < 14),
        smallestText: Math.min(...texts.map((t) => t.fontSize)),
        targetsBelow44: targets.filter((t) => t.width < 44 || t.height < 44),
        images: img,
        hdRequests: [
          ...new Set(
            performance
              .getEntriesByType('resource')
              .filter((r) => r.name.includes('/avatar/hd/'))
              .map((r) => new URL(r.name).pathname),
          ),
        ],
        overflow,
      };
    });
    const size = page.viewportSize();
    const entry = { name, ...size, ...metric };
    samples.push(entry);
    await writeFile(
      path.join(OUT, 'metrics.json'),
      JSON.stringify({ mode, samples, errors, partial: true }, null, 2) + '\n',
    );
    if (size.width === 390 || size.width === 1440)
      await page.screenshot({
        path: path.join(OUT, `${name}-${size.width}x${size.height}.png`),
        fullPage: true,
      });
    console.log(
      `${mode} ${name} ${size.width}x${size.height} overflow=${metric.scrollWidth - metric.innerWidth} small=${metric.textBelow14.length} touch=${metric.targetsBelow44.length}`,
    );
  };
  // Login/signup are presentation-only: never submit a real account form.
  for (const [width, height] of sizes) {
    if (!wanted('login') && !wanted('signup')) break;
    await page.setViewportSize({ width, height });
    await visit('/auth');
    if (wanted('login')) await measure('login');
    await page.getByRole('button', { name: 'Ainda não tenho conta' }).click();
    if (wanted('signup')) await measure('signup');
  }
  await page.addInitScript(() =>
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
  );
  for (const [width, height] of sizes) {
    if (!wanted('create')) break;
    await page.setViewportSize({ width, height });
    await visit('/journey/create');
    await measure('create');
  }
  if (!wanted('create')) await visit('/journey/create');
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Lia QA Mobile');
  await page
    .getByRole('button', { name: 'Criar Viajante', exact: true })
    .click();
  await page.waitForURL('**/journey/intro');
  await page.evaluate((items) => {
    const key = 'rpg-jovem-cristao:journey:v1',
      save = JSON.parse(localStorage.getItem(key));
    // Synthetic storage belongs only to this disposable browser context.
    save.travelers[0].inventory = items;
    localStorage.setItem(key, JSON.stringify(save));
  }, EQUIPMENT_CATALOG);
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const [name, route] of routes) {
      if (!wanted(name)) continue;
      await visit(route);
      await measure(name);
    }
    for (const step of [
      'explore',
      'reading',
      'reflection',
      'quiz',
      'snake',
      'reward',
    ]) {
      if (!wanted(step)) continue;
      await page.evaluate((step) => {
        const key = 'rpg-jovem-cristao:journey:v1',
          save = JSON.parse(localStorage.getItem(key));
        const p = save.travelers[0].progress;
        p.gardenStep = step;
        p.gardenFragments = step === 'explore' ? 0 : 3;
        p.bibleReading.genesis2Confirmed = step !== 'reading';
        p.bibleReading.genesis3Confirmed = step !== 'reading';
        p.bibleReading.comprehensionCompleted = step !== 'reading';
        p.devotionalCompleted = step !== 'reflection';
        p.snakeTutorialCompleted = true;
        localStorage.setItem(key, JSON.stringify(save));
      }, step);
      await visit('/journey/phases/o-jardim-e-a-escolha');
      await measure(step);
    }
  }
  const result = {
    mode,
    samples,
    errors,
    blockedExternal: [...new Set(blockedExternal)],
    physicalDevice: false,
    browser: 'Edge headless, touch/mobile emulation',
    at: new Date().toISOString(),
  };
  await writeFile(
    path.join(OUT, 'metrics.json'),
    JSON.stringify(result, null, 2) + '\n',
  );
  console.log(
    JSON.stringify({
      mode,
      samples: samples.length,
      overflowSamples: samples.filter((s) => s.scrollWidth > s.innerWidth + 1)
        .length,
      errors,
    }),
  );
} finally {
  await browser.close();
}
