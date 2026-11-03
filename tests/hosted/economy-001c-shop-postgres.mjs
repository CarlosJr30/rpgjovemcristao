// Only the new QA shop cases; approved community chest cases are not repeated.
process.env.RPG_ECONOMY_001B_CASES = '1';
process.env.RPG_ECONOMY_001C_CASES = '1';
process.env.RPG_ECONOMY_001C_SHOP_CASES = '1';
await import('./rpg-dev-010b-postgres.mjs');
