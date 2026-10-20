import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'dynamic-audio.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 120000,
  outputDir: 'build/task-0089-dynamic-audio/browser-artifacts',
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'build/task-0089-dynamic-audio/browser-results.json' },
    ],
  ],
  use: { baseURL: 'http://127.0.0.1:3196', trace: 'retain-on-failure' },
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
      command: 'npm run start --workspace=@rpg/web -- --port 3196',
      url: 'http://127.0.0.1:3196',
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          'sb_publishable_task0089_synthetic_not_real',
      },
    },
    {
      command:
        'npx --no-install vite --config tests/fixtures/dynamic-audio-harness/vite.config.ts',
      url: 'http://127.0.0.1:3197',
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
