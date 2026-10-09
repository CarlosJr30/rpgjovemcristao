import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Local visual inspection only. No production build, write endpoint or network service.
if (process.env.NODE_ENV === 'production')
  throw new Error('Arena Visual Lab is development-only');
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const server = await createServer({
  configFile: false,
  // The Vite review uses the explicit checkbox, never the Next pilot-lab flag.
  define: { 'process.env.NEXT_PUBLIC_AVATAR_HD_LAB': '"0"' },
  root,
  publicDir: path.join(root, 'apps/web/public'),
  esbuild: { jsx: 'automatic' },
  optimizeDeps: { entries: ['tools/arena-lab/index.html'] },
  server: {
    host: '127.0.0.1',
    port: 3109,
    strictPort: true,
    open: false,
    watch: {
      ignored: [
        '**/build/**',
        '**/.next/**',
        '**/docs/**',
        '**/tasks/**',
        '**/.agent/**',
        '**/.git/**',
      ],
    },
  },
  plugins: [
    {
      name: 'arena-lab-read-only-status',
      configureServer(vite) {
        vite.middlewares.use('/__arena_lab/assets', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.end();
            return;
          }
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('Content-Type', 'application/json');
          try {
            const { readArenaAssetStatus } = await vite.ssrLoadModule(
              '/apps/web/features/journey/dev/arena-asset-status.ts',
            );
            res.end(JSON.stringify(await readArenaAssetStatus(root)));
          } catch {
            res.statusCode = 503;
            res.end(
              JSON.stringify({
                error: 'Não foi possível auditar o manifesto local.',
              }),
            );
          }
        });
      },
    },
  ],
});
// Resolve the auditor before declaring readiness; generated evidence must not
// invalidate its module graph while other local validation is running.
await server.ssrLoadModule(
  '/apps/web/features/journey/dev/arena-asset-status.ts',
);
await server.listen();
process.stdout.write(
  'Arena Visual Lab: http://127.0.0.1:3109/tools/arena-lab/\n',
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, async () => {
    await server.close();
    process.exit(0);
  });
