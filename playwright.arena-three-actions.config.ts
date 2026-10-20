import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'arena-three-actions.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 60000,
  outputDir: 'build/task-0085-arena-cards/browser-artifacts',
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'build/task-0085-arena-cards/browser-results.json' },
    ],
  ],
  use: { baseURL: 'http://127.0.0.1:3188', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop-chromium',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 320, height: 740 },
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
  webServer: [
    {
      command: 'npm run start --workspace=@rpg/web -- --port 3188',
      url: 'http://127.0.0.1:3188',
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          'sb_publishable_task0085_synthetic_not_real',
      },
    },
    {
      command:
        'npx --no-install vite --config tests/fixtures/arena-three-actions-harness/vite.config.ts',
      url: 'http://127.0.0.1:3189',
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
