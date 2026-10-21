import { defineConfig } from '@playwright/test';
import base from './playwright.arena-tower.config';

export default defineConfig({
  ...base,
  testMatch: [
    'integrated006.spec.ts',
    'supabase-auth.spec.ts',
    'guild-panel.spec.ts',
    'guild-ebd.spec.ts',
  ],
  grep: /cross-feature|entrada oferece|flag local|API do convite|leader draft|special challenge|leader authorizes/,
  outputDir: 'build/task-consolidation-006/browser-artifacts',
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'build/task-consolidation-006/browser-results.json' },
    ],
  ],
  use: {
    ...base.use,
    baseURL: 'http://127.0.0.1:3183',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  webServer: {
    command: 'npm run start --workspace=@rpg/web -- --port 3183',
    url: 'http://127.0.0.1:3183',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        'sb_publishable_task006_synthetic_not_real',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
  },
});
