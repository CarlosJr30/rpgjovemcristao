import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { bakeSwordBytes, sha256 } from './body-fit-bake.mjs';
import { inspectPng } from './body-fit-batch-bake.mjs';
export const OUT = 'build/task-0059-equipment-recovery';
export const json = async p => JSON.parse(await readFile(p, 'utf8'));
export async function svgMask(polygons) {
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536">${polygons.map(p=>`<polygon points="${p}" fill="white"/>`).join('')}</svg>`)).png().toBuffer();
}
export async function cutSource(bytes, predicate) {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y=0;y<1536;y++) for(let x=0;x<1024;x++) if (!predicate(x,y)) data.fill(0,(y*1024+x)*4,(y*1024+x)*4+4);
  return sharp(data,{raw:info}).png().toBuffer();
}
export function anchor(source, destination, scale, rotation=0) {
  const a=rotation*Math.PI/180;
  return {scale,rotation,translateX:destination[0]-scale*(Math.cos(a)*source[0]-Math.sin(a)*source[1]),translateY:destination[1]-scale*(Math.sin(a)*source[0]+Math.cos(a)*source[1])};
}
export async function experiment(t, attempt, overlay, settings={}) {
  if (!/^[a-z0-9-]+$/.test(attempt) || !/^[a-z_]+_v2$/.test(t.id)) throw Error('Invalid staging attempt/target');
  const dir=OUT+'/recovery/'+t.id+'/'+attempt;
  await mkdir(OUT+'/recovery/'+t.id,{recursive:true}); await mkdir(dir);
  const base=await readFile(t.avatar), source=await readFile(t.source);
  if(sha256(source)!==t.sourceSha256) throw Error('Original source hash changed');
  const candidateBase=settings.base ?? base;
  const names={ [`${t.id}_baked.png`]:overlay, 'base-for-experiment.png':candidateBase };
  if(settings.mask) names['localized-mask.png']=settings.mask;
  for(const [f,bytes] of Object.entries(names)) await writeFile(dir+'/'+f,bytes,{flag:'wx'});
  await sharp({create:{width:1024,height:1536,channels:4,background:'#d3d3d3'}}).composite([{input:candidateBase},{input:overlay}]).png().toFile(dir+'/combined.png');
  const box=t.slot==='boots'?{left:190,top:1040,width:680,height:490}:t.slot==='helmet'?{left:300,top:0,width:470,height:460}:t.slot==='amulet'?{left:370,top:230,width:290,height:370}:{left:540,top:520,width:340,height:420};
  await sharp(dir+'/combined.png').extract(box).resize(box.width*2,box.height*2).png().toFile(dir+'/fit-zoom.png');
  const info=await inspectPng(overlay);
  const report={task:'TASK-0059',id:t.id,gender:t.gender,slot:t.slot,attempt,status:'FIT_VALIDATION_PENDING',selected:false,source:{path:t.source,sha256:t.sourceSha256},avatar:{path:t.avatar,sha256:sha256(base),immutable:true},output:{path:dir+'/'+t.id+'_baked.png',...info},compositionPath:dir+'/combined.png',settings:{...settings,base:settings.base?'NONDESTRUCTIVE_DERIVED_BASE':null,mask:settings.mask?{path:dir+'/localized-mask.png',sha256:sha256(settings.mask)}:null},reportPath:dir+'/fit-report.json',ready:false,humanBodyFitApproved:false,runtimeActivated:false};
  await writeFile(report.reportPath,JSON.stringify(report,null,2));
  return report;
}
export async function savePhase(phase,data) { await writeFile(OUT+'/checkpoints/phase-'+String(phase).padStart(2,'0')+'.json',JSON.stringify({phase,...data},null,2)); }
export { bakeSwordBytes };
