// Synthetic ownership/snapshots only. Never imported by the product registry.
import {
  createArenaBattle,
  getArenaCardCatalog,
  resolveArenaRound,
  type ArenaAction,
  type ArenaProfile,
  type BattleParticipantSnapshot,
} from '@rpg/game-engine';
export const MEASURED_CARD_ID = 'arena-card-measured-strike';
export const syntheticSevenCards = () => getArenaCardCatalog();
export const measuredHero: BattleParticipantSnapshot = {
  id: '003a-fixture-player',
  name: 'Viajante sintético003A',
  level: 8,
  attributes: { life: 80, strength: 5, defense: 3, wisdom: 3 },
  equipment: [],
  combatPower: 100,
};
export const measuredOpponent: BattleParticipantSnapshot = {
  ...measuredHero,
  id: '003a-fixture-opponent',
  name: 'Adversário sintético003A',
  attributes: { life: 90, strength: 3, defense: 2, wisdom: 1 },
  arenaProfile: 'guardian',
};
export function legacyTrajectories() {
  const states = [];
  const actions: readonly ArenaAction[] = [
    'attack',
    'defend',
    'special:path-strike',
    'attack',
    'defend',
    'special:steadfast-guard',
    'special:discernment',
    'attack',
    'special:pilgrim-step',
    'attack',
  ];
  for (const arenaProfile of [
    'agile',
    'offensive',
    'guardian',
    'tactical',
  ] as const)
    for (const level of [1, 2, 4, 8])
      for (const seed of [7, 42])
        for (const geared of [false, true]) {
          const gear: BattleParticipantSnapshot['equipment'] = geared
            ? [
                {
                  id: 'fixture-sword',
                  name: 'Espada sintética',
                  power: 4,
                  effectIds: ['path-sword'],
                },
                {
                  id: 'fixture-armor',
                  name: 'Armadura sintética',
                  power: 2,
                  effectIds: ['traveler-armor'],
                },
                {
                  id: 'fixture-amulet',
                  name: 'Amuleto sintético',
                  power: 1,
                  effectIds: ['prudence-amulet'],
                },
              ]
            : [];
          let state = createArenaBattle(
            { ...measuredHero, level, equipment: gear },
            {
              ...measuredOpponent,
              level,
              arenaProfile: arenaProfile as ArenaProfile,
              equipment: gear,
            },
            seed,
            '003a-legacy-fixture',
          );
          for (
            let turn = 0;
            turn < 40 && state.status === 'in_progress';
            turn++
          )
            state = resolveArenaRound(state, actions[turn % actions.length]);
          states.push(state);
        }
  return states;
}
