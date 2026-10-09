import { writeFile } from 'node:fs/promises';
import { OUT, json, savePhase } from './equipment-recovery-derive.mjs';
const assets=[],stateOverrides=[];
const reasons={
  boots:'HD possui calçado pré-composto. Registro por pé ainda duplica couro/sola; subtração localizada deixa5124pixels sem cobertura (9.97% da área removida), lacunas e resíduos no tornozelo. Não reconstruir fundo apagando anatomia.',
  helmet:'Coroa agora dentro do canvas, porém cabelo excede o casco e janela facial permanece incompatível com olhos/testa. Escala uniforme não resolve simultaneamente largura, hairline e abertura; nenhuma edição do cabelo/HD.',
  amulet:'Fonte termina no topo do canvas. Ocultar extremidades sob cachecol remove a continuidade visível da corrente; feminino parece broche flutuante, masculino tem corte na parte superior do medalhão. Não comprova suspensão pelo pescoço.',
  rareSword:'Bainha local comum não resolve guarda rara larga/ornamentada: fragmento da guarda reaparece isolado depois do antebraço, oclusão e boca desproporcionais. Não copiar máscara feminina como aprovação masculina.',
};
for(const family of ['boots','helmet','amulet','sword']){
  const data=await json(OUT+'/'+family+'-experiments.json');
  for(const a of data.assets){
    const pass=a.attempt==='c-split-suspension-mouth';
    a.status=pass?'FIT_PASS':'NEEDS_REWORK'; a.selected=pass;
    a.review={reviewer:'Codex — revisão técnica local, não humana',fullBodyInspected:true,zoomInspected:true,findings:pass?'Cabo para cima, lâmina ocultada pela boca em primeiro plano, bainha lateral com ponta para baixo, suspensões no cinto masculino (landmarks aproximados), mão em primeiro plano preservada. Proporção e contorno lateral convincentes no HD de referência.':family==='sword'?(a.id.includes('rare')?reasons.rareSword:a.attempt==='b-mouth-front-plane'?'Suspensão de couro passou à frente do cabo; plano incompatível.':'Pequeno trecho de lâmina visível junto à boca da bainha.'):reasons[family],humanApproval:false};
    if(pass){ a.settings.method='Suspensão atrás do cabo; faixa da boca y>=755 à frente da lâmina; guarda masculina reancorada; oclusão localizada do braço revisada'; a.dependency='Revisão corporal humana por hash e compatibilidade com armaduras';a.nextAction='Carlos revisar o novo candidato masculino e suas combinações; READY=false'; }
    await writeFile(a.reportPath,JSON.stringify(a,null,2));assets.push(a);
  }
  await writeFile(OUT+'/'+family+'-experiments.json',JSON.stringify({...data,assets:data.assets},null,2));
  if(family!=='sword'){
    for(const id of new Set(data.assets.map(a=>a.id))){
      const a=data.assets.filter(a=>a.id===id).at(-1);
      stateOverrides.push({id,technical:'NEEDS_NEW_ART',artRequirement:family==='boots'?'NEEDS_NEW_FOOTWEAR_ART':family==='helmet'?'NEEDS_NEW_HEADWEAR_ART':'NEEDS_NEW_CHAIN_ART',staging:a.output.path,sha256:a.output.sha256,recoveryReport:a.reportPath,human:'NOT_ELIGIBLE',ready:false,dependency:reasons[family],nextAction:'Produzir fonte específica conforme brief; novo bake e revisão independente'});
    }
  } else for(const a of data.assets.filter(a=>a.id.includes('rare'))) stateOverrides.push({id:a.id,technical:'NEEDS_NEW_SHEATH_ART',staging:a.output.path,sha256:a.output.sha256,recoveryReport:a.reportPath,human:'NOT_ELIGIBLE',ready:false,dependency:reasons.rareSword,nextAction:'Bainha própria para guarda/lâmina rara e suspensão específica do cinto'});
}
stateOverrides.push({id:'boots_traveler_common_male_v2',technical:'NEEDS_REWORK',dependency:'Método feminino não validado após2abordagens; masculino não processado',nextAction:'Aguardar solução de footwear feminina antes de derivar masculino'});
await writeFile(OUT+'/recovery-assessments.json',JSON.stringify({assets,stateOverrides,newFitPass:1,readyPromotions:0,humanApprovalsRecorded:0},null,2));
await savePhase(4,{status:'LOCAL_STOP_NEEDS_NEW_FOOTWEAR_ART',approaches:2,maleProcessed:false,reason:reasons.boots,evidence:'boots-experiments.json'});
await savePhase(5,{status:'LOCAL_DERIVATIVES_REJECTED_NEW_ART_REQUIRED',targets:2,reason:reasons.helmet,evidence:'helmet-experiments.json'});
await savePhase(6,{status:'LOCAL_OCCLUSION_REJECTED_NEW_CHAIN_ART_REQUIRED',targets:2,reason:reasons.amulet,evidence:'amulet-experiments.json'});
await savePhase(7,{status:'COMPLETE_WITH_LOCAL_ART_DEPENDENCIES',newFitPass:1,newSheathArtRequired:2,commonMaleSelected:'c-split-suspension-mouth',pilot0058Changed:false,humanApproval:false,evidence:'sword-experiments.json'});
await savePhase(8,{status:'COMPLETE_PRESERVED_REVIEW_PENDING',old0055FitPass:5,rebaked:0,readyPromotions:0,evidence:'review/index.html'});
console.log(JSON.stringify({attempts:assets.length,newFitPass:1,overrides:stateOverrides.length}));
