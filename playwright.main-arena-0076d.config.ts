import { defineConfig } from '@playwright/test';
const run = process.env.TASK_0076D_RUN ?? 'main-final';
if (!/^[a-z0-9-]+$/.test(run)) throw Error('Invalid evidence label');
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    'arena.spec.ts',
    'main-arena-0076d.spec.ts',
    'combat-card-system.spec.ts',
    'mobile-game-mode.spec.ts',
  ],
  grep:
    process.env.TASK_0076D_SHARED === '1'
      ? /activity-first layout/
      : /TASK-0076D|20 cards, preview|enemy can defeat/,
  workers: 1,
  retries: 0,
  timeout: 90000,
  outputDir: `build/task-0076d-main-arena/${run}-artifacts`,
  reporter: [
    ['list'],
    ['json', { outputFile: `build/task-0076d-main-arena/${run}-tests.json` }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3375',
    hasTouch: true,
    actionTimeout: 10000,
    navigationTimeout: 20000,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node build/task-0076d-main-arena/runtime/apps/web/server.js',
    url: 'http://127.0.0.1:3375',
    reuseExistingServer: false,
    env: {
      HOSTNAME: '127.0.0.1',
      PORT: '3375',
      RPG_ARENA_DEMO: '0',
      VERCEL_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
  projects: [
    {
      name: 'android',
      use: {
        browserName: 'chromium',
        channel: 'msedge',
        isMobile: true,
        deviceScaleFactor: 3,
        viewport: { width: 406, height: 904 },
      },
    },
    {
      name: 'webkit-mobile',
      use: {
        browserName: 'webkit',
        isMobile: true,
        deviceScaleFactor: 2,
        viewport: { width: 406, height: 904 },
      },
    },
  ],
});
