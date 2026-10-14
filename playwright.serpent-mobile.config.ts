import { defineConfig } from '@playwright/test';
import base from './playwright.game-mode.config';
const evidence = 'build/task-0066-serpent-mobile-first';
const run = process.env.SERPENT_QA_RUN ?? 'e2e';
export default defineConfig({
  ...base,
  reporter: [['list'], ['json', { outputFile: `${evidence}/${run}.json` }]],
  outputDir: `${evidence}/${run}-artifacts`,
  use: {
    ...base.use,
    // Keep DOM/network traces and explicit PNG evidence with less instrumentation.
    trace: {
      mode: 'retain-on-failure',
      screenshots: false,
      snapshots: true,
      sources: true,
    },
    baseURL: process.env.SERPENT_QA_URL ?? 'http://127.0.0.1:3166',
  },
});
