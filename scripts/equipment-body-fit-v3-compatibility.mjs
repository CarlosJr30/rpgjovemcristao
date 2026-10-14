import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url)),
  dir = path.join(root, 'build/task-0074-equipment-body-fit-v3');
const data = JSON.parse(
  (await readFile(path.join(dir, 'review/index.html'), 'utf8')).match(
    /<script type="application\/json" id="review-data">([\s\S]*?)<\/script>/,
  )[1],
);
const targets = data.targets.filter((t) => t.technical === 'FIT_PASS');
const out = path.join(dir, 'compatibility');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(dir, 'review/index.html')).href);
  const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  for (let i = 0; i < targets.length; i++)
    for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i],
        b = targets[j];
      if (a.avatarSha256 !== b.avatarSha256 || a.slot === b.slot) continue;
      await page
        .locator('#item')
        .selectOption(String(data.targets.findIndex((t) => t.id === a.id)));
      await page.locator('#after').click();
      await page.locator('#companion').selectOption(b.id);
      await page.locator('#overlay-img').evaluate((n) => n.decode());
      await page.locator('#companion-img').evaluate((n) => n.decode());
      const name = a.id + '__' + b.id,
        captures = [];
      for (const region of ['whole', 'waist', 'right-hand']) {
        await page.locator('#region').selectOption(region);
        const file = name + '-' + region + '.png';
        await page
          .locator('.after .viewport')
          .screenshot({ path: path.join(out, file) });
        captures.push(file);
      }
      results.push({
        a: a.id,
        b: b.id,
        avatar: a.avatarId,
        avatarSha256: a.avatarSha256,
        sha256: [a.sha256, b.sha256],
        layers: [a.layer, b.layer],
        captures,
        staticOnly: true,
        humanApprovedCombination: false,
      });
    }
  assert.equal(results.length, 10);
  assert.equal(
    await page.evaluate(() => JSON.stringify({ ...localStorage })),
    before,
  );
  await context.close();
} finally {
  await browser.close();
}
await writeFile(
  path.join(out, 'results.json'),
  JSON.stringify(
    {
      pairs: results,
      decisionWrites: 0,
      publicActivation: false,
      physicalDevice: false,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    pairs: results.length,
    captures: results.length * 3,
    decisionWrites: 0,
    publicActivation: false,
  }),
);
