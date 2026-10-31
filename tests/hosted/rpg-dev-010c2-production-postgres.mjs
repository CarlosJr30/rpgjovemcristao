// The same scoped authority cases, in the own PROD envelope, on loopback only.
process.env.RPG_010C2_CASES = '1';
process.env.RPG_010C2_PRODUCTION_PACKAGE = '1';
await import('./rpg-dev-010b-postgres.mjs');
