import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: [
    '**/equipment-portal.spec.ts',
    '**/body-fit-sheath-production/reduced-motion.spec.mjs',
  ],
  outputDir: 'build/task-0057-sword-sheath/portal-results',
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'build/task-0057-sword-sheath/portal-results.json' },
    ],
  ],
  use: { baseURL: 'http://127.0.0.1:3111', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: 'npm run start --workspace=@rpg/web -- --port 3111',
    url: 'http://127.0.0.1:3111',
    reuseExistingServer: false,
    timeout: 60000,
    env: { NEXT_TELEMETRY_DISABLED: '1' },
  },
});
