import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { OUT, json, anchor, experiment, svgMask, bakeSwordBytes } from './equipment-recovery-derive.mjs';
const targets=(await json(OUT+'/initial-targets.json')).targets;
const helmets=[];
for(const gender of ['female','male']){
  const t=targets.find(t=>t.id===`helmet_traveler_rare_${gender}_v2`);
  const transform=anchor([512,0],[gender==='female'?520:510,5],.28);
  const overlay=await bakeSwordBytes(await readFile(t.source),transform);
  helmets.push(await experiment(t,'a-crown-in-canvas',overlay,{method:'Uniform smaller helmet with crown safely in canvas; no Avatar/hair edit',transform,crownMargin:5}));
}
await writeFile(OUT+'/helmet-experiments.json',JSON.stringify({assets:helmets},null,2));
const amulets=[];
const scarves={female:'351,270 429,254 495,286 556,289 603,267 651,279 678,317 630,341 590,347 552,356 525,374 495,370 453,365 407,354 358,340',male:'345,273 421,258 489,291 549,292 596,271 648,276 675,324 640,354 595,382 548,402 521,400 480,389 437,372 392,349 352,335'};
for(const gender of ['female','male']){
  const t=targets.find(t=>t.id===`medallion_path_rare_${gender}_v2`),m=await json(`build/task-0055-body-fit-bake/${t.id}/fit-metadata.json`);
  const positioned=await bakeSwordBytes(await readFile(t.source),m.transform),mask=await svgMask([scarves[gender]]);
  const overlay=await sharp(positioned).composite([{input:mask,blend:'dest-out'}]).png().toBuffer();
  amulets.push(await experiment(t,'a-chain-behind-scarf',overlay,{method:'Localized chain endpoint occlusion behind original precomposed scarf; no new chain or Avatar edit',transform:m.transform,scarfPolygon:scarves[gender],mask}));
}
await writeFile(OUT+'/amulet-experiments.json',JSON.stringify({assets:amulets},null,2));
console.log(JSON.stringify({helmetAttempts:helmets.length,amuletAttempts:amulets.length}));
