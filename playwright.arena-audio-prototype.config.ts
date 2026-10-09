import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'arena-audio-prototype.spec.ts',
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: 'build/task-0042-prototype/dev-e2e-results',
  use: { baseURL: 'http://127.0.0.1:3110', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'prototype',
      use: { ...devices['Desktop Chrome'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: 'npm run dev --workspace=@rpg/web -- --port 3110',
    url: 'http://127.0.0.1:3110',
    reuseExistingServer: false,
    timeout: 60000,
    env: { RPG_ARENA_AUDIO_E2E: '1', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
