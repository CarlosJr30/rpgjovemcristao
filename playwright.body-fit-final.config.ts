import { defineConfig, devices } from '@playwright/test';
const run = process.env.BODY_FIT_QA_RUN ?? 'e2e-final';
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
  projects: [
    { name: 'android', use: { ...devices['Pixel 7'], channel: 'msedge' } },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 13'], browserName: 'webkit' },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
