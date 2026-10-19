import { defineConfig } from '@playwright/test';
const stage = process.env.TASK_0076B_STAGE ?? 'after';
const run = process.env.TASK_0076B_RUN ?? stage;
const runtime =
  process.env.TASK_0076B_RUNTIME ?? (stage === 'after' ? 'review' : 'before');
if (!/^[a-z0-9-]+$/.test(runtime)) throw Error('Invalid runtime label');
if (!/^[a-z0-9-]+$/.test(run)) throw Error('Invalid evidence label');
if (!['before', 'after'].includes(stage)) throw Error('Invalid capture stage');
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'card-arena-mobile-0076b.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 30000,
  outputDir: `build/task-0076b-mobile-layout/${run}-artifacts`,
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: `build/task-0076b-mobile-layout/${run}-tests.json` },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3377',
    hasTouch: true,
    actionTimeout: 10000,
    navigationTimeout: 20000,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node build/task-0076b-mobile-layout/${runtime}-runtime/apps/web/server.js`,
    url: 'http://127.0.0.1:3377',
    reuseExistingServer: false,
    timeout: 30000,
    env: { HOSTNAME: '127.0.0.1', PORT: '3377', NEXT_TELEMETRY_DISABLED: '1' },
  },
  projects: [
    {
      name: 'android',
      use: {
        browserName: 'chromium',
        channel: 'msedge',
        isMobile: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: 'webkit',
      // Safe-area override uses CDP, which is only available in Chromium.
      grepInvert: /safe area insets/,
      use: { browserName: 'webkit', isMobile: true, deviceScaleFactor: 2 },
    },
  ],
});
