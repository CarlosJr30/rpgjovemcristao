import { defineConfig, devices } from '@playwright/test';
const run = process.env.EQUIPMENT_QA_RUN ?? 'e2e';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 2,
  timeout: 90_000,
  outputDir: `build/task-0074-equipment-body-fit-v3/${run}-artifacts`,
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: `build/task-0074-equipment-body-fit-v3/${run}.json` },
    ],
  ],
  use: {
    actionTimeout: 15_000,
    baseURL: process.env.EQUIPMENT_QA_URL ?? 'http://127.0.0.1:3174',
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
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
    },
  ],
});
