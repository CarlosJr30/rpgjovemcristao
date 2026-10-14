import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from '@playwright/test';
import { build } from 'esbuild';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const mode = process.argv[2] ?? 'before';
assert(['before', 'after'].includes(mode));
const baseURL = process.env.MOBILE_QA_URL ?? 'http://127.0.0.1:3162';
assert(
  ['127.0.0.1', 'rpgjovemcristao-web-inky.vercel.app'].includes(
    new URL(baseURL).hostname,
  ),
);
const OUT = path.join(
  ROOT,
  'build/task-0064-mobile-game-mode',
  process.env.MOBILE_QA_RUN ?? process.env.MOBILE_QA_BROWSER ?? 'chromium',
  mode,
);
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
  [320, 568],
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
if (process.env.MOBILE_QA_PUBLISHED)
  sizes.splice(0, sizes.length, [390, 844], [1440, 900]);
const selected = new Set(process.argv.slice(3));
assert(
  selected.size === 0 || process.env.MOBILE_QA_RUN,
  'Subsets require a separate evidence run',
);
const wanted = (name) => selected.size === 0 || selected.has(name);
const samples = [],
  errors = [],
  blockedExternal = [];
const browser = await (
  process.env.MOBILE_QA_BROWSER === 'webkit' ? webkit : chromium
).launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    deviceScaleFactor: 3,
    userAgent:
      process.env.MOBILE_QA_BROWSER === 'webkit'
        ? undefined
        : 'Mozilla/5.0 (Linux; Android 15; POCO X7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',
  });
  await context.addInitScript(() => {
    window.__gameQA = {
      cls: 0,
      lcp: null,
      shifts: [],
      supported: PerformanceObserver.supportedEntryTypes,
    };
    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift'))
      new PerformanceObserver((list) => {
        for (const s of list.getEntries())
          if (!s.hadRecentInput) {
            window.__gameQA.cls += s.value;
            window.__gameQA.shifts.push(s.value);
          }
      }).observe({ type: 'layout-shift', buffered: true });
    if (
      PerformanceObserver.supportedEntryTypes.includes(
        'largest-contentful-paint',
      )
    )
      new PerformanceObserver((list) => {
        window.__gameQA.lcp = list.getEntries().at(-1)?.startTime ?? null;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await context.route(
    (url) =>
      url.protocol.startsWith('http') && url.origin !== new URL(baseURL).origin,
    (route) => {
      const url = new URL(route.request().url());
      blockedExternal.push(url.hostname);
      return route.abort();
    },
  );
  let page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  const visit = async (route) => {
    if (process.env.MOBILE_QA_FRESH_PAGES === '1') {
      const viewport = page.viewportSize();
      // Disposal is outside the snapshot: still capture all errors in each live page.
      page.removeAllListeners('pageerror');
      await page.close();
      page = await context.newPage();
      await page.setViewportSize(viewport);
      page.on('pageerror', (e) => errors.push(e.message));
    }
    // Finish pending same-origin prefetches before forcing a new document.
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    if (page.url() !== 'about:blank')
      await page.waitForLoadState('networkidle');
    await page.goto(baseURL + route, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    // Exploration intentionally hides the phase heading while keeping its DOM semantics.
    await page.locator('h1').first().waitFor({ state: 'attached' });
    await page.locator('main').first().waitFor({ state: 'visible' });
  };
  const measure = async (name) => {
    await page.locator('[data-avatar-base]').evaluateAll(async (images) => {
      await Promise.all(
        images
          .filter((img) => img.getBoundingClientRect().width > 0)
          .map(async (img) => {
            if (!img.complete)
              await new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              });
            if (img.naturalWidth) await img.decode().catch(() => {});
          }),
      );
    });
    await page.evaluate(() => scrollTo(0, 0));
    const metric = await page.evaluate(() => {
      const visible = (n) =>
        n.checkVisibility() &&
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
      const mainElement = document.querySelector('main');
      const main = mainElement?.getBoundingClientRect();
      const mainStyle = mainElement ? getComputedStyle(mainElement) : null;
      const nav = document.querySelector('nav[aria-label="Navegação do jogo"]');
      const unobscuredBottom =
        nav && visible(nav) ? nav.getBoundingClientRect().top : innerHeight;
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
        clientWidth: document.documentElement.clientWidth,
        innerHeight,
        dpr: devicePixelRatio,
        root: [
          'html',
          'body',
          '[data-game-shell], [class*="__shell"]',
          'main',
        ].map((selector) => {
          const n = document.querySelector(selector);
          if (!n) return { selector };
          const c = getComputedStyle(n),
            r = n.getBoundingClientRect();
          return {
            selector,
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            maxWidth: c.maxWidth,
            minWidth: c.minWidth,
            padding: c.padding,
            transform: c.transform,
            zoom: c.zoom,
          };
        }),
        usefulRatio:
          (main.width -
            parseFloat(mainStyle.paddingLeft) -
            parseFloat(mainStyle.paddingRight)) /
          innerWidth,
        unobscuredBottom,
        hudOcclusion: [
          ...document.querySelectorAll(
            '[data-testid="arena-stage"] article[data-side]',
          ),
        ].map((n) => {
          const hud = n.children[0]?.getBoundingClientRect(),
            actor = n.children[1]?.getBoundingClientRect();
          if (!hud || !actor) return null;
          return {
            side: n.getAttribute('data-side'),
            overlapArea:
              Math.max(
                0,
                Math.min(hud.right, actor.right) -
                  Math.max(hud.left, actor.left),
              ) *
              Math.max(
                0,
                Math.min(hud.bottom, actor.bottom) -
                  Math.max(hud.top, actor.top),
              ),
          };
        }),
        avatars: [...document.querySelectorAll('main [data-avatar-base]')]
          .filter(visible)
          .map((n) => {
            const r = n.getBoundingClientRect();
            return {
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              visibleArea:
                Math.max(
                  0,
                  Math.min(r.right, innerWidth) - Math.max(r.left, 0),
                ) *
                Math.max(
                  0,
                  Math.min(r.bottom, unobscuredBottom) - Math.max(r.top, 0),
                ),
            };
          }),
        controls: [...document.querySelectorAll('main button,main a')]
          .filter(visible)
          .map((n) => {
            const r = n.getBoundingClientRect();
            return {
              name: (n.getAttribute('aria-label') || n.textContent)
                .trim()
                .slice(0, 60),
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              inViewport: r.top >= 0 && r.bottom <= innerHeight,
            };
          }),
        field: (() => {
          const n = document.querySelector(
            '[data-testid="arena-stage"],canvas[role="application"]',
          );
          if (!n) return null;
          const r = n.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        })(),
        performance: {
          cls: window.__gameQA?.supported.includes('layout-shift')
            ? window.__gameQA.cls
            : null,
          lcpMs: window.__gameQA?.lcp ?? null,
          heapBytes: performance.memory?.usedJSHeapSize ?? null,
          measurement:
            'Local controlled observation, not field Core Web Vitals or physical mobile memory',
          resources: performance.getEntriesByType('resource').length,
          transferBytes: performance
            .getEntriesByType('resource')
            .reduce((a, r) => a + r.transferSize, 0),
        },
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
    if ([320, 390, 844, 1440].includes(size.width))
      await page.screenshot({
        path: path.join(OUT, `${name}-${size.width}x${size.height}.png`),
        scale: 'css',
        fullPage: false,
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
  await context.addInitScript(() =>
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
      if (name === 'arena') {
        await page.getByRole('button', { name: /Davi,/ }).click();
        await page
          .getByRole('button', { name: 'Iniciar batalha', exact: true })
          .click();
        await measure('arena-battle');
      }
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
    browser: process.env.MOBILE_QA_BROWSER ?? 'chromium',
    measurementIsolation:
      process.env.MOBILE_QA_FRESH_PAGES === '1'
        ? 'Fresh page per snapshot; context local fixture retained. Page disposal errors excluded, live page errors recorded.'
        : 'Repeated navigation in one page',
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
