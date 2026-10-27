import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {findPath,cellCenter,PORTAL_POSITION,CELL_SIZE,isBlocked} from '../../apps/web/features/journey/components/snake-game-engine.ts';

// Uses ordinary keyboard/pointer controls and existing read-only canvas metrics.
// Never edits game runtime, storage, network results, physics or enemy state.
export async function playMinigame(page, {origin, label, output, verifySafety = false}) {
 const checks=[];const check=(name,ok)=>{checks.push({name,passed:!!ok});assert(ok,name)};
 await page.goto(origin+'/journey/minigames/fuga-da-serpente');
 await expect(page.locator('[data-minigame-mode="demonstration"]')).toBeVisible();
 check('demonstration explains no progression',await page.getByText(/Vitória, derrota, tutorial e reinício não salvam progresso/).count()===1);
 await page.getByRole('button',{name:'Começar',exact:true}).click();
 const game=page.locator('[data-serpent-mode]'),canvas=page.getByRole('application');
 await expect(game).toHaveAttribute('data-status','playing');
 await expect.poll(()=>canvas.evaluate(c=>Number.isFinite(Number(c.dataset.playerX)))).toBe(true);
 const position=()=>canvas.evaluate(c=>({x:Number(c.dataset.playerX),y:Number(c.dataset.playerY)}));
 if(verifySafety){
  const start=await position();await page.keyboard.down('ArrowLeft');await page.waitForTimeout(1000);await page.keyboard.up('ArrowLeft');await page.waitForTimeout(150);
  const wall=await position();await page.keyboard.down('ArrowLeft');await page.waitForTimeout(250);await page.keyboard.up('ArrowLeft');await page.waitForTimeout(150);
  const stopped=await position();check('wall collision stops ordinary held movement without crossing',wall.x<start.x&&Math.abs(stopped.x-wall.x)<1&&!isBlocked(stopped));
 }
 if(await page.evaluate(()=>innerWidth<=1024)){
  const toggle=page.getByRole('button',{name:'Direcional',exact:true});if(await toggle.getAttribute('aria-pressed')!=='true')await toggle.click();
  const right=page.locator('button[data-direction="arrowright"]');await expect(right).toBeVisible();
  const box=await right.boundingBox(),before=await position(),point={x:box.x+box.width/2,y:box.y+box.height/2};
  if(page.context().browser().browserType().name()==='chromium'){
   const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});await page.waitForTimeout(350);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }else{await page.mouse.move(point.x,point.y);await page.mouse.down();await page.waitForTimeout(350);await page.mouse.up();}
  await page.waitForTimeout(150);check('mobile direction pointer moves the real player',(await position()).x>before.x);
  await expect(right).toHaveAttribute('aria-pressed','false');check('mobile direction release clears held input',true);
 }
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
 if(verifySafety){
  await move(cellCenter({col:4,row:11}));
  const score=game.locator('span').filter({hasText:'PONTOS'}).locator('strong');
  await expect.poll(async()=>Number(await score.textContent())).toBeGreaterThan(0);
  check('existing light crystal collection changes local engine score',Number(await score.textContent())%100===0);
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
 if(verifySafety){
  await expect(game).toHaveAttribute('data-status','ready');check('safe exit returns to ready and releases game mode',await page.evaluate(()=>document.body.dataset.snakeGameActive==='false'));
  await page.reload();await expect(page.locator('[data-minigame-mode="demonstration"]')).toBeVisible();await expect(game).toHaveAttribute('data-status','ready');check('reload discards round and tutorial instead of persisting',await page.getByRole('button',{name:'Começar',exact:true}).count()===1);
 }
 check('minigame fits viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 return checks;
}
