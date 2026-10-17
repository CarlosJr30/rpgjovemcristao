import {
  replayCardBattle,
  createCardBattle,
  createArenaBattle,
  resolveArenaRound,
  arenaSpecials,
  type ArenaAction,
  type BattleParticipantSnapshot,
  type TrainingReward,
} from '@rpg/game-engine';
import {
  TRAINING_OPPONENTS,
  travelerBattleSnapshot,
} from '../../features/journey/data/arena';
import { SHOP_OFFERS } from '../../features/journey/data/equipmentCatalog';
import type { Traveler } from '../../features/journey/domain/traveler';
import type { JourneyAction } from './journey-authority';

export class EconomyError extends Error {
  constructor(public readonly status: number) {
    super('Operação econômica não autorizada ou indisponível.');
  }
}
export type RegisteredBattle = {
  mode?: 'card' | 'classic';
  id: string;
  travelerId: string;
  seed: number;
  player: BattleParticipantSnapshot;
  opponent: BattleParticipantSnapshot;
};
export type EconomyPort = {
  authenticate(
    token: string,
  ): Promise<{ id: string; anonymous: boolean } | null>;
  loadTraveler(userId: string, travelerId: string): Promise<Traveler>;
  start(
    userId: string,
    travelerId: string,
    player: BattleParticipantSnapshot,
    opponent: BattleParticipantSnapshot,
    mode?: 'card' | 'classic',
  ): Promise<RegisteredBattle>;
  battle(
    userId: string,
    travelerId: string,
    battleId: string,
  ): Promise<RegisteredBattle>;
  settle(
    userId: string,
    travelerId: string,
    battleId: string,
    won: boolean,
  ): Promise<TrainingReward>;
  purchase(
    userId: string,
    travelerId: string,
    itemId: string,
  ): Promise<unknown>;
  journey?(
    userId: string,
    travelerId: string,
    operationId: string,
    action: JourneyAction,
  ): Promise<unknown>;
};
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(v);
function keys(v: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(v).some((key) => !allowed.includes(key)))
    throw new EconomyError(400);
}

/** HTTP boundary: the verified subject is never read from the body or user metadata. */
export async function handleEconomy(
  request: Request,
  port: EconomyPort,
): Promise<Response> {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ') || authorization.length > 16384)
      throw new EconomyError(401);
    const user = await port.authenticate(authorization.slice(7));
    if (!user || user.anonymous || !uuid(user.id)) throw new EconomyError(401);
    // Stream cap also covers chunked bodies; do not trust Content-Length alone.
    const reader = request.body?.getReader();
    if (!reader) throw new EconomyError(400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 8388608) {
        await reader.cancel();
        throw new EconomyError(413);
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new EconomyError(400);
    }
    if (!object(body) || !uuid(body.travelerId)) throw new EconomyError(400);
    if (body.operation !== 'journey-action' && size > 262144)
      throw new EconomyError(413);
    const travelerId = body.travelerId;
    if (body.operation === 'journey-action') {
      keys(body, ['operation', 'travelerId', 'operationId', 'action']);
      if (!uuid(body.operationId) || !port.journey) throw new EconomyError(400);
      return Response.json(
        await port.journey(
          user.id,
          travelerId,
          body.operationId,
          body.action as JourneyAction,
        ),
        { headers },
      );
    }
    if (
      body.operation === 'start-card-battle' ||
      body.operation === 'start-classic-battle'
    ) {
      keys(body, ['operation', 'travelerId', 'opponentId']);
      let opponent = TRAINING_OPPONENTS.find(
        (candidate) => candidate.id === body.opponentId,
      );
      if (
        !opponent &&
        body.operation === 'start-classic-battle' &&
        uuid(body.opponentId)
      )
        opponent = travelerBattleSnapshot(
          await port.loadTraveler(user.id, body.opponentId),
        );
      if (!opponent || opponent.id === travelerId) throw new EconomyError(400);
      const traveler = await port.loadTraveler(user.id, travelerId);
      if (traveler.id !== travelerId) throw new EconomyError(403);
      const registered =
        body.operation === 'start-classic-battle'
          ? await port.start(
              user.id,
              travelerId,
              travelerBattleSnapshot(traveler),
              opponent,
              'classic',
            )
          : await port.start(
              user.id,
              travelerId,
              travelerBattleSnapshot(traveler),
              opponent,
            );
      return Response.json(
        body.operation === 'start-classic-battle'
          ? createArenaBattle(
              registered.player,
              registered.opponent,
              registered.seed,
              registered.id,
            )
          : createCardBattle(
              registered.player,
              registered.opponent,
              registered.seed,
              registered.id,
            ),
        { headers },
      );
    }
    if (
      body.operation === 'settle-card-battle' ||
      body.operation === 'settle-classic-battle'
    ) {
      keys(body, ['operation', 'travelerId', 'battleId', 'commands']);
      if (
        !uuid(body.battleId) ||
        !Array.isArray(body.commands) ||
        body.commands.length > 2000
      )
        throw new EconomyError(400);
      const registered = await port.battle(user.id, travelerId, body.battleId);
      // Only commands come from the browser. Seed, actors, stats, equipment and ID
      // are the immutable server-issued record, including on retries after level-up.
      if (
        registered.travelerId !== travelerId ||
        registered.id !== body.battleId
      )
        throw new EconomyError(403);
      const classic = body.operation === 'settle-classic-battle';
      if ((registered.mode ?? 'card') !== (classic ? 'classic' : 'card'))
        throw new EconomyError(422);
      if (classic) {
        if (body.commands.length > 30) throw new EconomyError(422);
        let battle = createArenaBattle(
          registered.player,
          registered.opponent,
          registered.seed,
          registered.id,
        );
        const valid = [
          'attack',
          'defend',
          ...arenaSpecials.map((s) => 'special:' + s.id),
        ];
        for (const action of body.commands) {
          if (!valid.includes(action) || battle.status === 'finished')
            throw new EconomyError(422);
          const next = resolveArenaRound(battle, action as ArenaAction);
          if (next === battle) throw new EconomyError(422);
          battle = next;
        }
        if (battle.status !== 'finished') throw new EconomyError(422);
        return Response.json(
          await port.settle(
            user.id,
            travelerId,
            registered.id,
            battle.winnerId === travelerId,
          ),
          { headers },
        );
      }
      const battle = replayCardBattle(
        { version: 1, ...registered, commands: body.commands },
        travelerId,
      );
      if (!battle || battle.phase !== 'finished') throw new EconomyError(422);
      const reward = await port.settle(
        user.id,
        travelerId,
        registered.id,
        battle.winner === 'player',
      );
      return Response.json(reward, { headers });
    }
    if (body.operation === 'purchase-equipment') {
      keys(body, ['operation', 'travelerId', 'itemId']);
      const offer = SHOP_OFFERS.find(
        (candidate) => candidate.equipment.id === body.itemId,
      );
      if (!offer) throw new EconomyError(400);
      return Response.json(
        await port.purchase(user.id, travelerId, offer.equipment.id),
        { headers },
      );
    }
    throw new EconomyError(400);
  } catch (error) {
    return Response.json(
      { error: 'Operação econômica não autorizada ou indisponível.' },
      {
        status: error instanceof EconomyError ? error.status : 503,
        headers,
      },
    );
  }
}
