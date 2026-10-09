import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const screens = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

test('Avatar HD: native PNG, CSS geometry and DPR audit', async ({
  browser,
}, testInfo) => {
  test.skip(
    !['desktop', 'hd-pilot-lab'].includes(testInfo.project.name),
    'This test creates its own DPR contexts.',
  );
  test.setTimeout(180_000);
  const nativeHD = testInfo.project.name === 'hd-pilot-lab';
  const audit = [];
  for (const dpr of [1, 2, 3]) {
    for (const body of ['female', 'male']) {
      const context = await browser.newContext({
        deviceScaleFactor: dpr,
        reducedMotion: 'reduce',
      });
      try {
        const page = await context.newPage();
        await page.addInitScript(() =>
          localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local'),
        );
        await page.goto('/journey/create');
        await page
          .getByLabel('Nome do Viajante', { exact: true })
          .fill('Viajante HD');
        await page
          .getByRole('radio', {
            name: body === 'female' ? 'Feminino' : 'Masculino',
            exact: true,
          })
          .check();
        await page.getByRole('button', { name: 'Criar Viajante' }).click();
        await expect(page).not.toHaveURL(/\/create$/);
        // Starter boots now render: explicitly isolate the unequipped base audit.
        await page.evaluate(() => {
          const key = 'rpg-jovem-cristao:journey:v1';
          const save = JSON.parse(localStorage.getItem(key)!);
          save.travelers[0].equipped = {};
          save.travelers[0].avatar.equippedItems = {};
          localStorage.setItem(key, JSON.stringify(save));
        });
        for (const route of ['hero', 'equipment']) {
          await page.goto(`/journey/${route}`);
          const composite = page.locator(`[data-body-type="${body}"]`);
          const image = composite.getByRole('img', {
            name: 'Avatar do Viajante',
            exact: true,
          });
          await expect
            .poll(() =>
              image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
            )
            .toBe(nativeHD ? 1024 : 512);
          for (const viewport of screens) {
            await page.setViewportSize(viewport);
            const sample = await image.evaluate((node) => {
              const img = node as HTMLImageElement;
              const rect = img.getBoundingClientRect();
              const transforms = [];
              for (
                let ancestor: Element | null = img;
                ancestor;
                ancestor = ancestor.parentElement
              ) {
                const transform = getComputedStyle(ancestor).transform;
                if (transform !== 'none') transforms.push(transform);
              }
              return {
                source: img.currentSrc,
                sourceWidth: img.naturalWidth,
                sourceHeight: img.naturalHeight,
                cssWidth: rect.width,
                cssHeight: rect.height,
                dpr: window.devicePixelRatio,
                cssScale: rect.width / img.naturalWidth,
                effectiveScale:
                  (rect.width * window.devicePixelRatio) / img.naturalWidth,
                interpolation: getComputedStyle(img).imageRendering,
                transforms,
              };
            });
            expect(sample.source).toContain(`/assets/avatar/${nativeHD ? 'hd' : 'runtime'}/${body}/`);
            expect(sample.source).not.toContain('/_next/image');
            expect(sample.sourceHeight).toBe(nativeHD ? 1536 : 768);
            expect(sample.interpolation).toBe('auto');
            expect(sample.cssWidth).toBeLessThanOrEqual(sample.sourceWidth);
            expect(sample.cssHeight / sample.cssWidth).toBeCloseTo(1.5, 2);
            expect(sample.dpr).toBe(dpr);
            expect(sample.transforms).toEqual([]);
            await expect(composite.locator('[data-overlay-slot]')).toHaveCount(
              0,
            );
            audit.push({ body, route, viewport, ...sample });
            if (
              route === 'hero' &&
              ((viewport.width === 1440 && dpr === 2) ||
                (viewport.width === 390 && dpr === 3))
            ) {
              const prefix = `${body}-${viewport.width}-dpr${dpr}`;
              // Reproduce the previous interpolation for a controlled comparison.
              await image.evaluate((node) => {
                (node as HTMLElement).style.imageRendering = 'pixelated';
              });
              await composite.screenshot({
                path: testInfo.outputPath(`${prefix}-before-pixelated.png`),
              });
              await image.evaluate((node) => {
                (node as HTMLElement).style.removeProperty('image-rendering');
              });
              await composite.screenshot({
                path: testInfo.outputPath(`${prefix}-after-auto.png`),
              });
            }
          }
        }
      } finally {
        await context.close();
      }
    }
  }
  await writeFile(
    testInfo.outputPath('asset-audit.json'),
    JSON.stringify(audit, null, 2),
  );
  await testInfo.attach('asset-audit', {
    body: JSON.stringify(audit, null, 2),
    contentType: 'application/json',
  });
});
