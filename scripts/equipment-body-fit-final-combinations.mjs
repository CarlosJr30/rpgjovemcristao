import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('..', import.meta.url));
const dir = path.join(root, 'build/task-0075-body-fit-final-review');
const html = path.join(dir, 'review/index.html');
const data = JSON.parse(
  (await readFile(html, 'utf8')).match(
    /<script type="application\/json" id="review-data">([\s\S]*?)<\/script>/,
  )[1],
);
const out = path.join(dir, 'combinations');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const results = [];
try {
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(html).href);
    const storage = await page.evaluate(() =>
      JSON.stringify({ ...localStorage }),
    );
    for (const armor of data.targets.filter(
      (t) => t.slot === 'armor' && t.technical === 'FIT_PASS',
    )) {
      const sword = data.targets.find(
        (t) =>
          t.slot === 'weapon' &&
          t.gender === armor.gender &&
          t.technical === 'FIT_PASS',
      );
      const shield = data.targets.find(
        (t) =>
          t.slot === 'shield' &&
          t.gender === armor.gender &&
          t.technical === 'FIT_PASS',
      );
      assert.equal(sword.avatarSha256, armor.avatarSha256);
      assert.equal(shield.avatarSha256, armor.avatarSha256);
      const variants = [null, ...(shield.alternatives || [])];
      for (const v of variants) {
        await page
          .locator('#item')
          .selectOption(String(data.targets.indexOf(shield)));
        await page.locator('#after').click();
        await page.locator('#companion').selectOption(armor.id);
        await page.locator('#companion2').selectOption(sword.id);
        if (v) await page.locator('#variant').selectOption(v.id);
        for (const id of ['overlay-img', 'companion-img', 'companion2-img'])
          await page.locator('#' + id).evaluate((n) => n.decode());
        const prefix = `${armor.id}__${sword.id}__${v ? v.id : shield.id}-${width}`;
        const captures = [];
        for (const region of ['whole', 'head', 'waist', 'right-hand']) {
          await page.locator('#region').selectOption(region);
          const p = prefix + '-' + region + '.png';
          await page
            .locator('.after .viewport')
            .screenshot({ path: path.join(out, p) });
          captures.push(p);
        }
        results.push({
          width,
          height,
          avatar: armor.avatarId,
          avatarSha256: armor.avatarSha256,
          targets: [armor.id, sword.id, shield.id],
          sha256: [armor.sha256, sword.sha256, v?.sha256 || shield.sha256],
          layers: [2, 6, 7],
          variant: v?.id || 'original',
          captures,
          technicalGeometry: 'EXACT_ORIGINAL_CANVAS_NO_CORRECTIVE_TRANSFORM',
          visualResult: v
            ? 'FAIL_EXPERIMENTAL_MOUNT'
            : 'SHIELD_ATTACHMENT_UNPROVEN',
          humanApproved: false,
          runtimeActivated: false,
        });
      }
    }
    for (const shield of data.targets.filter(
      (t) => t.slot === 'shield' && t.technical === 'FIT_PASS',
    )) {
      for (const v of shield.alternatives) {
        await page
          .locator('#item')
          .selectOption(String(data.targets.indexOf(shield)));
        await page.locator('#before-mode').selectOption('candidate');
        await page.locator('#variant').selectOption(v.id);
        await page.locator('#side').click();
        await page.locator('#overlay-img').evaluate((n) => n.decode());
        await page.locator('#compare').screenshot({
          path: path.join(out, `${v.id}-${width}-original-vs-derived.png`),
        });
      }
    }
    assert.equal(
      await page.evaluate(() => JSON.stringify({ ...localStorage })),
      storage,
    );
    await ctx.close();
  }
} finally {
  await browser.close();
}
assert.equal(results.length, 24);
await writeFile(
  path.join(out, 'results.json'),
  JSON.stringify(
    {
      results,
      uniqueOriginalTriples: 4,
      uniqueExperimentalTriples: 8,
      captures: 104,
      decisionWrites: 0,
      staticOnly: true,
      physicalDevice: false,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ compositions: 24, captures: 104, decisionWrites: 0 }),
);
