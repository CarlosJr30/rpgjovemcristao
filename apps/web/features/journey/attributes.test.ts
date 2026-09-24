import { describe, expect, it } from 'vitest';
import { calculateTotalAttributes, equipmentSwapDelta } from './data/attributes';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import { createTraveler, DEFAULT_APPEARANCE, GARDEN_HELMET, type Equipment } from './domain/traveler';

const id = '12345678-1234-4321-8234-123456789abc';
const date = '2026-09-24T00:00:00.000Z';
const item = (equipmentId: string) => {
  const equipment = EQUIPMENT_CATALOG.find((candidate) => candidate.id === equipmentId);
  if (!equipment) throw new Error(`Item de teste ausente: ${equipmentId}`);
  return equipment;
};

describe('atributos derivados do Viajante', () => {
  it('separa base, equipamentos, progressão e temporários', () => {
    const traveler = createTraveler('Luca', DEFAULT_APPEARANCE, id, date);
    expect(calculateTotalAttributes(traveler, { defense: 1 })).toEqual({
      base: { life: 1, strength: 1, defense: 1, wisdom: 1 },
      equipment: { life: 1, strength: 0, defense: 0, wisdom: 0 },
      progression: { life: 0, strength: 0, defense: 0, wisdom: 0 },
      temporary: { life: 0, strength: 0, defense: 1, wisdom: 0 },
      total: { life: 2, strength: 1, defense: 2, wisdom: 1 },
    });
  });

  it('soma botas, espada e elmo e remove a espada sem alterar a base', () => {
    const traveler = createTraveler('Luca', DEFAULT_APPEARANCE, id, date);
    const sword = item('traveler-sword-common');
    traveler.inventory.push(sword, GARDEN_HELMET);
    traveler.equipped.weapon = sword.id;
    traveler.equipped.helmet = GARDEN_HELMET.id;
    expect(calculateTotalAttributes(traveler).total).toEqual({ life: 2, strength: 3, defense: 2, wisdom: 1 });
    delete traveler.equipped.weapon;
    expect(calculateTotalAttributes(traveler).total).toEqual({ life: 2, strength: 1, defense: 2, wisdom: 1 });
    expect(traveler.attributes).toEqual({ life: 1, strength: 1, defense: 1, wisdom: 1 });
  });

  it('troca o item do slot e nunca acumula bônus em ciclos repetidos', () => {
    const traveler = createTraveler('Luca', DEFAULT_APPEARANCE, id, date);
    const sword = item('traveler-sword-common');
    const betterSword: Equipment = {
      id: 'traveler-sword-test', name: 'Espada de teste', slot: 'weapon', rarity: 'raro', power: 4,
      stats: { strength: 3, wisdom: 1 },
    };
    traveler.inventory.push(sword, betterSword);
    traveler.equipped.weapon = sword.id;
    expect(equipmentSwapDelta(traveler, betterSword)).toEqual({ life: 0, strength: 1, defense: 0, wisdom: 1 });
    traveler.equipped.weapon = betterSword.id;
    expect(calculateTotalAttributes(traveler).total).toEqual({ life: 2, strength: 4, defense: 1, wisdom: 2 });
    for (let cycle = 0; cycle < 10; cycle += 1) {
      traveler.equipped.weapon = sword.id;
      expect(calculateTotalAttributes(traveler).total.strength).toBe(3);
      delete traveler.equipped.weapon;
      expect(calculateTotalAttributes(traveler).total.strength).toBe(1);
    }
  });

  it('aceita bônus temporário sem persistir ou misturar Viajantes', () => {
    const first = createTraveler('Luca', DEFAULT_APPEARANCE, id, date);
    const second = createTraveler('Bia', DEFAULT_APPEARANCE, '12345678-1234-4321-8234-000000000002', date);
    expect(calculateTotalAttributes(first, { wisdom: 2 }).total.wisdom).toBe(3);
    expect(calculateTotalAttributes(first).total.wisdom).toBe(1);
    expect(calculateTotalAttributes(second).total).toEqual({ life: 2, strength: 1, defense: 1, wisdom: 1 });
  });
});
