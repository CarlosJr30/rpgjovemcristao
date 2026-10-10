import { defineConfig } from '@playwright/test';
import mobile from './playwright.mobile.config';
import prototype from './playwright.arena-audio-prototype.config';

const dev = process.env.RPG_MEDIA_QA_MODE === 'development';
const run = process.env.RPG_MEDIA_QA_RUN ?? 'rework';
if (!/^[a-z0-9-]+$/.test(run)) throw new Error('Invalid media QA run name');
export default defineConfig({
  ...(dev ? prototype : mobile),
  testMatch: dev
    ? ['arena-audio-prototype.spec.ts', 'arena-audio-technical.spec.ts']
    : [
        'media-isolation.spec.ts',
        'mobile-experience.spec.ts',
        'equipment-portal.spec.ts',
        'arena-v2.spec.ts',
      ],
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: `build/task-0063-deployment-audit/${dev ? 'dev' : 'production'}-${run}-e2e.json`,
      },
    ],
  ],
  outputDir: `build/task-0063-deployment-audit/${dev ? 'dev' : 'production'}-${run}-e2e-artifacts`,
  webServer: dev
    ? {
        command: 'node scripts/prototype-audio-dev.mjs --port 3110',
        url: 'http://127.0.0.1:3110',
        reuseExistingServer: false,
        timeout: 60000,
        env: {
          RPG_ARENA_AUDIO_E2E: '1',
          NEXT_TELEMETRY_DISABLED: '1',
          NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
            'sb_publishable_task0063_local_fixture',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        },
      }
    : undefined,
});
