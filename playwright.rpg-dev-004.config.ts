import { defineConfig } from '@playwright/test';
import previous from './playwright.rpg-dev-001.config';

export default defineConfig({
  ...previous,
  outputDir: 'build/rpg-dev-004/equipment-browser-artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: 'build/rpg-dev-004/equipment-browser.json' }],
  ],
});
