import { defineConfig, devices } from '@playwright/test';
const run = process.env.GAMEPLAY_QA_RUN ?? 'e2e';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 2,
  timeout: 90_000,
  outputDir: `build/task-0073-mobile-gameplay-exploration/${run}-artifacts`,
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: `build/task-0073-mobile-gameplay-exploration/${run}.json` },
    ],
  ],
  use: {
    actionTimeout: 15_000,
    baseURL: process.env.GAMEPLAY_QA_URL ?? 'http://127.0.0.1:3173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'android',
      use: {
        ...devices['Pixel 7'],
        channel: 'msedge',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'webkit-mobile',
      use: {
        ...devices['iPhone 13'],
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'msedge',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
