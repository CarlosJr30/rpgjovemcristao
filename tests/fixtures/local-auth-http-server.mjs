import { createServer } from 'node:http';
import { mockLocalReleaseAuth } from './local-release-auth.ts';

/** Offline simulator for diagnosing browser routing, never a Supabase service. */
export async function startLocalAuthSimulator(options = {}) {
  let respond = async () => undefined;
  await mockLocalReleaseAuth(
    {
      route: async (_pattern, handler) => {
        respond = handler;
      },
    },
    'http://127.0.0.1:3199',
    options,
  );
  const server = createServer(async (req, res) => {
    // Explicit local cross-origin contract for the simulator only.
    if (req.headers.origin !== 'http://127.0.0.1:3199') {
      res.writeHead(403);
      res.end();
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3199');
    res.setHeader('Vary', 'Origin');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'authorization,apikey,content-type,x-client-info,prefer,accept-profile,content-profile,x-supabase-api-version',
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PATCH,DELETE,OPTIONS',
    );
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');
    void respond({
      request: () => ({
        url: () => 'https://fixture.invalid' + req.url,
        headers: () => req.headers,
        postDataJSON: () => (body ? JSON.parse(body) : {}),
      }),
      abort: async () => {
        res.writeHead(403);
        res.end();
      },
      fulfill: async ({ json }) => {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(json));
      },
    }).catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(3202, '127.0.0.1', resolve);
  });
  return server;
}
