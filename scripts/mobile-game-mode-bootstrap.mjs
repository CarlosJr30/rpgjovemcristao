// One-time QA scaffold: reads the previous harness without changing its evidence.
import { readFile, writeFile, mkdir, stat, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(root, 'build/task-0064-mobile-game-mode');
const baselineExists = await access(path.join(out, 'preservation-before.json'))
  .then(() => true)
  .catch((error) => {
    if (error.code === 'ENOENT') return false;
    throw error;
  });
assert(
  !baselineExists,
  'Baseline already exists: never overwrite prior evidence.',
);
await mkdir(out, { recursive: true });
const files = execFileSync(
  'git',
  ['ls-files', '-co', '--exclude-standard', '-z'],
  { cwd: root },
)
  .toString()
  .split('\0')
  .filter(Boolean);
const hashes = {};
for (const file of new Set(files)) {
  try {
    if ((await stat(path.join(root, file))).isFile())
      hashes[file] = createHash('sha256')
        .update(await readFile(path.join(root, file)))
        .digest('hex');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
await writeFile(
  path.join(out, 'preservation-before.json'),
  JSON.stringify(
    {
      commit: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(),
      hashes,
    },
    null,
    2,
  ),
);
let harness = await readFile(
  path.join(root, 'scripts/mobile-experience-audit.mjs'),
  'utf8',
);
harness = harness
  .replace('import { chromium }', 'import { chromium, webkit }')
  .replace(
    "assert.equal(new URL(baseURL).hostname, '127.0.0.1');",
    "assert(['127.0.0.1', 'rpgjovemcristao-web-inky.vercel.app'].includes(new URL(baseURL).hostname));",
  )
  .replace(
    "'build/task-0062-mobile-experience', mode",
    "'build/task-0064-mobile-game-mode', process.env.MOBILE_QA_BROWSER ?? 'chromium', mode",
  )
  .replace('const sizes = [', 'const sizes = [\n  [320, 568],')
  .replace(
    'const selected = new Set(process.argv.slice(3));',
    'if (process.env.MOBILE_QA_PUBLISHED) sizes.splice(0, sizes.length, [390, 844], [1440, 900]);\nconst selected = new Set(process.argv.slice(3));',
  )
  .replace(
    "const browser = await chromium.launch({ channel: 'msedge', headless: true });",
    "const browser = await (process.env.MOBILE_QA_BROWSER === 'webkit' ? webkit : chromium).launch({ headless: true });",
  )
  .replace(
    "url.hostname !== '127.0.0.1'",
    'url.origin !== new URL(baseURL).origin',
  )
  .replace(
    'const metric = await page.evaluate(() => {',
    `await page.locator('[data-avatar-base]').evaluateAll(async (images) => { await Promise.all(images.map(async (img) => { if (!img.complete) await new Promise(resolve => { img.addEventListener('load', resolve, {once:true}); img.addEventListener('error', resolve, {once:true}); }); if (img.naturalWidth) await img.decode().catch(() => {}); })); });
    await page.evaluate(() => scrollTo(0, 0));
    const metric = await page.evaluate(() => {`,
  )
  .replace(
    '        innerWidth,',
    `        innerWidth,
        clientWidth: document.documentElement.clientWidth,
        innerHeight, dpr: devicePixelRatio,
        root: ['html','body','[data-game-shell]','main'].map(selector => { const n = document.querySelector(selector); if (!n) return {selector}; const c = getComputedStyle(n), r = n.getBoundingClientRect(); return {selector, x:r.x,y:r.y,width:r.width,height:r.height, maxWidth:c.maxWidth,minWidth:c.minWidth,padding:c.padding,transform:c.transform,zoom:c.zoom}; }),
        usefulRatio: main?.width / innerWidth,
        avatars: [...document.querySelectorAll('main [data-avatar-base]')].filter(visible).map(n => {const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height, visibleArea:Math.max(0,Math.min(r.right,innerWidth)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0))};}),
        controls: [...document.querySelectorAll('main button,main a')].filter(visible).map(n=>{const r=n.getBoundingClientRect();return {name:(n.getAttribute('aria-label')||n.textContent).trim().slice(0,60), x:r.x,y:r.y,width:r.width,height:r.height, inViewport:r.top>=0&&r.bottom<=innerHeight};}),
        field: (()=>{const n=document.querySelector('[data-arena-stage],canvas[role="application"]'); if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})(),
        performance: {resources: performance.getEntriesByType('resource').length, transferBytes: performance.getEntriesByType('resource').reduce((a,r)=>a+r.transferSize,0)},`,
  )
  .replace(
    'if (size.width === 390 || size.width === 1440)',
    'if ([320,390,844,1440].includes(size.width))',
  )
  .replace('fullPage: true,', 'fullPage: false,')
  .replace(
    "browser: 'Edge headless, touch/mobile emulation',",
    "browser: process.env.MOBILE_QA_BROWSER ?? 'chromium',",
  )
  .replace(
    '      await measure(name);',
    `      await measure(name);
      if (name === 'arena') {
        await page.getByRole('button', {name: /Davi,/}).click();
        await page.getByRole('button', {name: 'Iniciar batalha', exact:true}).click();
        await measure('arena-battle');
      }`,
  );
await writeFile(path.join(root, 'scripts/mobile-game-mode-audit.mjs'), harness);
console.log(
  JSON.stringify({
    preservedFiles: Object.keys(hashes).length,
    harness: 'scripts/mobile-game-mode-audit.mjs',
  }),
);
