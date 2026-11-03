import { describe, expect, it } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { trainingTraveler } from './overlay';
import { calculateTotalAttributes } from '../journey/data/attributes';
import { SHOP_OFFERS } from '../journey/data/equipmentCatalog';
import type { TrainingState } from '../../lib/training-qa/store';
describe('training traveler projection', () => {
  it('preserves canonical level XP attributes equipment wallet and inventory without mutation', () => {
    const base = createTraveler(
      'Synthetic existing hero',
      DEFAULT_APPEARANCE,
      '10000000-0000-4000-8000-000000000003',
      '2026-01-01T00:00:00Z',
    );
    base.level = 50;
    base.xp = 4321;
    base.coins = 1234;
    const sword = SHOP_OFFERS[0].equipment;
    base.inventory.push(sword);
    base.equipped.weapon = sword.id;
    const before = structuredClone(base);
    const state = {
      actor: base.id,
      coins: 10000,
      chests: 1,
      items: { [sword.id]: 1 },
      equipped: { weapon: sword.id },
    } as unknown as TrainingState;
    const overlay = trainingTraveler(base, state);
    expect(base).toEqual(before);
    expect(overlay.coins).toBe(10000);
    expect(overlay.xp).toBe(before.xp);
    expect(overlay.level).toBe(50);
    expect(overlay.attributes).toEqual(before.attributes);
    expect(calculateTotalAttributes(overlay).total).toEqual(
      calculateTotalAttributes(base).total,
    );
    expect(overlay.inventory.filter((i) => i.id === sword.id)).toHaveLength(1);
  });
  it('unequips only the projected slot and hides old chest stacks from training', () => {
    const base = createTraveler(
      'Synthetic existing hero',
      DEFAULT_APPEARANCE,
      '10000000-0000-4000-8000-000000000003',
      '2026-01-01T00:00:00Z',
    );
    const sword = SHOP_OFFERS[0].equipment;
    base.inventory.push(sword);
    base.equipped.weapon = sword.id;
    base.chests.epic = 9;
    const overlay = trainingTraveler(base, {
      actor: base.id,
      coins: 10000,
      chests: 2,
      items: {},
      equipped: { weapon: null },
    } as unknown as TrainingState);
    expect(overlay.equipped.weapon).toBeUndefined();
    expect(base.equipped.weapon).toBe(sword.id);
    expect(overlay.chests.epic).toBe(0);
    expect(base.chests.epic).toBe(9);
    expect(overlay.chests.common).toBe(2);
  });
  it('rejects a response bound to a different hero', () => {
    const base = createTraveler(
      'Synthetic hero',
      DEFAULT_APPEARANCE,
      '10000000-0000-4000-8000-000000000003',
      '2026-01-01T00:00:00Z',
    );
    expect(() =>
      trainingTraveler(base, { actor: 'another' } as TrainingState),
    ).toThrow();
  });
});
