import { afterAll, beforeAll, expect, it, describe } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { getArenaCardCatalog } from '@rpg/game-engine';
import {
  offlinePostgres,
  tid,
  uid,
  literal,
} from '../../../../tests/fixtures/offline-authority-postgres';
import { executeAuthority, type BattleView } from './service';

// Two disposable no-network databases, identical synthetic actors and seed.
// No copied player, forced outcome, modified progress, hosted grants or mocks.
const seed = 20261024;
const replicas = [
  offlinePostgres({ authoritySeed: seed }),
  offlinePostgres({ authoritySeed: seed }),
];
type DB = (typeof replicas)[number];
const cards = getArenaCardCatalog().map((c, i) => ({
  ...c,
  id: `006-offline-${i}`,
}));
const ids = cards.map((c) => c.id);
const rows: object[] = [];
const execute = <T>(db: DB, n: number, body: object) =>
  executeAuthority({ authenticate: async () => null, call: db.rpc }, uid(n), {
    travelerId: tid(n),
    ...body,
  }) as Promise<T>;
const start = (db: DB, n: number, floor: number) =>
  execute<BattleView>(db, n, {
    operation: 'start',
    requestId: randomUUID(),
    mode: 'tower-v3',
    opponentId: null,
    floor,
    ids,
  });
const action = (b: BattleView) => ({
  operation: 'command',
  battleId: b.state.id,
  revision: b.revision,
  round: b.state.round,
  commandId: randomUUID(),
  action: 'attack',
});
async function finish(db: DB, n: number, b: BattleView) {
  for (let i = 0; i < 40 && b.state.status === 'in_progress'; i++)
    b = await execute<BattleView>(db, n, action(b));
  expect(b.state.status).toBe('finished');
  return b;
}
const balance = (db: DB, n: number) =>
  JSON.parse(
    db.query(`SELECT jsonb_build_object(
  'xp',t.xp,'coins',w.coins,'claims',(SELECT count(*) FROM economy_private.tower_reward_claims WHERE traveler_id=t.id),
  'epic',coalesce((SELECT quantity FROM public.traveler_chests WHERE traveler_id=t.id AND chest_type='epic'),0))
  FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id WHERE t.id='${tid(n)}'`),
  );
const comparable = (b: BattleView) =>
  JSON.parse(JSON.stringify(b.state).replaceAll(b.state.id, 'battle'));

describe.runIf(process.env.RPG_LOCAL_PG === '1')(
  'FIX-PROD-006 deterministic isolated Tower',
  () => {
    beforeAll(async () => {
      for (const db of replicas) {
        await db.start();
        db.apply('consolidation004-expand0078.sql');
        db.apply('consolidation004-authority.sql');
        db.query(`BEGIN;${readFileSync('supabase/migrations/20261024001624_fix_prod_003_owned_equipment.sql', 'utf8')}
        ${readFileSync('supabase/migrations/20261024025957_fix_prod_005_tower_settlement.sql', 'utf8')}COMMIT;`);
        for (const c of cards)
          db.query(`INSERT INTO economy_private.card_catalog(version,id,definition,approval_ref,starter)
        VALUES('006-offline', '${c.id}',${literal(c)},'offline-only',true)`);
        for (const n of [2, 3, 4, 5]) {
          db.create(n);
          await execute(db, n, { operation: 'starter' });
        }
        // Endgame test template initialized only here, not a real account or save.
        db.query(`UPDATE public.travelers SET xp=245000,level=50 WHERE id IN ('${tid(2)}','${tid(4)}','${tid(5)}');
        UPDATE public.traveler_stats SET base_life=50,base_strength=50,base_defense=50,base_wisdom=50 WHERE traveler_id IN ('${tid(2)}','${tid(4)}','${tid(5)}');
        UPDATE public.traveler_stats SET base_life=1,base_strength=0,base_defense=0,base_wisdom=0 WHERE traveler_id='${tid(3)}';
        UPDATE economy_private.tower_reward_policies SET enabled=true,approved_at=now(),catalog_version='006-offline',approval_ref='offline-simulation-only';`);
      }
    }, 180000);
    afterAll(() => {
      for (const db of replicas) db.stop();
      mkdirSync('build/fix-prod-006', { recursive: true });
      writeFileSync(
        'build/fix-prod-006/deterministic-floors.json',
        JSON.stringify(
          {
            seed,
            environment: 'disposable-offline-fixture',
            productionProof: false,
            rows,
          },
          null,
          2,
        ) + '\n',
      );
    }, 60000);

    it.each([1, 2, 3, 4, 5, 6, 7])(
      'floor %s: two independent executions agree, persist and settle once',
      async (floor) => {
        const results: BattleView[] = [];
        for (const db of replicas) {
          expect(await execute(db, 2, { operation: 'tower' })).toMatchObject({
            nextFloor: floor,
          });
          if (floor < 7)
            await expect(start(db, 2, floor + 1)).rejects.toThrow(
              /order denied/,
            );
          const b = await finish(db, 2, await start(db, 2, floor));
          expect(b.state.seed).toBe(seed);
          expect(b.reward).toMatchObject({
            outcome: 'victory',
            rewarded: true,
            xp: [20, 30, 40, 50, 60, 80, 150][floor - 1],
            coins: [10, 15, 20, 25, 30, 40, 75][floor - 1],
            epicChests: floor === 7 ? 1 : 0,
          });
          expect(
            await execute(db, 2, { operation: 'resume', mode: 'tower-v3' }),
          ).toEqual(b);
          expect(await execute(db, 2, { operation: 'tower' })).toMatchObject({
            nextFloor: floor + 1,
          });
          const totals = balance(db, 2);
          await expect(execute(db, 2, action(b))).rejects.toMatchObject({
            status: 409,
          });
          await expect(start(db, 2, floor)).rejects.toThrow(/order denied/);
          expect(balance(db, 2)).toEqual(totals);
          expect(
            db.query(`SELECT count(*) FROM economy_private.tower_reward_claims c
        JOIN public.chest_operations r ON r.id=c.receipt_id JOIN economy_private.battles b ON b.id=c.battle_id
        WHERE c.traveler_id='${tid(2)}' AND c.floor=${floor} AND c.account_id='${uid(2)}'
        AND r.account_id=c.account_id AND r.rewards=b.reward AND b.receipt_id=r.id`),
          ).toBe('1');
          results.push(b);
        }
        expect(comparable(results[0])).toEqual(comparable(results[1]));
        rows.push({
          floor,
          champion: floor === 7,
          repeatedIdentical: true,
          reward: results[0].reward,
          round: results[0].state.round,
          balances: replicas.map((db) => balance(db, 2)),
        });
        if (floor === 7)
          for (const db of replicas)
            expect(balance(db, 2)).toEqual({
              xp: 245430,
              coins: 215,
              claims: 7,
              epic: 1,
            });
      },
      120000,
    );

    it('defeat and disabled homologation never issue credits or false progression', async () => {
      const db = replicas[0];
      const loss = await finish(db, 3, await start(db, 3, 1));
      expect(loss.reward).toMatchObject({
        outcome: 'defeat',
        rewarded: false,
        xp: 0,
        coins: 0,
      });
      expect(balance(db, 3)).toEqual({ xp: 0, coins: 0, claims: 0, epic: 0 });
      expect(await execute(db, 3, { operation: 'tower' })).toMatchObject({
        nextFloor: 1,
      });
      db.query(
        'UPDATE economy_private.tower_reward_policies SET enabled=false',
      );
      const win = await finish(db, 4, await start(db, 4, 1));
      expect(win.reward).toMatchObject({
        outcome: 'victory',
        rewarded: false,
        xp: 0,
        coins: 0,
        status: 'blocked',
      });
      expect(balance(db, 4)).toEqual({
        xp: 245000,
        coins: 0,
        claims: 0,
        epic: 0,
      });
      db.query('UPDATE economy_private.tower_reward_policies SET enabled=true');
    }, 120000);

    it('concurrent terminal commands can create only one credit and one receipt', async () => {
      const db = replicas[0];
      let b = await start(db, 5, 1);
      // A normal command can miss: continue until the engine actually finishes.
      for (
        let turn = 0;
        turn < 40 && b.state.status === 'in_progress';
        turn++
      ) {
        const before = b,
          body = action(b);
        const responses = await Promise.allSettled([
          execute<BattleView>(db, 5, body),
          execute<BattleView>(db, 5, body),
        ]);
        expect(responses.filter((r) => r.status === 'fulfilled')).toHaveLength(
          1,
        );
        b = responses.find((r) => r.status === 'fulfilled')!
          .value as BattleView;
        expect(b.revision).toBe(before.revision + 1);
      }
      expect(b.reward).toMatchObject({ outcome: 'victory', xp: 20, coins: 10 });
      expect(balance(db, 5)).toEqual({
        xp: 245020,
        coins: 10,
        claims: 1,
        epic: 0,
      });
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE operation_key='battle:${b.state.id}'`,
        ),
      ).toBe('1');
    }, 120000);

    it('equip, reject an unapproved swap, unequip and reconnect preserve inventory and economy', () => {
      const db = replicas[0],
        n = 2;
      // The real catalog has one helmet. An owned but unapproved fixture ID
      // must not become equipable merely because it appears in inventory.
      db.query(`INSERT INTO public.inventory(traveler_id,item_id,quantity) VALUES
      ('${tid(n)}','traveler-helmet-common',1),('${tid(n)}','traveler-helmet-rare',1)`);
      const inventory = db.query(
        `SELECT jsonb_agg(to_jsonb(i) ORDER BY item_id) FROM public.inventory i WHERE traveler_id='${tid(n)}'`,
      );
      const before = balance(db, n);
      db.as(
        n,
        `SELECT public.set_owned_equipment('${tid(n)}','helmet','traveler-helmet-rare',null)`,
      );
      expect(() =>
        db.as(
          n,
          `SELECT public.set_owned_equipment('${tid(n)}','helmet','traveler-helmet-common','traveler-helmet-rare')`,
        ),
      ).toThrow(/Equipment denied/);
      expect(
        db.as(
          n,
          `SELECT item_id FROM public.equipped_items WHERE traveler_id='${tid(n)}' AND slot='helmet'`,
        ),
      ).toBe('traveler-helmet-rare');
      db.as(
        n,
        `SELECT public.set_owned_equipment('${tid(n)}','helmet',null,'traveler-helmet-rare')`,
      );
      expect(
        db.as(
          n,
          `SELECT count(*) FROM public.equipped_items WHERE traveler_id='${tid(n)}' AND slot='helmet'`,
        ),
      ).toBe('0');
      expect(
        db.query(
          `SELECT jsonb_agg(to_jsonb(i) ORDER BY item_id) FROM public.inventory i WHERE traveler_id='${tid(n)}'`,
        ),
      ).toBe(inventory);
      expect(balance(db, n)).toEqual(before);
    }, 120000);
  },
);
