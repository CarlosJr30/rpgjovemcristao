import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium,webkit,expect} from '@playwright/test';
import {startLocalAuthSimulator} from '../fixtures/local-auth-http-server.mjs';
import {playMinigame} from './minigame-practice-play.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'build/rpg-dev-008c');mkdirSync(out,{recursive:true});
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!/SUPABASE|TOKEN|SECRET|PASSWORD|VERCEL|^NEXT_PUBLIC_/i.test(k)));
Object.assign(env,{NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:3202',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic-local-public-key'});
const next=resolve(root,'node_modules/next/dist/bin/next'),cwd=resolve(root,'apps/web');
const build=spawn(process.execPath,[next,'build'],{cwd,env,stdio:'inherit'});assert.equal((await once(build,'exit'))[0],0);
const app=spawn(process.execPath,[next,'start','--hostname','127.0.0.1','--port','3199'],{cwd,env,stdio:['ignore','pipe','pipe']});let log='',simulator;
app.stdout.on('data',s=>log+=s);app.stderr.on('data',s=>log+=s);
const results={syntheticData:true,productionProof:false,runs:[]};
try{
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Local readiness timeout')),20000);app.stdout.on('data',s=>{if(String(s).includes('Ready in')){clearTimeout(t);resolve();}});});
 simulator=await startLocalAuthSimulator();
 for(const [label,launcher,viewport,touch] of [['desktop',chromium,{width:1440,height:1000},false],['mobile',webkit,{width:390,height:844},true],['android-emulated',chromium,{width:390,height:844},true]]){
  const browser=await launcher.launch(),context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch}),page=await context.newPage();const run={label,errors:[],writes:[],checks:[],passed:false};results.runs.push(run);
  page.on('pageerror',e=>run.errors.push(e.message));
  context.on('request',r=>{const u=new URL(r.url());if(u.origin==='http://127.0.0.1:3202'&&u.pathname.startsWith('/rest/v1/')&&!['GET','HEAD','OPTIONS'].includes(r.method())&&u.pathname!=='/rest/v1/profiles')run.writes.push({path:u.pathname,method:r.method()});});
  try{
   await page.goto('http://127.0.0.1:3199/auth');await page.getByLabel('E-mail').fill('local-only@fixture.invalid');await page.getByLabel('Senha',{exact:true}).fill('synthetic-local-only');await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page.getByRole('heading',{name:'Bem-vindo, Local WebKit',exact:true})).toBeVisible();
   run.checks=await playMinigame(page,{origin:'http://127.0.0.1:3199',label,output:out});assert.equal(run.errors.length,0);assert.equal(run.writes.length,0);run.passed=true;
  }catch(e){run.failure=e.message;await page.screenshot({path:out+'/'+label+'-failure.png',fullPage:true}).catch(()=>{});}
  finally{await browser.close();writeFileSync(out+'/browser-results.json',JSON.stringify(results,null,2));}
 }
 assert(results.runs.every(r=>r.passed),'Real engine local browser checks failed');
}finally{if(simulator)await new Promise(r=>simulator.close(r));app.kill();writeFileSync(out+'/server.log',log);}
console.log(JSON.stringify(results.runs.map(r=>({label:r.label,passed:r.passed,checks:r.checks.length,errors:r.errors,failure:r.failure}))));
