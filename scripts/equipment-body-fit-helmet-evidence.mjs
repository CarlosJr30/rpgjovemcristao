import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(
  root,
  'build/task-0075-body-fit-final-review/continuation/helmets',
);
await mkdir(out, { recursive: true });
const cases = [
  [
    'female',
    '02',
    'f1a2b8e7592ab3610a7ad0191e34557d674f3947b6672902cab90f3c78cd11bd',
  ],
  [
    'male',
    '03',
    '2dccdbbab52c6ddd1ab8a2b75cd6755f2a5b5c1059ae9516ba3b70ba1a92af60',
  ],
];
const hash = (b) => createHash('sha256').update(b).digest('hex');
const results = [];
const browser = await chromium.launch({ channel: 'msedge' });
for (const [gender, attempt, expected] of cases) {
  const avatar = `apps/web/public/assets/avatar/hd/${gender}/${gender}_short_moss_medium_hd.png`,
    asset = `build/task-0075-body-fit-final-review/size-rework/helmet_${gender}_attempt${attempt}.png`;
  const original = await readFile(path.join(root, avatar)),
    overlay = await readFile(path.join(root, asset));
  assert.equal(hash(overlay), expected);
  const img = (b) => 'data:image/png;base64,' + b.toString('base64');
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data:;style-src 'unsafe-inline';connect-src 'none';base-uri 'none'"><title>Elmo ${gender} — aprovação pendente</title><style>*{box-sizing:border-box}body{margin:0;background:#103426;color:#ffe6ac;font:14px/1.4 system-ui}h1,p{margin:8px 16px;overflow-wrap:anywhere}h1{font-size:24px}.pair{display:grid;grid-template-columns:1fr 1fr}figure{margin:0}figcaption{height:32px;text-align:center;font-weight:bold}.stage{position:relative;aspect-ratio:2/3;background:repeating-conic-gradient(#bfcbbf 0% 25%,#dce3d6 0% 50%) 50%/24px 24px}.stage img{position:absolute;inset:0;width:100%;height:100%}@media(max-width:500px){.pair{grid-template-columns:1fr}}</style><h1>Elmo ${gender === 'female' ? 'feminino' : 'masculino'} — tentativa ${attempt}</h1><p>SHA-256: ${expected}</p><p>Avatar: ${gender}_short_moss_medium · decisão humana PENDENTE</p><div class="pair"><figure><figcaption>Antes: HD original</figcaption><div class="stage"><img alt="Avatar HD original" src="${img(original)}"></div></figure><figure><figcaption>Depois: novo elmo, sem ativação</figcaption><div class="stage"><img alt="Mesmo Avatar HD" src="${img(original)}"><img alt="Novo elmo não aprovado" src="${img(overlay)}"></div></figure></div><p>Originais preservados. A aprovação deste novo hash precisa ser informada explicitamente. A folga sobre as sobrancelhas, especialmente no masculino, precisa de julgamento humano.</p></html>`;
  await writeFile(path.join(out, `${gender}.html`), html);
  const page = await browser.newPage({
    viewport: { width: 1024, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html);
  await page
    .locator('img')
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await page.screenshot({
    path: path.join(out, `${gender}-comparison.png`),
    clip: { x: 0, y: 0, width: 1024, height: 420 },
  });
  assert.equal(await page.locator('button').count(), 0);
  await page.close();
  results.push({
    gender,
    attempt,
    asset,
    assetSha256: expected,
    avatar,
    avatarSha256: hash(original),
    human: 'PENDING',
    runtime: false,
    fullBodyHtml: `${gender}.html`,
    headComparison: `${gender}-comparison.png`,
  });
}
await browser.close();
await writeFile(
  path.join(out, 'evidence.json'),
  JSON.stringify(
    { task: 'TASK-0075', results, decisionClicks: 0, originalsChanged: 0 },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ helmets: 2, exactHashesVerified: true, decisionClicks: 0 }),
);
