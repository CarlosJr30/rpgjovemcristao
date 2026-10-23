import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  getArenaCardCatalog,
  getApprovedArenaCards,
  resolveArenaCommand,
  type ArenaProductAction,
} from '@rpg/game-engine';
import {
  offlinePostgres,
  literal,
  uid,
  tid,
} from '../../../../tests/fixtures/offline-authority-postgres';
import {
  executeAuthority,
  handleAuthority,
  type AuthorityPort,
  type BattleView,
  type OwnedCard,
} from './service';

// Synthetic catalog approval exists ONLY in this opt-in disposable PostgreSQL.
const cards = getArenaCardCatalog().map((c, i) => ({
  id: `004-synthetic-card-${i}`,
  name: `Synthetic ${i}`,
  type: c.type,
  rarity: c.rarity,
  action: c.action,
}));
const ids = cards.map((c) => c.id);
const db = offlinePostgres();
const port: AuthorityPort = {
  authenticate: async (token) =>
    token === 'synthetic-A'
      ? { id: uid(2), anonymous: false }
      : token === 'anonymous'
        ? { id: uid(2), anonymous: true }
        : null,
  call: db.rpc,
};
const execute = <T>(n: number, body: object) =>
  executeAuthority(port, uid(n), { travelerId: tid(n), ...body }) as Promise<T>;
const start = (n: number, overrides: object = {}) =>
  execute<BattleView>(n, {
    operation: 'start',
    requestId: randomUUID(),
    mode: 'arena-v3',
    opponentId: 'training-apprentice',
    floor: null,
    ids,
    ...overrides,
  });
const command = (
  n: number,
  b: BattleView,
  action: ArenaProductAction = 'attack',
  overrides: object = {},
) =>
  execute<BattleView>(n, {
    operation: 'command',
    battleId: b.state.id,
    revision: b.revision,
    round: b.state.round,
    commandId: randomUUID(),
    action,
    ...overrides,
  });
async function finish(n: number, b: BattleView) {
  for (let turn = 0; turn < 40 && b.state.status === 'in_progress'; turn++)
    b = await command(n, b);
  expect(b.state.status).toBe('finished');
  return b;
}
async function beforeFinalAttack(n: number) {
  let b = await start(n);
  // PG supplies a random seed: an opening dodge/guard is not a settlement bug.
  // Prepare the actual last round so the race/rollback still targets payout.
  for (let turn = 0; turn < 20; turn++) {
    if (
      resolveArenaCommand(b.state, b.state.id, b.state.round, 'attack')
        .status === 'finished'
    )
      return b;
    b = await command(n, b);
  }
  throw new Error('Fixture did not reach a terminal attack');
}
const denied = (n: number, sql: string) =>
  expect(() => db.as(n, sql)).toThrow(
    /denied|permission|Account|Ownership|reconciliation/i,
  );
const totals = () =>
  db.query(
    `SELECT jsonb_agg(jsonb_build_array(t.id,t.xp,w.coins) ORDER BY t.id) FROM public.travelers t JOIN public.wallets w ON w.traveler_id=t.id`,
  );
let reproduced: unknown;
let preservedLegacy: string;

describe.runIf(process.env.RPG_LOCAL_PG === '1')(
  '004 offline PostgreSQL + real TypeScript authority',
  () => {
    beforeAll(async () => {
      await db.start();
      db.create(1);
      preservedLegacy = db.query(
        `SELECT to_jsonb(t)||jsonb_build_object('wallet',(SELECT to_jsonb(w) FROM public.wallets w WHERE traveler_id=t.id)) FROM public.travelers t WHERE id='${tid(1)}'`,
      );
      reproduced = JSON.parse(
        db
          .query(
            `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${uid(1)}';
      UPDATE public.travelers SET xp=99999 WHERE id='${tid(1)}';UPDATE public.wallets SET coins=99999 WHERE traveler_id='${tid(1)}';
      INSERT INTO public.inventory(traveler_id,item_id,quantity) VALUES('${tid(1)}','fake-card',1);
      SELECT public.claim_chest_reward('${tid(1)}','phase:garden-choice');
      SELECT jsonb_build_object('xp',(SELECT xp FROM public.travelers WHERE id='${tid(1)}'),'coins',(SELECT coins FROM public.wallets WHERE traveler_id='${tid(1)}'),'card',(SELECT count(*) FROM public.inventory WHERE item_id='fake-card'),'chests',(SELECT sum(quantity) FROM public.traveler_chests));ROLLBACK;`,
          )
          .split('\n')
          .at(-1)!,
      );
      db.apply('consolidation004-expand0078.sql');
      db.apply('consolidation004-authority.sql');
      for (let n = 2; n <= 9; n++) db.create(n);
      db.create(22, 2);
      db.create(88, 8);
      // Product table is empty. Starter denied before synthetic approval.
      await expect(execute(2, { operation: 'starter' })).rejects.toThrow(
        /unavailable/,
      );
      for (const c of cards)
        db.query(
          `INSERT INTO economy_private.card_catalog(version,id,definition,approval_ref,starter) VALUES('004-fixture-only','${c.id}',${literal(c)},'disposable-test-approval',true)`,
        );
      for (const n of [2, 3, 4, 5, 6, 7, 9])
        await execute(n, { operation: 'starter' });
      // Trusted fixture setup is never shipped in SQL migrations/product assets.
      db.query(`UPDATE public.traveler_stats SET base_life=80,base_strength=2,base_defense=3,base_wisdom=3 WHERE traveler_id='${tid(2)}';
      UPDATE public.traveler_stats SET base_life=80,base_strength=50,base_defense=8,base_wisdom=3 WHERE traveler_id IN ('${tid(3)}','${tid(5)}','${tid(6)}','${tid(7)}');
      UPDATE public.traveler_stats SET base_life=1,base_strength=0,base_defense=0,base_wisdom=0 WHERE traveler_id='${tid(4)}';
      UPDATE public.travelers SET xp=5600,level=8 WHERE id IN ('${tid(3)}','${tid(5)}','${tid(6)}','${tid(7)}');`);
    }, 120000);
    afterAll(() => db.stop(), 30000);
    it('reproduces ECON-LEGACY, rolls back, preserves legacy rows and leaves official catalog unapproved', () => {
      expect(reproduced).toEqual({
        xp: 99999,
        coins: 99999,
        card: 1,
        chests: 1,
      });
      expect(getApprovedArenaCards()).toHaveLength(0);
      const old = JSON.parse(preservedLegacy),
        now = JSON.parse(
          db.query(
            `SELECT to_jsonb(t)||jsonb_build_object('wallet',(SELECT to_jsonb(w) FROM public.wallets w WHERE traveler_id=t.id)) FROM public.travelers t WHERE id='${tid(1)}'`,
          ),
        );
      expect(now).toEqual({ ...old, economic_verified_at: null });
    });
    it.each([
      ['XP', `UPDATE public.travelers SET xp=1000 WHERE id='${tid(2)}'`],
      [
        'coins',
        `UPDATE public.wallets SET coins=1000 WHERE traveler_id='${tid(2)}'`,
      ],
      [
        'stats',
        `UPDATE public.traveler_stats SET base_strength=1000 WHERE traveler_id='${tid(2)}'`,
      ],
      [
        'chests',
        `INSERT INTO public.traveler_chests VALUES('${tid(2)}','common',1,'["fake"]')`,
      ],
      [
        'cards',
        `INSERT INTO public.inventory(traveler_id,item_id,quantity) VALUES('${tid(2)}','fake-card',1)`,
      ],
      [
        'equipped',
        `DELETE FROM public.equipped_items WHERE traveler_id='${tid(2)}'`,
      ],
      [
        'owner',
        `UPDATE public.travelers SET user_id='${uid(2)}' WHERE id='${tid(3)}'`,
      ],
      ['delete', `DELETE FROM public.travelers WHERE id='${tid(2)}'`],
    ])('denies direct %s mutation', (_label, sql) => denied(2, sql));
    it('denies all unsafe legacy RPCs including private and service-only entry points', () => {
      for (const sql of [
        `SELECT public.add_coins('${tid(2)}',1000)`,
        `SELECT public.spend_coins('${tid(2)}',1)`,
        `SELECT public.claim_chest_reward('${tid(2)}','phase:garden-choice')`,
        `SELECT public.grant_traveler_chest('${tid(2)}','common','fake','fake')`,
        `SELECT public.economy_authority('${uid(2)}','${tid(2)}','settle','{}')`,
        db.rpcSql(uid(2), tid(2), 'starter'),
      ])
        denied(2, sql);
      expect(
        db.query(
          `SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='economy_private' AND has_function_privilege('authenticated',p.oid,'EXECUTE') AND p.proname NOT IN ('create_traveler','chest')`,
        ),
      ).toBe('0');
    });
    it('keeps cosmetic/owner reads, hides other accounts, protects receipts and private battle details', async () => {
      db.as(
        2,
        `UPDATE public.travelers SET name='Updated synthetic' WHERE id='${tid(2)}'`,
      );
      for (const table of [
        'wallets',
        'inventory',
        'traveler_stats',
        'equipped_items',
        'traveler_chests',
        'chest_operations',
      ]) {
        expect(
          Number(
            db.as(
              2,
              `SELECT count(*) FROM public.${table} WHERE traveler_id='${tid(3)}'`,
            ),
          ),
        ).toBe(0);
      }
      expect(
        Number(
          db.as(
            2,
            `SELECT count(*) FROM public.inventory WHERE traveler_id='${tid(2)}'`,
          ),
        ),
      ).toBe(8);
      denied(2, 'SELECT * FROM economy_private.battles');
      await expect(db.rpc(uid(2), tid(3), 'collection')).rejects.toThrow(
        /Ownership/,
      );
      await expect(db.rpc(uid(2), tid(3), 'starter')).rejects.toThrow(
        /Ownership/,
      );
      expect(await db.rpc<OwnedCard[]>(uid(2), tid(22), 'collection')).toEqual(
        [],
      );
    });
    it('claims one starter per account across concurrent requests, Travelers and catalog revisions', async () => {
      const [a, b] = await Promise.all([
        db.rpc<{ id: string }>(uid(8), tid(8), 'starter'),
        db.rpc<{ id: string }>(uid(8), tid(88), 'starter'),
      ]);
      expect(a.id).toBe(b.id);
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE identity_key='arena-starter-v1:${uid(8)}'`,
        ),
      ).toBe('1');
      expect(
        db.query(
          `SELECT count(*) FROM public.inventory WHERE card_receipt_id='${a.id}'`,
        ),
      ).toBe('7');
      expect(
        (await db.rpc<{ id: string }>(uid(8), tid(88), 'starter')).id,
      ).toBe(a.id);
    });
    it('legacy balances/checkpoints cannot become official proof', async () => {
      await expect(start(1)).rejects.toThrow();
      await expect(
        db.rpc(uid(1), tid(1), 'purchase', { itemId: 'traveler-sword-common' }),
      ).rejects.toThrow(/reconciliation/);
      denied(
        1,
        `SELECT public.purchase_chest('${tid(1)}','common','${randomUUID()}')`,
      );
    });
    it('rejects malformed/unowned/cross-Traveler decks and fabricated damage/winner/seed/stat payloads', async () => {
      for (const selection of [
        ids.slice(1),
        [...ids.slice(1), ids[1]],
        [...ids.slice(1), 'not-owned'],
      ])
        await expect(start(2, { ids: selection })).rejects.toThrow();
      await expect(start(2, { travelerId: tid(22) })).rejects.toThrow();
      await expect(start(2, { travelerId: tid(3) })).rejects.toThrow();
      for (const extra of [
        { damage: 999 },
        { winnerId: tid(2) },
        { seed: 1 },
        { hp: 999 },
        { player: { attributes: { strength: 999 } } },
      ])
        await expect(start(2, extra)).rejects.toMatchObject({ status: 400 });
    });
    it('uses server snapshot/seed and rejects duplicate start intent conflicts and parallel active battles', async () => {
      const requestId = randomUUID(),
        b = await start(2, { requestId });
      expect(b.state.player.snapshot.attributes.life).toBe(81);
      expect(b.state.player.snapshot.equipment.map((e) => e.id)).toContain(
        'traveler-boots',
      );
      expect(b.state.deck?.cards).toHaveLength(7);
      expect((await start(2, { requestId })).state.id).toBe(b.state.id);
      await expect(
        start(2, { requestId, opponentId: 'training-guardian' }),
      ).rejects.toThrow(/conflict/);
      await expect(start(2)).rejects.toThrow(/unique|duplicate/i);
      await expect(
        execute(3, { operation: 'battle', battleId: b.state.id }),
      ).rejects.toThrow(/ownership/i);
    });
    it('checks Foco/level, refuses direct special/used card/replay/stale round and survives reload', async () => {
      let b = await execute<BattleView>(2, {
        operation: 'resume',
        mode: 'arena-v3',
      });
      const measured = cards.find(
        (c) => c.action === 'special:measured-strike',
      )!.id;
      const path = cards.find((c) => c.action === 'special:path-strike')!.id;
      await expect(command(2, b, `card:${measured}`)).rejects.toMatchObject({
        status: 422,
      });
      await expect(
        command(2, b, 'attack', { action: 'special:measured-strike' }),
      ).rejects.toMatchObject({ status: 400 });
      b = await command(2, b, 'defend');
      await expect(command(2, b, `card:${path}`)).rejects.toMatchObject({
        status: 422,
      });
      const commandId = randomUUID(),
        previous = b;
      b = await command(2, b, `card:${measured}`, { commandId });
      await expect(command(2, b, `card:${measured}`)).rejects.toMatchObject({
        status: 422,
      });
      await expect(
        command(2, previous, `card:${measured}`, { commandId }),
      ).rejects.toMatchObject({ status: 409 });
      await expect(
        command(2, b, 'attack', { round: b.state.round - 1 }),
      ).rejects.toMatchObject({ status: 422 });
      expect(
        (
          await execute<BattleView>(2, {
            operation: 'resume',
            mode: 'arena-v3',
          })
        ).state.deck?.usedIds,
      ).toContain(measured);
      await finish(2, b);
    });
    it('concurrent commands commit one transition, payout once, and reject finished commands', async () => {
      const b = await beforeFinalAttack(3);
      const before = totals();
      const results = await Promise.allSettled([command(3, b), command(3, b)]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const done = await execute<BattleView>(3, {
        operation: 'battle',
        battleId: b.state.id,
      });
      expect(done.state.status).toBe('finished');
      expect(done.reward).toMatchObject({
        xp: 8,
        coins: 3,
        rewarded: true,
        status: 'confirmed',
      });
      expect(done.receiptId).toBeTruthy();
      expect(totals()).not.toBe(before);
      const settled = totals();
      await expect(command(3, done)).rejects.toMatchObject({ status: 409 });
      for (let n = 0; n < 3; n++)
        expect(
          (
            await execute<BattleView>(3, {
              operation: 'resume',
              mode: 'arena-v3',
            })
          ).receiptId,
        ).toBe(done.receiptId);
      expect(totals()).toBe(settled);
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE operation_key='battle:${b.state.id}'`,
        ),
      ).toBe('1');
    });
    it('training anti-farm quota is enforced by the transaction, independent of request IDs', async () => {
      for (let n = 0; n < 3; n++) {
        const done = await finish(3, await start(3));
        expect(done.reward?.rewarded).toBe(n < 2);
        if (n === 2)
          expect(done.reward).toMatchObject({
            xp: 0,
            coins: 0,
            reason: 'daily-limit',
          });
      }
    });
    it('Tower only advances after a canonical win, rejects skips, keeps seven NPCs and blocks unapproved payout', async () => {
      expect(await execute(3, { operation: 'tower' })).toMatchObject({
        nextFloor: 1,
        rewardStatus: 'blocked',
      });
      await expect(
        start(3, { mode: 'tower-v3', floor: 2, opponentId: null }),
      ).rejects.toThrow(/order/);
      const before = totals();
      const done = await finish(
        3,
        await start(3, { mode: 'tower-v3', floor: 1, opponentId: null }),
      );
      expect(done.reward).toMatchObject({
        outcome: 'victory',
        status: 'blocked',
        xp: 0,
        coins: 0,
        rewarded: false,
      });
      expect(totals()).toBe(before);
      expect(await execute(3, { operation: 'tower' })).toMatchObject({
        nextFloor: 2,
      });
      await expect(
        start(3, { mode: 'tower-v3', floor: 1, opponentId: null }),
      ).rejects.toThrow(/order/);
      await expect(
        start(3, { mode: 'tower-v3', floor: 8, opponentId: null }),
      ).rejects.toThrow();
    });
    it('defeat gives no victory, reward or Tower advancement', async () => {
      const before = totals();
      const lost = await finish(
        4,
        await start(4, { mode: 'tower-v3', floor: 1, opponentId: null }),
      );
      expect(lost.state.winnerId).not.toBe(tid(4));
      expect(lost.reward).toMatchObject({ outcome: 'defeat', rewarded: false });
      expect(await execute(4, { operation: 'tower' })).toMatchObject({
        nextFloor: 1,
      });
      expect(totals()).toBe(before);
    });
    it('rollback after XP update leaves no partial wallet, round, card consumption or receipt; retry reconciles', async () => {
      const b = await beforeFinalAttack(5),
        before = totals();
      expect(
        resolveArenaCommand(b.state, b.state.id, b.state.round, 'attack')
          .status,
      ).toBe('finished');
      db.query(
        `CREATE FUNCTION public.fixture_fail_wallet() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic forced failure'; END $$;CREATE TRIGGER fixture_fail_wallet BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.fixture_fail_wallet()`,
      );
      try {
        await expect(command(5, b)).rejects.toThrow(/Synthetic forced failure/);
      } finally {
        db.query(
          'DROP TRIGGER fixture_fail_wallet ON public.wallets;DROP FUNCTION public.fixture_fail_wallet()',
        );
      }
      expect(totals()).toBe(before);
      expect(
        (
          await execute<BattleView>(5, {
            operation: 'battle',
            battleId: b.state.id,
          })
        ).revision,
      ).toBe(b.revision);
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE operation_key='battle:${b.state.id}'`,
        ),
      ).toBe('0');
      expect((await command(5, b)).reward?.rewarded).toBe(true);
    });
    it('concurrent chest purchase/open preserves legacy loot, atomic receipts and ownership', async () => {
      db.query(
        `UPDATE public.wallets SET coins=200 WHERE traveler_id='${tid(6)}'`,
      );
      const operation = randomUUID();
      const sql = `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${uid(6)}';SELECT public.purchase_chest('${tid(6)}','common','${operation}');COMMIT;`;
      await Promise.all([db.queryAsync(sql), db.queryAsync(sql)]);
      expect(
        db.query(
          `SELECT coins FROM public.wallets WHERE traveler_id='${tid(6)}'`,
        ),
      ).toBe('160');
      const open = randomUUID(),
        openSql = `BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub='${uid(6)}';SELECT public.open_chest('${tid(6)}','common','${open}');COMMIT;`;
      const receipts = await Promise.all([
        db.queryAsync(openSql),
        db.queryAsync(openSql),
      ]);
      expect(JSON.parse(receipts[0]).coins).toBe(JSON.parse(receipts[1]).coins);
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE operation_key='open:${open}'`,
        ),
      ).toBe('1');
      denied(2, `SELECT public.open_chest('${tid(6)}','common','${open}')`);
    });
    it('revocation retains inventory/history, removes eligibility, and does not reopen starter entitlement', async () => {
      const active = await start(9);
      const receipt = await db.rpc<{ id: string }>(uid(9), tid(9), 'starter');
      const revoked = await db.rpc<{ id: string }>(
        uid(9),
        tid(9),
        'revoke-card',
        {
          cardId: ids[0],
          reason: 'Synthetic reviewed revocation',
          reviewRef: 'synthetic-admin-review-004',
        },
      );
      expect(
        (
          await db.rpc<{ id: string }>(uid(9), tid(9), 'revoke-card', {
            cardId: ids[0],
            reason: 'Synthetic reviewed revocation',
            reviewRef: 'synthetic-admin-review-004',
          })
        ).id,
      ).toBe(revoked.id);
      expect(
        await db.rpc<OwnedCard[]>(uid(9), tid(9), 'collection'),
      ).toHaveLength(6);
      expect((await db.rpc<{ id: string }>(uid(9), tid(9), 'starter')).id).toBe(
        receipt.id,
      );
      await expect(start(9)).rejects.toThrow();
      await expect(command(9, active, 'defend')).rejects.toThrow(/revoked/);
      expect(
        db.query(
          `SELECT count(*) FROM public.inventory WHERE traveler_id='${tid(9)}' AND card_revoked_at IS NOT NULL`,
        ),
      ).toBe('1');
    });
    it('concurrent start requests create only one active battle and reject duplicate command IDs at a newer revision', async () => {
      const results = await Promise.allSettled([start(7), start(7)]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const b = await execute<BattleView>(7, {
          operation: 'resume',
          mode: 'arena-v3',
        }),
        commandId = randomUUID();
      const next = await command(7, b, 'defend', { commandId });
      await expect(command(7, next, 'attack', { commandId })).rejects.toThrow(
        /Stale/,
      );
      expect(
        (
          await execute<BattleView>(7, {
            operation: 'resume',
            mode: 'arena-v3',
          })
        ).revision,
      ).toBe(next.revision);
    });
    it('starter rollback leaves no partial provenance or receipt; level threshold keeps the existing ten-coin bonus', async () => {
      db.create(10);
      db.query(
        `INSERT INTO public.inventory(traveler_id,item_id,quantity) VALUES('${tid(10)}','${ids[0]}',1)`,
      );
      await expect(execute(10, { operation: 'starter' })).rejects.toThrow(
        /unique|duplicate/i,
      );
      expect(
        db.query(
          `SELECT count(*) FROM public.chest_operations WHERE identity_key='arena-starter-v1:${uid(10)}'`,
        ),
      ).toBe('0');
      expect(
        db.query(
          `SELECT count(*) FROM public.inventory WHERE traveler_id='${tid(10)}' AND card_receipt_id IS NOT NULL`,
        ),
      ).toBe('0');
      db.query(
        `DELETE FROM public.inventory WHERE traveler_id='${tid(10)}' AND item_id='${ids[0]}'`,
      );
      await execute(10, { operation: 'starter' });
      db.query(
        `UPDATE public.travelers SET xp=196 WHERE id='${tid(10)}';UPDATE public.traveler_stats SET base_life=80,base_strength=50 WHERE traveler_id='${tid(10)}'`,
      );
      const done = await finish(10, await start(10));
      expect(done.reward).toMatchObject({
        xp: 8,
        coins: 3,
        levelBonusCoins: 10,
      });
      expect(
        db.query(
          `SELECT xp||','||level||','||coins FROM public.travelers JOIN public.wallets ON traveler_id=id WHERE id='${tid(10)}'`,
        ),
      ).toBe('204,2,13');
    });
    it('HTTP uses the verified-identity port, rejects anonymous/forged identity/unexpected result fields and caps stream', async () => {
      const http = (body: unknown, token = 'synthetic-A') =>
        handleAuthority(
          new Request('http://local.invalid/api/authority', {
            method: 'POST',
            headers: { authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          }),
          port,
        );
      expect(
        (await http({ operation: 'collection', travelerId: tid(2) })).status,
      ).toBe(200);
      expect(
        (
          await http(
            { operation: 'collection', travelerId: tid(2) },
            'anonymous',
          )
        ).status,
      ).toBe(401);
      expect(
        (await http({ operation: 'collection', travelerId: tid(2) }, 'forged'))
          .status,
      ).toBe(401);
      expect(
        (
          await http({
            operation: 'collection',
            travelerId: tid(2),
            userId: uid(3),
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await http({
            operation: 'collection',
            travelerId: tid(2),
            padding: 'x'.repeat(17000),
          })
        ).status,
      ).toBe(413);
      const response = await http({
        operation: 'collection',
        travelerId: tid(2),
        won: true,
      });
      expect(response.status).toBe(400);
      expect(response.headers.get('cache-control')).toBe('no-store');
    });
    it('keeps leader approval, teacher permissions and individual Story blocked without economic proof', () => {
      db.as(
        6,
        `SELECT public.create_guild('${tid(6)}','Synthetic guild',NULL)`,
      );
      const guild = db.query(
        `SELECT guild_id FROM public.guild_members WHERE traveler_id='${tid(6)}'`,
      );
      db.query(
        `INSERT INTO public.guild_members(guild_id,traveler_id,role,status) VALUES('${guild}','${tid(7)}','member','active')`,
      );
      const mission = randomUUID(),
        data = {
          title: 'Synthetic mission',
          description: 'Disposable evidence',
          objective: 'Test',
          instructions: 'Synthetic only',
          evidenceCriterion: 'Evidence required',
          bibleReference: '',
          startsAt: '',
          dueAt: '',
          kind: 'mission',
          rewardTier: 'normal',
          audience: 'all',
          targetIds: [],
        };
      db.as(
        6,
        `SELECT public.save_guild_mission_v2('${tid(6)}','${mission}',0,${literal(data)});SELECT public.transition_guild_mission_v2('${tid(6)}','${mission}',1,'publish')`,
      );
      db.as(
        7,
        `SELECT public.act_guild_mission_v2('${tid(7)}','${mission}','start','','${randomUUID()}',0);SELECT public.act_guild_mission_v2('${tid(7)}','${mission}','submit','Synthetic evidence','${randomUUID()}',0)`,
      );
      const attempt = db.query(
          `SELECT id FROM public.guild_mission_attempts WHERE mission_id='${mission}'`,
        ),
        before = totals();
      denied(
        7,
        `SELECT public.review_guild_mission_v2('${tid(7)}','${attempt}',1,'approved','','${randomUUID()}')`,
      );
      db.as(
        6,
        `SELECT public.review_guild_mission_v2('${tid(6)}','${attempt}',1,'approved','','${randomUUID()}')`,
      );
      expect(
        db.query(
          `SELECT status FROM public.guild_mission_progress WHERE mission_id='${mission}'`,
        ),
      ).toBe('approved');
      expect(totals()).toBe(before);
      denied(
        7,
        `SELECT public.guild_ebd_command('${tid(7)}','teacher','${tid(7)}',0,'{"active":true,"publish":true,"attend":true}')`,
      );
      expect(() =>
        db.as(2, `SELECT public.complete_story('${tid(2)}','creation')`),
      ).toThrow(/dependencies pending/);
      expect(
        db.as(
          2,
          `SELECT count(*) FROM public.guild_members WHERE traveler_id='${tid(2)}'`,
        ),
      ).toBe('0');
      expect(db.as(2, 'SELECT count(*) FROM public.story_definitions')).toBe(
        '5',
      );
    });
    it('audits final exposed grants/RLS/definer search_path and writes structural evidence only', () => {
      expect(
        db.query(
          `SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','economy_private') AND c.relkind='r' AND NOT c.relrowsecurity`,
        ),
      ).toBe('0');
      expect(
        db.query(
          `SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='economy_private' AND p.prosecdef AND NOT ('search_path=""'=ANY(p.proconfig))`,
        ),
      ).toBe('0');
      const catalog = db.query(
        `SELECT jsonb_agg(jsonb_build_object('name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'authenticated',has_function_privilege('authenticated',p.oid,'EXECUTE'),'service',has_function_privilege('service_role',p.oid,'EXECUTE'),'definition',pg_get_functiondef(p.oid)) ORDER BY p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','economy_private')`,
      );
      mkdirSync('build/task-consolidation-004', { recursive: true });
      writeFileSync(
        'build/task-consolidation-004/catalog.json',
        catalog + '\n',
      );
    });
  },
);
