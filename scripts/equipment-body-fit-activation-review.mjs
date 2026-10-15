import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { inspectPng } from './body-fit-batch-bake.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const dir = path.join(root, 'build/task-0075-body-fit-final-review/activation');
await mkdir(dir, { recursive: true });
const read = (p) => readFile(path.join(root, p));
const json = async (p) => JSON.parse(await read(p));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const receipt = await json(
  'docs/architecture/TASK-0075-HUMAN-VISUAL-DECISIONS.json',
);
const history = await json(
  'build/task-0059-equipment-recovery/current-targets.json',
);
const expected = {
  armor_traveler_uncommon_female_v2:
    'ebee2f026c2dd6aac6b47850c8412f243cdc20c51a36d6f91e2d6cf3b46c20cb',
  armor_traveler_uncommon_male_v2:
    '8ece1c5d4daad2b4b7b0a6d673eb3ad6e2d16a9bcc888082ee33a2bd71c928c2',
  sword_path_common_female_v2:
    '735000c62ddaee5214cfb895deae17685a1f2e1c0c642f3557e09879d90524f2',
  sword_path_common_male_v2:
    '73e29fafd9adec500978eae7bb35eca05e8b79d946862b98704f40e95964aec4',
};
assert.equal(receipt.decisions.length, 16);
assert.equal(
  receipt.decisions.filter((d) => d.decision === 'VISUALLY_APPROVED').length,
  12,
);
assert.equal(
  sha(await read('build/task-0075-body-fit-final-review/review/index.html')),
  receipt.evidence.gallerySha256,
);
const checked = [];
for (const d of receipt.decisions) {
  const t = history.targets.find((t) => t.id === d.id);
  assert(t);
  assert.equal(d.asset, t.staging);
  assert.equal(d.itemId, t.itemId);
  assert.equal(d.gender, t.gender);
  assert.equal(d.avatar.path, t.avatar);
  assert.equal(sha(await read(d.asset)), d.sha256);
  assert.equal(sha(await read(t.source)), d.sourceSha256);
  assert.equal(sha(await read(d.avatar.path)), d.avatar.sha256);
  if (expected[d.id]) {
    assert.equal(d.sha256, expected[d.id]);
    assert.equal(d.decision, 'VISUALLY_APPROVED');
    assert.equal(t.technical, 'FIT_PASS');
    const png = await inspectPng(await read(d.asset));
    assert.equal(png.width, 1024);
    assert.equal(png.height, 1536);
    checked.push({ id: d.id, sha256: d.sha256, avatar: d.avatar, png });
  }
}
const uri = async (p) =>
  'data:image/png;base64,' + (await read(p)).toString('base64');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const captures = [];
try {
  for (const gender of ['female', 'male']) {
    const armor = receipt.decisions.find(
      (d) => d.id === `armor_traveler_uncommon_${gender}_v2`,
    );
    const sword = receipt.decisions.find(
      (d) => d.id === `sword_path_common_${gender}_v2`,
    );
    assert.equal(armor.avatar.sha256, sword.avatar.sha256);
    const hd = await uri(armor.avatar.path),
      a = await uri(armor.asset),
      s = await uri(sword.asset);
    const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0075 ${gender} pair</title><style>body{margin:16px;background:#102e25;color:#fff;font:16px system-ui}main{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0} .avatar{width:384px;height:576px;position:relative;background:repeating-conic-gradient(#ddd 0% 25%,#bbb 0% 50%) 0/20px 20px}.avatar img{position:absolute;inset:0;width:100%;height:100%}figcaption{max-width:384px;overflow-wrap:anywhere}#zoom{width:768px;height:500px;overflow:hidden;position:relative}#zoom .avatar{width:768px;height:1152px;position:absolute;top:-300px;left:0}@media(max-width:430px){.avatar{width:calc(100vw - 32px);height:calc((100vw - 32px)*1.5)}}</style><h1>TASK-0075 ${gender}: exact armor + sword</h1><p>Technical comparison; no new human combination approval recorded.</p><main><figure><figcaption>Before</figcaption><div class="avatar"><img src="${hd}" alt="Original Avatar"></div></figure><figure><figcaption>After: ${armor.id} + ${sword.id}</figcaption><div class="avatar" id="pair"><img src="${hd}" alt="Avatar"><img src="${a}" alt="Armor"><img src="${s}" alt="Sword"></div></figure></main><h2>Waist, arm and sheath</h2><div id="zoom"><div class="avatar"><img src="${hd}" alt="Avatar"><img src="${a}" alt="Armor"><img src="${s}" alt="Sword"></div></div><p>${armor.sha256}<br>${sword.sha256}<br>Avatar ${armor.avatar.sha256}</p></html>`;
    const file = path.join(dir, `${gender}-pair.html`);
    await writeFile(file, html);
    const page = await browser.newPage({
      viewport: { width: 1100, height: 1000 },
    });
    await page.goto(pathToFileURL(file).href);
    await page
      .locator('img')
      .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
    for (const [selector, name] of [
      ['main', 'before-after'],
      ['#zoom', 'waist'],
    ]) {
      const p = `${gender}-${name}.png`;
      await page.locator(selector).screenshot({ path: path.join(dir, p) });
      captures.push(p);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  path.join(dir, 'preflight.json'),
  JSON.stringify(
    {
      status: 'PASS',
      receiptBindings: 16,
      visualApprovals: 12,
      checked,
      captures,
      humanCombinationApproval: false,
      runtimeActivation: false,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    status: 'PASS',
    receiptBindings: 16,
    checked: checked.length,
    captures,
  }),
);
