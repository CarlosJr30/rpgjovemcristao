// Standalone UI QA with explicit fixtures. Does not claim a live two-account test.
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const root = process.cwd(),
  out = resolve(root, 'build/task-0071/browser');
await mkdir(out, { recursive: true });
const original = resolve(
  root,
  'apps/web/lib/supabase/repositories/guild-chat-repository.ts',
).replaceAll('\\', '/');
await build({
  entryPoints: [resolve(root, 'tests/fixtures/guild-chat-preview.tsx')],
  outdir: out,
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  external: ['/assets/*'],
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.css': 'local-css' },
  plugins: [
    {
      name: 'explicit-chat-fixtures',
      setup(b) {
        b.onResolve(
          { filter: /guild-chat-repository\.ts$/, namespace: 'fixture' },
          () => ({ path: original, namespace: 'file' }),
        );
        b.onResolve({ filter: /supabase\/auth-context$/ }, () => ({
          path: 'auth',
          namespace: 'fixture',
        }));
        b.onResolve({ filter: /repositories\/guild-chat-repository$/ }, () => ({
          path: 'repository',
          namespace: 'fixture',
        }));
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          contents:
            args.path === 'auth'
              ? 'export const useAuth=()=>({status:"signedIn",user:{id:window.chatFixture.account}});'
              : `export {CHAT_PAGE_SIZE,CHAT_MAX_LENGTH,ChatError,reportReasons} from ${JSON.stringify(original)};
        const f=()=>window.chatFixture;
        export const guildChatRepository={
          summary:async()=>f().summary,page:async(_g,before)=>f().messages.filter(m=>before===undefined || m.sequence<before).sort((a,b)=>b.sequence-a.sequence).slice(0,30),
          byIds:async(_g,ids)=>f().messages.filter(m=>ids.includes(m.id)),
          markRead:async(_g,_t,seq)=>{f().summary={...f().summary,unread_count:0,last_read_sequence:seq}},
          send:async(_g,_t,id,body,notice)=>{f().messages.push({...f().messages[0],id,sequence:200,body,is_announcement:notice});f().invalidate();return id},
          report:async()=>{},moderate:async(_g,_t,id)=>{const m=f().messages.find(m=>m.id===id);m.body=null;m.removed_at=new Date().toISOString();f().invalidate()},
          reports:async()=>[],log:async()=>[],
          subscribe:(_g,invalidate,status)=>{f().invalidate=invalidate;f().status=status;status(true);return ()=>{}}};`,
          loader: 'js',
        }));
      },
    },
  ],
});
const fixture = {
  account: 'fixture-account-a',
  guild: 'fixture-guild-a',
  traveler: 'fixture-traveler-a',
  summary: {
    unread_count: 1,
    last_read_sequence: 0,
    can_announce: true,
    can_moderate: true,
  },
  messages: [
    {
      id: 'fixture-message',
      sequence: 1,
      guild_id: 'fixture-guild-a',
      author_traveler_id: 'fixture-traveler-b',
      client_id: 'fixture-retry',
      author_name: 'Lia da Célula',
      author_body_type: 'female',
      author_skin_tone: 'medio',
      author_hair_style: 'curto',
      author_outfit: 'musgo',
      body: 'Que bom caminhar juntos! Nosso encontro será no sábado.',
      is_announcement: true,
      created_at: '2026-10-14T12:00:00Z',
      removed_at: null,
    },
  ],
};
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/guild-chat-preview.css"><style>body{background:#e8e7da;font:16px system-ui;margin:0;padding:16px;box-sizing:border-box}main{max-width:1000px;margin:auto}*,*:before,*:after{box-sizing:border-box}</style><main><p>Fixture visual de QA — sem autenticação real.</p><div id="root"></div></main><script>window.chatFixture=${JSON.stringify(fixture)};</script><script type="module" src="/guild-chat-preview.js"></script></html>`;
await writeFile(resolve(out, 'index.html'), html);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const base = url.pathname.startsWith('/assets/')
      ? resolve(root, 'apps/web/public')
      : out;
    const path =
      url.pathname === '/'
        ? resolve(out, 'index.html')
        : resolve(base, '.' + url.pathname);
    if (!path.startsWith(base + sep)) throw Error('path');
    const bytes = await readFile(path);
    res.setHeader(
      'Content-Type',
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.webp': 'image/webp',
      }[extname(path)] ?? 'application/octet-stream',
    );
    res.end(bytes);
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((resolveServer) =>
  server.listen(0, '127.0.0.1', resolveServer),
);
const origin = `http://127.0.0.1:${server.address().port}`;
const browsers = [];
const checks = [];
try {
  for (const channel of ['chrome', 'msedge']) {
    const browser = await chromium.launch({ channel, headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin);
    await page.getByRole('button', { name: /Abrir chat/ }).click();
    await page
      .getByText('Que bom caminhar juntos!', { exact: false })
      .waitFor();
    await page.waitForFunction(() =>
      Array.from(document.images).every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `${channel} overflow ${width}`,
      );
      await page.screenshot({
        path: resolve(out, `${channel}-${width}.png`),
        fullPage: true,
      });
      checks.push(
        `${channel} ${width}px: chat visible, no horizontal overflow`,
      );
    }
    await page.getByLabel('Mensagem para a célula').fill('Mensagem de QA');
    await page.getByRole('button', { name: 'Enviar', exact: true }).click();
    await page.getByText('Mensagem de QA', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Marcar como lidas' }).click();
    await page
      .getByRole('button', { name: 'Fechar chat', exact: true })
      .waitFor();
    await page.evaluate(() => {
      window.chatFixture.status(false);
      window.chatFixture.messages[0].body = null;
      window.chatFixture.messages[0].removed_at = new Date().toISOString();
      window.chatFixture.status(true);
    });
    await page
      .getByText('Mensagem removida pela moderação.', { exact: true })
      .first()
      .waitFor();
    await page.evaluate(() => {
      window.chatFixture.account = 'fixture-account-b';
      window.chatFixture.guild = 'fixture-guild-b';
      window.chatFixture.summary.unread_count = 0;
      window.chatFixture.messages = [];
      window.chatFixture.mount();
    });
    await page
      .getByRole('button', { name: 'Abrir chat', exact: true })
      .waitFor();
    assert.equal(
      await page.getByText('Mensagem de QA', { exact: true }).count(),
      0,
    );
    assert.deepEqual(errors, []);
    checks.push(
      `${channel}: send/read/reconnect/removal/account isolation fixtures PASS`,
    );
  }
  await writeFile(
    resolve(out, 'results.json'),
    JSON.stringify(
      {
        result: 'PASS',
        scope: 'UI fixtures only; real accounts/Auth/Realtime pending',
        checks,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      result: 'PASS',
      checks: checks.length,
      scope: 'UI fixtures only',
      artifact: 'build/task-0071/browser/results.json',
    }),
  );
} finally {
  await Promise.all(browsers.map((browser) => browser.close()));
  await new Promise((done) => server.close(done));
}
