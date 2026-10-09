import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/body-fit-sheath-pilot',
  outputDir: 'build/task-0058-sword-sheath-pilot/lab-results',
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'build/task-0058-sword-sheath-pilot/lab-results.json' },
    ],
  ],
  use: { baseURL: 'http://127.0.0.1:3109', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'pilot-lab',
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: 'node scripts/arena-lab.mjs',
    url: 'http://127.0.0.1:3109/tools/arena-lab/',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
