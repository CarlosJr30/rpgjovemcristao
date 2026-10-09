import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const out = 'build/task-0055-body-fit-bake';
test('15-target DEV review: filters, evidence, responsive full-canvas and native zoom', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/' + out + '/review/index.html');
  await expect(page.locator('body')).toHaveAttribute(
    'data-review-ready',
    'true',
  );
  await expect(page.locator('article')).toHaveCount(15);
  await page.locator('#gender').selectOption('female');
  await expect(page.locator('article:visible')).toHaveCount(7);
  await page.locator('#gender').selectOption('male');
  await expect(page.locator('article:visible')).toHaveCount(8);
  await page.locator('#gender').selectOption('');
  const slotCounts = {
    armor: 3,
    helmet: 2,
    boots: 2,
    weapon: 4,
    shield: 2,
    amulet: 2,
  };
  for (const [slot, count] of Object.entries(slotCounts)) {
    await page.locator('#slot').selectOption(slot);
    await expect(page.locator('article:visible')).toHaveCount(count);
  }
  await page.locator('#slot').selectOption('');
  await page.locator('#status').selectOption('FIT_PASS');
  await expect(page.locator('article:visible')).toHaveCount(5);
  await page.locator('#status').selectOption('NEEDS_REWORK');
  await expect(page.locator('article:visible')).toHaveCount(10);
  await page.locator('#gender').selectOption('female');
  await page.locator('#slot').selectOption('armor');
  await expect(page.locator('article:visible')).toHaveCount(0);
  await expect(page.locator('#visible-count')).toHaveText('0 targets visíveis');
  for (const k of ['gender', 'slot', 'status'])
    await page.locator('#' + k).selectOption('');
  const samples = [];
  for (const [width, height] of [
    [390, 844],
    [412, 915],
    [844, 390],
    [915, 412],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() =>
        page
          .locator('article img')
          .evaluateAll((imgs) =>
            imgs.every(
              (i) =>
                i.complete &&
                i.naturalWidth === 1024 &&
                i.naturalHeight === 1536,
            ),
          ),
      )
      .toBe(true);
    const checks = await page.locator('article img').evaluateAll((imgs) =>
      imgs.map((i) => {
        const r = i.getBoundingClientRect(),
          p = i.parentElement.getBoundingClientRect(),
          s = getComputedStyle(i);
        return {
          full:
            Math.abs(r.x - p.x) < 0.01 &&
            Math.abs(r.y - p.y) < 0.01 &&
            Math.abs(r.width - p.width) < 0.01 &&
            Math.abs(r.height - p.height) < 0.01,
          transform: s.transform,
        };
      }),
    );
    expect(checks.every((c) => c.full && c.transform === 'none')).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    samples.push({ viewport: [width, height], checks });
  }
  for (const view of [
    'source.png',
    'avatar_base.png',
    'baked_overlay.png',
    'combined.png',
    'overlay_50_50.png',
    'alignment_guides.png',
    'before.png',
    'armor_overlap.png',
  ]) {
    await page.locator('#view').selectOption(view);
    await expect
      .poll(() =>
        page
          .locator('article img')
          .evaluateAll((imgs) =>
            imgs.every(
              (i) =>
                i.complete &&
                i.naturalWidth === 1024 &&
                i.naturalHeight === 1536,
            ),
          ),
      )
      .toBe(true);
  }
  await page.locator('#view').selectOption('combined.png');
  await page.locator('#zoom').selectOption('native');
  expect(
    await page
      .locator('.frame')
      .first()
      .evaluate((e) => e.getBoundingClientRect().width),
  ).toBe(1024);
  await page.locator('#zoom').selectOption('fit');
  await page.screenshot({
    path: out + '/review/review-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#status').selectOption('FIT_PASS');
  await page.screenshot({
    path: out + '/review/review-mobile.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await writeFile(
    out + '/lab-checks.json',
    JSON.stringify(
      { status: 'PASS', samples, views: 8, filters: 'PASS', errors },
      null,
      2,
    ),
  );
});
test('Review is read-only; controls preserve source, baked, metadata and approved pilot', async ({
  page,
}) => {
  const inv = JSON.parse(await readFile(out + '/inventory.json', 'utf8'));
  const paths = inv.assets.flatMap((a) => [
    a.metadata,
    out + '/' + a.id + '/baked_overlay.png',
    out + '/' + a.id + '/source.png',
  ]);
  paths.push(
    'build/task-0054-body-fit-bake/fit-metadata.json',
    'build/task-0054-body-fit-bake/baked_overlay.png',
  );
  const hash = async (p) =>
    createHash('sha256')
      .update(await readFile(p))
      .digest('hex');
  const before = await Promise.all(paths.map(hash));
  await page.goto('/' + out + '/review/index.html');
  await page.locator('#gender').selectOption('male');
  await page.locator('#view').selectOption('alignment_guides.png');
  await page.locator('#zoom').selectOption('native');
  await page.reload();
  expect(await Promise.all(paths.map(hash))).toEqual(before);
});
