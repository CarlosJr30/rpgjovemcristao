import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['avatar-hd-pilot.spec.ts', 'avatar-hd.spec.ts'],
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: 'build/task-0048-evidence/geometry/runtime-test-results',
  use: { baseURL: 'http://127.0.0.1:3112', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'hd-pilot-lab',
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: 'node scripts/avatar-hd-pilot-lab.mjs',
    url: 'http://127.0.0.1:3112',
    reuseExistingServer: false,
    timeout: 90000,
  },
});
