import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
  createCardBattle,
  playCombatCard,
  combatCard,
  type CardBattle,
  calculateTrainingReward,
} from '@rpg/game-engine';
import {
  cardArenaStorage,
  cardArenaKey,
  type CardArenaScope,
} from './persistence/card-arena-storage';
import {
  arenaRepository,
  ARENA_STORAGE_KEY,
} from './persistence/arena-storage';
import { settleCardArenaReward } from './data/card-arena-reward';
import { travelerBattleSnapshot, TRAINING_OPPONENTS } from './data/arena';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';

class MemoryStorage {
  values = new Map<string, string>();
  fail = false;
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.fail) throw Error('quota');
    this.values.set(key, value);
  }
}
let storage: MemoryStorage;
const scope: CardArenaScope = {
  ownerId: 'local',
  travelerId: '00000000-0000-4000-8000-000000000076',
};
function setup(id = 'battle') {
  const t = createTraveler(
    'Teste Cartas',
    DEFAULT_APPEARANCE,
    scope.travelerId,
    '2026-10-15T00:00:00.000Z',
  );
  return createCardBattle(
    {
      ...travelerBattleSnapshot(t),
      attributes: { life: 3, strength: 30, defense: 3, wisdom: 1 },
    },
    TRAINING_OPPONENTS[0],
    1,
    id,
  );
}
function victory(id = 'battle'): CardBattle {
  const battle = setup(id);
  const attack = battle.hand.find(
    (item) =>
      combatCard(item.cardId)?.damage && !combatCard(item.cardId)?.focusCost,
  )!;
  const win = playCombatCard(battle, attack.id);
  expect(win.winner).toBe('player');
  return win;
}
beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal('window', { localStorage: storage });
});
describe('Card Arena persistence and settlement', () => {
  it('persists an action transcript and reconstructs energy, hand and damage after reload', () => {
    const a = setup();
    expect(cardArenaStorage.start(scope, a)).toBe(true);
    const next = playCombatCard(
      a,
      a.hand.find((c) => !combatCard(c.cardId)?.focusCost)!.id,
    );
    expect(cardArenaStorage.advance(scope, next, 0)).toBe(true);
    expect(cardArenaStorage.load(scope)?.battle).toEqual(next);
    expect(cardArenaStorage.advance(scope, next, 0)).toBe(false);
  });
  it('isolates owner and traveler, and rejects corruption rather than changing the journey save', () => {
    cardArenaStorage.start(scope, setup());
    const other = { ...scope, ownerId: '00000000-0000-4000-8000-000000000077' };
    expect(cardArenaStorage.load(other)).toBeNull();
    storage.setItem(cardArenaKey(other), storage.getItem(cardArenaKey(scope))!);
    expect(cardArenaStorage.load(other)).toBeNull();
    storage.setItem(cardArenaKey(scope), 'broken');
    expect(cardArenaStorage.load(scope)).toBeNull();
    expect(storage.getItem('rpg-jovem-cristao:journey:v1')).toBeNull();
  });
  it('reserves before applying and grants a victory only once across repeated callbacks and reload', () => {
    cardArenaStorage.start(scope, victory());
    const apply = vi.fn(() => true);
    const result = settleCardArenaReward(scope, apply);
    expect(result?.status).toBe('applied');
    expect(result?.reward).toEqual(calculateTrainingReward(true, 0));
    expect(apply).toHaveBeenCalledTimes(1);
    expect(cardArenaStorage.load(scope)?.settlement?.status).toBe('applied');
    settleCardArenaReward(scope, apply);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(arenaRepository.list(scope.travelerId)).toHaveLength(1);
  });
  it('keeps the existing three-per-opponent daily reward limit', () => {
    const apply = vi.fn(() => true);
    for (let i = 0; i < 4; i++) {
      cardArenaStorage.start(scope, victory(`battle-${i}`));
      settleCardArenaReward(scope, apply);
    }
    expect(apply).toHaveBeenCalledTimes(3);
    expect(cardArenaStorage.load(scope)?.settlement?.reward.reason).toBe(
      'daily-limit',
    );
    expect(
      arenaRepository.rewardedToday(scope.travelerId, TRAINING_OPPONENTS[0].id),
    ).toBe(3);
  });
  it('fails closed after an interrupted reservation; does not infer that a credit can be repeated', () => {
    const win = victory();
    cardArenaStorage.start(scope, win);
    cardArenaStorage.reserve(scope, win.id, calculateTrainingReward(true, 0));
    const apply = vi.fn(() => true);
    expect(settleCardArenaReward(scope, apply)?.status).toBe('reserved');
    expect(apply).not.toHaveBeenCalled();
  });
  it('shares the existing daily reward quota with victories from the legacy Arena', () => {
    arenaRepository.add({
      id: 'legacy-win',
      playerId: scope.travelerId,
      opponentId: TRAINING_OPPONENTS[0].id,
      opponentName: 'Aprendiz',
      result: 'victory',
      roundCount: 2,
      createdAt: new Date().toISOString(),
      damageDealt: 32,
      damageTaken: 1,
      abilitiesUsed: 0,
      reward: calculateTrainingReward(true, 0),
    });
    const apply = vi.fn(() => true);
    for (let i = 0; i < 3; i++) {
      cardArenaStorage.start(scope, victory(`mixed-${i}`));
      settleCardArenaReward(scope, apply);
    }
    expect(apply).toHaveBeenCalledTimes(2);
    expect(cardArenaStorage.load(scope)?.settlement?.reward.reason).toBe(
      'daily-limit',
    );
  });
  it('shows no granted reward if saving or applying fails', () => {
    cardArenaStorage.start(scope, victory());
    const apply = vi.fn(() => false);
    expect(settleCardArenaReward(scope, apply)?.status).toBe('failed');
    expect(arenaRepository.list(scope.travelerId)[0].reward.rewarded).toBe(
      false,
    );
    cardArenaStorage.start(scope, victory('another'));
    storage.fail = true;
    const notCalled = vi.fn(() => true);
    expect(settleCardArenaReward(scope, notCalled)).toBeNull();
    expect(notCalled).not.toHaveBeenCalled();
  });
  it('counts uncertain reservations conservatively and validates legacy history records', () => {
    cardArenaStorage.start(scope, victory());
    settleCardArenaReward(scope, () => true);
    const records = JSON.parse(storage.getItem(ARENA_STORAGE_KEY)!);
    records[0].settlement = 'reserved';
    records[0].reward = { coins: 0, xp: 0, rewarded: false, reason: 'victory' };
    storage.setItem(ARENA_STORAGE_KEY, JSON.stringify(records));
    expect(
      arenaRepository.rewardedToday(scope.travelerId, TRAINING_OPPONENTS[0].id),
    ).toBe(1);
  });
});
