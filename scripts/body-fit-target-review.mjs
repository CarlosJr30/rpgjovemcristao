import { readFile, writeFile, copyFile } from 'node:fs/promises';
import sharp from 'sharp';

const out = 'build/task-0052b-body-fit-target-validation';
const inventory = JSON.parse(
  await readFile(out + '/target-inventory.json', 'utf8'),
);
const manifest = JSON.parse(await readFile(inventory.manifestPath, 'utf8'));
for (const asset of inventory.assets) {
  if (
    !asset.exists ||
    asset.technicalStatus !== 'TECHNICALLY_VALIDATED' ||
    asset.mapping.status !== 'MAPPED'
  )
    throw new Error(
      'Only technically validated mapped sources may enter actual fit review',
    );
  const id = asset.filename.replace(/\.png$/, '');
  const { data, info } = await sharp(asset.sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bounds = { left: info.width, top: info.height, right: -1, bottom: -1 };
  for (let i = 0; i < info.width * info.height; i++)
    if (data[i * info.channels + info.channels - 1] >= 128) {
      const x = i % info.width,
        y = Math.floor(i / info.width);
      bounds.left = Math.min(bounds.left, x);
      bounds.right = Math.max(bounds.right, x);
      bounds.top = Math.min(bounds.top, y);
      bounds.bottom = Math.max(bounds.bottom, y);
    }
  asset.sourceBoundsAlpha128 = bounds;
  asset.geometry = {
    nativeCanvas: { width: 1024, height: 1536 },
    sourceWidth: bounds.right - bounds.left + 1,
    sourceHeight: bounds.bottom - bounds.top + 1,
    sourceBottomMinusHDFootBaseline:
      bounds.bottom - asset.referenceAvatar.footBaseline,
    correction: 'NONE: full canvas inset 0; no crop/warp/stretch/offset',
    guideMeaning: 'Pixel bounds and foot baseline, not new anatomy anchors',
  };
  asset.manifestSourceFile =
    manifest.assets.find(
      (entry) =>
        entry.target === asset.filename || entry.filename === asset.filename,
    )?.source_file ?? null;
  asset.provenance =
    'User supplied target PNG and hash-bound manifest; original authoring/crop history cannot be proven from PNG metadata. No corrective editing performed here.';
  asset.reviewedBy = 'Codex author fit QA; no human Body-Fit approval';
  await copyFile(asset.sourcePath, out + '/' + id + '/source.png');
}
await writeFile(
  out + '/target-inventory.json',
  JSON.stringify(inventory, null, 2) + '\n',
);
const safe = JSON.stringify(inventory).replace(/</g, '\\u003c');
await writeFile(
  out + '/review/index.html',
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0052B · fit real</title>
<style>body{margin:16px;font:16px system-ui;background:#f4f1e8;color:#17352b}label{display:inline-block;margin:8px}select{padding:7px;font:inherit}article{margin:20px 0;border:1px solid #aaa;background:white;border-radius:8px;padding:12px;overflow-wrap:anywhere}h2{font-size:19px}p{overflow-wrap:anywhere}.views{display:flex;flex-wrap:wrap;gap:14px}figure{margin:0;max-width:100%;width:var(--frame-size,180px)}figcaption{margin:5px 0}.frame{position:relative;width:100%;aspect-ratio:2/3;background:repeating-conic-gradient(#ddd 0 25%,#f5f5ed 0 50%) 0/16px 16px;overflow:hidden}.frame>img,.frame>svg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.blend .art{opacity:.5}.split .art{clip-path:inset(0 0 0 50%)}.split:after{content:'';position:absolute;left:50%;top:0;bottom:0;border-left:1px solid red}[hidden]{display:none!important}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}</style>
<h1>TASK-0052B · fit sobre HD · somente DEV</h1><p>16 fontes técnicas e mapeadas. Sem READY/aprovação corporal humana. Full canvas 1024×1536, inset 0; zoom altera igualmente o tamanho de apresentação de base e overlay, sem correção do PNG.</p>
<label>Gênero <select id="gender"><option value="">Todos</option><option value="female">Feminino</option><option value="male">Masculino</option></select></label><label>Slot <select id="slot"><option value="">Todos</option><option>armor</option><option>helmet</option><option>boots</option><option>weapon</option><option>shield</option><option>amulet</option></select></label><label>Zoom <select id="zoom"><option value="100">100%</option><option value="200">200%</option></select></label>
<p>Guides: contorno HD alpha ≥128 verde; fonte laranja; eixo x512 e baseline dos pés vermelha. Limites de pixels não são novos anchors anatômicos.</p><main></main>
<script type="application/json" id="data">${safe}</script><script>
const data=JSON.parse(document.getElementById('data').textContent),main=document.querySelector('main');
function image(src,kind,alt){const node=document.createElement('img');node.src=src;node.className=kind;node.alt=alt;return node}
for(const asset of data.assets){const id=asset.filename.replace(/\\.png$/,''),card=document.createElement('article');card.dataset.gender=asset.gender;card.dataset.slot=asset.slot;card.dataset.target=id;
const title=document.createElement('h2');title.textContent=asset.filename+' · '+asset.referenceAvatar.id;card.append(title);
const status=document.createElement('p');status.dataset.status='';status.textContent=asset.technicalStatus+' · MAPPED · '+asset.fitStatus+' · SHA-256 '+asset.sha256;card.append(status);
const grid=document.createElement('div');grid.className='views';card.append(grid);
for(const [mode,label] of [['base','Avatar HD base'],['overlay','Overlay original'],['combined','Combinado'],['blend','Alpha 50%'],['split','Comparação 50/50'],['guides','Combinado + guides']]){
 const figure=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent=label;figure.append(caption);const frame=document.createElement('div');frame.className='frame '+mode;frame.dataset.frame=mode;figure.append(frame);grid.append(figure);
 if(mode!=='overlay')frame.append(image('references/'+asset.referenceAvatar.id+'.png','base','HD '+asset.referenceAvatar.id));
 if(mode!=='base')frame.append(image('../'+id+'/source.png','art',asset.filename));
 if(mode==='guides'){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 1024 1536');
 for(const [b,color] of [[asset.referenceAvatar.bounds,'#007c56'],[asset.sourceBoundsAlpha128,'#d65300']]){const rect=document.createElementNS(svg.namespaceURI,'rect');for(const [key,value]of Object.entries({x:b.left,y:b.top,width:b.right-b.left+1,height:b.bottom-b.top+1,fill:'none',stroke:color,'stroke-width':5}))rect.setAttribute(key,String(value));svg.append(rect)}
 for(const [x1,y1,x2,y2,color]of [[512,0,512,1536,'#007c56'],[0,asset.referenceAvatar.footBaseline,1024,asset.referenceAvatar.footBaseline,'#b72424']]){const line=document.createElementNS(svg.namespaceURI,'line');for(const [key,value]of Object.entries({x1,y1,x2,y2,stroke:color,'stroke-width':5}))line.setAttribute(key,String(value));svg.append(line)}frame.append(svg)}
}
const observations=document.createElement('p');observations.dataset.observations='';card.append(observations);const report=document.createElement('a');report.href='../'+id+'/fit-report.json';report.textContent='Fit report';card.append(report);main.append(card)}
function filter(){for(const card of main.children)card.hidden=(document.getElementById('gender').value&&card.dataset.gender!==document.getElementById('gender').value)||(document.getElementById('slot').value&&card.dataset.slot!==document.getElementById('slot').value)}
document.getElementById('gender').addEventListener('change',filter);document.getElementById('slot').addEventListener('change',filter);document.getElementById('zoom').addEventListener('change',()=>document.body.style.setProperty('--frame-size',180*Number(document.getElementById('zoom').value)/100+'px'));
</script></html>`,
);
console.log(
  JSON.stringify({
    reviewedSources: inventory.assets.length,
    actualCompositions: 16,
    correction: 'NONE',
    status: 'Awaiting author visual inspection',
  }),
);
