import { defineConfig, devices } from '@playwright/test';
const run = process.env.BODY_FIT_QA_RUN ?? 'e2e-final';
const pinnedDesktop = process.env.BODY_FIT_PINNED_DESKTOP === '1';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 2,
  timeout: 90_000,
  outputDir: `build/task-0075-body-fit-final-review/${run}-artifacts`,
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: `build/task-0075-body-fit-final-review/${run}.json` },
    ],
  ],
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    baseURL: 'http://127.0.0.1:3175',
    trace: 'retain-on-failure',
  },
  // Own the production server lifecycle: never silently reuse a stale/shared process.
  webServer: {
    command: 'npm run start --workspace=@rpg/web -- --port 3175',
    url: 'http://127.0.0.1:3175',
    reuseExistingServer: false,
    timeout: 60_000,
    env: { NEXT_TELEMETRY_DISABLED: '1' },
  },
  projects: [
    { name: 'android', use: { ...devices['Pixel 7'], channel: 'msedge' } },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 13'], browserName: 'webkit' },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        ...(pinnedDesktop ? {} : { channel: 'chrome' }),
      },
    },
  ],
});
