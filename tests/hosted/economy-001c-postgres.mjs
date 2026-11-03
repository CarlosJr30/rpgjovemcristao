// Frozen bootstrap only; prior community/XP case suites are not rerun here.
process.env.RPG_ECONOMY_001B_CASES='1';
process.env.RPG_ECONOMY_001C_CASES='1';
await import('./rpg-dev-010b-postgres.mjs');
