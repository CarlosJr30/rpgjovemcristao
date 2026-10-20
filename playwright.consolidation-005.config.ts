import { defineConfig } from '@playwright/test';
import base from './playwright.arena-tower.config';
export default defineConfig({
  ...base,
  testMatch: 'origins005.spec.ts',
  timeout: 120000,
  outputDir: 'build/task-consolidation-005/browser-artifacts',
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'build/task-consolidation-005/browser-results.json' },
    ],
  ],
  use: { ...base.use, baseURL: 'http://127.0.0.1:3195',actionTimeout:15000,navigationTimeout:30000 },
  webServer: {
    command: 'npm run start --workspace=@rpg/web -- --port 3195',
    url: 'http://127.0.0.1:3195',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        'sb_publishable_task005_synthetic_not_real',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
  },
});
