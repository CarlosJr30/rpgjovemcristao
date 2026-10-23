// Synthetic definitions only. No approved product card or acquisition is created.
import { arenaSpecials, type ArenaCard } from '@rpg/game-engine';
import { cards as basicCards } from './arena-deck';
export const specialCards: readonly ArenaCard[] = [
  ...arenaSpecials
    .filter((s) => !s.cardOnly)
    .map((s) => ({
      id: `fixture-special-${s.id}`,
      name: `Teste: ${s.name}`,
      rarity: 'teste',
      type: s.type,
      action: `special:${s.id}` as const,
    })),
  ...basicCards.slice(0, 3),
];
export const specialIds = specialCards.map((c) => c.id);
