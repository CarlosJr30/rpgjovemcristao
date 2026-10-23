import { defineConfig } from '@playwright/test';
import base from './playwright.arena-tower.config';
export default defineConfig({
  ...base,testMatch:'authority004.spec.ts',timeout:90000,
  outputDir:'build/task-consolidation-004/browser-artifacts',
  reporter:[['list'],['json',{outputFile:'build/task-consolidation-004/browser-results.json'}]],
  use:{...base.use,baseURL:'http://127.0.0.1:3194'},
  webServer:{command:'npm run start --workspace=@rpg/web -- --port 3194',url:'http://127.0.0.1:3194',reuseExistingServer:false,timeout:60000,
    env:{NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_task004_synthetic_not_real',SUPABASE_SERVICE_ROLE_KEY:''}},
});
