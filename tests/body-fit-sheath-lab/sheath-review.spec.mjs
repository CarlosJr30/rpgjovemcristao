import { expect, test } from '@playwright/test';
import { PLANS, OUTPUT } from '../../scripts/body-fit-sheath-diagnostic.mjs';
import { writeFile } from 'node:fs/promises';
const viewports = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
test('Four-target sheath review accurately labels missing art in six viewports/reduced motion', async ({
  page,
}, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/' + OUTPUT + '/review/index.html');
  await expect(page.locator('h1')).toHaveText(
    'TASK-0057 — Espadas embainhadas',
  );
  await expect(page.locator('.comparison figure')).toHaveCount(4);
  await expect(page.locator('body')).toContainText(
    'overlay embainhado AUSENTE',
  );
  const samples = [];
  for (const vp of viewports) {
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const s of PLANS) {
      const article = page.locator('#' + s.id);
      await article.scrollIntoViewIfNeeded();
      await article.locator('img').evaluateAll((images) => {
        for (const i of images) i.loading = 'eager';
      });
      await article.locator('img').evaluateAll(async (images) => {
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
      samples.push({
        target: s.id,
        viewport: vp,
        views: 10,
        missingArtCorrectlyLabeled: true,
      });
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: info.outputPath(`review-${vp.width}x${vp.height}.png`),
    });
  }
  expect(errors).toEqual([]);
  await writeFile(
    info.outputPath('review-matrix.json'),
    JSON.stringify({ samples, errors }, null, 2),
  );
});
test('Existing Body-Fit Lab preserves two HD references/common sword missing-art gate and reduced motion', async ({
  page,
}, info) => {
  await page.goto('/tools/arena-lab/');
  await page
    .getByText('Body-Fit V2 · inspeção HD DEV', { exact: true })
    .click();
  const panel = page.locator('[data-body-fit-lab]'),
    results = [];
  for (const gender of ['female', 'male']) {
    await page.getByLabel('Gênero Body-Fit').selectOption(gender);
    await page
      .getByLabel('Avatar HD Body-Fit')
      .selectOption(`${gender}_short_moss_medium`);
    await page
      .getByLabel('Item Body-Fit')
      .selectOption('traveler-sword-common');
    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(panel.locator('[data-body-fit-target]')).toContainText(
        `sword_path_common_${gender}_v2.png`,
      );
      await expect(panel.locator('[data-body-fit-status]')).toContainText(
        'NEEDS_NEW_OVERLAY · Camadas READY: 0',
      );
      await expect(panel.locator('[data-overlay-slot]')).toHaveCount(0);
      const base = panel.locator('[data-body-fit-before] [data-avatar-base]');
      await expect(base).toHaveAttribute(
        'src',
        `/assets/avatar/hd/${gender}/${gender}_short_moss_medium_hd.png`,
      );
      await expect.poll(() => base.evaluate((i) => i.naturalWidth)).toBe(1024);
      expect(await base.evaluate((i) => i.naturalHeight)).toBe(1536);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      results.push({
        gender,
        viewport: vp,
        ready: 0,
        sourceDimensions: [1024, 1536],
      });
    }
  }
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await panel.screenshot({ path: info.outputPath('body-fit-unchanged.png') });
  await writeFile(
    info.outputPath('body-fit-matrix.json'),
    JSON.stringify(results, null, 2),
  );
});
