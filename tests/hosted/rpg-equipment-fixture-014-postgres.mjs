process.env.RPG_EQUIPMENT_FIX014_FUNDED_FIXTURE = '1';
process.env.RPG_EQUIPMENT_FIX014_CASES = '1';
process.argv.push('--test-envelope');
await import('./economy-001c-release-postgres.mjs');
