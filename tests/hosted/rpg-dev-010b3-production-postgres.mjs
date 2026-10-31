// Same isolated cases against the actual independently guarded PROD package.
// Synthetic loopback data only; no connection to Supabase PROD.
process.env.RPG_010B3_CASES = '1';
process.env.RPG_010B3_PRODUCTION_PACKAGE = '1';
await import('./rpg-dev-010b-postgres.mjs');
