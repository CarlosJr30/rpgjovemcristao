import { chromium, webkit } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const dir = path.join(root, 'build/task-0074-equipment-body-fit-v3');
const htmlPath = path.join(dir, 'review/index.html');
const html = await readFile(htmlPath, 'utf8');
const hash = (b) => createHash('sha256').update(b).digest('hex');
const htmlHash = hash(html);
const data = JSON.parse(
  html.match(
    /<script type="application\/json" id="review-data">([\s\S]*?)<\/script>/,
  )[1],
);
assert.equal(data.targets.length, 16);
const assetChecks = [];
for (const t of data.targets)
  for (const [p, expected] of [
    [t.staging, t.sha256],
    [t.avatar, t.avatarSha256],
    [t.source, t.sourceSha256],
  ]) {
    const sha = hash(await readFile(path.join(root, p)));
    assert.equal(sha, expected, p);
    if (data.images[p])
      assert.equal(
        hash(Buffer.from(data.images[p].split(',')[1], 'base64')),
        sha,
        'Embedded art: ' + p,
      );
    assetChecks.push({ path: p, sha256: sha, pass: true });
  }
assert.equal(Object.keys(data.images).length, 18);
const pending = data.targets.filter(
  (t) => t.human === 'HUMAN_BODY_FIT_REVIEW_PENDING',
);
assert.equal(pending.length, 7);
const engine = process.env.EQUIPMENT_QA_BROWSER ?? 'chromium';
const out = path.join(dir, 'inspection', engine);
await mkdir(out, { recursive: true });
const browser = await (engine === 'webkit' ? webkit : chromium).launch({
  headless: true,
  ...(engine === 'webkit' ? {} : { channel: 'msedge' }),
});
const checks = [],
  errors = [];
const sizes = [
  [320, 568],
  [360, 800],
  [375, 812],
  [390, 844],
  [412, 915],
  [430, 932],
  [844, 390],
  [915, 412],
  [768, 1024],
  [1440, 900],
  [1920, 1080],
];
try {
  for (const [width, height] of sizes) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width <= 1024,
      hasTouch: width <= 1024,
    });
    const page = await context.newPage();
    const requests = [];
    page.on('pageerror', (e) => errors.push({ width, message: e.message }));
    page.on('request', (r) => {
      if (/^https?:/.test(r.url())) requests.push(r.url());
    });
    await page.goto(pathToFileURL(htmlPath).href);
    const decode = async () => {
      await page.locator('#before-img').evaluate((n) => n.decode());
      await page.locator('#after-img').evaluate((n) => n.decode());
      await page.locator('#overlay-img').evaluate((n) => n.decode());
    };
    const beforeState = await page.evaluate(() =>
      JSON.stringify({ ...localStorage }),
    );
    for (const [i, t] of data.targets.entries()) {
      await page.locator('#item').selectOption(String(i));
      await decode();
      assert((await page.locator('#meta').textContent()).includes(t.id));
      assert.equal(
        await page.locator('#before-img').getAttribute('src'),
        data.images[t.avatar],
      );
      assert.equal(
        await page.locator('#overlay-img').getAttribute('src'),
        data.images[t.staging],
      );
      assert((await page.locator('#state').textContent()).includes(t.human));
      assert(
        (await page.locator('#approve').isDisabled()) ===
          (t.technical !== 'FIT_PASS'),
      );
    }
    await page.locator('#item').selectOption('0');
    await page.locator('#next').click();
    assert(
      (await page.locator('#meta').textContent()).includes(data.targets[1].id),
    );
    await page.locator('#previous').click();
    assert(
      (await page.locator('#meta').textContent()).includes(data.targets[0].id),
    );
    for (const mode of ['before', 'after', 'side']) {
      await page.locator('#' + mode).click();
      assert.equal(
        await page.locator('#compare').getAttribute('data-mode'),
        mode,
      );
    }
    await page.locator('#after').click();
    await page.locator('#region').selectOption('waist');
    assert.equal(await page.locator('#zoom').inputValue(), '2.5');
    assert(
      await page
        .locator('.after .viewport')
        .evaluate(
          (n) =>
            n.querySelector('.art').getBoundingClientRect().width >
            n.clientWidth * 2.4,
        ),
      'Zoom must enlarge the actual image',
    );
    await page.locator('#region').selectOption('whole');
    assert(
      await page
        .locator('.after .viewport')
        .evaluate(
          (n) =>
            n.querySelector('.art').getBoundingClientRect().height <=
            n.clientHeight + 2,
        ),
      'Whole-body frame must contain head and feet',
    );
    await page
      .locator('#companion')
      .selectOption('sword_path_common_female_v2');
    await page.locator('#companion-img').evaluate((n) => n.decode());
    await page.locator('#companion').selectOption('');
    await page.locator('#next').focus();
    await page.keyboard.press('Enter');
    assert(
      (await page.locator('#meta').textContent()).includes(data.targets[1].id),
    );
    assert.equal(await page.locator('html').getAttribute('lang'), 'pt-BR');
    const measured = await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      controls: [...document.querySelectorAll('button,select,summary,input')]
        .filter((n) => n.checkVisibility())
        .map((n) => ({
          id: n.id,
          height: n.getBoundingClientRect().height,
          name:
            n.getAttribute('aria-label') ||
            n.labels?.[0]?.textContent ||
            n.textContent,
        })),
    }));
    assert.equal(measured.width, width);
    assert(measured.documentWidth <= width);
    console.log(
      JSON.stringify({
        width,
        invalidControls: measured.controls.filter(
          (c) => c.height < 44 || !c.name.trim().length,
        ),
      }),
    );
    assert(
      measured.controls.every((c) => c.height >= 44 && c.name.trim().length),
    );
    if (width === 390 || width === 1440)
      for (const t of pending) {
        const i = data.targets.findIndex((a) => a.id === t.id);
        await page.locator('#item').selectOption(String(i));
        await decode();
        const prefix = t.id + '-' + width;
        for (const mode of ['before', 'after']) {
          await page.locator('#' + mode).click();
          await page
            .locator('.' + mode + ' .viewport')
            .screenshot({ path: path.join(out, prefix + '-' + mode + '.png') });
        }
        await page.locator('#side').click();
        await page
          .locator('#compare')
          .screenshot({ path: path.join(out, prefix + '-comparison.png') });
        await page.locator('#after').click();
        for (const region of t.slot === 'armor'
          ? ['head', 'left-hand', 'right-hand', 'waist']
          : t.slot === 'weapon'
            ? ['right-hand', 'waist', 'feet']
            : ['right-hand', 'waist']) {
          await page.locator('#region').selectOption(region);
          await page.locator('.after .viewport').screenshot({
            path: path.join(out, prefix + '-zoom-' + region + '.png'),
          });
        }
        await page.locator('#region').selectOption('whole');
        const companion =
          data.targets.find(
            (a) =>
              a.avatarSha256 === t.avatarSha256 &&
              a.slot === 'armor' &&
              a.slot !== t.slot &&
              a.id !== t.id,
          ) ??
          data.targets.find(
            (a) =>
              a.avatarSha256 === t.avatarSha256 &&
              a.slot === 'weapon' &&
              a.slot !== t.slot &&
              a.id !== t.id,
          );
        if (companion) {
          await page.locator('#companion').selectOption(companion.id);
          await page.locator('#companion-img').evaluate((n) => n.decode());
          await page.locator('.after .viewport').screenshot({
            path: path.join(out, prefix + '-with-' + companion.id + '.png'),
          });
        }
      }
    assert.equal(
      await page.evaluate(() => JSON.stringify({ ...localStorage })),
      beforeState,
      'No decision/storage writes',
    );
    assert.equal(requests.length, 0);
    checks.push({
      width,
      height,
      targetsDecoded: 16,
      embeddedHashes: true,
      navigation: true,
      beforeAfter: true,
      regions: true,
      avatarByExactCandidate: true,
      arbitraryAvatarSwitch: 'NOT_OFFERED_APPROVAL_SCOPE_GUARD',
      keyboard: true,
      touchTargets: true,
      overflow: false,
      remoteRequests: 0,
      decisionWrites: 0,
      physicalDevice: false,
    });
    await context.close();
  }
} finally {
  await browser.close();
}
assert.equal(hash(await readFile(htmlPath)), htmlHash);
await writeFile(
  path.join(out, 'results.json'),
  JSON.stringify(
    {
      engine,
      checks,
      errors,
      assetChecks,
      htmlSha256: htmlHash,
      humanDecisionControlsClicked: 0,
      pass: errors.length === 0,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    engine,
    viewports: checks.length,
    targets: 16,
    pending: 7,
    errors,
    decisionWrites: 0,
    pass: errors.length === 0,
  }),
);
if (errors.length) process.exitCode = 1;
