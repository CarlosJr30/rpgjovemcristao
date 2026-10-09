import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const output = 'build/task-0052-body-fit-validation/delivery';
const inventory = JSON.parse(
  await readFile(`${output}/source-inventory.json`, 'utf8'),
);
const viewports = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 844, height: 390 },
  { width: 915, height: 412 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

test('read-only source diagnostic: full canvas, original hashes, both HD references and responsive evidence', async ({
  page,
}) => {
  test.setTimeout(180000);
  await mkdir(`${output}/screenshots`, { recursive: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `/build/task-0052-body-fit-validation/delivery/review/index.html`,
  );
  await expect(page.locator('article')).toHaveCount(
    inventory.sources.length * 2,
  );
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(images.map((image) => image.decode()));
  });
  const samples = [];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (let index = 0; index < inventory.sources.length; index++)
      for (const reference of inventory.references) {
        const card = page.locator(
          `article[data-source="${index}"][data-reference="${reference.id}"]`,
        );
        await expect(card.locator('[data-frame]')).toHaveCount(6);
        const images = await card.locator('img').evaluateAll((nodes) =>
          nodes.map((image) => {
            const rect = image.getBoundingClientRect(),
              frame = image.parentElement.getBoundingClientRect();
            return {
              nativeWidth: image.naturalWidth,
              nativeHeight: image.naturalHeight,
              width: rect.width,
              height: rect.height,
              fullCanvas:
                Math.abs(rect.x - frame.x) < 0.01 &&
                Math.abs(rect.y - frame.y) < 0.01 &&
                Math.abs(rect.width - frame.width) < 0.01 &&
                Math.abs(rect.height - frame.height) < 0.01,
            };
          }),
        );
        expect(
          images.every(
            (image) =>
              image.nativeWidth === 1024 &&
              image.nativeHeight === 1536 &&
              image.fullCanvas &&
              Math.abs(image.height / image.width - 1.5) < 0.01,
          ),
        ).toBe(true);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        samples.push({
          source: inventory.sources[index].file,
          reference: reference.id,
          viewport,
          fullCanvas: true,
          fitApproval: false,
        });
        if (viewport.width === 1440) {
          await card.screenshot({
            path: `${output}/screenshots/source-${String(index).padStart(2, '0')}-${reference.id}.png`,
          });
          for (const mode of [
            'base',
            'source',
            'combined',
            'blend',
            'split',
            'guides',
          ])
            await card
              .locator(`[data-frame="${mode}"]`)
              .screenshot({
                path: `${output}/screenshots/source-${String(index).padStart(2, '0')}-${reference.id}-${mode}.png`,
              });
        }
      }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  for (const source of inventory.sources) {
    const response = await page.request.get(
      `/assets-source/body-fit-v2/${encodeURIComponent(source.file)}`,
    );
    expect(response.ok()).toBe(true);
    expect(
      createHash('sha256')
        .update(await response.body())
        .digest('hex'),
    ).toBe(source.sha256);
    const copy = await page.request.get(
      `/build/task-0052-body-fit-validation/delivery/review/source/${encodeURIComponent(source.file)}`,
    );
    expect(
      createHash('sha256')
        .update(await copy.body())
        .digest('hex'),
    ).toBe(source.sha256);
  }
  await writeFile(
    `${output}/lab-evidence.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        samples: samples.length,
        matrix: samples,
        reducedMotion: true,
        originalAndCopyHashes: 'PASS',
        consoleErrors: errors,
        fitApproval: false,
      },
      null,
      2,
    ) + '\n',
  );
});
