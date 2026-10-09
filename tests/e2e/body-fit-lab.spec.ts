import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { BODY_FIT_V2_TARGETS } from '../../apps/web/features/journey/data/bodyFitV2Plan';

test('Body-Fit DEV: HD selection, missing art gates, comparison and six viewport matrix', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const bodyRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/equipment/overlays/'))
      bodyRequests.push(request.url());
  });
  await page.goto('/tools/arena-lab/');
  await page
    .getByText('Body-Fit V2 · inspeção HD DEV', { exact: true })
    .click();
  const panel = page.locator('[data-body-fit-lab]');
  const results = [];
  for (const gender of ['female', 'male']) {
    await page.getByLabel('Gênero Body-Fit').selectOption(gender);
    const options = await page
      .getByLabel('Avatar HD Body-Fit')
      .locator('option')
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLOptionElement).value),
      );
    expect(options).toHaveLength(27);
    for (const id of options) {
      await page.getByLabel('Avatar HD Body-Fit').selectOption(id);
      const image = panel.locator('[data-body-fit-before] [data-avatar-base]');
      await expect(image).toHaveAttribute(
        'src',
        `/assets/avatar/hd/${gender}/${id}_hd.png`,
      );
      await expect
        .poll(() =>
          image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
        )
        .toBe(1024);
    }
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 412, height: 915 },
      { width: 844, height: 390 },
      { width: 915, height: 412 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      for (const target of BODY_FIT_V2_TARGETS.filter(
        (entry) =>
          entry.gender === gender &&
          ['armor', 'helmet', 'boots', 'weapon'].includes(entry.slot) &&
          entry.equipable,
      )) {
        await page.getByLabel('Item Body-Fit').selectOption(target.itemId);
        await expect(panel.locator('[data-body-fit-target]')).toContainText(
          target.filename,
        );
        await expect(panel.locator('[data-body-fit-status]')).toContainText(
          'NEEDS_NEW_OVERLAY · Camadas READY: 0',
        );
        await expect(panel.locator('[data-overlay-slot]')).toHaveCount(0);
        const geometry = await panel
          .locator('[data-avatar-base]')
          .evaluateAll((nodes) =>
            nodes.map((node) => {
              const i = node as HTMLImageElement,
                r = i.getBoundingClientRect();
              return {
                width: r.width,
                height: r.height,
                nativeWidth: i.naturalWidth,
                nativeHeight: i.naturalHeight,
              };
            }),
          );
        expect(
          geometry.every(
            (r) =>
              r.nativeWidth === 1024 &&
              r.nativeHeight === 1536 &&
              Math.abs(r.height / r.width - 1.5) < 0.01,
          ),
        ).toBe(true);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        results.push({
          gender,
          viewport,
          itemId: target.itemId,
          geometry,
          overlay: 'MISSING_NOT_VISUALLY_VALIDATED',
        });
        await panel.screenshot({
          path: info.outputPath(
            `${gender}-${target.slot}-${viewport.width}x${viewport.height}.png`,
          ),
        });
      }
    }
  }
  await page.getByLabel('Comparação Body-Fit').selectOption('split');
  await page.getByLabel('Divisão Body-Fit').fill('25');
  await expect(panel.locator('[data-body-fit-after]')).toHaveCSS(
    'clip-path',
    'inset(0px 0px 0px 25%)',
  );
  await page.getByLabel('Zoom Body-Fit').fill('200');
  await page.getByLabel('Silhueta Body-Fit').check();
  await page.getByLabel('Guias Body-Fit').uncheck();
  await page.getByLabel('Ligar overlay Body-Fit').uncheck();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(panel.locator('svg')).toHaveCount(0);
  await expect(panel.locator('[data-overlay-slot]')).toHaveCount(0);
  await panel.screenshot({
    path: info.outputPath('split-zoom-silhouette-reduced-motion.png'),
  });
  expect(bodyRequests).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await writeFile(
    info.outputPath('body-fit-matrix.json'),
    JSON.stringify(results, null, 2),
  );
});
