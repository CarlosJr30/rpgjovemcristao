import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: fileURLToPath(
    new URL('../../../apps/web/public', import.meta.url),
  ),
  esbuild: { jsx: 'automatic' },
  define: {
    'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
      'https://fixture.invalid',
    ),
    'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
      'sb_publishable_task0087_synthetic_not_real',
    ),
  },
  server: {
    host: '127.0.0.1',
    port: 3193,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('../../..', import.meta.url))] },
  },
});
