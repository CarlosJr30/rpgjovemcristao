import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {findPath,cellCenter,PORTAL_POSITION,CELL_SIZE} from '../../apps/web/features/journey/components/snake-game-engine.ts';

// Uses ordinary keyboard/pointer controls and existing read-only canvas metrics.
// Never edits game runtime, storage, network results, physics or enemy state.
export async function playMinigame(page, {origin, label, output}) {
 const checks=[];const check=(name,ok)=>{checks.push({name,passed:!!ok});assert(ok,name)};
 await page.goto(origin+'/journey/minigames/fuga-da-serpente');
 await expect(page.locator('[data-minigame-mode="demonstration"]')).toBeVisible();
 check('demonstration explains no progression',await page.getByText(/Vitória, derrota, tutorial e reinício não salvam progresso/).count()===1);
 await page.getByRole('button',{name:'Começar',exact:true}).click();
 const game=page.locator('[data-serpent-mode]'),canvas=page.getByRole('application');
 await expect(game).toHaveAttribute('data-status','playing');
 await expect.poll(()=>canvas.evaluate(c=>Number.isFinite(Number(c.dataset.playerX)))).toBe(true);
 const position=()=>canvas.evaluate(c=>({x:Number(c.dataset.playerX),y:Number(c.dataset.playerY)}));
 const initial=await position();await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');await page.waitForTimeout(150);
 check('ordinary keyboard movement changes player position',(await position()).x>initial.x);
 await page.getByRole('button',{name:'Pausar',exact:true}).click();await expect(game).toHaveAttribute('data-status','paused');
 const paused=await position();await page.waitForTimeout(250);check('pause holds player position',JSON.stringify(await position())===JSON.stringify(paused));
 await page.getByRole('button',{name:'Retomar',exact:true}).click();
 const goals=[cellCenter({col:3,row:3}),cellCenter({col:18,row:3}),cellCenter({col:22,row:9}),PORTAL_POSITION];
 let held='';const release=async()=>{if(held){await page.keyboard.up(held);held='';}};
 async function move(goal){
  const started=Date.now();
  while(Date.now()-started<45000){
   if(await game.getAttribute('data-status')!=='playing')break;
   const p=await position();if(Math.hypot(p.x-goal.x,p.y-goal.y)<15){await release();return;}
   const path=findPath(p,goal);assert(path.length || (Math.floor(p.x/CELL_SIZE)===Math.floor(goal.x/CELL_SIZE) && Math.floor(p.y/CELL_SIZE)===Math.floor(goal.y/CELL_SIZE)),'reachable ordinary route');
   // Follow the next cell. Existing physics still governs collisions/acceleration.
   const target=path.find(t=>Math.hypot(t.x-p.x,t.y-p.y)>10)??goal;
   const dx=target.x-p.x,dy=target.y-p.y;
   const key=Math.abs(dx)>Math.abs(dy)?dx>0?'ArrowRight':'ArrowLeft':dy>0?'ArrowDown':'ArrowUp';
   if(key!==held){await release();held=key;await page.keyboard.down(key);}
   await page.waitForTimeout(35);
  }
  await release();assert(await game.getAttribute('data-status')==='won','ordinary route must reach goal before defeat');
 }
 for(const goal of goals)await move(goal);
 await release();await expect(game).toHaveAttribute('data-status','won',{timeout:5000});
 check('real engine victory through normal controls',true);
 await page.screenshot({path:output+'/'+label+'-won.png',fullPage:true});
 await page.getByRole('button',{name:'Encerrar demonstração →',exact:true}).click();
 await expect(page.getByRole('region',{name:'Resultado demonstrativo'})).toBeVisible();check('winning callback ends only the demonstration',true);
 await page.getByRole('button',{name:'Jogar outra demonstração',exact:true}).click();
 await page.getByRole('button',{name:'Começar',exact:true}).click();
 await expect(game).toHaveAttribute('data-status','lost',{timeout:90000});
 check('real idle pursuit reaches defeat',true);check('defeat has no completion action',await page.getByRole('button',{name:'Encerrar demonstração →'}).count()===0);
 await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await expect(game).toHaveAttribute('data-status','playing');check('retry starts another real round',true);
 await page.getByRole('button',{name:'Sair',exact:true}).first().click();
 check('minigame fits viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 return checks;
}
