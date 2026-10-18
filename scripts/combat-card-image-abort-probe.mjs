import net from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

// Read-only, local-only regression for Next's shared cold image transform.
// Use widths absent from the 32px icon UI without changing original assets.
// Query-string variants are intentionally rejected by Next's default policy.
const origin = 'http://127.0.0.1:3176';
const source = '/assets/equipment/helmet/traveler_helmet_rare_icon.png';
const checks = [];
for (const [delay, width] of [
  [0, 384],
  [1, 640],
  [2, 750],
  [5, 828],
  [10, 1080],
  [20, 1200],
]) {
  const target = `/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=75`;
  await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: 3176 });
    socket.on('error', reject);
    socket.on('connect', () => {
      socket.write(
        `GET ${target} HTTP/1.1\r\nHost: 127.0.0.1:3176\r\nAccept: image/webp\r\nConnection: close\r\n\r\n`,
      );
      setTimeout(() => {
        socket.destroy();
        resolve();
      }, delay);
    });
  });
  const start = performance.now();
  try {
    const response = await fetch(origin + target, {
      headers: { accept: 'image/webp' },
      signal: AbortSignal.timeout(5000),
    });
    const bytes = (await response.arrayBuffer()).byteLength;
    checks.push({
      delay,
      width,
      status: response.status,
      bytes,
      elapsedMs: Math.round(performance.now() - start),
      pass: response.status === 200 && bytes > 0,
    });
  } catch (error) {
    checks.push({
      delay,
      width,
      elapsedMs: Math.round(performance.now() - start),
      pass: false,
      error: error.name,
    });
  }
}
const result = { origin, checks, pass: checks.every((check) => check.pass) };
await mkdir('build/task-0076-combat-card-system', { recursive: true });
await writeFile(
  'build/task-0076-combat-card-system/image-abort-probe.json',
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
if (!result.pass) process.exitCode = 1;
