import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const migration = readFileSync(
  new URL('../migrations/0000_initial_supabase_gameplay.sql', import.meta.url),
  'utf8',
);
const rollback = readFileSync(
  new URL(
    '../migrations/0000_initial_supabase_gameplay.down.sql',
    import.meta.url,
  ),
  'utf8',
);

describe('initial Supabase migration', () => {
  test('enables RLS and defines ownership policies for all six tables', () => {
    for (const table of [
      'profiles',
      'travelers',
      'traveler_stats',
      'wallets',
      'inventory',
      'equipped_items',
    ]) {
      expect(migration).toContain(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`,
      );
      expect(migration).toContain(`ON "${table}" AS PERMISSIVE`);
    }
  });

  test('keeps privileged access out of client-callable functions', () => {
    expect(migration).not.toContain('SECURITY DEFINER');
    expect(migration.match(/SECURITY INVOKER/g)?.length).toBe(5);
    expect(migration).toContain('FROM PUBLIC, "anon"');
  });

  test('provides a rollback for every gameplay table', () => {
    for (const table of [
      'profiles',
      'travelers',
      'traveler_stats',
      'wallets',
      'inventory',
      'equipped_items',
    ]) {
      expect(rollback).toContain(`DROP TABLE IF EXISTS public.${table}`);
    }
  });
});
