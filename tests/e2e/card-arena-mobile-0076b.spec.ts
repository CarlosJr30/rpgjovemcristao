import { test, expect, type Page } from '@playwright/test';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';

const stage = process.env.TASK_0076B_STAGE ?? 'after';
async function prepare(page: Page) {
  const traveler = createTraveler(
    'Viajante Mobile',
    DEFAULT_APPEARANCE,
    '00000000-0000-4000-8000-00000000007b',
    '2026-10-17T00:00:00.000Z',
  );
  traveler.progress.introCompleted = true;
  await page
    .context()
    .route('**/*', (route) =>
      new URL(route.request().url()).origin === 'http://127.0.0.1:3377'
        ? route.continue()
        : route.abort(),
    );
  await page.addInitScript((traveler) => {
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
    localStorage.setItem(
      'rpg-jovem-cristao:journey:v1',
      JSON.stringify({ version: 2, travelers: [traveler] }),
    );
    localStorage.setItem(
      'rpg-jovem-cristao:active-traveler-id:v1',
      traveler.id,
    );
    localStorage.setItem('rpg-jovem-cristao:active-traveler:v1', 'active');
    Object.defineProperty(crypto, 'getRandomValues', {
      value: (array: Uint32Array) => {
        array[0] = 123;
        return array;
      },
    });
  }, traveler);
  await page.goto('/journey/arena');
  await page
    .getByRole('button', { name: 'Treinar com Davi, o Aprendiz', exact: true })
    .tap();
  await expect(page.locator('[data-card-arena-state]')).toHaveAttribute(
    'data-card-arena-state',
    'player',
  );
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
  await page.locator('[data-avatar-base]').last().waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
const sizes = [
  [406, 904],
  [904, 406],
  [320, 568],
  [360, 740],
  [568, 320],
  [740, 360],
  [393, 873],
  [873, 393],
  [768, 1024],
  [1280, 800],
];
for (const [width, height] of sizes) {
  test(`layout ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await prepare(page);
    const field = page.getByLabel('Campo de batalha', { exact: true });
    await field.scrollIntoViewIfNeeded();
    for (const image of await field.locator('img').all()) {
      await expect(image).toHaveJSProperty('complete', true);
      expect(
        await image.evaluate((node: HTMLImageElement) => node.naturalWidth),
      ).toBeGreaterThan(0);
    }
    await page.screenshot({
      path: info.outputPath(`${stage}-${width}x${height}.png`),
      fullPage: true,
    });
    const metrics = await page.evaluate(() => {
      const rect = (e: Element) => {
        const r = e.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          right: r.right,
          bottom: r.bottom,
        };
      };
      const field = document.querySelector('[aria-label="Campo de batalha"]')!;
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        field: rect(field),
        cards: Array.from(document.querySelectorAll('[data-card-id]')).map(
          rect,
        ),
        fighters: Array.from(field.querySelectorAll('[data-side]')).map(
          (e) => ({
            box: rect(e),
            image: Array.from(e.querySelectorAll('img')).map(rect),
          }),
        ),
      };
    });
    await info.attach('geometry', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    });
    if (stage === 'before') return;
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    for (const r of metrics.cards) {
      expect(r.width).toBeGreaterThanOrEqual(70);
      expect(r.height).toBeGreaterThanOrEqual(60);
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.right).toBeLessThanOrEqual(width + 1);
    }
    for (const f of metrics.fighters)
      for (const img of f.image) {
        expect(img.x).toBeGreaterThanOrEqual(metrics.field.x - 1);
        expect(img.right).toBeLessThanOrEqual(metrics.field.right + 1);
        expect(img.y).toBeGreaterThanOrEqual(metrics.field.y - 1);
        expect(img.bottom).toBeLessThanOrEqual(metrics.field.bottom + 1);
      }
    const bars = await field
      .locator('progress')
      .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().y));
    expect(Math.abs(bars[0] - bars[1])).toBeLessThanOrEqual(1);
    const bottoms = await field
      .locator('[data-motion]')
      .evaluateAll((nodes) =>
        nodes
          .filter((n) => n.tagName === 'DIV')
          .map((n) => n.getBoundingClientRect().bottom),
      );
    expect(Math.abs(bottoms[0] - bottoms[1])).toBeLessThanOrEqual(5); // independent breathing phases remain enabled
  });
}

test('touch selection, stable controls during action, turn completion and rotation', async ({
  page,
}, info) => {
  test.skip(stage === 'before', 'Baseline capture only');
  await page.setViewportSize({ width: 406, height: 904 });
  await prepare(page);
  const end = page.getByRole('button', { name: 'Encerrar turno', exact: true });
  await page
    .getByRole('button', { name: /^Ampliar Golpe Rápido/ })
    .first()
    .tap();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: info.outputPath('touch-preview.png') });
  await page.evaluate(() => {
    const record = window as unknown as {
      arenaButtonPositions: number[];
      arenaSamplingDone: boolean;
    };
    record.arenaButtonPositions = [];
    record.arenaSamplingDone = false;
    const began = performance.now();
    const sample = () => {
      const button = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent === 'Encerrar turno',
      )!;
      record.arenaButtonPositions.push(
        button.getBoundingClientRect().top + scrollY,
      );
      if (performance.now() - began < 1000) requestAnimationFrame(sample);
      else record.arenaSamplingDone = true;
    };
    requestAnimationFrame(sample);
  });
  await page.getByRole('button', { name: 'Jogar carta', exact: true }).tap();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByLabel('Energia 2 de 3', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(4);
  await page.waitForFunction(
    () =>
      (window as unknown as { arenaSamplingDone: boolean }).arenaSamplingDone,
  );
  const movement = await page.evaluate(() => {
    const p = (window as unknown as { arenaButtonPositions: number[] })
      .arenaButtonPositions;
    return Math.max(...p) - Math.min(...p);
  });
  expect(movement).toBeLessThanOrEqual(1);
  await expect(end).toBeEnabled();
  await end.tap();
  await expect(
    page.getByLabel('Energia 3 de 3', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-card-arena-state]')).toHaveAttribute(
    'data-card-arena-state',
    'player',
  );
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
  await page.setViewportSize({ width: 904, height: 406 });
  await expect(end).toBeEnabled();
  await page.locator('[data-card-id]').first().tap();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar carta', exact: true }).tap();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: info.outputPath('after-rotation.png'),
    fullPage: true,
  });
});

test('large text and reduced motion retain all five selectable cards', async ({
  page,
}, info) => {
  test.skip(stage === 'before', 'Baseline capture only');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await prepare(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const cards = page.locator('[data-card-id]');
  await expect(cards).toHaveCount(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await info.attach('large-text-geometry', {
    body: JSON.stringify(
      await cards.evaluateAll((nodes) =>
        nodes.map((card) => ({
          card: {
            text: card.textContent,
            width: card.clientWidth,
            scroll: card.scrollWidth,
          },
          children: Array.from(card.querySelectorAll('*')).map((n) => ({
            text: n.textContent,
            tag: n.tagName,
            class: n.className,
            maxWidth: getComputedStyle(n).maxWidth,
            overflowWrap: getComputedStyle(n).overflowWrap,
            width: n.clientWidth,
            scroll: n.scrollWidth,
            rect: n.getBoundingClientRect().toJSON(),
          })),
        })),
      ),
      null,
      2,
    ),
    contentType: 'application/json',
  });
  await page.screenshot({
    path: info.outputPath('text-200-reduced.png'),
    fullPage: true,
  });
  for (const card of await cards.all()) {
    expect(
      await card.evaluate((n) => n.scrollWidth - n.clientWidth),
    ).toBeLessThanOrEqual(1);
    await card.tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Fechar carta', exact: true }).tap();
  }
  await page.screenshot({
    path: info.outputPath('text-200-reduced.png'),
    fullPage: true,
  });
});

test('safe area insets keep cards and preview inside usable screen', async ({
  page,
  browserName,
}, info) => {
  test.skip(
    stage === 'before' || browserName !== 'chromium',
    'CDP emulation is Chromium-only',
  );
  await page.setViewportSize({ width: 904, height: 406 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', {
    insets: { top: 24, right: 36, bottom: 20, left: 28 },
  });
  await prepare(page);
  for (const size of [
    { width: 904, height: 406 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(size);
    const metrics = await page
      .locator('[data-card-id]')
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getBoundingClientRect().toJSON()),
      );
    for (const rect of metrics) {
      expect(rect.left).toBeGreaterThanOrEqual(28);
      expect(rect.right).toBeLessThanOrEqual(size.width - 36);
    }
    await page.locator('[data-card-id]').first().tap();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Keep the shell header on-screen to detect stacking/close-button interception.
    await page.evaluate(() => window.scrollTo(0, 0));
    const rect = await dialog.evaluate((n) =>
      n.getBoundingClientRect().toJSON(),
    );
    expect(rect.left).toBeGreaterThanOrEqual(28);
    expect(rect.right).toBeLessThanOrEqual(size.width - 36);
    expect(rect.top).toBeGreaterThanOrEqual(24);
    expect(rect.bottom).toBeLessThanOrEqual(size.height - 20);
    await info.attach(`safe-area-${size.width}`, {
      body: JSON.stringify({ cards: metrics, dialog: rect }),
      contentType: 'application/json',
    });
    await page.screenshot({
      path: info.outputPath(`safe-area-${size.width}.png`),
    });
    await page.getByRole('button', { name: 'Fechar carta', exact: true }).tap();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  }
});

test('controls remain reachable after hand shrinks and energy runs out', async ({
  page,
}, info) => {
  test.skip(stage === 'before', 'Baseline capture only');
  await page.setViewportSize({ width: 406, height: 904 });
  await prepare(page);
  const end = page.getByRole('button', { name: 'Encerrar turno', exact: true });
  const originalTop = await end.evaluate(
    (n) => n.getBoundingClientRect().top + scrollY,
  );
  const names = [
    /^Ampliar Golpe R\u00e1pido/,
    /^Ampliar Golpe R\u00e1pido/,
    /^Ampliar Perseveran\u00e7a/,
  ];
  for (let index = 0; index < names.length; index++) {
    await page.getByRole('button', { name: names[index] }).first().tap();
    await page.getByRole('button', { name: 'Jogar carta', exact: true }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-card-id]')).toHaveCount(4 - index);
    await expect(end).toBeEnabled();
    expect(
      Math.abs(
        (await end.evaluate((n) => n.getBoundingClientRect().top + scrollY)) -
          originalTop,
      ),
    ).toBeLessThanOrEqual(1);
  }
  await expect(
    page.getByLabel('Energia 0 de 3', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[data-card-id][data-unavailable="true"]'),
  ).toHaveCount(1);
  await page.screenshot({
    path: info.outputPath('two-cards-zero-energy.png'),
    fullPage: true,
  });
  await end.tap();
  await expect(
    page.getByLabel('Energia 3 de 3', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(5);
});
