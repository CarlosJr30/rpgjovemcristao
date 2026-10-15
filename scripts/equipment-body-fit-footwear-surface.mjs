// Private, non-destructive structural proof. No PNG or Avatar is edited or emitted.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(
  root,
  'build/task-0075-body-fit-final-review/continuation/footwear',
);
await mkdir(out, { recursive: true });
const bytes = (p) => readFile(path.join(root, p));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const inventory = JSON.parse(
  await bytes('build/task-0075-body-fit-final-review/inventory.json'),
);
const receipt = JSON.parse(
  await bytes('docs/architecture/TASK-0075-HUMAN-VISUAL-DECISIONS.json'),
);
assert.equal(receipt.decisions.length, 16);
assert.equal(
  receipt.decisions.filter((d) => d.decision === 'VISUALLY_APPROVED').length,
  12,
);
for (const t of inventory.targets) {
  const d = receipt.decisions.find((d) => d.id === t.id);
  assert.equal(sha(await bytes(t.staging)), t.sha256);
  assert.equal(sha(await bytes(t.source)), t.sourceSha256);
  assert.equal(sha(await bytes(t.avatar)), t.avatarSha256);
  assert.equal(d.sha256, t.sha256);
  assert.equal(d.sourceSha256, t.sourceSha256);
  assert.equal(d.avatar.sha256, t.avatarSha256);
  assert.equal(d.avatar.id, t.avatarId);
  assert.equal(d.asset, t.staging);
  assert.equal(d.gender, t.gender);
}
// Separate conservative footwear-only regions, traced independently for each HD.
// No calves, skin, cape or trousers may be occluded; the HD remains fully visible.
const regions = {
  female: [
    [
      [297, 1268],
      [376, 1260],
      [374, 1325],
      [364, 1395],
      [387, 1441],
      [382, 1494],
      [242, 1494],
      [232, 1476],
      [241, 1440],
      [281, 1394],
      [294, 1323],
    ],
    [
      [654, 1261],
      [728, 1265],
      [744, 1320],
      [745, 1376],
      [777, 1410],
      [818, 1440],
      [830, 1471],
      [825, 1493],
      [689, 1495],
      [654, 1469],
      [654, 1426],
      [663, 1360],
    ],
  ],
  male: [
    [
      [277, 1271],
      [373, 1273],
      [373, 1325],
      [361, 1389],
      [370, 1433],
      [358, 1498],
      [210, 1504],
      [195, 1489],
      [202, 1449],
      [246, 1404],
      [273, 1366],
    ],
    [
      [646, 1272],
      [734, 1272],
      [752, 1313],
      [751, 1385],
      [785, 1426],
      [838, 1454],
      [859, 1490],
      [850, 1511],
      [695, 1506],
      [640, 1475],
      [637, 1431],
      [646, 1380],
    ],
  ],
};
function contains(x, y, p) {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [a, b] = p[i],
      [c, d] = p[j];
    if (b > y !== d > y && x < ((c - a) * (y - b)) / (d - b) + a)
      inside = !inside;
  }
  return inside;
}
const reports = [],
  figures = [];
for (const gender of ['female', 'male']) {
  const target = inventory.targets.find(
    (t) => t.id === `boots_traveler_common_${gender}_v2`,
  );
  const baseBytes = await bytes(target.avatar),
    base = await sharp(baseBytes).ensureAlpha().raw().toBuffer();
  const overlayPath = `build/task-0075-body-fit-final-review/size-rework/boots_${gender}_attempt03.png`;
  const overlayBytes = await bytes(overlayPath),
    overlay = await sharp(overlayBytes).ensureAlpha().raw().toBuffer();
  const surface = new Uint8Array(1024 * 1536);
  let pixels = 0,
    opaqueOutsideSurface = 0,
    painted = 0;
  let vector = '';
  for (let y = 0; y < 1536; y++) {
    let run = -1;
    for (let x = 0; x <= 1024; x++) {
      // Preserve the complete original toe/heel/sole. Clipping an entire replacement
      // shoe still paints a SECOND internal sole, even when its outside contour fits.
      // This proof supports shaft-only cosmetic panels, never replacement footwear.
      const index = y * 1024 + x,
        inside =
          x < 1024 &&
          y < 1395 &&
          base[index * 4 + 3] >= 128 &&
          regions[gender].some((p) => contains(x + 0.5, y + 0.5, p));
      if (inside) {
        surface[index] = 1;
        pixels++;
        if (overlay[index * 4 + 3] >= 128) painted++;
        if (run < 0) run = x;
      } else if (run >= 0) {
        vector += `M${run} ${y}h${x - run}v1h-${x - run}z`;
        run = -1;
      }
      if (x < 1024 && overlay[index * 4 + 3] >= 128 && !inside)
        opaqueOutsideSurface++;
    }
  }
  assert(pixels > 10000 && painted > 5000);
  assert(
    opaqueOutsideSurface > 1000,
    'Proof must exercise a real oversized/duplicate overlay',
  );
  // Rendering contract: output coverage = original base coverage; new pixels outside
  // the shoe surface are impossible. The base is never erased, masked or regenerated.
  let addedOutsideBase = 0;
  for (let i = 0; i < surface.length; i++) {
    const newAlpha = surface[i] ? overlay[i * 4 + 3] : 0;
    if (newAlpha > 0 && base[i * 4 + 3] < 128) addedOutsideBase++;
  }
  assert.equal(addedOutsideBase, 0);
  assert.equal(sha(await bytes(target.avatar)), target.avatarSha256);
  const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536"><path fill="white" d="${vector}"/></svg>`;
  await writeFile(path.join(out, `${gender}-footwear-surface.svg`), mask);
  const baseData = 'data:image/png;base64,' + baseBytes.toString('base64'),
    overlayData = 'data:image/png;base64,' + overlayBytes.toString('base64');
  const image = (s) => `<image href="${s}" width="1024" height="1536"/>`;
  const stage = (kind, content) =>
    `<figure><figcaption>${kind}</figcaption><div class="pan"><svg viewBox="0 0 1024 1536" role="img" aria-label="${gender}: ${kind}"><defs><clipPath id="${gender}-${kind.replaceAll(' ', '')}"><path d="${vector}"/></clipPath></defs>${image(baseData)}${content(kind)}</svg></div></figure>`;
  figures.push(
    `<article id="${gender}"><h2>Botas ${gender === 'female' ? 'femininas' : 'masculinas'} — prova de superfície</h2><p>Avatar: ${target.avatarId} · SHA ${target.avatarSha256}</p><p>Overlay experimental mantido sem ajuste: ${overlayPath} · SHA ${sha(overlayBytes)}</p><p class="warning">PROVA ESTRUTURAL, NÃO É FIT_PASS NEM ARTE APROVADA. A textura pode ter cortes e ainda exige arte específica para a superfície.</p><label>Zoom <select><option value="1">Corpo inteiro</option><option value="3">3× — arraste até os pés</option></select></label><div class="comparison">${stage('HD original', () => '')}${stage('Sobreposição aditiva', () => image(overlayData))}${stage('Superfície limitada', (kind) => `<g clip-path="url(#${gender}-${kind.replaceAll(' ', '')})">${image(overlayData)}</g>`)}${stage('Região de superfície', () => `<path d="${vector}" fill="#37dfac" opacity=".65"/>`)}</div><p>${opaqueOutsideSurface} pixels opacos do overlay são rejeitados fora da superfície; ${pixels} pixels definem a região. Nada do HD foi removido.</p></article>`,
  );
  reports.push({
    target: target.id,
    avatar: target.avatarId,
    avatarSha256: target.avatarSha256,
    overlayPath,
    overlaySha256: sha(overlayBytes),
    surfaceSha256: sha(Buffer.from(mask)),
    regions: regions[gender],
    surfacePixels: pixels,
    overlayPixelsOnSurface: painted,
    opaqueOverlayPixelsRejected: opaqueOutsideSurface,
    addedOutsideBase,
    baseFileHashReverified: true,
    status: 'STRUCTURAL_PROOF_ONLY',
    technical: 'NOT_ELIGIBLE',
    human: 'PENDING',
    runtime: false,
    limitations: [
      'Independent manually traced footwear region needs human contour review.',
      'Texture replacement is clipped; it does not preserve the complete oversized boot model.',
      'Shaft-only cosmetic panels: original toes, heels and soles are preserved below y1395. Dedicated surface artwork for seams, cuffs and laces is required; this is not replacement art.',
      'Production requires a separately approved compositor contract, exact Avatar binding and asset-failure fallback.',
    ],
  });
}
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>TASK-0075 — superfície do calçado HD</title><style>*{box-sizing:border-box}body{background:#102e23;color:#fff2cd;margin:16px;font:16px/1.5 system-ui;overflow-wrap:anywhere}h1,h2{color:#eac46d}.warning{background:#493b22;padding:12px}.comparison{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}figure{margin:0;min-width:0}figcaption{font-weight:bold;min-height:48px}.pan{overflow:auto;max-height:900px;background:repeating-conic-gradient(#bfcbbf 0% 25%,#dce3d6 0% 50%) 50%/24px 24px}.pan>svg{width:100%;display:block}select{min-height:44px;max-width:100%;padding:8px}article{border-top:1px solid #dbb966;margin-top:24px;padding-top:16px}@media(max-width:1000px){.comparison{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.comparison{grid-template-columns:1fr}}</style><h1>Superfície do calçado existente</h1><p>O HD inteiro permanece imutável. Em vez de apagar botas ou acrescentar uma segunda silhueta, o acabamento fica restrito ao calçado já desenhado. Esta é uma prova de compositor privado; nenhuma arte ou configuração de produção foi alterada. Não houve nova geração, escala ou deslocamento.</p>${figures.join('')}<script>for(const s of document.querySelectorAll('select'))s.addEventListener('change',()=>{for(const svg of s.closest('article').querySelectorAll('.pan>svg'))svg.style.width=(Number(s.value)*100)+'%'})</script></html>`;
await writeFile(path.join(out, 'index.html'), html);
await writeFile(
  path.join(out, 'proof.json'),
  JSON.stringify(
    {
      task: 'TASK-0075',
      method:
        'Non-destructive browser SVG clipping of equipment only; original HD rendered complete with no masking. Native code/vector proof, no raster editing.',
      receiptBindingsVerified: 16,
      visualApprovals: 12,
      originalsChanged: 0,
      newImageGenerations: 0,
      newTechnicalPasses: 0,
      runtimeChanges: 0,
      gallerySha256: sha(Buffer.from(html)),
      reports,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    proofs: reports.map((r) => ({
      target: r.target,
      addedOutsideBase: r.addedOutsideBase,
      rejected: r.opaqueOverlayPixelsRejected,
    })),
    visualApprovals: 12,
    originalsChanged: 0,
  }),
);
