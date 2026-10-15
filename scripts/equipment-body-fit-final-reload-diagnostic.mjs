import { chromium } from '@playwright/test';
import { build } from 'esbuild';
const b = await build({
  stdin: {
    contents:
      "export {EQUIPMENT_CATALOG} from './apps/web/features/journey/data/equipmentCatalog.ts';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { EQUIPMENT_CATALOG } = await import(
  'data:text/javascript;base64,' +
    Buffer.from(b.outputFiles[0].text).toString('base64')
);
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BODY_FIT_QA_CHANNEL || 'msedge',
});
try {
  for (const blockPrefetch of ['no-shot', 'viewport-shot']) {
    const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      }),
      page = await ctx.newPage();
    const pending = new Set();
    page.on('request', (r) => pending.add(r));
    for (const e of ['requestfinished', 'requestfailed'])
      page.on(e, (r) => pending.delete(r));
    await page.addInitScript(() =>
      localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
    );
    await page.goto('http://127.0.0.1:3175/journey/create');
    await page
      .getByLabel('Nome do Viajante', { exact: true })
      .fill('QA reload sintetico');
    await page
      .getByRole('button', { name: 'Criar Viajante', exact: true })
      .click();
    await page.getByRole('button', { name: /Entrar na jornada/ }).waitFor();
    await page.evaluate((items) => {
      const k = 'rpg-jovem-cristao:journey:v1',
        s = JSON.parse(localStorage.getItem(k)),
        t = s.travelers[0];
      t.avatar.gender = 'female';
      t.appearance = { hair: 'curto', outfit: 'musgo', skin: 'medio' };
      t.inventory = items;
      t.equipped = { armor: 'traveler-armor-uncommon' };
      localStorage.setItem(k, JSON.stringify(s));
    }, EQUIPMENT_CATALOG);
    await page.goto('http://127.0.0.1:3175/journey/equipment');
    await page
      .locator('[data-mobile-screen="equipment"] [data-overlay-item]')
      .waitFor();
    if (blockPrefetch === 'viewport-shot')
      await page.screenshot({
        path: `build/task-0075-body-fit-final-review/reload-diagnostic-${blockPrefetch}.png`,
        fullPage: false,
      });
    console.log(
      'before reload',
      JSON.stringify({
        blockPrefetch,
        pending: [...pending].map((r) => new URL(r.url()).pathname),
      }),
    );
    if (blockPrefetch === 'unroute')
      await page.unrouteAll({ behavior: 'ignoreErrors' });
    try {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
      console.log('reload PASS', blockPrefetch);
    } catch {
      console.log(
        'reload FAIL',
        JSON.stringify({
          blockPrefetch,
          pending: [...pending].map((r) => new URL(r.url()).pathname),
        }),
      );
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
