import { chromium, webkit } from '@playwright/test';
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const stage = process.argv[2] ?? 'before';
if (!['before', 'after', 'production'].includes(stage))
  throw Error('Invalid stage');
const origin = new URL(process.env.EQUIPMENT_QA_URL ?? 'http://127.0.0.1:3174')
  .origin;
if (
  !['127.0.0.1', 'rpgjovemcristao-web-inky.vercel.app'].includes(
    new URL(origin).hostname,
  )
)
  throw Error('Invalid QA origin');
const engine = process.env.EQUIPMENT_QA_BROWSER ?? 'chromium';
const out = path.join(
  root,
  `build/task-0074-equipment-body-fit-v3/${stage}/${engine}`,
);
await mkdir(out, { recursive: true });
const bundle = await build({
  stdin: {
    contents: `export {EQUIPMENT_CATALOG} from './apps/web/features/journey/data/equipmentCatalog.ts';`,
    resolveDir: root,
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
const browser = await (engine === 'webkit' ? webkit : chromium).launch({
  headless: true,
  ...(engine === 'webkit' ? {} : { channel: 'msedge' }),
});
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
const selected = process.env.EQUIPMENT_QA_SIZES?.split(',');
const samples = [],
  errors = [];
try {
  for (const [width, height] of sizes) {
    if (selected && !selected.includes(String(width))) continue;
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width <= 1024,
      hasTouch: width <= 1024,
      reducedMotion: 'reduce',
    });
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort(),
    );
    await context.addInitScript(() => {
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
      window.__equipmentCLS = 0;
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (!entry.hadRecentInput) window.__equipmentCLS += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
    });
    const page = await context.newPage();
    page.on('pageerror', (e) =>
      errors.push({ width, height, message: e.message }),
    );
    await page.goto(origin + '/journey/create');
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill('Equipamentos QA');
    await page
      .getByRole('button', { name: 'Criar Viajante', exact: true })
      .click();
    await page.getByRole('button', { name: /Entrar na jornada/ }).waitFor();
    await page.evaluate((items) => {
      const key = 'rpg-jovem-cristao:journey:v1',
        save = JSON.parse(localStorage.getItem(key));
      const t = save.travelers[0];
      t.appearance = { hair: 'curto', outfit: 'musgo', skin: 'medio' };
      t.avatar.gender = 'female';
      t.avatar.equippedItems = {};
      t.inventory = items;
      t.equipped = {};
      localStorage.setItem(key, JSON.stringify(save));
    }, EQUIPMENT_CATALOG);
    await page.waitForLoadState('networkidle');
    await page.goto(origin + '/journey/equipment');
    await page
      .locator('[data-avatar-mode="full"] [data-avatar-base]')
      .evaluate((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) =>
              image.addEventListener('load', resolve, { once: true }),
            ),
      );
    await page.evaluate(() => document.fonts.ready);
    const shot = async (name) => {
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        avatarSource: document
          .querySelector('[data-avatar-mode="full"] [data-avatar-base]')
          ?.getAttribute('src'),
        hdResources: performance
          .getEntriesByType('resource')
          .filter((r) => r.name.includes('/avatar/hd/'))
          .map((r) => ({
            name: new URL(r.name).pathname,
            bytes: r.transferSize,
            duration: r.duration,
          })),
        resourceBytes: performance
          .getEntriesByType('resource')
          .reduce((sum, r) => sum + (r.transferSize || 0), 0),
        cls: window.__equipmentCLS ?? null,
        heapBytes: performance.memory?.usedJSHeapSize ?? null,
      }));
      samples.push({ name, ...metrics });
      await page.screenshot({
        path: path.join(out, `${width}x${height}-${name}.png`),
        fullPage: false,
      });
    };
    await shot('portal');
    await page.getByRole('button', { name: 'Armadura', exact: true }).click();
    const card = page
      .locator('article')
      .filter({
        has: page.getByRole('heading', {
          name: 'Couraça do Viajante',
          exact: true,
        }),
      });
    await card.scrollIntoViewIfNeeded();
    await shot('item-comparison');
    const tryOn = card.getByRole('button', {
      name: 'Experimentar',
      exact: true,
    });
    if (await tryOn.isVisible()) {
      await tryOn.click();
      await page.getByRole('dialog', { name: /Experimentar/ }).waitFor();
      await shot('try-on');
      await page.getByRole('button', { name: 'Antes', exact: true }).click();
      await shot('try-on-before');
      await page.getByRole('button', { name: 'Depois', exact: true }).click();
      await page
        .getByRole('button', { name: 'Fechar painel', exact: true })
        .click();
    }
    if (stage !== 'before') {
      await card.getByRole('button', { name: 'Equipar', exact: true }).click();
      await card
        .getByRole('button', { name: 'Desequipar', exact: true })
        .waitFor();
      await page.locator('[data-avatar-mode="full"]').scrollIntoViewIfNeeded();
      await shot('equipped');
    }
    await page.waitForLoadState('networkidle');
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  path.join(out, 'metrics.json'),
  JSON.stringify(
    { stage, engine, samples, errors, physicalDevice: false },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    stage,
    engine,
    captures: samples.length,
    errors,
    overflow: samples
      .filter((s) => s.documentWidth > s.width)
      .map((s) => `${s.width}:${s.name}`),
  }),
);
