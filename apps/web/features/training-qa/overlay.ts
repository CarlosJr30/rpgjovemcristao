import type { Traveler } from '../journey/domain/traveler';
import { EQUIPMENT_CATALOG } from '../journey/data/equipmentCatalog';
import type { TrainingState } from '../../lib/training-qa/store';
export function trainingTraveler(
  base: Traveler,
  state: TrainingState,
): Traveler {
  if (base.id !== state.actor) throw Error('Avatar do treino divergente.');
  const inventory = base.inventory.map((item) => ({ ...item }));
  for (const [id, quantity] of Object.entries(state.items)) {
    const def = EQUIPMENT_CATALOG.find((item) => item.id === id);
    if (!def) throw Error('Item de treino indisponível.');
    const index = inventory.findIndex((item) => item.id === id);
    const next = { ...def, quantity };
    if (index < 0) inventory.push(next);
    else inventory[index] = next;
  }
  const equipped = { ...base.equipped };
  for (const [slot, item] of Object.entries(state.equipped)) {
    const key = slot as keyof typeof equipped;
    if (item === null) delete equipped[key];
    else equipped[key] = item;
  }
  return {
    ...base,
    coins: state.coins,
    inventory,
    equipped,
    avatar: { ...base.avatar, equippedItems: { ...equipped } },
    chests: {
      ...base.chests,
      common: state.chests,
      uncommon: 0,
      rare: 0,
      epic: 0,
      extraordinary: 0,
    },
  };
}
