import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { offlinePostgres } from '../../../../tests/fixtures/offline-authority-postgres';

// Optional private snapshot of the function/ACL, never Auth or player credentials.
// No hosted writes: replay the exact captured definition in a disposable DB.
const db = offlinePostgres();
describe.runIf(
  process.env.RPG_LOCAL_PG === '1' && !!process.env.RPG_RECOVERY_SNAPSHOT,
)('FIX-PROD-005 exact hosted function recovery offline', () => {
  beforeAll(async () => {
    await db.start();
    db.apply('consolidation004-expand0078.sql');
    db.apply('consolidation004-authority.sql');
    // Cover a Windows Git checkout: dollar-quoted baseline guards must match
    // regardless of whether this migration arrives with CRLF or LF.
    const sql = readFileSync(
      'supabase/migrations/20261024025957_fix_prod_005_tower_settlement.sql',
      'utf8',
    ).replaceAll(/\r?\n/g, '\r\n');
    db.query(`BEGIN;${sql}\nCOMMIT;`);
  }, 120000);
  afterAll(() => db.stop(), 30000);
  it('restores the captured test-project function exactly without removing ledgers', () => {
    const snapshot = JSON.parse(
      readFileSync(process.env.RPG_RECOVERY_SNAPSHOT!, 'utf8'),
    );
    expect(snapshot.project).toBe('wkdvdzfkbwvhyjmamrsg');
    expect(snapshot.policies_absent && snapshot.claims_absent).toBe(true);
    const before = db.query(
      `SELECT pg_get_functiondef('public.arena_authority_v3(uuid,uuid,text,jsonb)'::regprocedure)`,
    );
    const restored = db.query(`BEGIN;${snapshot.function_definition};
      SELECT pg_get_functiondef('public.arena_authority_v3(uuid,uuid,text,jsonb)'::regprocedure);ROLLBACK;`);
    expect(restored.replaceAll('\r', '')).toBe(
      snapshot.function_definition.trim().replaceAll('\r', ''),
    );
    expect(
      db.query(
        `SELECT pg_get_functiondef('public.arena_authority_v3(uuid,uuid,text,jsonb)'::regprocedure)`,
      ),
    ).toBe(before);
    expect(
      db.query(`SELECT (SELECT count(*) FROM economy_private.tower_reward_claims)=0
      AND (SELECT NOT enabled FROM economy_private.tower_reward_policies)`),
    ).toBe('t');
    expect(
      db.query(
        `SELECT proacl::text FROM pg_proc WHERE oid='public.arena_authority_v3(uuid,uuid,text,jsonb)'::regprocedure`,
      ),
    ).toBe(snapshot.function_acl);
  }, 120000);
});
