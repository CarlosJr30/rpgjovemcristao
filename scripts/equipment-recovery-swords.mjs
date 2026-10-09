import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { OUT, json, anchor, cutSource, experiment, bakeSwordBytes } from './equipment-recovery-derive.mjs';
import { occludeArm, point } from './body-fit-sheath-pilot-bake.mjs';
import { sha256 } from './body-fit-bake.mjs';
const targets=(await json(OUT+'/initial-targets.json')).targets;
const sheathPath='build/task-0058-sword-sheath-pilot/source/sheath-generated-v2.png';
const sheath=await readFile(sheathPath);
if(sha256(sheath)!=='b042739c4e179c504b33b0c50da710ae1c42edb7f67444f967264c8a219a9949') throw Error('Local sheath source changed');
const recipes=[
  {id:'sword_path_common_male_v2',guardSource:[333,1115],guard:[686,710],scale:.4,throat:[697,765],sheathScale:.46,sheathRotation:10},
  {id:'sword_path_rare_female_v2',guardSource:[513,450],guard:[685,710],scale:.4,throat:[697,748],sheathScale:.455,sheathRotation:10},
  {id:'sword_path_rare_male_v2',guardSource:[511,462],guard:[686,728],scale:.42,throat:[699,777],sheathScale:.47,sheathRotation:10},
  {id:'sword_path_common_male_v2',guardSource:[333,1115],guard:[686,725],scale:.4,throat:[697,765],sheathScale:.46,sheathRotation:10,attempt:'b-mouth-front-plane'},
  {id:'sword_path_common_male_v2',guardSource:[333,1115],guard:[686,725],scale:.4,throat:[697,765],sheathScale:.46,sheathRotation:10,attempt:'c-split-suspension-mouth'},
];
const assets=[];
for(const r of recipes){
  const only=process.argv.find(p=>p.startsWith('--only='))?.slice(7);
  if(only?r.attempt!==only:Boolean(r.attempt)) continue;
  const t=targets.find(t=>t.id===r.id),m=await json(`build/task-0056-sword-downward/${r.id}/fit-metadata.json`);
  const rotation=m.transform.rotation-15, swordT=anchor(r.guardSource,r.guard,r.scale,rotation), sheathT=anchor([406,450],r.throat,r.sheathScale,r.sheathRotation);
  const full=await bakeSwordBytes(await readFile(t.source),swordT), a=15*Math.PI/180;
  const hilt=await cutSource(full,(x,y)=>(x-r.guard[0])*Math.sin(a)+(y-r.guard[1])*Math.cos(a)<=55);
  const leather=await bakeSwordBytes(sheath,sheathT);
  const layers=r.attempt==='c-split-suspension-mouth'?[{input:hilt},{input:await cutSource(leather,(x,y)=>y>=755)}]:[{input:hilt}];
  const raw=r.attempt==='b-mouth-front-plane'?await sharp(hilt).composite([{input:leather}]).png().toBuffer():await sharp(leather).composite(layers).png().toBuffer();
  // Same method, independently evaluated on each HD. Male polygon suitability is a review gate.
  const occluded=await occludeArm(raw,await readFile(t.avatar),'localized-avatar-colour-refinement');
  const report=await experiment(t,r.attempt??'a-local-sheath-adaptation',occluded.bytes,{method:r.attempt?'Mouth front plane occludes inserted blade; male guard independently lowered15px':'Individually anchored local leather sheath plus original hilt; diagnostic, not presumed compatible',transforms:{sword:swordT,sheath:sheathT},sheathSource:{path:sheathPath,sha256:sha256(sheath)},landmarks:{throat:r.throat,tip:point([878,1428],sheathT),beltLoops:[[160,102],[237,153]].map(p=>point(p,sheathT))},hiltCutAxial:55,mask:occluded.mask,rotationBasis:'Independent original root-to-tip normalization from TASK0056, then lateral15degrees',armMaskRequiresIndividualReview:true});
  const dir=report.reportPath.slice(0,report.reportPath.lastIndexOf('/'));
  for(const [name,bytes] of Object.entries({'hilt-original-pixels.png':hilt,'sheath-positioned.png':leather,'unoccluded-equipment.png':raw})) await writeFile(dir+'/'+name,bytes,{flag:'wx'});
  const guides=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect x="${t.gender==='female'?410:398}" y="${t.gender==='female'?558:590}" width="245" height="60" fill="none" stroke="cyan" stroke-width="3"/><path d="M${r.throat.join(' ')}L${report.settings.landmarks.tip.join(' ')}" stroke="yellow" stroke-width="3"/>${report.settings.landmarks.beltLoops.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="none" stroke="magenta" stroke-width="3"/>`).join('')}</svg>`);
  await sharp(report.compositionPath).composite([{input:guides}]).png().toFile(dir+'/alignment-guides.png');
  assets.push(report);
}
const previous=process.argv.some(p=>p.startsWith('--only='))?(await json(OUT+'/sword-experiments.json')).assets:[];
await writeFile(OUT+'/sword-experiments.json',JSON.stringify({assets:[...previous,...assets],pilot0058Untouched:true},null,2));
console.log(JSON.stringify({swordAttempts:assets.length}));
