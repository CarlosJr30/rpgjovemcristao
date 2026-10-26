import { defineConfig } from '@playwright/test';

// Synthetic browser fixtures only; no Next server, Supabase or hosted rewards.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['arena-deck.spec.ts', 'arena-tower.spec.ts'],
  grep: /isolated/,
  workers: 1,
  retries: 0,
  timeout: 120000,
  outputDir: 'build/rpg-dev-002/gameplay-browser-artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: 'build/rpg-dev-002/gameplay-browser.json' }],
  ],
  use: { trace: 'retain-on-failure' },
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
      command:
        'npx --no-install vite --config tests/fixtures/arena-deck-harness/vite.config.ts',
      url: 'http://127.0.0.1:3187',
      reuseExistingServer: false,
    },
    {
      command:
        'npx --no-install vite --config tests/fixtures/arena-tower-harness/vite.config.ts',
      url: 'http://127.0.0.1:3193',
      reuseExistingServer: false,
    },
  ],
});
