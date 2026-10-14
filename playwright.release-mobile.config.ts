import { defineConfig } from '@playwright/test';
import gameMode from './playwright.game-mode.config';

const evidence =
  process.env.RPG_RELEASE_EVIDENCE_DIR ?? 'build/task-0065-mobile-release';
const run = process.env.GAME_QA_RUN ?? 'release-e2e';
export default defineConfig({
  ...gameMode,
  reporter: [['list'], ['json', { outputFile: `${evidence}/${run}.json` }]],
  outputDir: `${evidence}/${run}-artifacts`,
});
