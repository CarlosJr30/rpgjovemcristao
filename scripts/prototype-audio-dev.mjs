import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPOSITORY_ROOT,
  assertPrototypeSources,
  readPrototypeSource,
} from './prototype-audio-isolation.mjs';

export async function prototypeResponse(
  request,
  policy,
  root = REPOSITORY_ROOT,
) {
  if (process.env.NODE_ENV !== 'development')
    return new Response(null, { status: 404 });
  if (!['GET', 'HEAD'].includes(request.method))
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const url = new URL(request.url);
  const item = policy.items.find(
    (item) => `/assets/${item.receiptKey}` === url.pathname,
  );
  if (!item) return new Response(null, { status: 404 });
  try {
    const bytes = await readPrototypeSource(root, policy, item);
    const headers = {
      'Content-Type': 'audio/ogg',
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
    };
    const range = request.headers.get('range');
    let start = 0,
      end = bytes.length - 1,
      status = 200;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2]))
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${bytes.length}` },
        });
      if (match[1]) {
        start = Number(match[1]);
        end = match[2] ? Math.min(Number(match[2]), end) : end;
      } else {
        start = Math.max(0, bytes.length - Number(match[2]));
      }
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start < 0 ||
        start >= bytes.length
      )
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${bytes.length}` },
        });
      headers['Content-Range'] = `bytes ${start}-${end}/${bytes.length}`;
      status = 206;
    }
    headers['Content-Length'] = String(end - start + 1);
    return new Response(
      request.method === 'HEAD'
        ? null
        : new Uint8Array(bytes.subarray(start, end + 1)),
      { status, headers },
    );
  } catch {
    // A missing/modified prototype never serves an unreviewed file or crashes gameplay.
    return new Response(null, { status: 404 });
  }
}

async function main() {
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development')
    throw Error('Prototype server is development-only');
  process.env.NODE_ENV = 'development';
  const policy = await assertPrototypeSources();
  const server = createServer(async (incoming, outgoing) => {
    try {
      const request = new Request(new URL(incoming.url, 'http://127.0.0.1'), {
        method: incoming.method,
        headers: incoming.headers,
      });
      const response = await prototypeResponse(request, policy);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      outgoing.writeHead(500);
      outgoing.end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  console.log(
    'Prototype Arena audio: private DEV sources, loopback server; no public copies.',
  );
  const child = spawn(
    process.execPath,
    [
      path.join(REPOSITORY_ROOT, 'node_modules/next/dist/bin/next'),
      'dev',
      '--hostname',
      '127.0.0.1',
      ...process.argv.slice(2),
    ],
    {
      cwd: path.join(REPOSITORY_ROOT, 'apps/web'),
      stdio: 'inherit',
      windowsHide: true,
      env: { ...process.env, RPG_AUDIO_PROTOTYPE_PORT: String(port) },
    },
  );
  let stopping = false;
  const close = () => {
    if (stopping) return;
    stopping = true;
    server.closeAllConnections();
    server.close();
    // Windows termination does not propagate SIGTERM to Next's worker.
    // Target only the child tree created above; never discover/kill by name.
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      if (process.platform === 'win32')
        spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
          windowsHide: true,
          stdio: 'ignore',
        });
      else child.kill('SIGTERM');
    }
  };
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  process.once('exit', close);
  child.once('error', (error) => {
    console.error(error.message);
    server.closeAllConnections();
    server.close();
    process.exitCode = 1;
  });
  child.once('exit', (code) => {
    server.closeAllConnections();
    server.close();
    process.exitCode = stopping ? 0 : (code ?? 0);
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
