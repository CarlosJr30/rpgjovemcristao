import { chromium, webkit } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(
  root,
  'build/task-0075-body-fit-final-review/continuation/footwear',
);
await mkdir(path.join(out, 'captures'), { recursive: true });
const checks = [],
  pixelChecks = [];
for (const engine of ['chromium', 'webkit']) {
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({
    headless: true,
    ...(engine === 'chromium' ? { channel: 'msedge' } : {}),
  });
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [412, 915],
    [844, 390],
    [1440, 900],
    [1920, 1080],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [],
      remote = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => {
      if (
        !r.url().startsWith('http://127.0.0.1:8077/') &&
        !r.url().startsWith('data:')
      )
        remote.push(r.url());
    });
    await page.goto('http://127.0.0.1:8077/');
    await page.locator('svg image').evaluateAll((imgs) =>
      Promise.all(
        imgs.map((i) => {
          const img = new Image();
          img.src = i.getAttribute('href');
          return img.decode();
        }),
      ),
    );
    assert.equal(await page.locator('article').count(), 2);
    assert.equal(await page.locator('.pan>svg').count(), 8);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.equal(await page.evaluate(() => localStorage.length), 0);
    for (let i = 0; i < 2; i++) {
      const article = page.locator('article').nth(i);
      await article.locator('select').selectOption('3');
      assert.equal(
        await article
          .locator('.pan>svg')
          .first()
          .evaluate((e) => e.style.width),
        '300%',
      );
      await article.locator('select').selectOption('1');
      if (engine === 'chromium' && [390, 1920].includes(width))
        await article.screenshot({
          path: path.join(out, `captures/${engine}-${width}-${i}.png`),
        });
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(remote, []);
    checks.push({
      engine,
      width,
      height,
      status: 'PASS',
      errors: 0,
      remoteRequests: 0,
    });
    if (engine === 'chromium' && width === 1920) {
      for (let i = 0; i < 2; i++) {
        const gender = i ? 'male' : 'female',
          svgs = await page
            .locator('article')
            .nth(i)
            .locator('.pan>svg')
            .evaluateAll((nodes) => nodes.map((n) => n.outerHTML));
        const mask = await readFile(
            path.join(out, `${gender}-footwear-surface.svg`),
            'utf8',
          ),
          surface = new Uint8Array(1024 * 1536);
        for (const m of mask.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g))
          for (let x = +m[1]; x < +m[1] + +m[3]; x++)
            surface[+m[2] * 1024 + x] = 1;
        const renders = [];
        const probe = await browser.newPage({
          viewport: { width: 1100, height: 1600 },
          deviceScaleFactor: 1,
        });
        for (const j of [0, 1, 2]) {
          await probe.setContent(
            '<style>body{margin:0}svg{display:block;background:#ccd7c5}</style>' +
              svgs[j],
          );
          await probe.locator('svg').evaluate((e) => {
            e.style.width = '1024px';
            e.style.height = '1536px';
          });
          await probe.locator('svg image').evaluateAll((imgs) =>
            Promise.all(
              imgs.map((i) => {
                const img = new Image();
                img.src = i.getAttribute('href');
                return img.decode();
              }),
            ),
          );
          const png = await probe.locator('svg').screenshot();
          assert.equal((await sharp(png).metadata()).width, 1024);
          await writeFile(
            path.join(out, `captures/${gender}-native-${j}.png`),
            png,
          );
          renders.push(await sharp(png).ensureAlpha().raw().toBuffer());
        }
        let differencesOutsideSurface = 0,
          naiveDifferencesOutsideSurface = 0,
          changedInsideSurface = 0,
          toeAndSoleDifferences = 0;
        for (let k = 0; k < surface.length; k++) {
          const eq = (a, b) =>
            a.subarray(k * 4, k * 4 + 4).equals(b.subarray(k * 4, k * 4 + 4));
          if (!surface[k]) {
            if (!eq(renders[0], renders[2])) differencesOutsideSurface++;
            if (!eq(renders[0], renders[1])) naiveDifferencesOutsideSurface++;
          }
          if (Math.floor(k / 1024) >= 1395 && !eq(renders[0], renders[2]))
            toeAndSoleDifferences++;
          else if (!eq(renders[0], renders[2])) changedInsideSurface++;
        }
        assert.equal(
          differencesOutsideSurface,
          0,
          'Actual browser pixels outside footwear must remain identical',
        );
        assert.equal(
          toeAndSoleDifferences,
          0,
          'Complete HD toes/heels/soles must remain original, without internal double soles',
        );
        assert(naiveDifferencesOutsideSurface > 1000);
        assert(changedInsideSurface > 1000);
        pixelChecks.push({
          gender,
          differencesOutsideSurface,
          naiveDifferencesOutsideSurface,
          changedInsideSurface,
          toeAndSoleDifferences,
          status: 'PASS',
        });
        await probe.close();
      }
    }
    await page.close();
  }
  await browser.close();
}
await writeFile(
  path.join(out, 'inspection.json'),
  JSON.stringify(
    {
      status: 'PASS',
      checks,
      pixelChecks,
      decisionClicks: 0,
      runtimeChanges: 0,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ status: 'PASS', viewports: checks.length, pixelChecks }),
);
