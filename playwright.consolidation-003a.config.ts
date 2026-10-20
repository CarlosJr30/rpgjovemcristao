import { defineConfig } from '@playwright/test';
import base from './playwright.arena-tower.config';
export default defineConfig({
  ...base,
  testMatch: ['measured-strike.spec.ts', 'arena-deck.spec.ts'],
  grep: /isolated candidate|actual authenticated Arena/,
  timeout: 90000,
  outputDir: 'build/task-consolidation-003a/browser-artifacts',
  reporter: [
    ['list'],
    [
      'json',
      { outputFile: 'build/task-consolidation-003a/browser-results.json' },
    ],
  ],
});
