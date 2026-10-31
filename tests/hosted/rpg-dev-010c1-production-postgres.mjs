// Same additional history/authorization cases in the own PROD envelope, isolated only.
process.env.RPG_010C1_CASES = '1';
process.env.RPG_010C1_PRODUCTION_PACKAGE = '1';
process.env.RPG_010C1_HISTORY_ONLY = '1';
await import('./rpg-dev-010b-postgres.mjs');
