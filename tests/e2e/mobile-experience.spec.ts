import { expect, test } from '@playwright/test';

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

test('TASK-0062: criação sem sobreposição, toque, teclado e modal em dez viewports', async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  await page.context().route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.protocol.startsWith('http') && url.hostname !== '127.0.0.1'
      ? route.abort()
      : route.continue();
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');
    Object.assign(window, { mobileLayoutShifts: [], mobileShiftSources: [] });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!shift.hadRecentInput) {
          (
            window as unknown as { mobileLayoutShifts: number[] }
          ).mobileLayoutShifts.push(shift.value);
          (
            window as unknown as { mobileShiftSources: unknown[] }
          ).mobileShiftSources.push({
            value: shift.value,
            sources: (
              entry as unknown as {
                sources: {
                  node?: Element;
                  previousRect: DOMRectReadOnly;
                  currentRect: DOMRectReadOnly;
                }[];
              }
            ).sources.map((s) => ({
              node: s.node?.className,
              previous: s.previousRect.toJSON(),
              current: s.currentRect.toJSON(),
            })),
          });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto('/journey/create');
    await expect(
      page.getByLabel('Nome do Viajante', { exact: true }),
    ).toBeVisible();
    const avatar = page.locator(
      '[class*="avatarScene"] [data-avatar-mode="card"]',
    );
    await expect(avatar).toBeVisible();
    const rect = await avatar.boundingBox();
    const title = await page
      .locator('[class*="characterStage"] h2')
      .boundingBox();
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(title!.y + 1);
    expect(rect!.width / rect!.height).toBeCloseTo(2 / 3, 2);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    if (width <= 800 || (info.project.name === 'mobile' && width <= 1024)) {
      expect(
        await page
          .getByLabel('Nome do Viajante', { exact: true })
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(16);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByLabel('Nome do Viajante', { exact: true })
    .fill('Lia Mobile QA');
  await page
    .getByRole('button', { name: 'Criar Viajante', exact: true })
    .click();
  await expect(page).toHaveURL('/journey/intro');
  await page.goto('/');
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).tap();
  } else {
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  }
  const diary = page
    .getByRole('navigation')
    .getByRole('link', { name: 'Diário', exact: true });
  await diary.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/journey/diary');
  await expect(
    page.getByRole('heading', { name: 'Diário do Viajante', exact: true }),
  ).toBeVisible();
  // Reduced motion must affect the actual rendered panels, not just the media query.
  expect(
    await page
      .locator('[class*="panel"]')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page
      .getByRole('button', { name: 'Trocar Viajante', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height + 1);
    if (width === 390) {
      await page.screenshot({
        path: info.outputPath('traveler-modal-390x844.png'),
        fullPage: true,
      });
    }
    const cancel = dialog.getByRole('button', { name: /Cancelar/ });
    await cancel.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).not.toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('/journey/hero', { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', { name: 'Lia Mobile QA', exact: true }),
    ).toBeVisible();
    const performance = await page.evaluate(() => {
      const images = Array.from(document.images).filter((i) =>
        i.src.includes('/avatar/hd/'),
      );
      const hd = globalThis.performance
        .getEntriesByType('resource')
        .filter((r) =>
          r.name.includes('/avatar/hd/'),
        ) as PerformanceResourceTiming[];
      return {
        cls: (
          window as unknown as { mobileLayoutShifts: number[] }
        ).mobileLayoutShifts.reduce((a, b) => a + b, 0),
        hdIdentities: new Set(hd.map((r) => new URL(r.name).pathname)).size,
        hdBytes: hd.reduce((n, r) => n + r.encodedBodySize, 0),
        images: images.map((i) => ({
          loaded: i.complete && i.naturalWidth > 0,
          fit: getComputedStyle(i).objectFit,
          width: i.width,
          height: i.height,
        })),
        shifts: (window as unknown as { mobileShiftSources: unknown[] })
          .mobileShiftSources,
      };
    });
    console.log(
      JSON.stringify({
        project: info.project.name,
        width,
        cls: performance.cls,
        hdIdentities: performance.hdIdentities,
        hdBytes: performance.hdBytes,
        shifts: performance.cls > 0.1 ? performance.shifts : undefined,
      }),
    );
    expect(performance.cls).toBeLessThanOrEqual(0.1);
    expect(performance.hdIdentities).toBeLessThanOrEqual(2);
    for (const image of performance.images) {
      expect(image.loaded).toBe(true);
      expect(image.fit).toBe('contain');
    }
    await info.attach(`CPU 4x, HD e layout shifts ${width} — emulação`, {
      body: JSON.stringify(performance, null, 2),
      contentType: 'application/json',
    });
  }
  await page
    .getByRole('button', { name: 'Trocar Viajante', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Trocar Viajante', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Escolha seu Viajante', exact: true }),
  ).toBeVisible();
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    const selected = page.locator(
      '[class*="savedTravelerOption"] [data-avatar-mode="card"]',
    );
    const portrait = await selected.boundingBox();
    const title = await page
      .locator('[class*="savedTravelerOption"] h2')
      .boundingBox();
    expect(portrait!.y + portrait!.height).toBeLessThanOrEqual(title!.y + 1);
    if (width === 390)
      await page.screenshot({
        path: info.outputPath('traveler-selection-390x844.png'),
        fullPage: true,
      });
  }
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/journey');
});
