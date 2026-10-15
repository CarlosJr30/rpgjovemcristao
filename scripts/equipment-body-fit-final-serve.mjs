import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const sizeRework = process.argv.includes('--size-rework');
const port = sizeRework ? 8076 : 8075;
const file = new URL(
  sizeRework
    ? '../build/task-0075-body-fit-final-review/size-rework/review.html'
    : '../build/task-0075-body-fit-final-review/review/index.html',
  import.meta.url,
);
await readFile(file);
createServer(async (req, res) => {
  if (req.method !== 'GET' || !['/', '/index.html'].includes(req.url)) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    const html = await readFile(file);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Length': html.length,
    });
    res.end(html);
  } catch {
    res.writeHead(503);
    res.end('Galeria temporariamente indisponivel.');
  }
}).listen(port, '127.0.0.1', () =>
  console.log(
    `TASK-0075 PRIVATE review: http://127.0.0.1:${port}/ (loopback only, one HTML, no other files served)`,
  ),
);
