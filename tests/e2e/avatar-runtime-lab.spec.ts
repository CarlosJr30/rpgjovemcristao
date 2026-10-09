import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
test('existing DEV lab: all faces/hairs/bodies, sizes, colors and approval gate', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto('/tools/arena-lab/');
  await page
    .getByText('Avatar Runtime HD V1 · inspeção DEV', { exact: true })
    .click();
  const panel = page.locator('[data-avatar-runtime-lab]');
  await expect(panel.locator('[data-lab-combination]')).toHaveCount(18);
  await expect(panel.locator('[data-lab-mode]')).toHaveCount(5);
  await expect(panel.locator('[data-lab-ready-count]')).toHaveText('0');
  const urls = new Set<string>();
  for (const outfit of ['musgo', 'ocre', 'azul'])
    for (const skin of ['claro', 'medio', 'escuro']) {
      await page.getByLabel('Roupa do avatar no lab').selectOption(outfit);
      await page.getByLabel('Tom de pele no lab').selectOption(skin);
      for (const image of await panel
        .locator('[data-lab-combination] [data-avatar-base]')
        .all()) {
        await expect
          .poll(() =>
            image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
          )
          .toBe(1024);
        urls.add((await image.getAttribute('src'))!);
      }
    }
  expect(urls.size).toBe(54);
  await page.getByLabel('Com equipamentos aprovados').uncheck();
  await expect(panel.locator('[data-overlay-slot]')).toHaveCount(0);
  for (const size of [
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 844, height: 390 },
    { width: 915, height: 412 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    await panel.locator('[data-avatar-base]').evaluateAll(async (nodes) => {
      await Promise.all(
        nodes.map((node) => (node as HTMLImageElement).decode()),
      );
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    const geometry = await panel
      .locator('[data-avatar-base]')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return {
            w: r.width,
            h: r.height,
            fit: getComputedStyle(node).objectFit,
          };
        }),
      );
    expect(
      geometry.every(
        (r) =>
          r.w > 0 && Math.abs(r.h / r.w - 1.5) < 0.02 && r.fit === 'contain',
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await panel.screenshot({
      path: info.outputPath(`avatar-matrix-${size.width}x${size.height}.png`),
    });
  }
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test('native HD candidates: both bodies, five modes, six viewports and DPR 1/2/3', async ({
  browser,
}, info) => {
  test.setTimeout(180000);
  const audit = [];
  for (const dpr of [1, 2, 3]) {
    const context = await browser.newContext({
      deviceScaleFactor: dpr,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:3109/tools/arena-lab/');
      await page
        .getByText('Avatar Runtime HD V1 · inspeção DEV', { exact: true })
        .click();
      await page
        .getByLabel('Revisar dois pilotos HD (Geometry Lock aprovado)')
        .check();
      const panel = page.locator('[data-hd-pilot-review]');
      await expect(panel.locator('[data-hd-pilot-mode]')).toHaveCount(10);
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 412, height: 915 },
        { width: 844, height: 390 },
        { width: 915, height: 412 },
        { width: 1440, height: 900 },
        { width: 1920, height: 1080 },
      ]) {
        await page.setViewportSize(viewport);
        for (const gender of ['male', 'female']) {
          const body = panel.locator(`[data-hd-pilot-body="${gender}"]`);
          const images = body.locator(
            '[data-hd-pilot-mode] [data-avatar-base]',
          );
          await images.evaluateAll(async (nodes) => {
            await Promise.all(
              nodes.map((node) => (node as HTMLImageElement).decode()),
            );
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            );
          });
          const samples = await images.evaluateAll((nodes) =>
            nodes.map((node) => {
              const img = node as HTMLImageElement,
                rect = img.getBoundingClientRect();
              return {
                source: img.currentSrc,
                width: img.naturalWidth,
                height: img.naturalHeight,
                cssWidth: rect.width,
                cssHeight: rect.height,
                dpr: devicePixelRatio,
                interpolation: getComputedStyle(img).imageRendering,
                fit: getComputedStyle(img).objectFit,
                mode: img.parentElement!.getAttribute('data-avatar-mode'),
                status: img.parentElement!.getAttribute(
                  'data-avatar-asset-status',
                ),
              };
            }),
          );
          for (const sample of samples) {
            expect(sample.source).toContain(
              `/assets/avatar/hd/${gender}/${gender}_short_moss_medium_hd.png`,
            );
            expect(sample.width).toBe(1024);
            expect(sample.height).toBe(1536);
            expect(sample.cssHeight / sample.cssWidth).toBeCloseTo(1.5, 2);
            expect(sample.interpolation).toBe('auto');
            expect(sample.fit).toBe('contain');
            expect(sample.status).toBe('HUMAN_VISUAL_APPROVED');
            expect(sample.dpr).toBe(dpr);
            audit.push({
              gender,
              viewport,
              ...sample,
              effectiveHD: (sample.cssWidth * dpr) / 1024,
              effectiveLegacy: (sample.cssWidth * dpr) / 512,
            });
          }
          await expect(body.locator('[data-overlay-slot]')).toHaveCount(0);
          if (viewport.width === 390 || viewport.width === 1440)
            await body.screenshot({
              path: info.outputPath(
                `${gender}-${viewport.width}-dpr${dpr}-comparison.png`,
              ),
            });
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (dpr === 2)
          await panel.screenshot({
            path: info.outputPath(
              `hd-pilots-${viewport.width}x${viewport.height}-dpr2.png`,
            ),
          });
      }
      expect(await page.evaluate(() => localStorage.length)).toBe(0);
      // Portrait bounds use the central normalized head region at each physical size.
      const portrait = await page.evaluate(async () => {
        const modulePath = '/apps/web/features/journey/data/avatarRuntime.ts';
        const { resolveAvatarIdentity } = await import(modulePath);
        return ['male', 'female'].map((gender) => {
          const t = {
            appearance: { hair: 'curto', outfit: 'musgo', skin: 'medio' },
            avatar: { gender, face: 3, hair: 2 },
          };
          return {
            legacy: resolveAvatarIdentity(t),
            hd: resolveAvatarIdentity(t, true),
          };
        });
      });
      for (const item of portrait) {
        expect(item.hd.portrait.width).toBe(item.legacy.portrait.width);
        expect(item.hd.portrait.height).toBe(item.legacy.portrait.height);
        expect(item.hd.faceId).toBe(3);
        expect(item.hd.legacyHairId).toBe(2);
      }
    } finally {
      await context.close();
    }
  }
  await writeFile(
    info.outputPath('native-hd-dpr-audit.json'),
    JSON.stringify(audit, null, 2),
  );
});

test('HD error or wrong physical dimensions restores legacy, then procedural; review toggle retries', async ({
  page,
}) => {
  await page.route('**/assets/avatar/hd/**', (route) => route.abort());
  await page.goto('/tools/arena-lab/');
  await page
    .getByText('Avatar Runtime HD V1 · inspeção DEV', { exact: true })
    .click();
  const toggle = page.getByLabel(
    'Revisar dois pilotos HD (Geometry Lock aprovado)',
  );
  await toggle.check();
  const images = page.locator('[data-hd-pilot-mode] [data-avatar-base]');
  await expect(images).toHaveCount(10);
  for (const img of await images.all()) {
    await expect
      .poll(() => img.evaluate((n) => (n as HTMLImageElement).naturalWidth))
      .toBe(512);
    await expect(img).toHaveAttribute('src', /\/runtime\//);
  }
  await toggle.uncheck();
  await page.unroute('**/assets/avatar/hd/**');
  // A 200 response with a legacy-sized PNG is invalid HD, not successful validation.
  await page.route('**/assets/avatar/hd/**', async (route) => {
    const url = route
      .request()
      .url()
      .replace('/hd/', '/runtime/')
      .replace('_hd.png', '.png');
    const response = await page.request.get(url);
    await route.fulfill({ response });
  });
  await toggle.check();
  for (const img of await images.all())
    await expect(img).toHaveAttribute('src', /\/runtime\//);
  await toggle.uncheck();
  await page.unroute('**/assets/avatar/hd/**');
  await page.route('**/assets/avatar/runtime/**', (route) => route.abort());
  await page.route('**/assets/avatar/hd/**', (route) => route.abort());
  await toggle.check();
  await expect(
    page.locator('[data-hd-pilot-mode] [data-avatar-fallback]'),
  ).toHaveCount(10);
  await toggle.uncheck();
  await page.unroute('**/assets/avatar/runtime/**');
  await page.unroute('**/assets/avatar/hd/**');
  await toggle.check();
  for (const img of await images.all())
    await expect
      .poll(() => img.evaluate((n) => (n as HTMLImageElement).naturalWidth))
      .toBe(1024);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});
