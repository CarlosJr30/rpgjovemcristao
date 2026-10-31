// Existing isolated loopback setup; no remote Supabase access or Auth credentials.
process.env.RPG_010C1_CASES = '1';
if (process.argv.includes('--history-only'))
  process.env.RPG_010C1_HISTORY_ONLY = '1';
await import('./rpg-dev-010b-postgres.mjs');
