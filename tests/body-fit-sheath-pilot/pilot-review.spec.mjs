import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const viewports = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
test('One pilot review: ten image views, fit report and human gate in six viewports', async ({
  page,
}, info) => {
  const errors = [],
    samples = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/build/task-0058-sword-sheath-pilot/review/index.html');
  await expect(page.locator('h1')).toContainText('TASK-0058');
  await expect(page.locator('body')).toContainText(
    'HUMAN_BODY_FIT_REVIEW_PENDING',
  );
  await expect(page.locator('body')).toContainText('READY0');
  const article = page.locator('#sword_path_common_female_v2');
  for (const vp of viewports) {
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await article.locator('img').evaluateAll(async (images) => {
      for (const i of images) i.loading = 'eager';
      await Promise.all(images.map((i) => i.decode()));
    });
    const state = await article
      .locator('img')
      .evaluateAll((images) =>
        images.map((i) => ({
          loaded: i.complete && i.naturalWidth > 0,
          transform: getComputedStyle(i).transform,
        })),
      );
    expect(state).toHaveLength(10);
    expect(state.every((i) => i.loaded && i.transform === 'none')).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: info.outputPath(`pilot-${vp.width}x${vp.height}.png`),
    });
    await article
      .locator('figure')
      .nth(5)
      .screenshot({
        path: info.outputPath(`waist-${vp.width}x${vp.height}.png`),
      });
    samples.push({
      viewport: vp,
      target: 'sword_path_common_female_v2',
      views: state.length,
      transform: 'none',
      horizontalOverflow: false,
    });
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await writeFile(
    info.outputPath('pilot-review-matrix.json'),
    JSON.stringify({ samples, errors }, null, 2),
  );
});
test('Existing Body-Fit Lab preserves female reference/missing-overlay gate; staging never READY', async ({
  page,
}, info) => {
  await page.goto('/tools/arena-lab/');
  await page
    .getByText('Body-Fit V2 · inspeção HD DEV', { exact: true })
    .click();
  await page.getByLabel('Gênero Body-Fit').selectOption('female');
  await page
    .getByLabel('Avatar HD Body-Fit')
    .selectOption('female_short_moss_medium');
  await page.getByLabel('Item Body-Fit').selectOption('traveler-sword-common');
  const panel = page.locator('[data-body-fit-lab]'),
    samples = [];
  for (const vp of viewports) {
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(panel.locator('[data-body-fit-target]')).toContainText(
      'sword_path_common_female_v2.png',
    );
    await expect(panel.locator('[data-body-fit-status]')).toContainText(
      'NEEDS_NEW_OVERLAY · Camadas READY: 0',
    );
    await expect(panel.locator('[data-overlay-slot]')).toHaveCount(0);
    const base = panel.locator('[data-body-fit-before] [data-avatar-base]');
    await expect(base).toHaveAttribute(
      'src',
      '/assets/avatar/hd/female/female_short_moss_medium_hd.png',
    );
    await expect.poll(() => base.evaluate((i) => i.naturalWidth)).toBe(1024);
    expect(await base.evaluate((i) => i.naturalHeight)).toBe(1536);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    samples.push({ viewport: vp, readyLayers: 0, candidateActivated: false });
  }
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await panel.screenshot({
    path: info.outputPath('existing-lab-unchanged.png'),
  });
  await writeFile(
    info.outputPath('existing-lab-matrix.json'),
    JSON.stringify(samples, null, 2),
  );
});
