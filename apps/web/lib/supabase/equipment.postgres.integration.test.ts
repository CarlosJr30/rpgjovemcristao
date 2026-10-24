import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  offlinePostgres,
  tid,
  uid,
} from '../../../../tests/fixtures/offline-authority-postgres';
import { EQUIPMENT_CATALOG } from '../../features/journey/data/equipmentCatalog';
const db = offlinePostgres();
const equipment = (
  n: number,
  item: string | null,
  expected: string | null,
  slot = 'boots',
) =>
  `SELECT public.set_owned_equipment('${tid(n)}','${slot}',${item === null ? 'NULL' : `'${item}'`},${expected === null ? 'NULL' : `'${expected}'`})`;
const invariant = () =>
  db.query(
    `SELECT jsonb_build_object('inventory',(select jsonb_agg(i order by id) from public.inventory i),'travelers',(select jsonb_agg(t order by id) from public.travelers t),'stats',(select jsonb_agg(s order by traveler_id) from public.traveler_stats s),'wallets',(select jsonb_agg(w order by traveler_id) from public.wallets w),'receipts',(select jsonb_agg(r order by id) from public.chest_operations r))`,
  );
describe.runIf(process.env.RPG_LOCAL_PG === '1')(
  'FIX-PROD-002 equipment PostgreSQL/RLS',
  () => {
    beforeAll(async () => {
      await db.start();
      db.apply('consolidation004-expand0078.sql');
      db.apply('consolidation004-authority.sql');
      expect(
        db.query(
          "select to_regprocedure('public.set_owned_equipment(uuid,text,text,text)') is null",
        ),
      ).toBe('t');
      db.query(
        `BEGIN;${readFileSync('packages/database/proposals/fix-prod-002-equipment.sql', 'utf8')}COMMIT;`,
      );
      for (let n = 1; n <= 5; n++) db.create(n);
      db.query(
        `UPDATE public.travelers SET economic_verified_at=NULL WHERE id='${tid(1)}';UPDATE auth.users SET is_anonymous=true WHERE id='${uid(3)}';`,
      );
    }, 60000);
    afterAll(() => db.stop(), 30000);
    it('keeps all table ACLs and RLS; anonymous/service cannot execute the new endpoint', () => {
      expect(
        db.query(
          "select has_function_privilege('anon','public.set_owned_equipment(uuid,text,text,text)','EXECUTE'),has_function_privilege('service_role','public.set_owned_equipment(uuid,text,text,text)','EXECUTE'),has_table_privilege('authenticated','public.equipped_items','UPDATE'),(select relrowsecurity from pg_class where oid='public.equipped_items'::regclass)",
        ),
      ).toBe('f|f|f|t');
      expect(() =>
        db.query(`SET ROLE anon;${equipment(1, null, 'traveler-boots')}`),
      ).toThrow(/permission denied/);
      expect(() =>
        db.query(
          `SET ROLE authenticated;${equipment(1, null, 'traveler-boots')}`,
        ),
      ).toThrow(/Account denied/);
    });
    it('allows only the owned legacy item selection and preserves inventory, quantities, XP, stats, money and reconciliation', () => {
      const before = invariant();
      expect(
        JSON.parse(db.as(1, equipment(1, null, 'traveler-boots'))),
      ).toEqual({});
      expect(
        JSON.parse(db.as(1, equipment(1, 'traveler-boots', null))),
      ).toEqual({ boots: 'traveler-boots' });
      expect(invariant()).toBe(before);
      expect(
        db.query(
          `select economic_verified_at is null from public.travelers where id='${tid(1)}'`,
        ),
      ).toBe('t');
      expect(() =>
        db.query(
          `SET ROLE service_role;${db.rpcSql(uid(1), tid(1), 'start', {})}`,
        ),
      ).toThrow(/reconciliation/);
    });
    it('retries equip/unequip without duplicating, losing or consuming items', () => {
      const before = invariant();
      db.as(1, equipment(1, null, 'traveler-boots'));
      db.as(1, equipment(1, null, 'traveler-boots'));
      db.as(1, equipment(1, 'traveler-boots', null));
      db.as(1, equipment(1, 'traveler-boots', null));
      expect(invariant()).toBe(before);
      expect(
        db.query(
          `select count(*) from public.equipped_items where traveler_id='${tid(1)}' and slot='boots'`,
        ),
      ).toBe('1');
    });
    it('denies foreign Traveler and anonymous Auth users', () => {
      expect(() => db.as(2, equipment(1, null, 'traveler-boots'))).toThrow(
        /Ownership denied/,
      );
      expect(() => db.as(3, equipment(3, null, 'traveler-boots'))).toThrow(
        /Account denied/,
      );
    });
    it('denies fake, unowned and wrong-slot items without mutating any data', () => {
      const before = invariant();
      for (const [item, slot] of [
        ['fake', 'boots'],
        ['traveler-boots', 'weapon'],
        ['traveler-sword-common', 'weapon'],
      ])
        expect(() => db.as(1, equipment(1, item, null, slot))).toThrow(
          /denied/,
        );
      expect(() => db.as(1, equipment(1, null, null, 'admin'))).toThrow(
        /Invalid slot/,
      );
      expect(invariant()).toBe(before);
    });
    it('covers exactly the existing equipment catalog and server-derived slot mapping', () => {
      const before = invariant();
      for (const item of EQUIPMENT_CATALOG) {
        db.query(
          `INSERT INTO public.inventory(traveler_id,item_id,quantity) VALUES('${tid(4)}','${item.id}',2) ON CONFLICT(traveler_id,item_id) DO NOTHING;`,
        );
        const prior = item.slot === 'boots' ? 'traveler-boots' : null;
        db.as(4, equipment(4, item.id, prior, item.slot));
      }
      expect(
        db.query(
          `select count(*) from public.equipped_items where traveler_id='${tid(4)}'`,
        ),
      ).toBe('6');
      expect(
        db.query(
          `select min(quantity)>0 from public.inventory where traveler_id='${tid(4)}'`,
        ),
      ).toBe('t');
      expect(invariant()).not.toBe(before); // Only this synthetic fixture setup inserts inventory.
    });
    it('rejects stale tabs and rolls back an interrupted selection', () => {
      expect(() => db.as(1, equipment(1, null, 'stale-id'))).toThrow(
        /Equipment changed/,
      );
      db.query(
        `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${uid(1)}';${equipment(1, null, 'traveler-boots')};ROLLBACK;`,
      );
      expect(
        db.query(
          `select item_id from public.equipped_items where traveler_id='${tid(1)}' and slot='boots'`,
        ),
      ).toBe('traveler-boots');
    });
    it('serializes concurrent retries with no item loss or duplicate equipment', async () => {
      const before = invariant();
      const sql = `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${uid(5)}';${equipment(5, null, 'traveler-boots')};COMMIT;`;
      await Promise.all([db.queryAsync(sql), db.queryAsync(sql)]);
      expect(
        db.query(
          `select count(*) from public.equipped_items where traveler_id='${tid(5)}'`,
        ),
      ).toBe('0');
      expect(invariant()).toBe(before);
    });
    it('freezes selection during an active canonical battle', () => {
      db.query(
        `INSERT INTO economy_private.battles(traveler_id,seed,player,opponent,mode) VALUES('${tid(2)}',1,'{}','{}','arena-v3')`,
      );
      expect(() => db.as(2, equipment(2, null, 'traveler-boots'))).toThrow(
        /Battle in progress/,
      );
      expect(
        db.query(
          `select item_id from public.equipped_items where traveler_id='${tid(2)}'`,
        ),
      ).toBe('traveler-boots');
    });
  },
);
