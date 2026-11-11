process.env.RPG_ECONOMY_041_CASES = '1';
if (process.argv.includes('--progress'))
  process.env.RPG_ECONOMY_041_PROGRESS = '1';
if (process.argv.includes('--installation'))
  process.env.RPG_ECONOMY_041_INSTALLATION = '1';
await import('./economy-001c-release-postgres.mjs');
