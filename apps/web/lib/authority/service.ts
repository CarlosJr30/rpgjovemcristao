import { createHash } from 'node:crypto';
import {
  ARENA_CARD_BALANCE_VERSION,
  createArenaDeckBattle,
  isArenaCard,
  resolveArenaCommand,
  validateArenaDeck,
  type ArenaCard,
  type ArenaProductAction,
  type BattleState,
  type BattleParticipantSnapshot,
} from '@rpg/game-engine';
import {
  TRAINING_OPPONENTS,
  travelerBattleSnapshot,
} from '../../features/journey/data/arena';
import { TOWER_FLOORS, TOWER_VERSION } from '../../features/arena-tower/config';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Traveler,
} from '../../features/journey/domain/traveler';
import { EQUIPMENT_CATALOG } from '../../features/journey/data/equipmentCatalog';
import { levelForXp } from '../../features/journey/data/progression';

export class AuthorityError extends Error {
  constructor(public status: number) {
    super('Operação oficial indisponível ou não autorizada.');
  }
}
export type AuthorityPort = {
  authenticate(
    token: string,
  ): Promise<{ id: string; anonymous: boolean } | null>;
  call<T>(
    user: string,
    traveler: string,
    operation: string,
    payload?: object,
  ): Promise<T>;
};
export type CanonicalContext = {
  name: string;
  xp: number;
  coins: number;
  attributes: Traveler['attributes'];
  equipped: Traveler['equipped'];
  inventory: { item_id: string; quantity: number }[];
};
export type OwnedCard = { card: ArenaCard; version: string; receiptId: string };
export type BattleRecord = {
  id: string;
  traveler_id: string;
  seed: number;
  player: BattleParticipantSnapshot;
  opponent: BattleParticipantSnapshot;
  mode: 'arena-v3' | 'tower-v3';
  revision: number;
  state: BattleState | null;
  catalog_version: string;
  rules_version: string;
  cards: ArenaCard[];
  floor: number | null;
  settled_at: string | null;
  reward: RewardReceipt | null;
  receipt_id: string | null;
};
export type RewardReceipt = {
  levelBonusCoins?: number;
  xp: number;
  coins: number;
  rewarded: boolean;
  reason: string;
  status: 'confirmed' | 'blocked';
  outcome: 'victory' | 'defeat';
};
export type BattleView = {
  state: BattleState;
  revision: number;
  receiptId: string | null;
  reward: RewardReceipt | null;
  floor: number | null;
};
const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(v);
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const requireValue = (v: unknown, status = 400) => {
  if (!v) throw new AuthorityError(status);
};
function exact(body: Record<string, unknown>, names: string[]) {
  requireValue(
    Object.keys(body).length === names.length &&
      names.every((n) => Object.hasOwn(body, n)),
  );
}
function snapshot(id: string, c: CanonicalContext) {
  const base = createTraveler(
    c.name,
    DEFAULT_APPEARANCE,
    id,
    new Date().toISOString(),
  );
  return travelerBattleSnapshot({
    ...base,
    xp: c.xp,
    level: levelForXp(c.xp),
    coins: c.coins,
    attributes: c.attributes,
    equipped: c.equipped,
    inventory: c.inventory.flatMap((row) => {
      const item = EQUIPMENT_CATALOG.find((i) => i.id === row.item_id);
      return item && row.quantity > 0
        ? [{ ...item, quantity: row.quantity }]
        : [];
    }),
  });
}
function canonicalState(b: BattleRecord) {
  requireValue(b.rules_version === ARENA_CARD_BALANCE_VERSION, 409);
  return (
    b.state ??
    createArenaDeckBattle(
      b.player,
      b.opponent,
      b.seed,
      b.id,
      b.cards.map((c) => c.id),
      b.cards,
    )
  );
}
function view(b: BattleRecord): BattleView {
  return {
    state: canonicalState(b),
    revision: b.revision,
    receiptId: b.receipt_id,
    reward: b.reward,
    floor: b.floor,
  };
}

/** Already verified subject passed separately; body never supplies owner or result. */
export async function executeAuthority(
  port: AuthorityPort,
  user: string,
  value: unknown,
): Promise<unknown> {
  requireValue(object(value));
  const b = value as Record<string, unknown>;
  requireValue(uuid(user) && uuid(b.travelerId));
  const traveler = b.travelerId as string;
  const call = <T>(op: string, payload: object = {}) =>
    port.call<T>(user, traveler, op, payload);
  switch (b.operation) {
    case 'collection':
    case 'starter':
    case 'tower':
      exact(b, ['operation', 'travelerId']);
      return call(b.operation);
    case 'resume': {
      exact(b, ['operation', 'travelerId', 'mode']);
      requireValue(b.mode === 'arena-v3' || b.mode === 'tower-v3');
      const record = await call<BattleRecord | null>('latest', {
        mode: b.mode,
      });
      return record ? view(record) : null;
    }
    case 'battle': {
      exact(b, ['operation', 'travelerId', 'battleId']);
      requireValue(uuid(b.battleId));
      return view(await call<BattleRecord>('battle', { battleId: b.battleId }));
    }
    case 'start': {
      exact(b, [
        'operation',
        'travelerId',
        'requestId',
        'mode',
        'opponentId',
        'floor',
        'ids',
      ]);
      requireValue(
        uuid(b.requestId) &&
          Array.isArray(b.ids) &&
          b.ids.every((id) => typeof id === 'string' && id.length <= 100),
      );
      requireValue(b.mode === 'arena-v3' || b.mode === 'tower-v3');
      const collection = await call<OwnedCard[]>('collection');
      requireValue(
        collection.every((e) => isArenaCard(e.card)),
        503,
      );
      const ids = b.ids as string[];
      requireValue(
        !validateArenaDeck(
          ids,
          collection.map((e) => e.card),
        ),
        422,
      );
      let opponent: BattleParticipantSnapshot | undefined;
      if (b.mode === 'tower-v3') {
        requireValue(
          Number.isInteger(b.floor) &&
            (b.floor as number) >= 1 &&
            (b.floor as number) <= 7 &&
            b.opponentId === null,
        );
        opponent = TOWER_FLOORS[(b.floor as number) - 1].snapshot;
      } else {
        requireValue(b.floor === null);
        opponent = TRAINING_OPPONENTS.find((o) => o.id === b.opponentId);
      }
      requireValue(opponent, 422);
      const context = await call<CanonicalContext>('context');
      const digest = createHash('sha256')
        .update(JSON.stringify([b.mode, b.opponentId, b.floor, ids]))
        .digest('hex');
      return view(
        await call<BattleRecord>('start', {
          requestId: b.requestId,
          digest,
          mode: b.mode,
          ids,
          context,
          player: snapshot(traveler, context),
          opponent,
          floor: b.floor,
          towerVersion: b.mode === 'tower-v3' ? TOWER_VERSION : null,
          rulesVersion: ARENA_CARD_BALANCE_VERSION,
        }),
      );
    }
    case 'command': {
      exact(b, [
        'operation',
        'travelerId',
        'battleId',
        'revision',
        'round',
        'commandId',
        'action',
      ]);
      requireValue(
        uuid(b.battleId) &&
          uuid(b.commandId) &&
          Number.isInteger(b.revision) &&
          Number.isInteger(b.round),
      );
      requireValue(
        b.action === 'attack' ||
          b.action === 'defend' ||
          (typeof b.action === 'string' &&
            b.action.startsWith('card:') &&
            b.action.length <= 105),
      );
      const registered = await call<BattleRecord>('battle', {
        battleId: b.battleId,
      });
      requireValue(
        registered.revision === b.revision && !registered.settled_at,
        409,
      );
      const current = canonicalState(registered);
      const next = resolveArenaCommand(
        current,
        b.battleId as string,
        b.round as number,
        b.action as ArenaProductAction,
      );
      requireValue(next !== current, 422);
      return view(
        await call<BattleRecord>('commit', {
          battleId: b.battleId,
          revision: b.revision,
          commandId: b.commandId,
          command: { round: b.round, action: b.action },
          state: next,
          rulesVersion: ARENA_CARD_BALANCE_VERSION,
        }),
      );
    }
    default:
      throw new AuthorityError(400);
  }
}

export async function handleAuthority(
  request: Request,
  port: AuthorityPort,
): Promise<Response> {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const auth = request.headers.get('authorization');
    requireValue(auth?.startsWith('Bearer ') && auth.length <= 16384, 401);
    const user = await port.authenticate(auth!.slice(7));
    requireValue(user && !user.anonymous && uuid(user.id), 401);
    const reader = request.body?.getReader();
    requireValue(reader);
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const part = await reader!.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 16384) {
        await reader!.cancel();
        throw new AuthorityError(413);
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let value: unknown;
    try {
      value = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new AuthorityError(400);
    }
    return Response.json(await executeAuthority(port, user!.id, value), {
      headers,
    });
  } catch (error) {
    return Response.json(
      { error: 'Operação oficial indisponível ou não autorizada.' },
      { headers, status: error instanceof AuthorityError ? error.status : 503 },
    );
  }
}
