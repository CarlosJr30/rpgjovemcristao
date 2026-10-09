import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const out = 'build/task-0054-body-fit-bake';
test('DEV review: seven views, six viewports, baked1:1 with no corrective transform', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/' + out + '/review/index.html');
  await expect(page.locator('body')).toHaveAttribute(
    'data-bake-editor-ready',
    'true',
  );
  await expect(page.locator('main .frame')).toHaveCount(7);
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
    const geometry = await page
      .locator('[data-view="combined"] img')
      .evaluateAll((images) =>
        images.map((i) => {
          const r = i.getBoundingClientRect(),
            p = i.parentElement.getBoundingClientRect(),
            s = getComputedStyle(i);
          return {
            size: [i.naturalWidth, i.naturalHeight],
            full:
              r.x === p.x &&
              r.y === p.y &&
              Math.abs(r.width - p.width) < 0.01 &&
              Math.abs(r.height - p.height) < 0.01,
            transform: s.transform,
            left: s.left,
            top: s.top,
          };
        }),
      );
    expect(
      geometry.every(
        (g) =>
          g.size[0] === 1024 &&
          g.size[1] === 1536 &&
          g.full &&
          g.transform === 'none' &&
          g.left === '0px' &&
          g.top === '0px',
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    samples.push({ viewport: [width, height], geometry });
  }
  await page.getByLabel('Zoom', { exact: true }).selectOption('1024');
  expect(
    await page
      .locator('[data-view="combined"]')
      .evaluate((e) => e.getBoundingClientRect().width),
  ).toBe(1024);
  await page.getByLabel('Zoom', { exact: true }).selectOption('360');
  await page.screenshot({
    path: out + '/review/review-desktop.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await writeFile(
    out + '/lab-checks.json',
    JSON.stringify({ status: 'PASS', samples, pageErrors: errors }, null, 2),
  );
});
test('DEV draft controls, opacity, before/after, guides, reset and metadata export never alter baked', async ({
  page,
}) => {
  const original = await readFile(out + '/baked_overlay.png');
  const hash = (b) => createHash('sha256').update(b).digest('hex');
  await page.goto('/' + out + '/review/index.html');
  await expect(page.locator('body')).toHaveAttribute(
    'data-bake-editor-ready',
    'true',
  );
  await page.locator('#editor summary').click();
  const defaults = JSON.parse(
    await readFile(out + '/fit-metadata.json', 'utf8'),
  ).transform;
  await page
    .getByLabel('Mover X', { exact: true })
    .fill(String(defaults.translateX + 20));
  await expect(page.locator('#draft-metadata')).toContainText(
    String(defaults.translateX + 20),
  );
  await page
    .getByLabel('Mover Y', { exact: true })
    .fill(String(defaults.translateY + 10));
  await page.getByLabel('Escala uniforme', { exact: true }).fill('.5');
  await page.getByLabel('Rotação (graus)', { exact: true }).fill('2');
  await page.getByLabel('Opacity', { exact: true }).fill('0.75');
  await page.getByLabel('Before/after', { exact: true }).selectOption('before');
  await page.getByLabel('Guides', { exact: true }).uncheck();
  await expect(page.locator('#draft-metadata')).toContainText(
    '"view": "before"',
  );
  expect(
    await page
      .locator('[data-baked]')
      .first()
      .evaluate((e) => getComputedStyle(e).transform),
  ).toBe('none');
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Exportar metadata do rascunho' })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('task-0054-pilot-settings.json');
  const exported = JSON.parse(await readFile(await file.path(), 'utf8'));
  expect(exported.transform.scale).toBe(0.5);
  expect(exported.transform.rotation).toBe(2);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  for (const [n, v] of Object.entries(defaults))
    await expect(page.locator('#' + n)).toHaveValue(String(v));
  expect(hash(await readFile(out + '/baked_overlay.png'))).toBe(hash(original));
});
