// Reuse the established loopback setup, not previous test results or hosted sessions.
process.env.RPG_010B3_CASES = '1';
await import('./rpg-dev-010b-postgres.mjs');
