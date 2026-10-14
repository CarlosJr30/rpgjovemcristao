import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 120_000,
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: `build/task-0064-mobile-game-mode/${process.env.GAME_QA_RUN ?? 'e2e'}.json`,
      },
    ],
  ],
  outputDir: `build/task-0064-mobile-game-mode/${process.env.GAME_QA_RUN ?? 'e2e'}-artifacts`,
  use: { baseURL: 'http://127.0.0.1:3165', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'android',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'webkit-mobile',
      use: {
        ...devices['iPhone 13'],
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
