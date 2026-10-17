import { Client } from 'pg';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  transitionJourney,
  type JourneyAction,
} from '../../../apps/web/lib/economy/journey-authority';
import { journeyActions } from '../../../apps/web/lib/economy/testing/journey-fixtures';
import {
  EconomyError,
  handleEconomy,
  type EconomyPort,
  type RegisteredBattle,
} from '../../../apps/web/lib/economy/authority';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../../apps/web/features/journey/domain/traveler';
import { EQUIPMENT_CATALOG } from '../../../apps/web/features/journey/data/equipmentCatalog';
import {
  travelerBattleSnapshot,
  TRAINING_OPPONENTS,
} from '../../../apps/web/features/journey/data/arena';
import {
  createArenaBattle,
  resolveArenaRound,
  createCardBattle,
  combatCard,
  playCombatCard,
  endCardTurn,
  resolveCardEnemyTurn,
  type ArenaAction,
} from '@rpg/game-engine';

const connectionString = process.env.TASK_0076A_CONTRACT_DATABASE_URL;
const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
let admin: Client,
  ownedFixture = false;
const evidence: Record<string, unknown> = {};
async function connect(
  role = 'service_role',
  user: string | null = null,
  application_name = 'TASK0076A_TEST',
) {
  const c = new Client({ connectionString, application_name });
  await c.connect();
  await c.query(`SET ROLE ${role}`);
  await c.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    user ?? '',
  ]);
  return c;
}
async function gatewayOn(
  c: Client,
  traveler: string,
  op: string,
  payload: object = {},
  user = userA,
) {
  return (
    await c.query('SELECT public.economy_authority($1,$2,$3,$4) AS result', [
      user,
      traveler,
      op,
      payload,
    ])
  ).rows[0].result;
}
async function gateway(
  traveler: string,
  op: string,
  payload: object = {},
  user = userA,
) {
  const c = await connect();
  try {
    return await gatewayOn(c, traveler, op, payload, user);
  } finally {
    await c.end();
  }
}
async function newTraveler(user = userA, coins = 0, strong = false) {
  const id = randomUUID(),
    c = await connect('authenticated', user);
  try {
    await c.query(
      "SELECT public.create_traveler($1,'Viajante Sintetico','male','medio','curto',null,'musgo')",
      [id],
    );
  } finally {
    await c.end();
  }
  await admin.query('UPDATE public.wallets SET coins=$2 WHERE traveler_id=$1', [
    id,
    coins,
  ]);
  if (strong)
    await admin.query(
      'UPDATE public.traveler_stats SET base_strength=30,base_life=20 WHERE traveler_id=$1',
      [id],
    );
  return id;
}
async function commitAction(
  id: string,
  action: JourneyAction,
  operationId = randomUUID(),
) {
  const context = await gateway(id, 'journey-context'),
    next = transitionJourney(context.state, action);
  const payload = {
    operationId,
    digest: createHash('sha256').update(JSON.stringify(action)).digest('hex'),
    revision: context.revision,
    state: next.state,
    rewardKey: next.rewardKey,
  };
  return { result: await gateway(id, 'journey-commit', payload), payload };
}
async function ready(id: string) {
  for (const a of journeyActions().slice(0, -1)) await commitAction(id, a);
}
async function snapshot(id: string) {
  return (
    await admin.query(
      `SELECT jsonb_build_object('traveler',to_jsonb(t),'wallet',(SELECT to_jsonb(w) FROM public.wallets w WHERE traveler_id=t.id),'inventory',(SELECT jsonb_agg(to_jsonb(i) ORDER BY item_id) FROM public.inventory i WHERE traveler_id=t.id)) AS value FROM public.travelers t WHERE t.id=$1`,
      [id],
    )
  ).rows[0].value;
}
async function parallelUnderRowLock(
  id: string,
  op: string,
  payloads: object[],
) {
  const connections = await Promise.all(
    payloads.map(() => connect('service_role', null, 'TASK0076A_CONCURRENT')),
  );
  const blocker = await connect('postgres');
  await blocker.query('BEGIN');
  await blocker.query(
    'SELECT id FROM public.travelers WHERE id=$1 FOR UPDATE',
    [id],
  );
  const pending = connections.map((c, i) => gatewayOn(c, id, op, payloads[i]));
  let waiters = 0;
  try {
    for (let i = 0; i < 200; i++) {
      waiters = Number(
        (
          await admin.query(
            "SELECT count(*) n FROM pg_stat_activity WHERE application_name='TASK0076A_CONCURRENT' AND wait_event_type='Lock'",
          )
        ).rows[0].n,
      );
      if (waiters === payloads.length) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(waiters).toBe(payloads.length);
    await blocker.query('COMMIT');
    return { results: await Promise.all(pending), waiters };
  } finally {
    await blocker.query('ROLLBACK');
    await blocker.end();
    await Promise.all(connections.map((c) => c.end()));
  }
}
function port(): EconomyPort {
  return {
    authenticate: async () => ({ id: userA, anonymous: false }),
    async loadTraveler(user, id) {
      const d = await gateway(id, 'context', {}, user),
        base = createTraveler(
          d.name,
          DEFAULT_APPEARANCE,
          id,
          '2026-10-17T00:00:00.000Z',
        );
      return {
        ...base,
        xp: d.xp,
        coins: d.coins,
        attributes: d.attributes,
        equipped: d.equipped,
        inventory: d.inventory.flatMap(
          (v: { item_id: string; quantity: number }) => {
            const item = EQUIPMENT_CATALOG.find((x) => x.id === v.item_id);
            return item ? [{ ...item, quantity: v.quantity }] : [];
          },
        ),
      };
    },
    start: (u, t, player, opponent, mode = 'card') =>
      gateway(t, 'start', { player, opponent, mode }, u),
    battle: (u, t, id) => gateway(t, 'battle', { battleId: id }, u),
    settle: (u, t, id, won) => gateway(t, 'settle', { battleId: id, won }, u),
    purchase: (u, t, itemId) => gateway(t, 'purchase', { itemId }, u),
    journey: async (u, t, operationId, action) => {
      const ctx = await gateway(t, 'journey-context', {}, u);
      let r;
      try {
        r = transitionJourney(ctx.state, action);
      } catch {
        throw new EconomyError(422);
      }
      return gateway(
        t,
        'journey-commit',
        {
          operationId,
          digest: createHash('sha256')
            .update(JSON.stringify(action))
            .digest('hex'),
          revision: ctx.revision,
          state: r.state,
          rewardKey: r.rewardKey,
        },
        u,
      );
    },
  };
}
const http = (body: object) =>
  new Request('http://localhost/api/economy', {
    method: 'POST',
    headers: { Authorization: 'Bearer synthetic-user' },
    body: JSON.stringify(body),
  });
describe.skipIf(!connectionString)(
  'real PostgreSQL economy contracts and concurrency',
  () => {
    beforeAll(async () => {
      const url = new URL(connectionString!);
      if (
        !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
        !/^\/task0076a_[a-z0-9_]+$/.test(url.pathname)
      )
        throw Error('Disposable loopback database required');
      admin = new Client({ connectionString });
      await admin.connect();
      expect(
        (
          await admin.query(
            "SELECT count(*) n FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')",
          )
        ).rows[0].n,
      ).toBe('0');
      ownedFixture = true;
      evidence.server = (await admin.query('SELECT version() v')).rows[0].v;
      await admin.query(`DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF; END $$;
  CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean DEFAULT false);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon,service_role;CREATE PUBLICATION supabase_realtime;`);
      for (const name of [
        '0000_initial_supabase_gameplay',
        '0001_guild_supabase_v1',
        '0002_traveler_chests',
        '0003_guild_mission_chest_rewards',
        '0004_guild_leader_panel',
        '0005_guild_lessons_and_schedule',
        '0006_traveler_journey_progress',
        '0007_guild_chat',
        '0008_guild_chat_commit_order',
      ])
        await admin.query(
          await readFile(
            resolve('packages/database/migrations', name + '.sql'),
            'utf8',
          ),
        );
      await admin.query('INSERT INTO auth.users(id) VALUES($1),($2)', [
        userA,
        userB,
      ]);
      const legacy = await newTraveler(userA, 777);
      await admin.query(
        'UPDATE public.travelers SET xp=888,journey_progress=$2 WHERE id=$1',
        [
          legacy,
          {
            gardenStep: 'done',
            gardenRewardGranted: true,
            gardenCompleted: true,
          },
        ],
      );
      const before = await snapshot(legacy);
      await admin.query('BEGIN');
      try {
        await admin.query(
          await readFile(
            resolve(
              'packages/database/migrations/0009_reward_security_task0076a.sql',
            ),
            'utf8',
          ),
        );
        await admin.query('COMMIT');
      } catch (e) {
        await admin.query('ROLLBACK');
        throw e;
      }
      expect(await snapshot(legacy)).toEqual(before);
      const bridge = await connect('authenticated', userA);
      try {
        expect(
          (await bridge.query('SELECT public.economy_protocol_version() v'))
            .rows[0].v,
        ).toBe(1);
        await bridge.query('BEGIN');
        expect(
          (await bridge.query('SELECT public.add_coins($1,1) v', [legacy]))
            .rows[0].v,
        ).toBe(778);
        await bridge.query('UPDATE public.travelers SET xp=xp+1 WHERE id=$1', [
          legacy,
        ]);
        await bridge.query(
          "INSERT INTO public.inventory(traveler_id,item_id) VALUES($1,'synthetic-legacy-item')",
          [legacy],
        );
        await bridge.query(
          "SELECT public.claim_chest_reward($1,'phase:garden-choice')",
          [legacy],
        );
        await bridge.query('ROLLBACK');
      } finally {
        await bridge.end();
      }
      // Prove that a failed contract transaction restores protocol/grants/data.
      await admin.query('BEGIN');
      await admin.query(
        await readFile(
          resolve(
            'packages/database/migrations/0010_reward_security_cutover_task0076a.sql',
          ),
          'utf8',
        ),
      );
      await expect(admin.query('SELECT 1/0')).rejects.toMatchObject({
        code: '22012',
      });
      await admin.query('ROLLBACK');
      expect(
        (await admin.query('SELECT public.economy_protocol_version() v'))
          .rows[0].v,
      ).toBe(1);
      expect(await snapshot(legacy)).toEqual(before);
      evidence.cutover_transaction_rollback = true;
      await admin.query('BEGIN');
      try {
        await admin.query(
          await readFile(
            resolve(
              'packages/database/migrations/0010_reward_security_cutover_task0076a.sql',
            ),
            'utf8',
          ),
        );
        await admin.query('COMMIT');
      } catch (e) {
        await admin.query('ROLLBACK');
        throw e;
      }
      expect(
        (await admin.query('SELECT public.economy_protocol_version() v'))
          .rows[0].v,
      ).toBe(2);
      expect(await snapshot(legacy)).toEqual(before);
      evidence.migration_preserved_existing_resources = true;
      evidence.deployment_order = {
        expand_old_client_credit_still_works: true,
        contract_protocol: 2,
        resources_preserved: true,
      };
      const state = await gateway(legacy, 'journey-context');
      expect(state.state.progress.gardenRewardGranted).toBe(true);
      await commitAction(legacy, { type: 'complete' });
      expect((await gateway(legacy, 'context')).coins).toBe(777);
    });
    afterAll(async () => {
      if (admin) {
        await writeFile(
          resolve(
            'build/task-0076a-reward-security/continuation-20261017/postgres-evidence.json',
          ),
          JSON.stringify(evidence, null, 2),
        );
        if (ownedFixture)
          await admin.query(
            'DROP SCHEMA IF EXISTS guild_chat_private CASCADE;DROP SCHEMA IF EXISTS economy_private CASCADE;DROP SCHEMA IF EXISTS auth CASCADE;DROP SCHEMA public CASCADE;CREATE SCHEMA public;DROP PUBLICATION IF EXISTS supabase_realtime;',
          );
        await admin.end();
      }
    });
    test('preserves exploration, reading, devotional, Snake, Quiz and the phase reward amounts', async () => {
      const id = await newTraveler();
      await admin.query(
        'UPDATE public.travelers SET journey_progress=$2 WHERE id=$1',
        [id, { guildId: 'synthetic-guild', guildChallengeStatus: 'locked' }],
      );
      for (const action of journeyActions()) await commitAction(id, action);
      const c = await gateway(id, 'context');
      expect(c).toMatchObject({ coins: 90, xp: 120 });
      expect(
        c.inventory.map((i: { item_id: string }) => i.item_id).sort(),
      ).toEqual(['traveler-boots', 'traveler-helmet-rare', 'wisdom-amulet']);
      expect(
        Number(
          (
            await admin.query(
              "SELECT quantity FROM public.traveler_chests WHERE traveler_id=$1 AND chest_type='common'",
              [id],
            )
          ).rows[0].quantity,
        ),
      ).toBe(1);
      await commitAction(id, { type: 'complete' });
      expect(await gateway(id, 'context')).toEqual(c);
      expect(
        (
          await admin.query(
            'SELECT journey_progress FROM public.travelers WHERE id=$1',
            [id],
          )
        ).rows[0].journey_progress.guildChallengeStatus,
      ).toBe('available');
      evidence.journey = {
        coins: 90,
        xp: 120,
        phase_chests: 1,
        replay_duplicates: 0,
      };
    });
    test('8 simultaneous phase claims wait on the same row and grant exactly once', async () => {
      const id = await newTraveler();
      await ready(id);
      const ctx = await gateway(id, 'journey-context'),
        r = transitionJourney(ctx.state, { type: 'complete' }),
        op = randomUUID();
      const p = {
        operationId: op,
        revision: ctx.revision,
        state: r.state,
        rewardKey: r.rewardKey,
        digest: createHash('sha256')
          .update('{"type":"complete"}')
          .digest('hex'),
      };
      const run = await parallelUnderRowLock(
        id,
        'journey-commit',
        Array.from({ length: 8 }, () => p),
      );
      expect(run.results.filter((r) => !r.duplicate)).toHaveLength(1);
      expect((await gateway(id, 'context')).xp).toBe(120);
      expect(
        (
          await admin.query(
            "SELECT count(*) n FROM economy_private.journey_rewards WHERE traveler_id=$1 AND reward_key='phase:garden-choice'",
            [id],
          )
        ).rows[0].n,
      ).toBe('1');
      evidence.concurrent_phase = {
        requests: 8,
        simultaneous_lock_waiters: run.waiters,
        new_receipts: 1,
        duplicate_responses: 7,
        xp: 120,
      };
    });
    test('8 simultaneous battle settlements credit one receipt, with shared classic/card quota', async () => {
      const id = await newTraveler(userA, 0, true);
      const player = travelerBattleSnapshot(
        await port().loadTraveler(userA, id),
      );
      const first = await gateway(id, 'start', {
        player,
        opponent: TRAINING_OPPONENTS[0],
        mode: 'classic',
      });
      const run = await parallelUnderRowLock(
        id,
        'settle',
        Array.from({ length: 8 }, () => ({ battleId: first.id, won: true })),
      );
      expect(run.results.every((r) => r.xp === 8)).toBe(true);
      expect(await gateway(id, 'context')).toMatchObject({ xp: 8, coins: 3 });
      for (const mode of ['card', 'classic', 'card']) {
        const b = await gateway(id, 'start', {
          player,
          opponent: TRAINING_OPPONENTS[0],
          mode,
        });
        await gateway(id, 'settle', { battleId: b.id, won: true });
      }
      expect(await gateway(id, 'context')).toMatchObject({ xp: 24, coins: 9 });
      evidence.concurrent_battle = {
        requests: 8,
        simultaneous_lock_waiters: run.waiters,
        xp_after_same_receipt: 8,
        shared_daily_rewarded_battles: 3,
      };
    });
    test('the real HTTP handlers replay canonical classic and card victories and reject tampering', async () => {
      for (const mode of ['classic', 'card'] as const) {
        const id = await newTraveler(userA, 0, true),
          p = port();
        const start = await handleEconomy(
          http({
            operation: 'start-' + mode + '-battle',
            travelerId: id,
            opponentId: 'training-apprentice',
          }),
          p,
        );
        expect(start.status).toBe(200);
        const b: RegisteredBattle = await gateway(id, 'battle', {
          battleId: ((await start.json()) as { id: string }).id,
        });
        let commands: unknown[];
        if (mode === 'classic') {
          let game = createArenaBattle(b.player, b.opponent, b.seed, b.id);
          const actions: ArenaAction[] = [];
          while (game.status !== 'finished') {
            actions.push('attack');
            game = resolveArenaRound(game, 'attack');
          }
          expect(game.winnerId).toBe(id);
          commands = actions;
        } else {
          let game = createCardBattle(b.player, b.opponent, b.seed, b.id);
          for (let n = 0; n < 100 && game.phase !== 'finished'; n++) {
            if (game.phase === 'enemy') game = resolveCardEnemyTurn(game);
            else {
              const allowed = (i: { id: string; cardId: string }) =>
                combatCard(i.cardId)!.cost <= game.energy &&
                combatCard(i.cardId)!.focusCost <= game.player.focus;
              const c =
                game.hand.find(
                  (i) => allowed(i) && combatCard(i.cardId)?.damage,
                ) ?? game.hand.find(allowed);
              game = c ? playCombatCard(game, c.id) : endCardTurn(game);
            }
          }
          expect(game.winner).toBe('player');
          commands = game.commands;
        }
        const payload = {
          operation: 'settle-' + mode + '-battle',
          travelerId: id,
          battleId: b.id,
          commands,
        };
        expect(
          (await handleEconomy(http({ ...payload, xp: 999 }), p)).status,
        ).toBe(400);
        expect((await handleEconomy(http(payload), p)).status).toBe(200);
        expect((await handleEconomy(http(payload), p)).status).toBe(200);
        expect(await gateway(id, 'context')).toMatchObject({ xp: 8, coins: 3 });
      }
    });
    test('RLS, private grants and editable checkpoint flags cannot grant resources or another player data', async () => {
      const id = await newTraveler(),
        other = await newTraveler(userB);
      await gateway(id, 'journey-context');
      const a = await connect('authenticated', userA),
        anon = await connect('anon');
      try {
        for (const sql of [
          'UPDATE public.wallets SET coins=999 WHERE traveler_id=$1',
          'UPDATE public.travelers SET xp=999 WHERE id=$1',
          "INSERT INTO public.inventory(traveler_id,item_id) VALUES($1,'invented')",
          'SELECT public.add_coins($1,999)',
          'SELECT * FROM economy_private.journeys WHERE traveler_id=$1',
        ])
          await expect(a.query(sql, [id])).rejects.toMatchObject({
            code: '42501',
          });
        expect(
          (await a.query('SELECT * FROM public.travelers WHERE id=$1', [other]))
            .rowCount,
        ).toBe(0);
        await a.query(
          'UPDATE public.travelers SET journey_progress=$2 WHERE id=$1',
          [id, { gardenCompleted: true, gardenRewardGranted: true }],
        );
        expect(
          (
            await a.query(
              'SELECT journey_progress FROM public.travelers WHERE id=$1',
              [id],
            )
          ).rows[0].journey_progress.gardenCompleted,
        ).toBe(false);
        await expect(
          a.query(
            "SELECT public.claim_chest_reward($1,'phase:garden-choice')",
            [id],
          ),
        ).rejects.toMatchObject({ code: '42501' });
        await expect(
          anon.query("SELECT public.economy_authority($1,$2,'context','{}')", [
            userA,
            id,
          ]),
        ).rejects.toMatchObject({ code: '42501' });
        await expect(
          gateway(other, 'context', {}, userA),
        ).rejects.toMatchObject({ code: '42501' });
        const before = await snapshot(id);
        expect(
          (
            await handleEconomy(
              http({
                operation: 'journey-action',
                travelerId: id,
                operationId: randomUUID(),
                action: { type: 'complete', coins: 999 },
              }),
              port(),
            )
          ).status,
        ).toBe(422);
        expect(await snapshot(id)).toEqual(before);
      } finally {
        await a.end();
        await anon.end();
      }
    });
    test('failure after XP/debit and before inventory rolls back state, ledger and balances', async () => {
      const id = await newTraveler(userA, 200);
      await ready(id);
      const before = await snapshot(id);
      await admin.query(
        "ALTER TABLE public.inventory ADD CONSTRAINT synthetic_reject_amulet CHECK(item_id<>'wisdom-amulet') NOT VALID",
      );
      try {
        await expect(
          commitAction(id, { type: 'complete' }),
        ).rejects.toMatchObject({ code: '23514' });
        expect(await snapshot(id)).toEqual(before);
        expect(
          (
            await admin.query(
              "SELECT count(*) n FROM economy_private.journey_rewards WHERE traveler_id=$1 AND reward_key='phase:garden-choice'",
              [id],
            )
          ).rows[0].n,
        ).toBe('0');
      } finally {
        await admin.query(
          'ALTER TABLE public.inventory DROP CONSTRAINT synthetic_reject_amulet',
        );
      }
      await commitAction(id, { type: 'complete' });
      expect((await gateway(id, 'context')).xp).toBe(120);
    });
    test('operation IDs bind payloads and stale revisions do not write partial state', async () => {
      const id = await newTraveler();
      await commitAction(id, { type: 'advance', step: 'explore' });
      const a = await commitAction(id, { type: 'collect', id: 'coins-grove' });
      await expect(
        gateway(id, 'journey-commit', { ...a.payload, digest: 'b'.repeat(64) }),
      ).rejects.toMatchObject({ code: '22023' });
      await expect(
        gateway(id, 'journey-commit', {
          ...a.payload,
          operationId: randomUUID(),
        }),
      ).rejects.toMatchObject({ code: '40001' });
      expect((await gateway(id, 'context')).coins).toBe(8);
    });
    test('chest purchase/open concurrency consumes one chest and never double-debits', async () => {
      const id = await newTraveler(userA, 100),
        op = randomUUID(),
        clients = await Promise.all(
          Array.from({ length: 6 }, () => connect('authenticated', userA)),
        );
      try {
        const bought = await Promise.all(
          clients.map((c) =>
            c.query("SELECT public.purchase_chest($1,'common',$2) r", [id, op]),
          ),
        );
        expect(bought.filter((x) => !x.rows[0].r.duplicate)).toHaveLength(1);
        expect((await gateway(id, 'context')).coins).toBe(60);
        const opened = await Promise.all(
          clients.map((c) =>
            c.query("SELECT public.open_chest($1,'common',$2) r", [id, op]),
          ),
        );
        expect(opened.filter((x) => !x.rows[0].r.duplicate)).toHaveLength(1);
        expect(new Set(opened.map((x) => x.rows[0].r.coins)).size).toBe(1);
        expect(
          (
            await admin.query(
              'SELECT count(*) n FROM public.traveler_chests WHERE traveler_id=$1',
              [id],
            )
          ).rows[0].n,
        ).toBe('0');
        evidence.concurrent_chest = {
          requests: 6,
          charged_purchases: 1,
          opened_chests: 1,
        };
      } finally {
        await Promise.all(clients.map((c) => c.end()));
      }
    });
    test('server-approved Guild self-complete and leader-approval missions retain tiers and one claim', async () => {
      const leader = await newTraveler(),
        member = await newTraveler(userB),
        a = await connect('authenticated', userA),
        b = await connect('authenticated', userB);
      try {
        const guild = (
          await a.query(
            "SELECT public.create_guild($1,'Guilda Sintetica',null) id",
            [leader],
          )
        ).rows[0].id;
        const request = (
          await b.query('SELECT public.request_join_guild($1,$2) id', [
            guild,
            member,
          ])
        ).rows[0].id;
        await a.query('SELECT public.review_guild_join_request($1,$2,true)', [
          request,
          leader,
        ]);
        for (const [mode, tier, xp, coins, chest] of [
          ['self_complete', 'normal', 80, 25, 'common'],
          ['leader_approval', 'great', 240, 100, 'uncommon'],
        ] as const) {
          const mission = (
            await a.query(
              "SELECT public.create_guild_mission($1,'Missao Sintetica',null,'practical_activity',null,null,$2,$3,null,null,true,null) id",
              [leader, mode, tier],
            )
          ).rows[0].id;
          await b.query('SELECT public.start_guild_mission($1,$2)', [
            mission,
            member,
          ]);
          const before = await gateway(member, 'context', {}, userB);
          await b.query(
            "SELECT public.submit_guild_mission($1,$2,'Evidencia sintetica')",
            [mission, member],
          );
          if (mode === 'leader_approval') {
            expect(await gateway(member, 'context', {}, userB)).toEqual(before);
            await expect(
              b.query('SELECT public.review_guild_mission($1,$2,$2,true)', [
                mission,
                member,
              ]),
            ).rejects.toMatchObject({ code: '42501' });
            await a.query('SELECT public.review_guild_mission($1,$2,$3,true)', [
              mission,
              member,
              leader,
            ]);
            await expect(
              a.query('SELECT public.review_guild_mission($1,$2,$3,true)', [
                mission,
                member,
                leader,
              ]),
            ).rejects.toMatchObject({ code: 'P0001' });
          }
          const after = await gateway(member, 'context', {}, userB);
          expect(after.xp - before.xp).toBe(xp);
          expect(after.coins - before.coins).toBe(
            coins + (before.xp < 200 && after.xp >= 200 ? 10 : 0),
          );
          expect(
            (
              await admin.query(
                'SELECT quantity FROM public.traveler_chests WHERE traveler_id=$1 AND chest_type=$2',
                [member, chest],
              )
            ).rows[0].quantity,
          ).toBe(1);
          await expect(
            b.query("SELECT public.submit_guild_mission($1,$2,'Replay')", [
              mission,
              member,
            ]),
          ).rejects.toMatchObject({ code: 'P0001' });
          await expect(
            b.query('SELECT public.apply_guild_mission_reward($1,$2)', [
              mission,
              member,
            ]),
          ).rejects.toMatchObject({ code: '42501' });
        }
        evidence.guild_missions = {
          self_complete: { xp: 80, coins: 25, chest: 'common' },
          leader_approval: {
            xp: 240,
            coins: 100,
            level_bonus: 10,
            chest: 'uncommon',
          },
          duplicate_claims: 0,
        };
      } finally {
        await a.end();
        await b.end();
      }
    });
    test('concurrent distinct operation IDs cannot duplicate a phase entitlement', async () => {
      const id = await newTraveler();
      await ready(id);
      const ctx = await gateway(id, 'journey-context'),
        r = transitionJourney(ctx.state, { type: 'complete' });
      const payload = () => ({
        operationId: randomUUID(),
        revision: ctx.revision,
        state: r.state,
        rewardKey: r.rewardKey,
        digest: 'a'.repeat(64),
      });
      const clients = await Promise.all([connect(), connect()]);
      try {
        const outcomes = await Promise.allSettled(
          clients.map((c) => gatewayOn(c, id, 'journey-commit', payload())),
        );
        expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(
          1,
        );
        const failed = outcomes.find(
          (o) => o.status === 'rejected',
        ) as PromiseRejectedResult;
        expect(failed.reason.code).toBe('40001');
        await commitAction(id, { type: 'complete' });
        expect(await gateway(id, 'context')).toMatchObject({
          coins: 90,
          xp: 120,
        });
        evidence.distinct_phase_operations = {
          concurrent_requests: 2,
          optimistic_conflicts: 1,
          phase_grants: 1,
        };
      } finally {
        await Promise.all(clients.map((c) => c.end()));
      }
    });
  },
);
