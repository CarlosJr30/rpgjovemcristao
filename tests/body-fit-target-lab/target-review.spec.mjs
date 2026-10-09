import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const out = 'build/task-0052b-body-fit-target-validation';
const inventory = JSON.parse(
  await readFile(out + '/target-inventory.json', 'utf8'),
);
test('actual mapped targets: correct HD gender, six views, full canvas, zoom and responsive evidence', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/' + out + '/review/index.html');
  await expect(page.locator('article')).toHaveCount(16);
  await page
    .locator('img')
    .evaluateAll(async (images) =>
      Promise.all(images.map((image) => image.decode())),
    );
  const samples = [];
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 844, height: 390 },
    { width: 915, height: 412 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    for (const asset of inventory.assets) {
      const id = asset.filename.replace(/\.png$/, ''),
        card = page.locator('[data-target="' + id + '"]');
      await expect(card.locator('[data-frame]')).toHaveCount(6);
      const geometry = await card.locator('img').evaluateAll((nodes) =>
        nodes.map((image) => {
          const a = image.getBoundingClientRect(),
            b = image.parentElement.getBoundingClientRect();
          return {
            w: image.naturalWidth,
            h: image.naturalHeight,
            ratio: a.height / a.width,
            full:
              Math.abs(a.x - b.x) < 0.01 &&
              Math.abs(a.y - b.y) < 0.01 &&
              Math.abs(a.width - b.width) < 0.01 &&
              Math.abs(a.height - b.height) < 0.01,
            src: image.getAttribute('src'),
            kind: image.className,
          };
        }),
      );
      expect(
        geometry.every(
          (g) =>
            g.w === 1024 &&
            g.h === 1536 &&
            Math.abs(g.ratio - 1.5) < 0.01 &&
            g.full,
        ),
      ).toBe(true);
      expect(
        geometry
          .filter((g) => g.kind === 'base')
          .every((g) => g.src.includes(asset.referenceAvatar.id)),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      samples.push({
        filename: asset.filename,
        gender: asset.gender,
        reference: asset.referenceAvatar.id,
        viewport,
        fullCanvas: true,
      });
      if (viewport.width === 1440) {
        await card.screenshot({ path: out + '/' + id + '/comparison.png' });
        for (const mode of [
          'base',
          'overlay',
          'combined',
          'blend',
          'split',
          'guides',
        ])
          await card
            .locator('[data-frame="' + mode + '"]')
            .screenshot({ path: out + '/' + id + '/' + mode + '.png' });
      }
    }
  }
  await page.getByLabel('Zoom').selectOption('200');
  for (const asset of inventory.assets) {
    const id = asset.filename.replace(/\.png$/, ''),
      frame = page.locator(
        '[data-target="' + id + '"] [data-frame="combined"]',
      );
    expect((await frame.boundingBox()).width).toBe(360);
    await frame.screenshot({ path: out + '/' + id + '/zoom-combined.png' });
    const response = await page.request.get(
      '/' + out + '/' + id + '/source.png',
    );
    expect(
      createHash('sha256')
        .update(await response.body())
        .digest('hex'),
    ).toBe(asset.sha256);
  }
  await page.getByLabel('Gênero').selectOption('female');
  await expect(page.locator('article:visible')).toHaveCount(8);
  await page.getByLabel('Slot').selectOption('armor');
  await expect(page.locator('article:visible')).toHaveCount(2);
  await page.getByLabel('Gênero').selectOption('male');
  await expect(page.locator('article:visible')).toHaveCount(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await writeFile(
    out + '/actual-fit-lab-evidence.json',
    JSON.stringify(
      {
        at: new Date().toISOString(),
        samples,
        viewports: 6,
        sourceTargets: 16,
        reducedMotion: true,
        sourceCopyHashes: 'PASS',
        zoom: 200,
        consoleErrors: errors,
        fitApproval: false,
      },
      null,
      2,
    ) + '\n',
  );
});
