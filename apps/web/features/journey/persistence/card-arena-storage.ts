import {
  cardBattleTranscript,
  replayCardBattle,
  type CardBattle,
  type TrainingReward,
} from '@rpg/game-engine';

export type CardArenaScope = Readonly<{ ownerId: string; travelerId: string }>;
export type CardSettlement = Readonly<{
  status: 'reserved' | 'applied' | 'failed';
  reward: TrainingReward;
}>;
export type CardArenaSession = Readonly<{
  battle: CardBattle;
  settlement: CardSettlement | null;
}>;
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export const CARD_ARENA_STORAGE_PREFIX = 'rpg-jovem-cristao:card-arena:v1:';
const validId = (id: string) =>
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id);
export const cardArenaKey = (scope: CardArenaScope) => {
  if (
    !validId(scope.travelerId) ||
    (scope.ownerId !== 'local' && !validId(scope.ownerId))
  )
    throw Error('Invalid card arena scope');
  return CARD_ARENA_STORAGE_PREFIX + scope.ownerId + ':' + scope.travelerId;
};
function validSettlement(value: unknown): value is CardSettlement {
  if (!value || typeof value !== 'object') return false;
  const v = value as CardSettlement,
    r = v.reward;
  return (
    ['reserved', 'applied', 'failed'].includes(v.status) &&
    !!r &&
    typeof r.rewarded === 'boolean' &&
    ['victory', 'defeat', 'daily-limit'].includes(r.reason) &&
    (r.rewarded ? r.xp === 8 && r.coins === 3 : r.xp === 0 && r.coins === 0)
  );
}
export function createCardArenaStorage(storage: () => StoragePort) {
  const api = {
    load(scope: CardArenaScope): CardArenaSession | null {
      try {
        const raw = storage().getItem(cardArenaKey(scope));
        if (!raw || raw.length > 262144) return null;
        const value = JSON.parse(raw) as {
          version: number;
          ownerId: string;
          transcript: unknown;
          settlement: unknown;
        };
        if (value.version !== 1 || value.ownerId !== scope.ownerId) return null;
        const battle = replayCardBattle(value.transcript, scope.travelerId);
        if (!battle) return null;
        if (
          value.settlement !== null &&
          (!validSettlement(value.settlement) || battle.phase !== 'finished')
        )
          return null;
        return {
          battle,
          settlement: value.settlement as CardSettlement | null,
        };
      } catch {
        return null;
      }
    },
    write(scope: CardArenaScope, session: CardArenaSession): boolean {
      try {
        if (session.battle.player.snapshot.id !== scope.travelerId)
          return false;
        const key = cardArenaKey(scope),
          raw = JSON.stringify({
            version: 1,
            ownerId: scope.ownerId,
            transcript: cardBattleTranscript(session.battle),
            settlement: session.settlement,
          });
        if (raw.length > 262144) return false;
        storage().setItem(key, raw);
        return storage().getItem(key) === raw;
      } catch {
        return false;
      }
    },
    start(scope: CardArenaScope, battle: CardBattle) {
      return api.write(scope, { battle, settlement: null });
    },
    advance(
      scope: CardArenaScope,
      battle: CardBattle,
      expectedRevision: number,
    ) {
      const current = api.load(scope);
      return (
        !!current &&
        !current.settlement &&
        current.battle.id === battle.id &&
        current.battle.revision === expectedRevision &&
        battle.revision === expectedRevision + 1 &&
        api.write(scope, { battle, settlement: null })
      );
    },
    reserve(scope: CardArenaScope, battleId: string, reward: TrainingReward) {
      const current = api.load(scope);
      return (
        !!current &&
        current.battle.id === battleId &&
        current.battle.phase === 'finished' &&
        !current.settlement &&
        api.write(scope, {
          ...current,
          settlement: { status: 'reserved', reward },
        })
      );
    },
    complete(
      scope: CardArenaScope,
      battleId: string,
      reward: TrainingReward,
      status: 'applied' | 'failed',
    ) {
      const current = api.load(scope);
      return (
        !!current &&
        current.battle.id === battleId &&
        current.settlement?.status === 'reserved' &&
        api.write(scope, { ...current, settlement: { status, reward } })
      );
    },
  };
  return api;
}
export const cardArenaStorage = createCardArenaStorage(
  () => window.localStorage,
);
