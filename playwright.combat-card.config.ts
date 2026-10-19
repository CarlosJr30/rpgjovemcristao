import { defineConfig, devices } from '@playwright/test';
const run = process.env.COMBAT_QA_RUN ?? 'combat-card-final';
if (!/^[a-z0-9-]+$/.test(run)) throw Error('Invalid QA run name');
export default defineConfig({
  testDir: './tests/e2e',
  workers: 2,
  retries: 0,
  timeout: 90000,
  outputDir: `build/task-0076-combat-card-system/${run}-artifacts`,
  reporter: [
    ['list'],
    ['json', { outputFile: `build/task-0076-combat-card-system/${run}.json` }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3176',
    actionTimeout: 15000,
    navigationTimeout: 20000,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start --workspace=@rpg/web -- --port 3176',
    url: 'http://127.0.0.1:3176',
    reuseExistingServer: false,
    timeout: 60000,
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
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
