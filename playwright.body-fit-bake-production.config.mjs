import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/body-fit-bake-production',
  outputDir: 'build/task-0054-body-fit-bake/production-results',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3108' },
  projects: [
    {
      name: 'production',
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: 'npm run start --workspace=@rpg/web -- --port 3108',
    url: 'http://127.0.0.1:3108',
    reuseExistingServer: false,
    timeout: 60000,
    env: { NEXT_TELEMETRY_DISABLED: '1' },
  },
});
