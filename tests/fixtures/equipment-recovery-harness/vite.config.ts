import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: fileURLToPath(
    new URL('../../../apps/web/public', import.meta.url),
  ),
  esbuild: { jsx: 'automatic' },
  define: { 'process.env': JSON.stringify({ NODE_ENV: 'development' }) },
  server: {
    host: '127.0.0.1',
    port: 3197,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('../../..', import.meta.url))] },
  },
});
