import { beforeEach, describe, expect, test } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { SHOP_OFFERS } from './data/equipmentCatalog';
import { travelerBattleSnapshot } from './data/arena';
import { ARENA_STORAGE_KEY, arenaRepository } from './persistence/arena-storage';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}
const storage = new MemoryStorage();
beforeEach(() => { storage.clear(); Object.assign(globalThis, { window: { localStorage: storage } }); });

describe('integração local da Arena', () => {
  test('snapshot congela atributos totais e efeitos dos equipamentos equipados', () => {
    const traveler = createTraveler('Lia', DEFAULT_APPEARANCE, 'traveler-1', '2026-09-24T00:00:00.000Z');
    const sword = SHOP_OFFERS[0].equipment;
    traveler.inventory.push(sword);
    traveler.equipped.weapon = sword.id;
    const snapshot = travelerBattleSnapshot(traveler);
    expect(snapshot.attributes).toEqual({ life: 2, strength: 3, defense: 1, wisdom: 1 });
    expect(snapshot.equipment.find((item) => item.id === sword.id)?.effectIds).toContain('path-sword');
    traveler.attributes.strength = 99;
    expect(snapshot.attributes.strength).toBe(3);
  });

  test('histórico isola Viajantes, rejeita duplicata e conta recompensas do dia', () => {
    const reward = { xp: 8, coins: 3, rewarded: true, reason: 'victory' as const };
    const record = { id: 'battle-1', playerId: 'p1', opponentId: 'o1', opponentName: 'Treino', result: 'victory' as const, roundCount: 3, createdAt: '2026-09-24T12:00:00.000Z', damageDealt: 20, damageTaken: 5, abilitiesUsed: 1, reward };
    expect(arenaRepository.add(record)).toBe(true);
    expect(arenaRepository.add(record)).toBe(false);
    expect(arenaRepository.list('p1')).toHaveLength(1);
    expect(arenaRepository.list('p2')).toHaveLength(0);
    expect(arenaRepository.rewardedToday('p1', 'o1', new Date('2026-09-24T18:00:00.000Z'))).toBe(1);
  });

  test('storage inválido ou excessivo é ignorado', () => {
    storage.setItem(ARENA_STORAGE_KEY, JSON.stringify([{ id: null }]));
    expect(arenaRepository.list('p1')).toEqual([]);
    storage.setItem(ARENA_STORAGE_KEY, 'x'.repeat(256_001));
    expect(arenaRepository.list('p1')).toEqual([]);
  });
});
