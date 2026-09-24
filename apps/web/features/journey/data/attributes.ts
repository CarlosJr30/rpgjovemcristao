import {
  ATTRIBUTE_KEYS,
  type AttributeKey,
  type AttributeValues,
  type Equipment,
  type EquipmentStats,
  type Traveler,
} from '../domain/traveler';

export const ATTRIBUTE_LABELS: Readonly<Record<AttributeKey, string>> = {
  life: 'Vida',
  strength: 'Força',
  defense: 'Defesa',
  wisdom: 'Sabedoria',
};

export const ATTRIBUTE_GAMEPLAY_ROLES: Readonly<Record<AttributeKey, string>> = {
  life: 'Resistência em sistemas de gameplay apropriados.',
  strength: 'Capacidade ofensiva em mecânicas futuras adequadas.',
  defense: 'Proteção e redução em desafios apropriados.',
  wisdom: 'Dicas, percepção e opções adicionais em puzzles; nunca resolve o desafio automaticamente.',
};

// Progressão está preparada, mas permanece vazia até existir balanceamento aprovado.
export const LEVEL_ATTRIBUTE_BONUSES: readonly { level: number; stats: EquipmentStats }[] = [];

export type AttributeBreakdown = {
  base: AttributeValues;
  equipment: AttributeValues;
  progression: AttributeValues;
  temporary: AttributeValues;
  total: AttributeValues;
};

export const zeroAttributes = (): AttributeValues => ({ life: 0, strength: 0, defense: 0, wisdom: 0 });

function addStats(target: AttributeValues, stats: EquipmentStats): AttributeValues {
  for (const key of ATTRIBUTE_KEYS) target[key] += stats[key] ?? 0;
  return target;
}

export function equippedItems(traveler: Pick<Traveler, 'inventory' | 'equipped'>): Equipment[] {
  return Object.entries(traveler.equipped).flatMap(([slot, id]) => {
    const item = traveler.inventory.find((candidate) => candidate.id === id && candidate.slot === slot);
    return item ? [item] : [];
  });
}

export function equipmentAttributeBonuses(traveler: Pick<Traveler, 'inventory' | 'equipped'>): AttributeValues {
  return equippedItems(traveler).reduce((total, item) => addStats(total, item.stats), zeroAttributes());
}

export function progressionAttributeBonuses(level: number): AttributeValues {
  return LEVEL_ATTRIBUTE_BONUSES
    .filter((entry) => entry.level <= level)
    .reduce((total, entry) => addStats(total, entry.stats), zeroAttributes());
}

export function calculateTotalAttributes(
  traveler: Pick<Traveler, 'attributes' | 'inventory' | 'equipped' | 'level'>,
  temporaryStats: EquipmentStats = {},
): AttributeBreakdown {
  const base = { ...traveler.attributes };
  const equipment = equipmentAttributeBonuses(traveler);
  const progression = progressionAttributeBonuses(traveler.level);
  const temporary = addStats(zeroAttributes(), temporaryStats);
  const total = zeroAttributes();
  for (const key of ATTRIBUTE_KEYS)
    total[key] = base[key] + equipment[key] + progression[key] + temporary[key];
  return { base, equipment, progression, temporary, total };
}

export function equipmentSwapDelta(traveler: Traveler, item: Equipment): AttributeValues {
  const before = calculateTotalAttributes(traveler).total;
  const after = calculateTotalAttributes({
    ...traveler,
    equipped: { ...traveler.equipped, [item.slot]: item.id },
  }).total;
  const delta = zeroAttributes();
  for (const key of ATTRIBUTE_KEYS) delta[key] = after[key] - before[key];
  return delta;
}

export function formatAttributeBonuses(stats: EquipmentStats): string[] {
  return ATTRIBUTE_KEYS.flatMap((key) => {
    const value = stats[key] ?? 0;
    return value ? [`+${value} ${ATTRIBUTE_LABELS[key]}`] : [];
  });
}

export function formatAttributeDelta(delta: AttributeValues): string[] {
  return ATTRIBUTE_KEYS.flatMap((key) => {
    const value = delta[key];
    return value ? [`${value > 0 ? '+' : ''}${value} ${ATTRIBUTE_LABELS[key]}`] : [];
  });
}
