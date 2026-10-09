import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { OUTPUT, fitStateForOutput } from './body-fit-bake.mjs';

const meta = JSON.parse(await readFile(OUTPUT + '/fit-metadata.json', 'utf8'));
const assessment = JSON.parse(
  await readFile(OUTPUT + '/fit-report.json', 'utf8'),
);
const reviewState =
  assessment.output?.sha256 === meta.output.sha256
    ? assessment
    : fitStateForOutput(assessment, meta.output);
await mkdir(OUTPUT + '/review', { recursive: true });
const base = await readFile(OUTPUT + '/avatar_base.png'),
  source = await readFile(OUTPUT + '/source.png'),
  baked = await readFile(OUTPUT + '/baked_overlay.png');
const canvas = () =>
  sharp({
    create: { width: 1024, height: 1536, channels: 4, background: '#d3d3d3' },
  });
await canvas()
  .composite([{ input: base }, { input: source }])
  .png()
  .toFile(OUTPUT + '/before.png');
await canvas()
  .composite([{ input: base }, { input: baked }])
  .png()
  .toFile(OUTPUT + '/combined.png');
const raw = await sharp(baked).raw().toBuffer();
for (let i = 3; i < raw.length; i += 4) raw[i] = Math.round(raw[i] * 0.5);
const blend = await sharp(raw, {
  raw: { width: 1024, height: 1536, channels: 4 },
})
  .png()
  .toBuffer();
await canvas()
  .composite([{ input: base }, { input: blend }])
  .png()
  .toFile(OUTPUT + '/overlay_50_50.png');
const marks = Object.entries(meta.landmarkResiduals)
  .map(([name, p]) => {
    const [x, y] = p.avatar,
      [a, b] = p.projected;
    return `<path d="M${x} ${y} L${a} ${b}" stroke="orange" stroke-width="3"/><circle cx="${x}" cy="${y}" r="6" fill="cyan"/><circle cx="${a}" cy="${b}" r="5" fill="orange"/><text x="${x + 9}" y="${y - 12}">${name}</text>`;
  })
  .join('');
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><g font-size="16" font-family="sans-serif" fill="black">${marks}</g><path d="M0 1495 H1024" stroke="red" stroke-width="2"/></svg>`,
);
await canvas()
  .composite([{ input: base }, { input: baked }, { input: svg }])
  .png()
  .toFile(OUTPUT + '/alignment_guides.png');
const row = (title, file, kind) =>
  `<section><h2>${title}</h2><div class="frame" data-view="${kind}"><img src="../${file}" alt="${title}"></div></section>`;
const composed = (title, kind, opacity = '1') =>
  `<section><h2>${title}</h2><div class="frame" data-view="${kind}"><img class="base" src="../avatar_base.png" alt="HD imutável"><img class="baked" data-baked src="../baked_overlay.png" style="opacity:${opacity}" alt="Baked em posição1:1 sem transform"></div></section>`;
const t = meta.transform;
const controls = [
  ['translateX', 'Mover X', -200, 600, 1],
  ['translateY', 'Mover Y', -200, 600, 1],
  ['scale', 'Escala uniforme', 0.1, 1.2, 0.001],
  ['rotation', 'Rotação (graus)', -5, 5, 0.1],
]
  .map(
    ([name, label, min, max, step]) =>
      `<label>${label}<input data-transform="${name}" id="${name}" type="number" min="${min}" max="${max}" step="${step}" value="${t[name]}"></label>`,
  )
  .join('');
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>TASK-0054 — Offline bake DEV review</title><style>body{margin:20px;background:#17202a;color:#fff;font:16px system-ui}a{color:#9ef}main{display:flex;flex-wrap:wrap;gap:20px}section{max-width:100%;min-width:0}.frame{position:relative;width:min(360px,calc(100vw - 40px));aspect-ratio:2/3;background:repeating-conic-gradient(#b3b3b3 0% 25%,#ddd 0% 50%) 0/24px 24px}.frame img,.frame canvas{position:absolute;top:0;left:0;width:100%;height:100%;transform:none}body.native .frame{width:1024px;height:1536px}label{display:inline-flex;flex-direction:column;margin:8px}input,select,button{font:inherit;padding:8px;max-width:180px}pre{white-space:pre-wrap;overflow-wrap:anywhere}details{border:1px solid #657;padding:12px;margin:16px 0}body.native{overflow-x:auto}</style><h1>TASK-0054 — piloto baked</h1><p id="fit-status">${reviewState.status} / ${reviewState.reviewStatus ?? 'FIT_VALIDATION_PENDING'}. ${reviewState.ready ? 'READY somente em staging, aprovado por Carlos para este hash e avatar; runtime preservado.' : 'Somente DEV; aprovação humana/READY pendentes.'}</p><p>Antes: source original sobre HD sem ajuste. Depois: PNG baked já alinhado. Cyan = landmark HD; orange = source projetado; não são ajustes de runtime.</p><label>Zoom<select id="zoom" aria-label="Zoom"><option value="360">35%</option><option value="1024">100% nativo</option></select></label><p><a href="../fit-metadata.json">Metadata exata / landmarks / hashes</a> · <a href="../fit-report.json">Fit report</a></p><main>${row('Avatar base', 'avatar_base.png', 'base')}${row('Source original', 'source.png', 'source')}${row('Antes — source sem ajuste', 'before.png', 'before')}${row('Baked isolado', 'baked_overlay.png', 'baked')}${composed('Depois — baked sem transform', 'combined')}${composed('Overlay 50/50', 'blend', '.5')}${row('Alignment guides', 'alignment_guides.png', 'guides')}</main><details id="editor"><summary>Editor offline DEV — rascunho separado do baked</summary><p>Alterar controles muda somente o canvas de rascunho. O PNG baked e sua apresentação continuam intactos. Exporte metadata e execute o CLI local para um novo bake do mesmo piloto; nenhum endpoint de escrita.</p>${controls}<label>Opacity<input id="opacity" type="range" min="0" max="1" step=".05" value=".5"></label><label>Before/after<select id="draft-mode" aria-label="Before/after"><option value="after">Após ajuste offline</option><option value="before">Source original</option></select></label><label>Guides<input id="draft-guides" type="checkbox" checked></label><button id="reset" type="button">Reset</button><button id="export" type="button">Exportar metadata do rascunho</button><div class="frame"><canvas id="draft" width="1024" height="1536" aria-label="Composição de rascunho offline"></canvas></div><pre id="draft-metadata"></pre></details><h2>Fit report</h2><pre id="report"></pre><script type="module">import {initializeBakeReview} from '/tools/body-fit-bake-lab/review.mjs';initializeBakeReview();</script></html>`;
await writeFile(OUTPUT + '/review/index.html', html);
console.log(
  'Seven review views and separate DEV draft editor written; final baked presentation has no transform.',
);
