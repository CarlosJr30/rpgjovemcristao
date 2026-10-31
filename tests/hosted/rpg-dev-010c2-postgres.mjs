// Only new scoped challenge cases. Existing migrations are setup, not additional case claims.
process.env.RPG_010C2_CASES = '1';
await import('./rpg-dev-010b-postgres.mjs');
