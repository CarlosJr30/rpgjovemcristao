process.env.RPG_ECONOMY_001B_CASES = '1';
process.env.RPG_ECONOMY_001C_CASES = '1';
process.env.RPG_ECONOMY_FIX010_CASES = '1';
if (process.argv.includes('--production'))
  process.env.RPG_FIX010_PRODUCTION = '1';
await import('./rpg-dev-010b-postgres.mjs');
