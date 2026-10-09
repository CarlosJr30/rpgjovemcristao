import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
if (process.env.NODE_ENV === 'production')
  throw new Error('Avatar HD pilot laboratory is DEV only');
const require = createRequire(import.meta.url);
const child = spawn(
  process.execPath,
  [
    require.resolve('next/dist/bin/next'),
    'dev',
    '--port',
    '3112',
    '--hostname',
    '127.0.0.1',
  ],
  {
    cwd: fileURLToPath(new URL('../apps/web/', import.meta.url)),
    windowsHide: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      NEXT_PUBLIC_AVATAR_HD_LAB: '1',
      RPG_ARENA_AUDIO_E2E: '0',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, () => child.kill(signal));
child.once('exit', (code) => process.exit(code ?? 1));
child.once('error', () => process.exit(1));
