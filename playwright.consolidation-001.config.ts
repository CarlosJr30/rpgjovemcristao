import { defineConfig } from '@playwright/test';

// Selected cross-boundary scenarios from the approved suites, rerun on one SHA.
// All DataAPI/Auth traffic is intercepted; this is not a hosted acceptance run.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    'consolidation-001.spec.ts',
    'supabase-auth.spec.ts',
    'story-worlds.spec.ts',
    'guild-panel.spec.ts',
    'guild-ebd.spec.ts',
    'chest-reveal.spec.ts',
  ],
  grep: /consolidated route navigation|flag local antiga|API do convite recusa|home → map → world|leader draft → publish|leader authorizes teacher|product confirmed opening/,
  workers: 1,
  retries: 0,
  timeout: 120000,
  outputDir: 'build/task-consolidation-001/browser-artifacts',
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'build/task-consolidation-001/browser-results.json' },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3183',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
  },
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
  webServer: {
    command: 'npm run start --workspace=@rpg/web -- --port 3183',
    url: 'http://127.0.0.1:3183',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        'sb_publishable_consolidation001_synthetic_not_real',
    },
  },
});
