import { defineConfig, devices } from '@playwright/test';

const run = process.env.RPG_MOBILE_QA_RUN ?? 'e2e';
if (!/^[a-z0-9-]+$/.test(run)) throw new Error('Invalid local QA run name');

// Dedicated loopback server with no online credentials; leave the user's dev server alone.
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 90_000,
  reporter: [
    ['list'],
    ['json', { outputFile: `build/task-0062-mobile-experience/${run}.json` }],
  ],
  outputDir: `build/task-0062-mobile-experience/${run}-artifacts`,
  use: { baseURL: 'http://127.0.0.1:3162', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'msedge',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
