import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  offlinePostgres,
  tid,
  uid,
} from '../../../tests/fixtures/offline-authority-postgres';

const migration = readFileSync(
  'supabase/migrations/20261026122539_rpg_dev_006_owned_equipment.sql',
  'utf8',
);
const release = readFileSync(
  'supabase/migrations/20261024151503_release_ebd_001_isolation.sql',
  'utf8',
);
const owned = readFileSync(
  'supabase/migrations/20261024001624_fix_prod_003_owned_equipment.sql',
  'utf8',
);
// Exercise both real deployment shapes: absent PROD endpoint and prepared TEST.
describe.runIf(process.env.RPG_LOCAL_PG === '1').each([false, true])(
  'RPG-DEV-006 release (prepared endpoint: %s)',
  (prepared) => {
    const db = offlinePostgres();
    const command = (
      n: number,
      item: string | null,
      prior: string | null,
      slot = 'boots',
    ) =>
      `SELECT public.set_owned_equipment('${tid(n)}','${slot}',${item === null ? 'NULL' : `'${item}'`},${prior === null ? 'NULL' : `'${prior}'`})`;
    const invariants = () =>
      db.query(
        `SELECT jsonb_build_object('inventory',(select jsonb_agg(x order by id) from public.inventory x),'wallets',(select jsonb_agg(x order by traveler_id) from public.wallets x),'travelers',(select jsonb_agg(x order by id) from public.travelers x),'stats',(select jsonb_agg(x order by traveler_id) from public.traveler_stats x))`,
      );
    let baseline = '';
    beforeAll(async () => {
      await db.start();
      db.apply('consolidation004-expand0078.sql');
      db.apply('consolidation004-authority.sql');
      for (let n = 1; n <= 3; n++) db.create(n);
      if (prepared)
        db.query(`BEGIN;${owned.replaceAll("'40001'", "'PT409'")}COMMIT;`);
      db.query(`BEGIN;${release}COMMIT;`);
      baseline = invariants();
      expect(
        db.query(
          "select has_function_privilege('authenticated','public.create_traveler(uuid,text,text,text,text,text,text)','EXECUTE')",
        ),
      ).toBe('t');
      db.query(`BEGIN;${migration}COMMIT;`);
      expect(invariants()).toBe(baseline);
    }, 120000);
    afterAll(() => db.stop(), 30000);
    it('opens only owned equipment and preserves all economic and direct-write denials', () => {
      expect(
        db.query(
          "select public.release_scope(),has_function_privilege('authenticated','public.set_owned_equipment(uuid,text,text,text)','EXECUTE'),has_function_privilege('anon','public.set_owned_equipment(uuid,text,text,text)','EXECUTE'),has_function_privilege('service_role','public.set_owned_equipment(uuid,text,text,text)','EXECUTE')",
        ),
      ).toBe('hero-equipment-006|t|f|f');
      for (const sql of [
        `UPDATE public.equipped_items SET item_id='forged' WHERE traveler_id='${tid(1)}'`,
        `UPDATE public.inventory SET quantity=2 WHERE traveler_id='${tid(1)}'`,
        `UPDATE public.wallets SET coins=coins+6 WHERE traveler_id='${tid(1)}'`,
        `UPDATE public.travelers SET xp=xp+16 WHERE id='${tid(1)}'`,
        `SELECT public.open_chest('${tid(1)}','common','${uid(1)}')`,
        `SELECT public.arena_authority_v3('${uid(1)}','${tid(1)}','starter','{}')`,
      ])
        expect(() => db.as(1, sql)).toThrow();
      expect(
        db.query(
          "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','economy_private') and c.relkind='r' and not c.relrowsecurity",
        ),
      ).toBe('0');
    });
    it('unequips, equips and replays without consuming items or changing progression', () => {
      expect(JSON.parse(db.as(1, command(1, null, 'traveler-boots')))).toEqual(
        {},
      );
      expect(JSON.parse(db.as(1, command(1, 'traveler-boots', null)))).toEqual({
        boots: 'traveler-boots',
      });
      db.as(1, command(1, 'traveler-boots', null));
      expect(invariants()).toBe(baseline);
    });
    it('rejects stale tabs, foreign actors, anonymous sessions and unknown variants', () => {
      expect(() => db.as(1, command(1, null, 'stale'))).toThrow(
        /Equipment changed/,
      );
      expect(() => db.as(2, command(1, null, 'traveler-boots'))).toThrow(
        /Ownership denied/,
      );
      expect(() =>
        db.query(
          `SET ROLE authenticated;${command(1, null, 'traveler-boots')}`,
        ),
      ).toThrow(/Account denied/);
      expect(() =>
        db.as(1, command(1, 'forged-boots', 'traveler-boots')),
      ).toThrow(/Equipment denied/);
      expect(() =>
        db.as(1, command(1, 'traveler-sword-common', null, 'weapon')),
      ).toThrow(/Item ownership denied/);
      expect(invariants()).toBe(baseline);
    });
    it('serializes concurrent identical requests and rolls back interrupted equipment writes', async () => {
      const sql = `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${uid(3)}';${command(3, null, 'traveler-boots')};COMMIT;`;
      await Promise.all([db.queryAsync(sql), db.queryAsync(sql)]);
      expect(
        db.query(
          `select count(*) from public.equipped_items where traveler_id='${tid(3)}'`,
        ),
      ).toBe('0');
      db.query(
        `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${uid(3)}';${command(3, 'traveler-boots', null)};ROLLBACK;`,
      );
      expect(
        db.query(
          `select count(*) from public.equipped_items where traveler_id='${tid(3)}'`,
        ),
      ).toBe('0');
      db.as(3, command(3, 'traveler-boots', null));
      expect(invariants()).toBe(baseline);
    });
    it('swaps two synthetic weapons atomically only inside this offline database', async () => {
      const before = invariants();
      const definition = db.query(
        "select pg_get_functiondef('economy_private.set_owned_equipment(uuid,text,text,text)'::regprocedure)",
      );
      const mapping = "WHEN 'traveler-sword-common' THEN 'weapon'";
      expect(definition.split(mapping)).toHaveLength(2);
      // Explicit user authorization for an isolated synthetic second sword.
      // This test-only mapping is never written to a migration or hosted DB.
      db.query(
        definition.replace(
          mapping,
          mapping + "\n   WHEN 'offline-sword-alternate' THEN 'weapon'",
        ),
      );
      db.query(
        `INSERT INTO public.inventory(traveler_id,item_id,quantity) VALUES('${tid(2)}','traveler-sword-common',1),('${tid(2)}','offline-sword-alternate',1)`,
      );
      db.as(2, command(2, 'traveler-sword-common', null, 'weapon'));
      expect(
        JSON.parse(
          db.as(
            2,
            command(
              2,
              'offline-sword-alternate',
              'traveler-sword-common',
              'weapon',
            ),
          ),
        ).weapon,
      ).toBe('offline-sword-alternate');
      db.as(
        2,
        command(
          2,
          'offline-sword-alternate',
          'traveler-sword-common',
          'weapon',
        ),
      );
      expect(
        db.query(
          `select count(*) from public.equipped_items where traveler_id='${tid(2)}' and slot='weapon'`,
        ),
      ).toBe('1');
      const run = (item: string | null) =>
        db.queryAsync(
          `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${uid(2)}';${command(2, item, 'offline-sword-alternate', 'weapon')};COMMIT;`,
        );
      const competing = await Promise.allSettled([
        run('traveler-sword-common'),
        run(null),
      ]);
      expect(competing.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(competing.filter((r) => r.status === 'rejected')).toHaveLength(1);
      expect(
        db.query(
          `select count(*)||':'||sum(quantity) from public.inventory where traveler_id='${tid(2)}' and item_id in ('traveler-sword-common','offline-sword-alternate')`,
        ),
      ).toBe('2:2');
      const selected =
        db.query(
          `select item_id from public.equipped_items where traveler_id='${tid(2)}' and slot='weapon'`,
        ) || null;
      db.as(2, command(2, null, selected, 'weapon'));
      db.query(
        `DELETE FROM public.inventory WHERE traveler_id='${tid(2)}' AND item_id IN ('traveler-sword-common','offline-sword-alternate')`,
      );
      db.query(definition);
      expect(invariants()).toBe(before);
    });
    it('recovers the previous RPC/ACL surface without restoring or modifying player data', () => {
      db.query(`BEGIN;
        DROP FUNCTION public.set_owned_equipment(uuid,text,text,text);
        DROP FUNCTION economy_private.set_owned_equipment(uuid,text,text,text);
        ${prepared ? owned.replaceAll("'40001'", "'PT409'") : ''}
        ${prepared ? 'REVOKE EXECUTE ON FUNCTION public.set_owned_equipment(uuid,text,text,text),economy_private.set_owned_equipment(uuid,text,text,text) FROM PUBLIC,anon,authenticated,service_role;' : ''}
        CREATE OR REPLACE FUNCTION public.release_scope() RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT 'guild-ebd-001'::text $$;
        COMMIT;`);
      expect(db.query('select public.release_scope()')).toBe('guild-ebd-001');
      expect(
        db.query(
          "select to_regprocedure('public.set_owned_equipment(uuid,text,text,text)') is not null",
        ),
      ).toBe(prepared ? 't' : 'f');
      expect(() => db.as(1, command(1, null, 'traveler-boots'))).toThrow();
      expect(invariants()).toBe(baseline);
    });
  },
);
