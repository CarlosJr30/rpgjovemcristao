import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['supabase-auth.spec.ts', 'quick-registration.spec.ts'],
  workers: 1,
  retries: 0,
  timeout: 45000,
  outputDir: 'build/task-0080-account-entry/browser-review-artifacts',
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'build/task-0080-account-entry/browser-review-tests.json' },
    ],
  ],
  use: { baseURL: 'http://127.0.0.1:3181', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop-chromium',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'mobile-webkit',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run start --workspace=@rpg/web -- --port 3181',
    url: 'http://127.0.0.1:3181',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      RPG_MOBILE_E2E: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        'sb_publishable_task0080_test_fixture_not_real',
    },
  },
});
