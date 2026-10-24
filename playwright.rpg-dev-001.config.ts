import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'equipment-recovery.spec.ts',
  workers: 1,
  retries: 0,
  outputDir: 'build/rpg-dev-001/browser-artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: 'build/rpg-dev-001/browser.json' }],
  ],
  use: { baseURL: 'http://127.0.0.1:3197', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command:
      'npx --no-install vite --config tests/fixtures/equipment-recovery-harness/vite.config.ts',
    url: 'http://127.0.0.1:3197',
    reuseExistingServer: false,
  },
});
