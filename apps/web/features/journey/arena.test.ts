import { beforeEach, describe, expect, test } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { SHOP_OFFERS } from './data/equipmentCatalog';
import { travelerBattleSnapshot, TRAINING_OPPONENTS } from './data/arena';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import {
  createArenaBattle,
  resolveArenaRound,
  specialAvailability,
} from '@rpg/game-engine';
import {
  ARENA_STORAGE_KEY,
  arenaRepository,
} from './persistence/arena-storage';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}
const storage = new MemoryStorage();
beforeEach(() => {
  storage.clear();
  Object.assign(globalThis, { window: { localStorage: storage } });
});

describe('integração local da Arena', () => {
  test('treinos são vencíveis com build existente e básico/especial, sem atributos base inventados', () => {
    const traveler = createTraveler(
      'Lia',
      DEFAULT_APPEARANCE,
      'p',
      '2026-09-24T00:00:00.000Z',
    );
    traveler.level = 8;
    traveler.xp = 5600;
    traveler.inventory = EQUIPMENT_CATALOG.map((item) => ({ ...item }));
    traveler.equipped = Object.fromEntries(
      EQUIPMENT_CATALOG.map((item) => [item.slot, item.id]),
    );
    const player = travelerBattleSnapshot(traveler);
    for (const opponent of TRAINING_OPPONENTS) {
      let victories = 0;
      for (let seed = 0; seed < 30; seed++) {
        let battle = createArenaBattle(player, opponent, seed);
        while (battle.status === 'in_progress')
          battle = resolveArenaRound(
            battle,
            specialAvailability(battle.player, 'path-strike') === 'available'
              ? 'special:path-strike'
              : 'attack',
          );
        if (battle.winnerId === 'p') victories++;
      }
      expect(victories, opponent.name).toBeGreaterThan(0);
    }
  });
  test('snapshot congela atributos totais e efeitos dos equipamentos equipados', () => {
    const traveler = createTraveler(
      'Lia',
      DEFAULT_APPEARANCE,
      'traveler-1',
      '2026-09-24T00:00:00.000Z',
    );
    const sword = SHOP_OFFERS[0].equipment;
    traveler.inventory.push(sword);
    traveler.equipped.weapon = sword.id;
    const snapshot = travelerBattleSnapshot(traveler);
    expect(snapshot.attributes).toEqual({
      life: 2,
      strength: 3,
      defense: 1,
      wisdom: 1,
    });
    expect(
      snapshot.equipment.find((item) => item.id === sword.id)?.effectIds,
    ).toContain('path-sword');
    traveler.attributes.strength = 99;
    expect(snapshot.attributes.strength).toBe(3);
  });

  test('histórico isola Viajantes, rejeita duplicata e conta recompensas do dia', () => {
    const reward = {
      xp: 8,
      coins: 3,
      rewarded: true,
      reason: 'victory' as const,
    };
    const record = {
      id: 'battle-1',
      playerId: 'p1',
      opponentId: 'o1',
      opponentName: 'Treino',
      result: 'victory' as const,
      roundCount: 3,
      createdAt: '2026-09-24T12:00:00.000Z',
      damageDealt: 20,
      damageTaken: 5,
      abilitiesUsed: 1,
      reward,
    };
    expect(arenaRepository.add(record)).toBe(true);
    expect(arenaRepository.add(record)).toBe(false);
    expect(arenaRepository.list('p1')).toHaveLength(1);
    expect(arenaRepository.list('p2')).toHaveLength(0);
    expect(
      arenaRepository.rewardedToday(
        'p1',
        'o1',
        new Date('2026-09-24T18:00:00.000Z'),
      ),
    ).toBe(1);
  });

  test('storage inválido ou excessivo é ignorado', () => {
    storage.setItem(ARENA_STORAGE_KEY, JSON.stringify([{ id: null }]));
    expect(arenaRepository.list('p1')).toEqual([]);
    storage.setItem(ARENA_STORAGE_KEY, 'x'.repeat(256_001));
    expect(arenaRepository.list('p1')).toEqual([]);
  });
});
