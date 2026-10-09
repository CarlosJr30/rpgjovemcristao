import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'body-fit-lab.spec.ts',
  outputDir: 'build/task-0051-evidence/lab-test-results',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3109', trace: 'retain-on-failure' },
  projects: [
    { name: 'lab', use: { ...devices['Desktop Chrome'], channel: 'msedge' } },
  ],
  webServer: {
    command: 'node scripts/arena-lab.mjs',
    url: 'http://127.0.0.1:3109/tools/arena-lab/',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
