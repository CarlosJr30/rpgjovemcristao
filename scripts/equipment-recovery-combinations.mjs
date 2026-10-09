import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { OUT, json } from './equipment-recovery-derive.mjs';
import { sha256 } from './body-fit-bake.mjs';
const {targets}=await json(OUT+'/current-targets.json');
await mkdir(OUT+'/compatibility');
const combinations=[];
for(const gender of ['female','male']){
  for(const other of ['weapon','shield','amulet','boots','helmet']){
    const ids=[`armor_traveler_uncommon_${gender}_v2`,targets.find(t=>t.gender===gender&&t.slot===other&&!t.id.includes('sword_path_rare')).id];
    combinations.push({id:gender+'-armor-uncommon-'+other,gender,ids});
  }
  for(const other of ['weapon','shield']) combinations.push({id:gender+'-armor-rare-'+other,gender,ids:[`armor_traveler_rare_${gender}_v2`,targets.find(t=>t.gender===gender&&t.slot===other&&!t.id.includes('sword_path_rare')).id]});
}
const order={armor:2,boots:3,amulet:4,weapon:6,shield:7,helmet:8};
for(const c of combinations){
  const pieces=c.ids.map(id=>targets.find(t=>t.id===id)).sort((a,b)=>order[a.slot]-order[b.slot]);
  const dir=OUT+'/compatibility/'+c.id; await mkdir(dir);
  const avatar=await readFile(pieces[0].avatar);
  const base=c.id==='female-armor-uncommon-boots'?await readFile(pieces[1].staging.replace(pieces[1].id+'_baked.png','base-for-experiment.png')):avatar;
  const combined=await sharp({create:{width:1024,height:1536,channels:4,background:'#d3d3d3'}}).composite([{input:base},...await Promise.all(pieces.map(async t=>({input:await readFile(t.staging)})))]).png().toBuffer();
  await writeFile(dir+'/combined.png',combined,{flag:'wx'});
  const box=pieces[1].slot==='boots'?{left:190,top:1030,width:680,height:500}:pieces[1].slot==='helmet'?{left:295,top:0,width:490,height:480}:pieces[1].slot==='amulet'?{left:350,top:230,width:340,height:400}:{left:540,top:520,width:340,height:450};
  await sharp(combined).extract(box).resize(box.width*2,box.height*2).png().toFile(dir+'/intersection-zoom.png');
  Object.assign(c,{status:'COMPATIBILITY_REVIEW_PENDING',compositionPath:dir+'/combined.png',sha256:sha256(combined),zoomPath:dir+'/intersection-zoom.png',avatar:{path:pieces[0].avatar,sha256:sha256(avatar)},derivedBase:c.id==='female-armor-uncommon-boots',pieces:pieces.map(t=>({id:t.id,path:t.staging,sha256:t.sha256,isolatedStatus:t.technical,layer:order[t.slot]})),runtimeActivated:false,humanApproval:false});
}
const tiles=[]; const tileW=256,tileH=430;
for(let i=0;i<combinations.length;i++){
  const c=combinations[i],label=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="46"><rect width="256" height="46" fill="#173829"/><text x="8" y="18" fill="white" font-size="11">${c.id}</text><text x="8" y="36" fill="#eac778" font-size="11">DIAGNÓSTICO / revisão pendente</text></svg>`);
  const img=await sharp(c.compositionPath).resize(256,384).toBuffer();
  tiles.push({input:img,left:(i%4)*tileW,top:Math.floor(i/4)*tileH},{input:label,left:(i%4)*tileW,top:Math.floor(i/4)*tileH+384});
}
await sharp({create:{width:1024,height:Math.ceil(combinations.length/4)*tileH,channels:4,background:'#173829'}}).composite(tiles).png().toFile(OUT+'/compatibility/contact-sheet.png');
await writeFile(OUT+'/compatibility/manifest.json',JSON.stringify({combinations,notTested:[{combination:'Calças + botas',reason:'Sem fonte/item/candidato Calças; proposta não gera evidência visual'},{combination:'Calças + armadura',reason:'Sem fonte/item/candidato Calças; proposta não gera evidência visual'}]},null,2));
console.log(JSON.stringify({combinations:combinations.length}));
