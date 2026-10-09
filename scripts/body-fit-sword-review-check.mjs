import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { OUTPUT, IDS } from './body-fit-sword-bake.mjs';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage(),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(
    pathToFileURL(path.resolve(OUTPUT + '/review/index.html')).href,
  );
  const samples = [];
  await mkdir(OUTPUT + '/browser-evidence', { recursive: true });
  for (const width of [360, 390, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const id of IDS) {
      const section = page.locator('#' + id);
      await section.scrollIntoViewIfNeeded();
      await section.locator('img').evaluateAll((images) => {
        for (const i of images) i.loading = 'eager';
      });
      await section.locator('img').evaluateAll(async (images) => {
        await Promise.all(images.map((i) => i.decode()));
      });
      const state = await section
        .locator('img')
        .evaluateAll((images) =>
          images.map((i) => ({
            width: i.naturalWidth,
            height: i.naturalHeight,
            transform: getComputedStyle(i).transform,
            loaded: i.complete && i.naturalWidth > 0,
          })),
        );
      assert.equal(state.length, 10);
      assert(state.every((i) => i.loaded && i.transform === 'none'));
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      samples.push({
        width,
        id,
        views: state.length,
        noTransform: true,
        noHorizontalOverflow: true,
      });
    }
    if (width === 390 || width === 1366) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: OUTPUT + '/browser-evidence/review-' + width + '.png',
      });
    }
  }
  assert.equal(errors.length, 0);
  const hashLinks = await page.locator('a[href$="fit-metadata.json"]').count();
  assert.equal(hashLinks, 4);
  await writeFile(
    OUTPUT + '/browser-check.json',
    JSON.stringify(
      {
        status: 'PASS',
        samples,
        errors,
        viewports: 6,
        targetSamples: 24,
        viewSamples: 240,
        protocol: 'local file only; no server/network',
        scope: 'Review HTML only, runtime untouched',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'Review PASS: 6 viewports / 24 targets / 240 views; no transforms, no overflow, no page errors',
  );
} finally {
  await browser.close();
}
