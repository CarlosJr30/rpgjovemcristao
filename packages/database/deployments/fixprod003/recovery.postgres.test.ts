import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import {
  offlinePostgres,
  literal,
} from '../../../../tests/fixtures/offline-authority-postgres';
const db = offlinePostgres();
const equipment = () =>
  readFileSync(
    'supabase/migrations/20261024001624_fix_prod_003_owned_equipment.sql',
    'utf8',
  );
const catalog = () =>
  readFileSync(
    'supabase/migrations/20261024001803_fix_prod_003_test_catalog.sql',
    'utf8',
  );
describe.runIf(process.env.RPG_LOCAL_PG === '1')(
  'FIX-PROD-003 targeted test recovery',
  () => {
    let before: Record<string, unknown>;
    beforeAll(async () => {
      before = JSON.parse(
        readFileSync('build/fix-prod-003/test-before.json', 'utf8'),
      );
      await db.start();
      db.apply('consolidation004-expand0078.sql');
      db.apply('consolidation004-authority.sql');
      const identities = before.auth_identities as {
        id: string;
        anonymous: boolean;
      }[];
      for (const user of identities)
        db.query(
          `INSERT INTO auth.users(id,is_anonymous) VALUES('${user.id}',${user.anonymous});`,
        );
      // Only the private, no-network disposable clone is changed during recovery.
      const data = before.data as Record<string, unknown[]>;
      db.query(
        `DELETE FROM public.story_definitions;INSERT INTO public.story_definitions SELECT * FROM jsonb_populate_recordset(NULL::public.story_definitions,${literal(data['public.story_definitions'])});`,
      );
    }, 120000);
    afterAll(() => db.stop(), 30000);
    it('restores all 35 captured application tables and verifies frozen function definitions', () => {
      for (const [table, rows] of Object.entries(
        before.data as Record<string, unknown[]>,
      )) {
        expect(/^(public|economy_private)\.[a-z_]+$/.test(table)).toBe(true);
        expect(
          JSON.parse(
            db.query(
              `SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]') FROM ${table} t`,
            ),
          ),
        ).toEqual(rows);
      }
      type Definition = {
        schema: string;
        name: string;
        args: string;
        definition: string;
      };
      const functions = JSON.parse(
        db.query(
          `SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid))) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','economy_private')`,
        ),
      ) as Definition[];
      expect(functions).toHaveLength((before.functions as Definition[]).length);
      for (const f of before.functions as Definition[]) {
        const actual = functions.find(
          (a) =>
            a.schema === f.schema && a.name === f.name && a.args === f.args,
        );
        expect(actual?.definition.replaceAll('\r', '').trim()).toBe(
          f.definition.replaceAll('\r', '').trim(),
        );
      }
    }, 120000);
    it('rolls back the equipment DDL atomically before the first hosted change', () => {
      db.query(`BEGIN;${equipment()}ROLLBACK;`);
      expect(
        db.query(
          "SELECT to_regprocedure('public.set_owned_equipment(uuid,text,text,text)') IS NULL",
        ),
      ).toBe('t');
    });
    it('rejects test-catalog deployment without a verified test target', () => {
      expect(() => db.query(`BEGIN;${catalog()}COMMIT;`)).toThrow(
        /Verified TEST target required/,
      );
      expect(
        db.query('SELECT count(*) FROM economy_private.card_catalog'),
      ).toBe('0');
    });
    it('applies the two reviewed increments without granting inventory or economic value', () => {
      db.query(
        `BEGIN;${equipment()}SET LOCAL fixprod003.target_project='wkdvdzfkbwvhyjmamrsg';${catalog()}COMMIT;`,
      );
      expect(
        db.query(
          "SELECT count(*),count(DISTINCT definition->>'action') FROM economy_private.card_catalog",
        ),
      ).toBe('7|7');
      expect(db.query('SELECT count(*) FROM public.inventory')).toBe('0');
      expect(db.query('SELECT count(*) FROM public.chest_operations')).toBe(
        '0',
      );
      expect(
        db.query(
          "SELECT has_function_privilege('anon','public.set_owned_equipment(uuid,text,text,text)','EXECUTE'),has_table_privilege('authenticated','economy_private.card_catalog','INSERT')",
        ),
      ).toBe('f|f');
    });
  },
);
