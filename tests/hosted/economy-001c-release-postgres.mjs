// New production boundary only. Prior approved community/QA shop cases are reused.
process.env.RPG_ECONOMY_001B_CASES = '1';
process.env.RPG_ECONOMY_001C_CASES = '1';
process.env.RPG_ECONOMY_001C_RELEASE_CASES = '1';
if (process.argv.includes('--test-envelope'))
  process.env.RPG_ECONOMY_001C_RELEASE_ENV = 'TEST';
await import('./rpg-dev-010b-postgres.mjs');
