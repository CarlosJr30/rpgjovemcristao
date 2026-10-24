import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getArenaCardCatalog, resolveArenaCommand } from '@rpg/game-engine';
import {
  offlinePostgres,
  literal,
  tid,
  uid,
} from '../../../../tests/fixtures/offline-authority-postgres';
import { executeAuthority, type BattleView } from './service';

// Disposable, network-disabled PostgreSQL only. These synthetic actors/catalog
// approvals do NOT prove legitimate hosted clears or homologate real credits.
const db = offlinePostgres();
const cards = getArenaCardCatalog().map((card, i) => ({
  ...card,
  id: `005-offline-card-${i}`,
}));
const ids = cards.map((c) => c.id);
const execute = <T>(n: number, body: object) =>
  executeAuthority({ authenticate: async () => null, call: db.rpc }, uid(n), {
    travelerId: tid(n),
    ...body,
  }) as Promise<T>;
const start = (n: number, floor: number) =>
  execute<BattleView>(n, {
    operation: 'start',
    requestId: randomUUID(),
    mode: 'tower-v3',
    opponentId: null,
    floor,
    ids,
  });
const commandBody = (b: BattleView) => ({
  operation: 'command',
  battleId: b.state.id,
  revision: b.revision,
  round: b.state.round,
  commandId: randomUUID(),
  action: 'attack',
});
const command = (n: number, b: BattleView) =>
  execute<BattleView>(n, commandBody(b));
async function finish(n: number, b: BattleView) {
  for (let turn = 0; turn < 40 && b.state.status === 'in_progress'; turn++)
    b = await command(n, b);
  expect(b.state.status).toBe('finished');
  return b;
}
async function beforeFinal(n: number, floor: number) {
  let b = await start(n, floor);
  for (let turn = 0; turn < 40; turn++) {
    if (
      resolveArenaCommand(b.state, b.state.id, b.state.round, 'attack')
        .status === 'finished'
    )
      return b;
    b = await command(n, b);
  }
  throw Error('Offline battle did not reach final attack');
}
const balance = (n: number) =>
  JSON.parse(
    db.query(`SELECT jsonb_build_object('xp',t.xp,'coins',w.coins,
      'claims',(SELECT count(*) FROM economy_private.tower_reward_claims WHERE traveler_id=t.id),
      'epic',coalesce((SELECT quantity FROM public.traveler_chests WHERE traveler_id=t.id AND chest_type='epic'),0))
      FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id WHERE t.id='${tid(n)}'`),
  );

describe.runIf(process.env.RPG_LOCAL_PG === '1')(
  'FIX-PROD-005 transactional Tower in disposable PostgreSQL',
  () => {
    beforeAll(async () => {
      await db.start();
      db.apply('consolidation004-expand0078.sql');
      db.apply('consolidation004-authority.sql');
      const originalDefinition = db.query(
        `SELECT pg_get_functiondef('public.arena_authority_v3(uuid,uuid,text,jsonb)'::regprocedure)`,
      );
      const sql = readFileSync(
        'supabase/migrations/20261024025957_fix_prod_005_tower_settlement.sql',
        'utf8',
      );
      db.query(`BEGIN;${sql}\nCOMMIT;`);
      // Rehearse the non-destructive recovery: restore only the old function,
      // preserve ledger tables, verify the definition, then roll the drill back.
      const recovered = db.query(`BEGIN;${originalDefinition};
        SELECT pg_get_functiondef('public.arena_authority_v3(uuid,uuid,text,jsonb)'::regprocedure);ROLLBACK;`);
      expect(recovered.replaceAll('\r', '')).toBe(
        originalDefinition.replaceAll('\r', ''),
      );
      for (const c of cards)
        db.query(`INSERT INTO economy_private.card_catalog(version,id,definition,approval_ref,starter)
          VALUES('005-offline-only','${c.id}',${literal(c)},'offline-fixture-only',true)`);
      for (let n = 1; n <= 8; n++) {
        db.create(n);
        await execute(n, { operation: 'starter' });
      }
      // Trusted fixtures, never an SQL migration or a hosted data operation.
      db.query(`UPDATE public.traveler_stats SET base_life=80,base_strength=50,base_defense=8,base_wisdom=3;
        UPDATE public.traveler_stats SET base_life=1,base_strength=0,base_defense=0,base_wisdom=0 WHERE traveler_id='${tid(3)}';`);
    }, 120000);
    afterAll(() => db.stop(), 30000);

    it('default policy blocks a canonical victory and preserves balances', async () => {
      const before = balance(1);
      const b = await finish(1, await start(1, 1));
      expect(b.reward).toMatchObject({
        outcome: 'victory',
        rewarded: false,
        xp: 0,
        coins: 0,
        epicChests: 0,
        status: 'blocked',
      });
      expect(balance(1)).toEqual(before);
      expect(await execute(1, { operation: 'tower' })).toMatchObject({
        nextFloor: 2,
      });
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE id=(SELECT receipt_id FROM economy_private.battles WHERE id='${b.state.id}') AND account_id='${uid(1)}' AND operation_type='tower-result'`,
        ),
      ).toBe('1');
    }, 120000);

    it('only an offline administrator can approve; no retrospective payment', async () => {
      for (const role of ['anon', 'authenticated', 'service_role']) {
        expect(() =>
          db.query(
            `BEGIN;SET LOCAL ROLE ${role};UPDATE economy_private.tower_reward_policies SET enabled=true;COMMIT;`,
          ),
        ).toThrow(/permission denied/);
        expect(() =>
          db.query(
            `BEGIN;SET LOCAL ROLE ${role};SELECT economy_private.settle_tower_battle('${uid(1)}','${tid(1)}',gen_random_uuid());COMMIT;`,
          ),
        ).toThrow(/permission denied/);
      }
      // Homologation simulation ONLY inside this isolated test container.
      db.query(`UPDATE economy_private.tower_reward_policies SET enabled=true,
        catalog_version='005-offline-only',approved_at=now(),approval_ref='offline-simulation-not-homologation';`);
      const before = balance(1);
      const old = await execute<BattleView>(1, {
        operation: 'resume',
        mode: 'tower-v3',
      });
      await expect(command(1, old)).rejects.toMatchObject({ status: 409 });
      expect(balance(1)).toEqual(before);
    }, 120000);

    it('settles seven engine-derived victories, champion and exactly 430/215/one closed epic', async () => {
      const xp = [20, 30, 40, 50, 60, 80, 150];
      const coins = [10, 15, 20, 25, 30, 40, 75];
      let totalXp = 0,
        totalCoins = 0;
      for (let floor = 1; floor <= 7; floor++) {
        expect(await execute(2, { operation: 'tower' })).toMatchObject({
          nextFloor: floor,
        });
        if (floor < 7)
          await expect(start(2, floor + 1)).rejects.toThrow(/order denied/);
        let b: BattleView;
        if (floor === 7) {
          const final = await beforeFinal(2, floor);
          // Exercise the real chest capacity constraint during champion payout.
          // This inventory exists only in the disposable offline fixture.
          db.query(`INSERT INTO public.traveler_chests(traveler_id,chest_type,quantity,sources)
            SELECT '${tid(2)}','epic',9999,jsonb_agg('offline-capacity-fixture'::text) FROM generate_series(1,9999)`);
          const beforeFailure = balance(2);
          await expect(command(2, final)).rejects.toThrow(/check constraint/);
          expect(balance(2)).toEqual(beforeFailure);
          expect(
            await execute(2, { operation: 'resume', mode: 'tower-v3' }),
          ).toEqual(final);
          expect(
            db.query(
              `SELECT count(*) FROM public.chest_operations WHERE operation_key='battle:${final.state.id}'`,
            ),
          ).toBe('0');
          db.query(
            `DELETE FROM public.traveler_chests WHERE traveler_id='${tid(2)}' AND chest_type='epic'`,
          );
          b = await command(2, final);
        } else {
          b = await finish(2, await start(2, floor));
        }
        expect(b.reward).toMatchObject({
          outcome: 'victory',
          rewarded: true,
          xp: xp[floor - 1],
          coins: coins[floor - 1],
          epicChests: floor === 7 ? 1 : 0,
          status: 'confirmed',
        });
        totalXp += xp[floor - 1];
        totalCoins += coins[floor - 1];
        expect(balance(2)).toEqual({
          xp: totalXp,
          coins: totalCoins,
          claims: floor,
          epic: floor === 7 ? 1 : 0,
        });
        const resumed = await execute<BattleView>(2, {
          operation: 'resume',
          mode: 'tower-v3',
        });
        expect(resumed).toEqual(b);
        await expect(command(2, b)).rejects.toMatchObject({ status: 409 });
        await expect(start(2, floor)).rejects.toThrow(/order denied/);
      }
      expect(await execute(2, { operation: 'tower' })).toMatchObject({
        nextFloor: 8,
      });
      expect(balance(2)).toEqual({ xp: 430, coins: 215, claims: 7, epic: 1 });
      expect(
        db.query(`SELECT count(*) FROM economy_private.tower_reward_claims c
          JOIN public.chest_operations r ON r.id=c.receipt_id AND r.account_id=c.account_id
          JOIN economy_private.battles b ON b.id=c.battle_id AND b.receipt_id=r.id
          WHERE c.traveler_id='${tid(2)}' AND c.account_id='${uid(2)}' AND b.reward=r.rewards`),
      ).toBe('7');
      expect(
        db.query(
          `SELECT sources->>0 LIKE 'tower-receipt:%' FROM public.traveler_chests WHERE traveler_id='${tid(2)}' AND chest_type='epic'`,
        ),
      ).toBe('t');
    }, 120000);

    it('defeat grants nothing and leaves the same floor unlocked', async () => {
      const before = balance(3);
      const b = await finish(3, await start(3, 1));
      expect(b.reward).toMatchObject({
        outcome: 'defeat',
        reason: 'defeat',
        rewarded: false,
        xp: 0,
        coins: 0,
        epicChests: 0,
      });
      expect(balance(3)).toEqual(before);
      expect(await execute(3, { operation: 'tower' })).toMatchObject({
        nextFloor: 1,
      });
    }, 120000);

    it('concurrent terminal commands issue one receipt, claim and payout', async () => {
      const b = await beforeFinal(4, 1);
      const body = commandBody(b);
      const replies = await Promise.allSettled([
        execute(4, body),
        execute(4, body),
      ]);
      expect(replies.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(replies.filter((r) => r.status === 'rejected')).toHaveLength(1);
      expect(balance(4)).toEqual({ xp: 20, coins: 10, claims: 1, epic: 0 });
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE operation_key='battle:${b.state.id}'`,
        ),
      ).toBe('1');
    }, 120000);

    it('missing wallet rolls back final command, XP, receipt, claim and progress', async () => {
      const b = await beforeFinal(5, 1);
      db.query(`DELETE FROM public.wallets WHERE traveler_id='${tid(5)}'`);
      await expect(command(5, b)).rejects.toThrow(/Wallet missing/);
      const resumed = await execute<BattleView>(5, {
        operation: 'resume',
        mode: 'tower-v3',
      });
      expect(resumed).toEqual(b);
      expect(
        db.query(`SELECT xp FROM public.travelers WHERE id='${tid(5)}'`),
      ).toBe('0');
      expect(
        db.query(
          `SELECT count(*) FROM economy_private.tower_reward_claims WHERE traveler_id='${tid(5)}'`,
        ),
      ).toBe('0');
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE operation_key='battle:${b.state.id}'`,
        ),
      ).toBe('0');
      db.query(
        `INSERT INTO public.wallets(traveler_id,coins) VALUES('${tid(5)}',0)`,
      );
      await command(5, b);
      expect(balance(5)).toEqual({ xp: 20, coins: 10, claims: 1, epic: 0 });
    }, 120000);

    it('unapproved catalog binding or in-flight preapproval battle cannot pay', async () => {
      const b = await start(6, 1);
      db.query(
        `UPDATE economy_private.tower_reward_policies SET approved_at=now()`,
      );
      const finished = await finish(6, b);
      expect(finished.reward).toMatchObject({
        rewarded: false,
        xp: 0,
        coins: 0,
      });
      db.query(
        `UPDATE economy_private.tower_reward_policies SET catalog_version='different-catalog'`,
      );
      const other = await finish(7, await start(7, 1));
      expect(other.reward).toMatchObject({ rewarded: false, xp: 0, coins: 0 });
      expect(balance(6)).toEqual({ xp: 0, coins: 0, claims: 0, epic: 0 });
      expect(balance(7)).toEqual({ xp: 0, coins: 0, claims: 0, epic: 0 });
    }, 120000);

    it('preserves Arena settlement and isolates another account from Tower receipts', async () => {
      const before = balance(8);
      const b = await finish(
        8,
        await execute<BattleView>(8, {
          operation: 'start',
          requestId: randomUUID(),
          mode: 'arena-v3',
          opponentId: 'training-apprentice',
          floor: null,
          ids,
        }),
      );
      expect(b.reward).toMatchObject({
        rewarded: true,
        xp: 8,
        coins: 3,
        outcome: 'victory',
      });
      expect(balance(8)).toEqual({ ...before, xp: 8, coins: 3 });
      const tower = await execute<BattleView>(2, {
        operation: 'resume',
        mode: 'tower-v3',
      });
      await expect(
        execute(8, { operation: 'battle', battleId: tower.state.id }),
      ).rejects.toThrow(/ownership denied/);
      expect(
        db.as(
          8,
          `SELECT count(*) FROM public.chest_operations WHERE id='${tower.receiptId}'`,
        ),
      ).toBe('0');
      expect(balance(2)).toEqual({ xp: 430, coins: 215, claims: 7, epic: 1 });
    }, 120000);
  },
);
