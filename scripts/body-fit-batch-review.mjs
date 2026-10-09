import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { OUTPUT } from './body-fit-batch-bake.mjs';
import { sha256 } from './body-fit-bake.mjs';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const inventory = await json(OUTPUT + '/inventory.json');
const assessments = await json(OUTPUT + '/visual-assessment.json');
if (assessments.assets.length !== 15)
  throw Error('15 individual visual assessments required');
for (const a of inventory.assets) {
  const dir = OUTPUT + '/' + a.id,
    meta = await json(dir + '/fit-metadata.json');
  const assessment = assessments.assets.find((s) => s.id === a.id);
  if (
    assessment?.sha256 !== a.sha256 ||
    !['FIT_PASS', 'NEEDS_REWORK'].includes(assessment.status)
  )
    throw Error('Fresh visual inspection must match each baked hash');
  const report = {
    task: 'TASK-0055',
    id: a.id,
    itemId: a.itemId,
    gender: a.gender,
    slot: a.slot,
    assessedAt: assessments.at,
    assessedBy: 'Codex / author visual QA (not Carlos Faustino)',
    outputSha256: a.sha256,
    sourceSha256: a.sourceSha256,
    referenceAvatar: a.avatar,
    technicalStatus: a.technicalStatus,
    mapping: a.mapping,
    status: assessment.status,
    reviewStatus:
      assessment.status === 'FIT_PASS'
        ? 'HUMAN_BODY_FIT_REVIEW_PENDING'
        : 'NEEDS_REWORK',
    humanBodyFitApproved: false,
    ready: false,
    runtimeActivated: false,
    observations: assessment.observations,
    regions: assessment.regions,
    reworkRecommendation: assessment.reworkRecommendation,
    limits:
      'Only this derivative/hash and named reference; no cross-gender or 54-avatar compatibility claimed; landmark residuals are approximate diagnostics, not sufficient to prove fit.',
    landmarkMethod: meta.landmarkMethod,
    landmarkResiduals: meta.landmarkResiduals,
    evidence: [
      'source.png',
      'avatar_base.png',
      'baked_overlay.png',
      'combined.png',
      'overlay_50_50.png',
      'alignment_guides.png',
      'before.png',
      ...(a.slot === 'amulet' ? ['armor_overlap.png'] : []),
    ].map((file) => dir + '/' + file),
  };
  await writeFile(
    dir + '/fit-report.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  Object.assign(a, {
    fitStatus: report.status,
    reviewStatus: report.reviewStatus,
    fitReport: dir + '/fit-report.json',
    metadata: dir + '/fit-metadata.json',
    metadataSha256: sha256(await readFile(dir + '/fit-metadata.json')),
    observations: report.observations,
    reworkRecommendation: report.reworkRecommendation,
  });
  await writeFile(
    dir + '/receipt.json',
    JSON.stringify(
      {
        ...a,
        task: 'TASK-0055',
        updatedAt: new Date().toISOString(),
        sourceApproval: 'SOURCE_VISUAL_APPROVED (inherited)',
        humanBodyFitApproved: false,
        ready: false,
        runtimePath: null,
        stagingPath: meta.output.path,
        approvedBy: null,
      },
      null,
      2,
    ) + '\n',
  );
}
inventory.counts = {
  processed: 15,
  TECHNICALLY_VALIDATED: 15,
  MAPPED: 15,
  MAPPING_ERROR: 0,
  FIT_PASS: inventory.assets.filter((a) => a.fitStatus === 'FIT_PASS').length,
  NEEDS_REWORK: inventory.assets.filter((a) => a.fitStatus === 'NEEDS_REWORK')
    .length,
  HUMAN_BODY_FIT_REVIEW_PENDING: inventory.assets.filter(
    (a) => a.reviewStatus === 'HUMAN_BODY_FIT_REVIEW_PENDING',
  ).length,
  FIT_VALIDATION_PENDING: 0,
  HUMAN_BODY_FIT_APPROVED: 0,
  READY: 0,
  runtimeActivated: 0,
};
inventory.status =
  'BAKE_BATCH_COMPLETE / FIT_VALIDATION_COMPLETE / HUMAN_REVIEW_AND_REWORK_REQUIRED';
await writeFile(
  OUTPUT + '/inventory.json',
  JSON.stringify(inventory, null, 2) + '\n',
);
await mkdir(OUTPUT + '/review', { recursive: true });
const data = JSON.stringify(inventory).replaceAll('<', '\\u003c');
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0055 — Body-Fit batch DEV</title><style>body{margin:16px;background:#182820;color:#f2f6f0;font:16px system-ui}a{color:#a9e8ff}h2{font-size:17px;overflow-wrap:anywhere}label{display:inline-flex;flex-direction:column;gap:5px;margin:8px}select{font:inherit;padding:8px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:18px}article{padding:12px;border:1px solid #687;border-radius:8px;min-width:0;background:#23352a;overflow-wrap:anywhere}.frame{position:relative;width:100%;aspect-ratio:2/3;background:repeating-conic-gradient(#ccc 0 25%,#eee 0 50%) 0/20px 20px}.frame img{position:absolute;top:0;left:0;width:100%;height:100%;transform:none}article.pass{border-color:#70dd9f}article.rework{border-color:#e2b561}[hidden]{display:none!important}body.native main{display:block}body.native article{width:1024px;margin-bottom:18px}body.native .frame{width:1024px;height:1536px}body.native{overflow-x:auto}p{overflow-wrap:anywhere}</style></head><body><h1>TASK-0055 — 15 derivados offline</h1><p id="summary">${inventory.counts.FIT_PASS} FIT_PASS · ${inventory.counts.NEEDS_REWORK} NEEDS_REWORK · 0 READY · 0 ativados. Carlos ainda não aprovou Body-Fit destes 15. Somente staging; piloto TASK-0054 intacto.</p><p>Cyan: landmarks da referência/objetivos de posicionamento; orange: projeção da source. Montagem traseira de escudo é proxy; pontos de lâmina e borda são objetivos visuais. Nenhuma correção CSS no baked.</p><nav><label>Gênero<select id="gender"><option value="">Todos</option><option value="female">Feminino</option><option value="male">Masculino</option></select></label><label>Slot<select id="slot"><option value="">Todos</option><option>armor</option><option>helmet</option><option>boots</option><option>weapon</option><option>shield</option><option>amulet</option></select></label><label>Status<select id="status"><option value="">Todos</option><option>FIT_PASS</option><option>NEEDS_REWORK</option></select></label><label>Vista<select id="view"><option value="combined.png">Combinado</option><option value="avatar_base.png">Avatar base</option><option value="source.png">Source original</option><option value="baked_overlay.png">Baked isolado</option><option value="overlay_50_50.png">Overlay 50/50</option><option value="alignment_guides.png">Guides</option><option value="before.png">Antes — sem bake</option><option value="armor_overlap.png">Medalhão + armor (demais: combinado)</option></select></label><label>Zoom<select id="zoom"><option value="fit">Responsivo</option><option value="native">100% nativo</option></select></label></nav><p id="visible-count" aria-live="polite"></p><p><a href="../inventory.json">Inventário / transform / SHA-256 por target</a></p><main></main><script type="application/json" id="data">${data}</script><script>
const data=JSON.parse(document.getElementById('data').textContent),main=document.querySelector('main');
for(const a of data.assets){const card=document.createElement('article');card.dataset.id=a.id;card.dataset.gender=a.gender;card.dataset.slot=a.slot;card.dataset.status=a.fitStatus;card.className=a.fitStatus==='FIT_PASS'?'pass':'rework';const h=document.createElement('h2');h.textContent=a.filename;card.append(h);const state=document.createElement('p');state.textContent=a.fitStatus+' / '+a.reviewStatus+' / READY:false';card.append(state);const frame=document.createElement('div');frame.className='frame';const img=document.createElement('img');img.loading='eager';img.src='../'+a.id+'/combined.png';img.alt='Evidência combinada de '+a.id;frame.append(img);card.append(frame);const ref=document.createElement('p');ref.textContent='Referência HD: '+a.avatar.id;card.append(ref);const notes=document.createElement('p');notes.textContent=a.observations.join(' ');card.append(notes);const transform=document.createElement('p');transform.textContent='tx '+a.transform.translateX.toFixed(3)+'; ty '+a.transform.translateY.toFixed(3)+'; scale '+a.transform.scale.toFixed(6)+'; rotation '+a.transform.rotation+'°';card.append(transform);for(const [label,file] of [['Fit report','fit-report.json'],['Metadata / landmarks / SHA','fit-metadata.json'],['Receipt','receipt.json'],['Combinado nativo','combined.png'],['50/50 nativo','overlay_50_50.png'],['Guides nativos','alignment_guides.png']]){const link=document.createElement('a');link.href='../'+a.id+'/'+file;link.textContent=label;card.append(link,document.createTextNode(' · '));}main.append(card);}
function filter(){let n=0;for(const c of main.children){c.hidden=['gender','slot','status'].some(k=>document.getElementById(k).value&&c.dataset[k]!==document.getElementById(k).value);if(!c.hidden)n++;}document.getElementById('visible-count').textContent=n+' targets visíveis';}
for(const k of ['gender','slot','status'])document.getElementById(k).addEventListener('change',filter);
document.getElementById('view').addEventListener('change',e=>{for(const c of main.children){let view=e.target.value;if(view==='armor_overlap.png'&&c.dataset.slot!=='amulet')view='combined.png';c.querySelector('img').src='../'+c.dataset.id+'/'+view;c.querySelector('img').alt=view+' — '+c.dataset.id;}});
document.getElementById('zoom').addEventListener('change',e=>document.body.classList.toggle('native',e.target.value==='native'));filter();document.body.dataset.reviewReady='true';
</script></body></html>`;
await writeFile(OUTPUT + '/review/index.html', html);
console.log(JSON.stringify(inventory.counts));
