// Reuse only frozen PostgreSQL setup. Do not rerun the prior community case suites.
process.env.RPG_ECONOMY_001B_CASES='1';
await import('./rpg-dev-010b-postgres.mjs');
