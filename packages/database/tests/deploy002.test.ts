import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  offlinePostgres,
  uid,
  tid,
} from '../../../tests/fixtures/offline-authority-postgres';
import {
  recipe,
  migrationPayload,
  sourceSql,
  TARGET,
  SOURCE_SHA,
} from '../deployments/deploy002/recipe.mjs';

const steps = recipe();
const db = offlinePostgres({
  beforeMigrations(query) {
    // Reproduce the target's postgres-owned public defaults before hardening.
    query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon,authenticated,service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated,service_role;
      GRANT USAGE ON SCHEMA public TO PUBLIC,anon,authenticated,service_role;`);
    query(`BEGIN;${steps[0].payload}\nCOMMIT;`);
  },
  transformMigration: migrationPayload,
});

it('pins only the isolated target and verifies fifteen historical hashes plus generated guard/release payloads', () => {
  expect(TARGET).toBe('wkdvdzfkbwvhyjmamrsg');
  expect(SOURCE_SHA).toBe('cb66b6c4b87645cf5911a86b8b99943cc2d1664b');
  expect(steps).toHaveLength(17);
  expect(new Set(steps.map((s) => s.name)).size).toBe(17);
  expect(steps.map((s) => s.source).filter((s) => /0010/.test(s))).toEqual([]);
  for (const step of steps.slice(1, -1)) {
    expect(step.payload).not.toMatch(/^BEGIN;\s*$/m);
    expect(step.payload).not.toMatch(/^COMMIT;\s*$/m);
    expect(step.payload.trimEnd()).toMatch(
      /REVOKE USAGE ON SCHEMA public FROM PUBLIC, anon, authenticated;$/,
    );
  }
  const lock = JSON.parse(
    readFileSync(
      'packages/database/reviewed/consolidation-004.lock.json',
      'utf8',
    ),
  );
  expect(steps.at(-2)?.sourceSha256).toBe(lock.steps[1].sha256);
});

describe.runIf(process.env.RPG_LOCAL_PG === '1')(
  'DEPLOY002 exact installation under managed defaults',
  () => {
    beforeAll(async () => {
      await db.start();
    }, 120000);
    afterAll(() => db.stop(), 30000);

    it('keeps public inaccessible after baseline and both economy stages; source grant cannot reopen it', () => {
      expect(
        db.query(
          "SELECT has_schema_privilege('authenticated','public','USAGE')",
        ),
      ).toBe('f');
      expect(() => db.as(1, 'SELECT * FROM public.travelers')).toThrow(
        /permission denied for schema public/,
      );
      for (const step of steps.slice(14, -1)) {
        db.query(`BEGIN;${step.payload}\nCOMMIT;`);
        expect(
          db.query(
            "SELECT has_schema_privilege('anon','public','USAGE') OR has_schema_privilege('authenticated','public','USAGE')",
          ),
        ).toBe('f');
      }
      expect(db.query('SELECT public.economy_protocol_version()')).toBe('3');
      expect(
        db.query('SELECT count(*) FROM economy_private.card_catalog'),
      ).toBe('0');
    });

    it('rolls back a failed release and keeps the quarantine; journal is never fabricated', () => {
      expect(() =>
        db.query(
          `BEGIN;CREATE TABLE public.deploy002_rollback_probe(id integer);SELECT 1/0;COMMIT;`,
        ),
      ).toThrow();
      expect(
        db.query(
          "SELECT to_regclass('public.deploy002_rollback_probe') IS NULL",
        ),
      ).toBe('t');
      expect(
        db.query(
          "SELECT has_schema_privilege('authenticated','public','USAGE')",
        ),
      ).toBe('f');
      // Proof that a security gate failure prevents the release transaction.
      expect(() =>
        db.query(
          `BEGIN;GRANT UPDATE ON public.wallets TO authenticated;${steps.at(-1)!.payload}\nCOMMIT;`,
        ),
      ).toThrow(/Unexpected economic/);
      expect(
        db.query(
          "SELECT has_schema_privilege('authenticated','public','USAGE')",
        ),
      ).toBe('f');
    });

    it('releases only hardened ACLs, preserves fixed new-Traveler allocation and denies client economic writes', () => {
      db.query(`BEGIN;${steps.at(-1)!.payload}\nCOMMIT;`);
      expect(
        db.query(
          "SELECT has_schema_privilege('authenticated','public','USAGE')",
        ),
      ).toBe('t');
      db.create(51);
      db.create(52);
      expect(
        db.query(
          `SELECT economic_verified_at IS NOT NULL FROM public.travelers WHERE id='${tid(51)}'`,
        ),
      ).toBe('t');
      expect(
        db.as(
          51,
          `SELECT count(*) FROM public.travelers WHERE id='${tid(52)}'`,
        ),
      ).toBe('0');
      for (const sql of [
        `UPDATE public.wallets SET coins=999 WHERE traveler_id='${tid(51)}'`,
        `UPDATE public.travelers SET xp=999 WHERE id='${tid(51)}'`,
        `INSERT INTO public.inventory(traveler_id,item_id,quantity) VALUES('${tid(51)}','fake',1)`,
        `SELECT public.add_coins('${tid(51)}',999)`,
        `SELECT public.grant_traveler_chest('${tid(51)}','common','fake','fake')`,
        `SELECT public.arena_authority_v3('${uid(51)}','${tid(51)}','starter','{}')`,
      ])
        expect(() => db.as(51, sql)).toThrow(/permission denied/);
      expect(() =>
        db.query(
          `BEGIN;SET LOCAL ROLE anon;SELECT * FROM public.wallets;COMMIT;`,
        ),
      ).toThrow(/permission denied/);
      expect(() =>
        db.as(51, `SELECT public.complete_story('${tid(51)}','creation')`),
      ).toThrow(/dependencies pending/);
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE traveler_id='${tid(51)}'`,
        ),
      ).toBe('0');
      expect(sourceSql(steps[1].source)).toContain('CREATE TABLE');
    });
  },
);
