// Test-only definitions. Never imported by the product catalog or acquisition flows.
import type { ArenaCard, BattleParticipantSnapshot } from '@rpg/game-engine';
export const cards: readonly ArenaCard[] = Array.from(
  { length: 40 },
  (_, i) => ({
    id: `fixture-card-${i + 1}`,
    name: `Carta de teste ${i + 1}`,
    rarity: i % 2 ? 'raro' : 'comum',
    type: i % 2 ? 'DEFENSIVE' : 'OFFENSIVE',
    action: i === 39 ? null : i % 2 ? 'defend' : 'attack',
  }),
);
export const ids = cards.slice(0, 7).map((c) => c.id);
export const player: BattleParticipantSnapshot = {
  id: 'player',
  name: 'Viajante de teste',
  level: 8,
  attributes: { life: 30, strength: 1, defense: 10, wisdom: 1 },
  equipment: [],
  combatPower: 100,
};
export const opponent: BattleParticipantSnapshot = {
  ...player,
  id: 'opponent',
  name: 'Adversário sintético',
};
