import { defineConfig } from '@playwright/test';
const remote = process.env.TASK_0076C_URL;
if (
  remote &&
  (!/^https:\/\/rpgjovemcristao(?:-web)?-[a-z0-9]+-carlos-junior-s-projects\.vercel\.app$/.test(
    remote,
  ) ||
    remote.includes('5mx9i4w7t'))
)
  throw Error('Only the verified unique Preview hostname is allowed');
const stage = remote ? 'remote' : 'local';
const label = process.env.TASK_0076C_RUN ?? stage;
if (!/^[a-z0-9-]+$/.test(label)) throw Error('Invalid evidence label');
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'arena-preview-0076c.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 30000,
  outputDir: `build/task-0076c-vercel-preview/${label}-artifacts`,
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: `build/task-0076c-vercel-preview/${label}-tests.json` },
    ],
  ],
  use: {
    baseURL: remote ?? 'http://127.0.0.1:3376',
    hasTouch: true,
    trace: remote ? 'off' : 'retain-on-failure',
    actionTimeout: 10000,
  },
  webServer: remote
    ? undefined
    : {
        command:
          'node build/task-0076c-vercel-preview/runtime-final/apps/web/server.js',
        url: 'http://127.0.0.1:3376',
        reuseExistingServer: false,
        env: {
          HOSTNAME: '127.0.0.1',
          PORT: '3376',
          RPG_ARENA_DEMO: '1',
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
      },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit', isMobile: true, deviceScaleFactor: 2 },
    },
  ],
});
