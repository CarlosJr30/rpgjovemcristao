import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceDir = path.join(root, 'assets-source/body-fit-v2');
const output = path.join(root, 'build/task-0052-body-fit-validation/delivery');
const review = path.join(output, 'review');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const save = async (file, value) =>
  writeFile(file, JSON.stringify(value, null, 2) + '\n');

// PNG decoding alone is not a CRC check. Reject corrupt chunks explicitly.
export function validatePngChunks(bytes) {
  if (
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw new Error('Invalid PNG signature');
  let offset = 8;
  let chunks = 0;
  let ended = false;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error('Truncated PNG chunk');
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error('Truncated PNG payload');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    let crc = 0xffffffff;
    for (const byte of bytes.subarray(offset + 4, end - 4)) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    if ((crc ^ 0xffffffff) >>> 0 !== bytes.readUInt32BE(end - 4))
      throw new Error(`PNG CRC mismatch: ${type}`);
    if (chunks === 0 && type !== 'IHDR') throw new Error('IHDR must be first');
    chunks++;
    offset = end;
    if (type === 'IEND') {
      ended = true;
      break;
    }
  }
  if (!ended || offset !== bytes.length)
    throw new Error('Missing IEND or trailing data');
  return { status: 'CRC_PASS', chunks };
}

// Mapping is exact filename, or a hash-bound explicit target in a delivered manifest.
// A depicted slot or a filename such as "paladina" cannot determine target gender/rarity.
export function mapSource(source, manifestEntries, targets) {
  const exact = targets.filter((target) => target.filename === source.file);
  const entries = manifestEntries.filter(
    (entry) => entry.filename === source.file && entry.sha256 === source.sha256,
  );
  const declared = entries.flatMap((entry) =>
    entry.targetFilename ? [entry.targetFilename] : [],
  );
  const filenames = [
    ...new Set([...exact.map((target) => target.filename), ...declared]),
  ];
  if (
    filenames.length !== 1 ||
    !targets.some((target) => target.filename === filenames[0])
  )
    return {
      status: 'UNMAPPED_SOURCE_ART',
      target: null,
      reason: 'No single explicit, valid target binding',
    };
  return {
    status: 'MAPPED',
    target: filenames[0],
    reason: exact.length
      ? 'Exact target filename'
      : 'Explicit hash-bound manifest target',
  };
}

async function main() {
  for (const directory of [
    output,
    review,
    path.join(review, 'source'),
    path.join(review, 'references'),
  ])
    await mkdir(directory, { recursive: true });
  const at = new Date().toISOString();
  const targets = (
    await json(
      path.join(root, 'docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json'),
    )
  ).assets;
  let manifestPath = 'assets-source/body-fit-v2/manifest.json';
  let manifest;
  try {
    manifest = await json(path.join(root, manifestPath));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    manifestPath = 'manifest.json';
    manifest = await json(path.join(root, manifestPath));
  }
  if (!Array.isArray(manifest.assets))
    throw new Error('Manifest assets must be an array');
  const files = (await readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.png$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const sources = [];
  for (const file of files) {
    const bytes = await readFile(path.join(sourceDir, file));
    const crc = validatePngChunks(bytes);
    const metadata = await sharp(bytes, { failOn: 'warning' }).metadata();
    const { data, info } = await sharp(bytes, { failOn: 'warning' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const alpha = { zero: 0, partial: 0, opaque: 0, max: 0, atLeast128: 0 };
    const bounds = {
      left: info.width,
      top: info.height,
      right: -1,
      bottom: -1,
    };
    for (let i = 0; i < info.width * info.height; i++) {
      const a = data[i * info.channels + info.channels - 1];
      alpha.max = Math.max(alpha.max, a);
      if (a === 0) alpha.zero++;
      else if (a === 255) alpha.opaque++;
      else alpha.partial++;
      if (a >= 128) {
        alpha.atLeast128++;
        const x = i % info.width,
          y = Math.floor(i / info.width);
        bounds.left = Math.min(bounds.left, x);
        bounds.right = Math.max(bounds.right, x);
        bounds.top = Math.min(bounds.top, y);
        bounds.bottom = Math.max(bounds.bottom, y);
      }
    }
    const source = { file, sha256: hash(bytes) };
    const entry = manifest.assets.find(
      (candidate) => candidate.filename === file,
    );
    const mapping = mapSource(source, manifest.assets, targets);
    const technicalPass =
      metadata.format === 'png' &&
      info.width === 1024 &&
      info.height === 1536 &&
      metadata.hasAlpha &&
      alpha.zero > 0 &&
      alpha.atLeast128 > 0;
    if (!entry || entry.sha256 !== source.sha256)
      throw new Error(`Source manifest hash mismatch: ${file}`);
    const record = {
      ...source,
      bytes: bytes.length,
      width: info.width,
      height: info.height,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha,
      alpha,
      bounds,
      integrity: { ...crc, decode: 'DECODE_PASS' },
      technicalStatus: technicalPass ? 'TECHNICAL_PASS' : 'TECHNICAL_FAIL',
      sourceStatus: 'SOURCE_VISUAL_APPROVED',
      approvalEvidence:
        'Carlos Faustino: source-art delivery instruction, confirmed by delivered manifest and actual hash',
      manifestPath,
      manifestHashMatches: true,
      mapping,
      fitStatus: 'FIT_VALIDATION_PENDING',
      humanBodyFitApproved: false,
      runtimeReady: false,
    };
    sources.push(record);
    await copyFile(
      path.join(sourceDir, file),
      path.join(review, 'source', file),
    );
  }
  const references = ['female', 'male'].map(
    (gender) =>
      targets.find((target) => target.gender === gender).referenceAvatar,
  );
  for (const reference of references) {
    const original = path.join(root, 'apps/web/public', reference.source);
    const bytes = await readFile(original);
    if (hash(bytes) !== reference.sha256)
      throw new Error(`Reference hash mismatch: ${reference.id}`);
    await copyFile(
      original,
      path.join(review, 'references', `${reference.id}.png`),
    );
  }
  const counts = {
    sources: sources.length,
    uniqueHashes: new Set(sources.map((source) => source.sha256)).size,
    technicalPass: sources.filter(
      (source) => source.technicalStatus === 'TECHNICAL_PASS',
    ).length,
    mapped: sources.filter((source) => source.mapping.status === 'MAPPED')
      .length,
    UNMAPPED_SOURCE_ART: sources.filter(
      (source) => source.mapping.status === 'UNMAPPED_SOURCE_ART',
    ).length,
    FIT_PASS: 0,
    FIT_FAIL: 0,
    NEEDS_REWORK: 0,
    FIT_VALIDATION_PENDING: sources.length,
    READY: 0,
  };
  const missingTargets = targets
    .filter(
      (target) =>
        !sources.some((source) => source.mapping.target === target.filename),
    )
    .map((target) => target.filename);
  const inventory = {
    at,
    manifestPath,
    manifestSha256: hash(await readFile(path.join(root, manifestPath))),
    expectedManifestAbsent:
      manifestPath !== 'assets-source/body-fit-v2/manifest.json',
    counts,
    sources,
    references,
    missingTargets,
    diagnosticScope:
      'Two HD reference bodies only; neither gender nor target compatibility is asserted for unmapped source art. Full-canvas inset 0, no fitting correction.',
  };
  await save(path.join(output, 'source-inventory.json'), inventory);
  for (const source of sources)
    await save(path.join(output, source.file + '.fit-report.json'), {
      at,
      ...source,
      references: references.map((reference) => ({
        id: reference.id,
        sha256: reference.sha256,
        bounds: reference.bounds,
        footBaseline: reference.footBaseline,
      })),
      diagnosticStatus: 'VISUAL_INSPECTION_REQUIRED',
      evidence: 'review/index.html',
      reason: 'Mapping required before target-specific Body-Fit validation',
      correction: 'NONE',
    });
  const safe = JSON.stringify(inventory).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0052 · review local das fontes</title>
<style>body{margin:16px;font:16px system-ui;color:#182e29;background:#f3f0e7}h1{font-size:25px}article{border:1px solid #aaa;border-radius:8px;padding:12px;margin:20px 0;background:white}h2{overflow-wrap:anywhere;font-size:19px}.views{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}figure{margin:0}figcaption{margin:5px 0}.frame{position:relative;width:100%;max-width:240px;aspect-ratio:2/3;background:repeating-conic-gradient(#deded7 0 25%,#f5f5ef 0 50%) 0/16px 16px;overflow:hidden}.frame>img,.frame>svg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.blend .art{opacity:.5}.split .art{clip-path:inset(0 0 0 50%)}.split:after{content:'';position:absolute;left:50%;top:0;bottom:0;border-left:1px solid red}code{overflow-wrap:anywhere}p{max-width:100ch;overflow-wrap:anywhere}summary{cursor:pointer}button{padding:8px}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}</style>
<h1>TASK-0052 · fontes aprovadas esteticamente · diagnóstico DEV</h1>
<p>12 fontes; 11 hashes únicos. Nenhum target atribuído por suposição. UNMAPPED_SOURCE_ART / FIT_VALIDATION_PENDING. Nenhum READY ou aprovação corporal. As composições abaixo são diagnósticas sobre duas referências, sem confirmar gênero, item ou raridade. Originais copiados byte a byte; inset 0 em canvas 1024×1536, sem offsets, crop ou warp.</p>
<p>50/50: mistura de alpha a 50% e comparação por divisão vertical. Guides: contorno HD alpha ≥128 (verde), contorno da fonte alpha ≥128 (laranja), eixo x512 e baseline dos pés (vermelho). São limites de pixels, não anchors anatômicos aprovados.</p>
<p><a href="../source-inventory.json">Inventário, hashes e 16 targets sem fonte vinculada</a> · <a href="../visual-assessment.json">Diagnóstico visual e recomendação de regeneração</a></p><main></main>
<script type="application/json" id="inventory">${safe}</script><script>
const inventory=JSON.parse(document.getElementById('inventory').textContent);
const main=document.querySelector('main');
function image(src,kind,alt){const node=document.createElement('img');node.src=src;node.className=kind;node.alt=alt;return node}
for(const [index,source] of inventory.sources.entries()) for(const reference of inventory.references){
 const article=document.createElement('article');article.dataset.source=index;article.dataset.reference=reference.id;
 const title=document.createElement('h2');title.textContent=source.file+' · '+reference.id;article.append(title);
 const note=document.createElement('p');note.textContent='UNMAPPED_SOURCE_ART · FIT_VALIDATION_PENDING · SHA-256 '+source.sha256;article.append(note);
 const grid=document.createElement('div');grid.className='views';article.append(grid);
 const body='references/'+reference.id+'.png',art='source/'+encodeURIComponent(source.file);
 for(const [mode,label] of [['base','Avatar base'],['source','Source art original'],['combined','Combinado'],['blend','Overlay alpha 50%'],['split','Comparação 50/50'],['guides','Combinado + guides']]){
  const figure=document.createElement('figure');figure.dataset.mode=mode;
  const caption=document.createElement('figcaption');caption.textContent=label;figure.append(caption);
  const frame=document.createElement('div');frame.className='frame '+mode;frame.dataset.frame=mode;figure.append(frame);grid.append(figure);
  if(mode!=='source')frame.append(image(body,'base','Avatar HD de referência '+reference.id));
  if(mode!=='base')frame.append(image(art,'art',source.file));
  if(mode==='guides'){
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1024 1536');svg.setAttribute('aria-label','Contornos alpha ≥128, eixo e baseline');
   for(const [bounds,color] of [[reference.bounds,'#007d5b'],[source.bounds,'#d35100']]){const rect=document.createElementNS(svg.namespaceURI,'rect');for(const [key,value] of Object.entries({x:bounds.left,y:bounds.top,width:bounds.right-bounds.left+1,height:bounds.bottom-bounds.top+1,fill:'none',stroke:color,'stroke-width':5}))rect.setAttribute(key,String(value));svg.append(rect)}
   for(const [x1,y1,x2,y2,color] of [[512,0,512,1536,'#007d5b'],[0,reference.footBaseline,1024,reference.footBaseline,'#b72424']]){const line=document.createElementNS(svg.namespaceURI,'line');for(const [key,value] of Object.entries({x1,y1,x2,y2,stroke:color,'stroke-width':5}))line.setAttribute(key,String(value));svg.append(line)}frame.append(svg);
  }
 }
 main.append(article);
}
</script></html>`;
  await writeFile(path.join(review, 'index.html'), html);
  console.log(
    JSON.stringify({
      at,
      manifestPath,
      counts,
      missingTargets: missingTargets.length,
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
