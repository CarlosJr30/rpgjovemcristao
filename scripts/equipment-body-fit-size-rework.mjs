import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { inspectPng } from './body-fit-batch-bake.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = path.join(
  root,
  'build/task-0075-body-fit-final-review/size-rework',
);
await mkdir(dir, { recursive: true });
const read = (p) => readFile(path.join(root, p));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const inventory = JSON.parse(
  await read('build/task-0075-body-fit-final-review/inventory.json'),
);
const receipt = JSON.parse(
  await read('docs/architecture/TASK-0075-HUMAN-VISUAL-DECISIONS.json'),
);
const data = [];
for (const t of inventory.targets) {
  assert.equal(hash(await read(t.staging)), t.sha256);
  assert.equal(hash(await read(t.avatar)), t.avatarSha256);
  assert.equal(hash(await read(t.source)), t.sourceSha256);
  const decision = receipt.decisions.find((d) => d.id === t.id);
  assert.equal(decision.sha256, t.sha256);
  assert.equal(decision.avatar.sha256, t.avatarSha256);
  if (!['helmet', 'boots'].includes(t.slot)) continue;
  const variants = [];
  const attempts =
    t.slot === 'boots'
      ? ['01', '02', '03', '04']
      : t.gender === 'female'
        ? ['01', '02']
        : ['01', '02', '03'];
  for (const attempt of attempts) {
    const filename = `${t.slot}_${t.gender}_attempt${attempt}.png`;
    const p = `build/task-0075-body-fit-final-review/size-rework/${filename}`;
    const bytes = await read(p);
    const png = await inspectPng(bytes);
    assert.equal(png.width, 1024);
    assert.equal(png.height, 1536);
    assert.equal(png.hasAlpha, true);
    const raw = await sharp(bytes).ensureAlpha().raw().toBuffer();
    let facePixels = 0,
      outsideRegion = 0;
    const footBounds = [
      { left: 1024, top: 1536, right: 0, bottom: 0, pixels: 0 },
      { left: 1024, top: 1536, right: 0, bottom: 0, pixels: 0 },
    ];
    for (let y = 0; y < 1536; y++)
      for (let x = 0; x < 1024; x++) {
        const a = raw[(y * 1024 + x) * 4 + 3];
        if (a > 8 && (t.slot === 'helmet' ? y > 300 : y < 1050))
          outsideRegion++;
        if (
          a >= 128 &&
          t.slot === 'helmet' &&
          x >= 435 &&
          x <= 600 &&
          y >= 145 &&
          y <= 275
        )
          facePixels++;
        if (a >= 128 && t.slot === 'boots') {
          const b = footBounds[x < 512 ? 0 : 1];
          b.left = Math.min(b.left, x);
          b.right = Math.max(b.right, x);
          b.top = Math.min(b.top, y);
          b.bottom = Math.max(b.bottom, y);
          b.pixels++;
        }
      }
    // Manual composition inspection, bound to the exact bytes, not inferred from a rectangular proxy.
    // Male03 overlaps 105 pixels of the conservative facial rectangle near the brow/temple;
    // the eyes appear clear, but brow clearance must remain explicit in human review.
    const readyForHuman = new Set([
      'f1a2b8e7592ab3610a7ad0191e34557d674f3947b6672902cab90f3c78cd11bd',
      '2dccdbbab52c6ddd1ab8a2b75cd6755f2a5b5c1059ae9516ba3b70ba1a92af60',
    ]).has(hash(bytes));
    variants.push({
      filename,
      path: p,
      sha256: hash(bytes),
      png,
      facePixels,
      outsideRegion,
      footBounds: t.slot === 'boots' ? footBounds : null,
      technical: 'FIT_REVIEW_PENDING',
      visualResult: readyForHuman ? 'HUMAN_REVIEW_READY' : 'NEEDS_REWORK',
      defect:
        t.slot === 'boots'
          ? 'Ainda há incompatibilidade de contorno/posição ou calçado duplicado. Não recomendar aprovação.'
          : readyForHuman
            ? 'Rosto e olhos livres na composição; requer aceite humano do novo hash e validação técnica completa.'
            : 'A posição anterior invade a região do rosto; versão superada.',
      human: 'PENDING_FOR_THIS_NEW_HASH',
      runtime: false,
      image: 'data:image/png;base64,' + bytes.toString('base64'),
    });
  }
  data.push({
    id: t.id,
    slot: t.slot,
    gender: t.gender,
    avatarId: t.avatarId,
    avatarSha256: t.avatarSha256,
    originalSha256: t.sha256,
    original:
      'data:image/png;base64,' + (await read(t.staging)).toString('base64'),
    avatar:
      'data:image/png;base64,' + (await read(t.avatar)).toString('base64'),
    variants,
  });
}
assert.equal(data.length, 4);
assert.equal(
  receipt.decisions.filter((d) => d.decision === 'VISUALLY_APPROVED').length,
  12,
);
const escape = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;');
const stage = (t, overlay, label) =>
  `<figure><figcaption>${label}</figcaption><div class="pan"><div class="stage"><img alt="Avatar HD original ${t.avatarId}" src="${t.avatar}">${overlay ? `<img class="overlay" alt="Equipamento ${t.id}" src="${overlay}">` : ''}</div></div></figure>`;
const cards = data
  .map(
    (t, i) =>
      `<article id="candidate-${i}"><h2>${escape(t.id)}</h2><p>Avatar: ${t.avatarId} · SHA: <code>${t.avatarSha256}</code></p><p>Original: <code>${t.originalSha256}</code> · CORREÇÃO SOLICITADA</p><p class="warning">Novas versões: inspeção técnica e aprovação humana pendentes. Nenhuma ativação.</p><label>Zoom de inspeção <select class="zoom"><option value="1">Corpo inteiro</option><option value="2">2× — arraste para a região</option><option value="3">3× — arraste para a região</option></select></label><div class="compare">${stage(t, null, 'HD original preservado')}${stage(t, t.original, 'Candidato anterior — não aprovado')}${t.variants.map((v, n) => stage(t, v.image, `Tentativa ${n + 1} — não aprovada`)).join('')}</div>${t.variants.map((v) => `<p>${v.filename}: <code>${v.sha256}</code></p><p>${v.visualResult}: ${v.defect}</p><p>Pixels opacos na região facial: ${v.facePixels}; fora da região esperada: ${v.outsideRegion}. Estes indicadores não comprovam encaixe visual.</p>`).join('')}</article>`,
  )
  .join('');
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>TASK-0075 — Correções de elmos e botas</title><style>html{color-scheme:dark}*{box-sizing:border-box}body{overflow-wrap:anywhere;margin:0;padding:16px;background:#102e23;color:#fff4d6;font:16px/1.5 system-ui}main{max-width:1800px;margin:auto}h1,h2{color:#edd086}h2,code{overflow-wrap:anywhere}article{border-top:2px solid #bba060;margin-top:32px;padding-top:16px}.warning{background:#49391e;padding:12px}a{color:#ffe4a0}nav{display:flex;flex-wrap:wrap;gap:8px}nav a,select{max-width:100%;padding:12px;min-height:44px;background:#f4e9c9;color:#143628;border-radius:8px}.compare{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}figure{margin:12px 0;min-width:0}figcaption{min-height:52px;font-weight:bold}.pan{overflow:auto;max-height:850px;background:repeating-conic-gradient(#bbc6b8 0% 25%,#d7dfd1 0% 50%) 50%/24px 24px}.stage{position:relative;width:100%;aspect-ratio:2/3;min-width:0}.stage img{position:absolute;width:100%;height:100%;inset:0}.overlay{z-index:1}code{font-size:13px}li{margin-bottom:8px}@media(max-width:1000px){.compare{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.compare{grid-template-columns:1fr}body{padding:12px}figcaption{min-height:0}}</style><main><h1>TASK-0075 — Elmos e botas em correção</h1><p>Registro recebido: 12 originais aprovados visualmente e 4 com correção solicitada. Esta página compara os originais e novas tentativas por item, sem transformar os PNGs ou os Avatares.</p><p class="warning">As tentativas são experimentais. Não são novas versões FIT_PASS e não herdam a aprovação dos originais. A galeria anterior e o ZIP de auditoria permanecem como evidência histórica. Nenhuma publicação foi realizada.</p><nav>${data.map((t, i) => `<a href="#candidate-${i}">${t.slot === 'helmet' ? 'Elmo' : 'Botas'} ${t.gender === 'female' ? 'feminino' : 'masculino'}</a>`).join('')}</nav>${cards}<h2>Decisões visuais dos originais</h2><ul>${receipt.decisions.map((d) => `<li>${d.id}: ${d.decision === 'VISUALLY_APPROVED' ? 'APROVADO VISUALMENTE' : 'CORREÇÃO SOLICITADA'} · <code>${d.sha256}</code></li>`).join('')}</ul><p>Os resultados técnicos anteriores continuam válidos separadamente. Armaduras raras permanecem arquivadas; testes funcionais com falhas ainda bloqueiam publicação.</p></main><script>for(const select of document.querySelectorAll('.zoom'))select.addEventListener('change',()=>{for(const stage of select.closest('article').querySelectorAll('.stage'))stage.style.width=(Number(select.value)*100)+'%'})</script></html>`;
await writeFile(path.join(dir, 'review.html'), html);
const report = {
  recordedAt: new Date().toISOString(),
  method:
    'Built-in imagegen only. PNGs copied unchanged; browser uses untransformed full-canvas layers. No programmatic raster editing.',
  originalHashesVerified: 16,
  documentaryVisualApprovals: 12,
  correctionRequests: 4,
  newTechnicalPasses: 0,
  newHumanApprovals: 0,
  runtimeChanges: 0,
  gallerySha256: hash(Buffer.from(html)),
  candidates: data.map((t) => {
    const entry = { ...t };
    delete entry.original;
    delete entry.avatar;
    entry.variants = t.variants.map((v) => {
      const variant = { ...v };
      delete variant.image;
      return variant;
    });
    return entry;
  }),
};
await writeFile(
  path.join(dir, 'manifest.json'),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    candidates: data.length,
    attempts: (await readdir(dir)).filter((f) => f.endsWith('.png')).length,
    gallery: path.join(dir, 'review.html'),
    manifest: path.join(dir, 'manifest.json'),
  }),
);
