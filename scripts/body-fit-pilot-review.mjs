import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { validatePngChunks } from './body-fit-source-audit.mjs';

const output = 'build/task-0053-body-fit-pilot';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const save = (file, data) =>
  writeFile(file, JSON.stringify(data, null, 2) + '\n');
const number = Number(process.argv[2]);
const source = process.argv[3];
if (![1, 2, 3, 4].includes(number) || !source)
  throw new Error(
    'Usage: node scripts/body-fit-pilot-review.mjs <1..4> <generated PNG>',
  );
const folder = `${output}/attempt-${number}`;
await mkdir(folder, { recursive: true });
const bytes = await readFile(source);
const crc = validatePngChunks(bytes);
const metadata = await sharp(bytes, { failOn: 'warning' }).metadata();
const { data, info } = await sharp(bytes, { failOn: 'warning' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
let zero = 0,
  partial = 0,
  opaque = 0;
const box = { left: info.width, top: info.height, right: -1, bottom: -1 };
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const alpha = data[(y * info.width + x) * 4 + 3];
    if (alpha === 0) zero++;
    else if (alpha === 255) opaque++;
    else partial++;
    if (alpha >= 128) {
      box.left = Math.min(box.left, x);
      box.top = Math.min(box.top, y);
      box.right = Math.max(box.right, x);
      box.bottom = Math.max(box.bottom, y);
    }
  }
}
const landmarks = JSON.parse(
  await readFile(`${output}/landmarks.json`, 'utf8'),
);
const coverage = Object.fromEntries(
  Object.entries(landmarks.points).map(([name, [x, y]]) => [
    name,
    { x, y, alpha: data[(y * info.width + x) * 4 + 3] },
  ]),
);
const technical = {
  attempt: number,
  validatedAt: new Date().toISOString(),
  generatorFile: source,
  target: 'armor_traveler_uncommon_female_v2.png',
  sha256: hash(bytes),
  format: metadata.format,
  width: info.width,
  height: info.height,
  alpha: {
    channel: metadata.hasAlpha,
    transparentPixels: zero,
    partialPixels: partial,
    opaquePixels: opaque,
  },
  integrity: crc,
  bboxAlpha128: box,
  landmarkSamples: coverage,
  status:
    metadata.format === 'png' &&
    metadata.hasAlpha &&
    zero > 0 &&
    box.right >= 0 &&
    info.width === 1024 &&
    info.height === 1536
      ? 'TECHNICALLY_VALIDATED'
      : 'TECHNICAL_FAIL',
  fitStatus: 'FIT_VALIDATION_PENDING',
  policy: {
    postprocessing: 'NONE; byte copy only',
    humanBodyFitApproved: false,
    ready: false,
    devOnly: true,
  },
};
try {
  const previous = JSON.parse(
    await readFile(`${folder}/fit_report.json`, 'utf8'),
  );
  technical.fitStatus = previous.fitStatus;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await copyFile(source, `${folder}/overlay_candidate.png`);
await copyFile(`${output}/avatar_base.png`, `${folder}/avatar_base.png`);
await copyFile(
  `${output}/source_reference.png`,
  `${folder}/source_reference.png`,
);
await save(`${folder}/technical-receipt.json`, technical);
const labels = Object.entries(landmarks.points)
  .map(
    ([name, [x, y]]) =>
      `<circle cx="${x}" cy="${y}" r="8"/><text x="${x + 12}" y="${y - 12}">${name}</text>`,
  )
  .join('');
const guides = `<svg viewBox="0 0 1024 1536" aria-label="Landmarks diagnósticos"><g fill="cyan" stroke="black" stroke-width="2" font-family="sans-serif" font-size="17">${labels}</g><g fill="none" stroke="cyan" stroke-width="3"><circle cx="520" cy="302" r="35"/><circle cx="240" cy="799" r="45"/><circle cx="783" cy="810" r="45"/><path d="M379 346 L657 352 M391 492 L646 499 M421 705 L646 711"/></g><path d="M0 1495 H1024" stroke="red" stroke-width="3"/></svg>`;
const base = `<img class="base" src="../avatar_base.png" alt="Avatar HD imutável">`;
const candidate = `<img class="candidate" src="overlay_candidate.png" alt="Candidato sem transformação">`;
const views = {
  base,
  source: '<img src="../source_reference.png" alt="Fonte estética original">',
  candidate,
  combined: base + candidate,
  blend:
    base + candidate.replace('class="candidate"', 'class="candidate blend"'),
  guides: base + candidate + guides,
};
const frames = Object.entries(views)
  .map(
    ([name, markup]) =>
      `<section><h2>${name}</h2><div class="frame" data-view="${name}">${markup}</div></section>`,
  )
  .join('');
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>TASK-0053 — tentativa ${number}</title><style>body{background:#17202a;color:#fff;font:16px system-ui;margin:24px}a{color:#9ef}main{display:flex;flex-wrap:wrap;gap:24px}.frame{position:relative;width:360px;aspect-ratio:2/3;background:repeating-conic-gradient(#b3b3b3 0% 25%,#dedede 0% 50%) 0/24px 24px}.frame img,.frame svg{position:absolute;inset:0;width:100%;height:100%}.blend{opacity:.5}body.native .frame{width:1024px}pre{white-space:pre-wrap}select{padding:8px}</style><h1>TASK-0053 — tentativa ${number}</h1><p>DEV-only. Canvas comum 1024×1536; nenhuma correção de fit. Sem aprovação humana ou READY.</p><label>Zoom <select id="zoom"><option value="360">35%</option><option value="1024">100% nativo</option></select></label><p>O encaixe deve existir na arte: parece vestido ou colado? Cyan: landmarks diagnósticos, linha vermelha: pés do HD.</p><main>${frames}</main><h2>Análise e receipt</h2><pre id="report"></pre><script>document.querySelector('#zoom').onchange=e=>document.body.classList.toggle('native',e.target.value==='1024');fetch('fit_report.json').then(r=>r.ok?r.json():fetch('technical-receipt.json').then(x=>x.json())).then(r=>document.querySelector('#report').textContent=JSON.stringify(r,null,2));</script></html>`;
await writeFile(`${folder}/index.html`, html);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1150, height: 1800 },
  });
  await page.goto(`http://127.0.0.1:3109/${folder}/index.html`);
  await page
    .locator('img')
    .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
  await page.selectOption('#zoom', '1024');
  const evidencePage = await browser.newPage({
    viewport: { width: 1024, height: 1536 },
  });
  for (const [view, file] of Object.entries({
    combined: 'combined.png',
    blend: 'overlay_50_50.png',
    guides: 'alignment_guides.png',
  })) {
    // Integer viewport avoids fractional locator screenshot rounding.
    // Both layers keep the full canvas; candidate pixels are never transformed.
    await evidencePage.setContent(
      `<base href="http://127.0.0.1:3109/${folder}/"><style>html,body{margin:0;width:1024px;height:1536px;overflow:hidden}.frame{position:relative;width:1024px;height:1536px;background:repeating-conic-gradient(#b3b3b3 0% 25%,#dedede 0% 50%) 0/24px 24px}.frame img,.frame svg{position:absolute;inset:0;width:1024px;height:1536px}.blend{opacity:.5}</style><div class="frame">${views[view]}</div>`,
    );
    await evidencePage
      .locator('img')
      .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
    await evidencePage.screenshot({ path: `${folder}/${file}` });
  }
  await evidencePage.close();
  const checks = [];
  for (const [width, height] of [
    [390, 844],
    [412, 915],
    [844, 390],
    [915, 412],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.selectOption('#zoom', '360');
    const geometry = await page
      .locator('[data-view="combined"]')
      .evaluate((frame) => {
        const images = [...frame.querySelectorAll('img')];
        const boxes = images.map((i) => {
          const r = i.getBoundingClientRect();
          return [r.x, r.y, r.width, r.height];
        });
        return {
          sizes: images.map((i) => [i.naturalWidth, i.naturalHeight]),
          boxes,
          transforms: images.map((i) => getComputedStyle(i).transform),
        };
      });
    if (
      JSON.stringify(geometry.boxes[0]) !== JSON.stringify(geometry.boxes[1]) ||
      geometry.transforms.some((x) => x !== 'none')
    )
      throw Error('Lab added corrective transform or offset');
    checks.push({ viewport: [width, height], ...geometry, status: 'PASS' });
  }
  await save(`${folder}/lab-checks.json`, { status: 'PASS', checks });
} finally {
  await browser.close();
}
if (hash(await readFile(`${folder}/overlay_candidate.png`)) !== hash(bytes))
  throw Error('Candidate bytes changed');
console.log(JSON.stringify(technical));
