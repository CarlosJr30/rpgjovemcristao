import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {createGardenQuizSession} from '../../apps/web/features/journey/data/gardenQuiz.ts';
export async function playMissions(page,{origin,label,output}){
 const checks=[];const check=(name,ok)=>{checks.push({name,passed:!!ok});assert(ok,name)};
 await page.goto(origin+'/journey/phases/o-jardim-e-a-escolha');await expect(page.locator('[data-practice-stage="opening"]')).toBeVisible();
 check('demonstration is explicit',await page.getByText(/Não salva conclusão, Diário ou progresso/).count()===1);
 await page.getByRole('button',{name:'Iniciar demonstração →',exact:true}).click();
 await expect(page.getByRole('application',{name:'Área explorável do Jardim'})).toBeVisible();
 check('only three non-economic objective points',await page.locator('[data-garden-point]').count()===3);
 check('no grant or inventory controls',await page.getByRole('button',{name:/coletar|abrir baú|adicionar à mochila|comprar|vender/i}).count()===0);
 const choose=async(id,title)=>{
  await page.locator('[data-garden-point="'+id+'"]').click();
  const detail=page.getByRole('dialog').getByRole('button',{name:'Investigar',exact:true});
  if(await detail.isVisible())await detail.click();
  const dialog=page.getByRole('dialog',{name:title,exact:true});await expect(dialog).toBeVisible();return dialog;
 };
 let dialog=await choose('water','Desafio do cuidado');
 await expect(dialog.getByRole('button',{name:'Concluir observação',exact:true})).toBeDisabled();
 for(const name of [/Água que irriga/,/Solo que pode ser cultivado/,/Vegetação a ser guardada/])await dialog.getByRole('button',{name}).click();
 await dialog.getByRole('button',{name:'Concluir observação',exact:true}).click();
 dialog=await choose('stones','Desafio do limite');await dialog.getByRole('button',{name:'Limite',exact:true}).click();await expect(dialog.getByText('Sequência 0 / 3',{exact:true})).toBeVisible();
 check('incorrect objective sequence does not finish',await page.getByRole('button',{name:'Continuar a jornada →'}).count()===0);
 for(const name of ['Liberdade','Orientação','Limite'])await dialog.getByRole('button',{name,exact:true}).click();
 dialog=await choose('leaves','Desafio de escolha e consequência');
 for(const name of [/Orientação lembrada/,/Escolha realizada/,/Mudança percebida/])await dialog.getByRole('button',{name}).click();
 for(const name of ['Orientação','Escolha','Consequência'])await dialog.getByRole('button',{name,exact:true}).click();
 await page.getByRole('button',{name:'Continuar a jornada →',exact:true}).click();await expect(page.locator('[data-practice-stage="reading"]')).toBeVisible();
 await expect(page.getByRole('button',{name:'Continuar para o checkpoint →',exact:true})).toBeDisabled();
 const links=page.getByRole('link',{name:'Abrir na Bíblia ↗',exact:true});check('two existing external chapter references',await links.count()===2);
 for(let i=0;i<2;i++){
  const href=await links.nth(i).getAttribute('href');check('chapter link remains NVI external '+i,/^https:\/\/www\.bible\.com\/pt\/bible\/129\/GEN\.[23]\.NVI$/.test(href));
  const popup=page.waitForEvent('popup');await links.nth(i).click();await(await popup).close();
  await page.getByRole('button',{name:'Concluí a leitura',exact:true}).first().click();
 }
 await page.getByRole('button',{name:'Continuar para o checkpoint →',exact:true}).click();
 await expect(page.getByRole('button',{name:'Concluir checkpoint →',exact:true})).toBeDisabled();
 await page.getByLabel('Abandonar o jardim',{exact:true}).check();check('wrong comprehension stays blocked',await page.getByRole('button',{name:'Concluir checkpoint →',exact:true}).isDisabled());
 for(const answer of ['Cultivar e guardar o jardim','Há liberdade ampla e um limite específico','Surgem vergonha, medo e consequências'])await page.getByLabel(answer,{exact:true}).check();
 await page.getByRole('button',{name:'Concluir checkpoint →',exact:true}).click();
 await page.getByRole('button',{name:'Reservar um momento de oração (opcional)',exact:true}).click();await expect(page.getByText('Oração opcional',{exact:true})).toBeVisible();
 check('blank reflection cannot advance',await page.getByRole('button',{name:'Continuar na demonstração →',exact:true}).isDisabled());
 await page.getByRole('textbox').fill('Reflexão sintética desta demonstração, sem dados pessoais.');await page.getByRole('button',{name:'Continuar na demonstração →',exact:true}).click();
 await page.getByRole('button',{name:'Continuar para o Quiz →',exact:true}).click();
 const questions=createGardenQuizSession(1);
 for(let i=0;i<questions.length;i++){
  const q=questions[i],answer=i===0?q.options.find(o=>o.id!==q.correctOptionId):q.options.find(o=>o.id===q.correctOptionId);
  await expect(page.getByRole('heading',{name:q.question,exact:true})).toBeVisible();await page.getByRole('button',{name:answer.text,exact:true}).click();
  await expect(page.getByText(i===0?'Resposta incorreta.':'Resposta correta.',{exact:true})).toBeVisible();
  check('quiz answer disables replayed submission '+i,await page.getByRole('button',{name:answer.text,exact:true}).isDisabled());
  await page.getByRole('button',{name:'Próxima →',exact:true}).click();
 }
 await expect(page.getByRole('region',{name:'Resultado da demonstração'})).toBeVisible();check('quiz reports educational score only',await page.getByText(/Quiz nesta execução: 4\/5/).count()===1);
 check('completed exercise has no economic action',await page.getByRole('button',{name:/resgatar|receber|baú|equipar|concluir fase/i}).count()===0);
 check('full practice fits viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:output+'/'+label+'-practice-finished.png',fullPage:true});
 await page.reload();await expect(page.locator('[data-practice-stage="opening"]')).toBeVisible();check('reload discards exercise instead of completing phase',await page.getByRole('textbox').count()===0);
 return checks;
}
