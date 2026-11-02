// Same new bridge cases against the separately generated production envelope.
process.env.ECONOMY_001A_PRODUCTION_PACKAGE='1';
await import('./economy-001a-postgres.mjs');
