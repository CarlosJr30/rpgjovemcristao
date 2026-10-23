import { expect, test } from 'vitest';
import {
  arenaOffensiveTerm,
  calculateMaxHp,
  chooseArenaOpponentAction,
  createArenaBattle,
  resolveArenaRound,
  specialAvailability,
} from '@rpg/game-engine';
import { TOWER_FLOORS } from './config';
test('seven unique opponents have increasing HP, power and offensive potential; champion leads every attribute', () => {
  expect(TOWER_FLOORS.map((f) => f.snapshot.name)).toEqual([
    'Recruta da Arena',
    'Aprendiz de Guerreiro',
    'Combatente Experiente',
    'Defensor da Arena',
    'Guerreiro Veterano',
    'Guardião Lendário',
    'Campeão da Torre',
  ]);
  expect(new Set(TOWER_FLOORS.map((f) => f.id)).size).toBe(7);
  for (let i = 1; i < 7; i++) {
    const before = TOWER_FLOORS[i - 1].snapshot,
      after = TOWER_FLOORS[i].snapshot;
    expect(after.combatPower).toBeGreaterThan(before.combatPower);
    expect(calculateMaxHp(after.attributes)).toBeGreaterThan(
      calculateMaxHp(before.attributes),
    );
    expect(arenaOffensiveTerm(after)).toBeGreaterThan(
      arenaOffensiveTerm(before),
    );
  }
  for (const key of ['life', 'strength', 'defense', 'wisdom'] as const)
    expect(TOWER_FLOORS[6].snapshot.attributes[key]).toBeGreaterThan(
      TOWER_FLOORS[5].snapshot.attributes[key],
    );
  expect(TOWER_FLOORS.filter((f) => f.boss)).toHaveLength(1);
});
test('existing profiles add distinct defensive/special cadence without seeing the upcoming player choice', () => {
  const p = {
    ...TOWER_FLOORS[6].snapshot,
    id: 'probe',
    attributes: { life: 50, strength: 1, defense: 20, wisdom: 1 },
  };
  const sequences = TOWER_FLOORS.map((f) => {
    let b = createArenaBattle(p, f.snapshot, 42);
    const actions = [];
    for (let i = 0; i < 8; i++) {
      actions.push(chooseArenaOpponentAction(b));
      b = resolveArenaRound(b, 'attack');
    }
    return actions;
  });
  expect(sequences[0].every((a) => a === 'attack')).toBe(true);
  expect(sequences[1]).toContain('special:path-strike');
  expect(sequences[2]).toContain('special:discernment');
  expect(sequences[3]).toContain('special:steadfast-guard');
  expect(sequences[6]).toContain('special:discernment');
  expect(sequences[6]).toContain('defend');
});
test('benchmark uses existing actions over20seeds per floor and records difficulty evidence', () => {
  const p = {
    id: 'benchmark',
    name: 'Teste',
    level: 8,
    attributes: { life: 10, strength: 5, defense: 4, wisdom: 5 },
    equipment: [
      {
        id: 'sword',
        name: 'Teste',
        power: 1,
        effectIds: ['path-sword' as const],
      },
      {
        id: 'armor',
        name: 'Teste',
        power: 1,
        effectIds: ['traveler-armor' as const],
      },
    ],
    combatPower: 0,
  };
  const metrics = TOWER_FLOORS.map((f) => {
    let wins = 0,
      rounds = 0,
      damage = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let b = createArenaBattle(p, f.snapshot, seed);
      while (b.status === 'in_progress')
        b = resolveArenaRound(
          b,
          specialAvailability(b.player, 'path-strike') === 'available'
            ? 'special:path-strike'
            : 'attack',
        );
      wins += Number(b.winnerId === p.id);
      rounds += b.round;
      damage += b.player.damageTaken;
    }
    return {
      floor: f.index,
      power: f.snapshot.combatPower,
      wins,
      meanRounds: rounds / 20,
      meanDamageTaken: damage / 20,
    };
  });
  console.info('TOWER_BENCHMARK', JSON.stringify(metrics));
  expect(metrics[0].wins).toBe(20);
  expect(metrics[6].wins).toBeLessThan(metrics[0].wins);
  for (let i = 1; i < 7; i++)
    expect(metrics[i].wins).toBeLessThanOrEqual(metrics[i - 1].wins);
});
