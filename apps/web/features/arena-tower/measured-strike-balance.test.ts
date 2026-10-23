import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import {
  arenaCombatConfig,
  arenaCardAvailability,
  arenaOffensiveTerm,
  battleBalanceConfig as rules,
  createArenaDeckBattle,
  normalizeBattleStat,
  resolveArenaCommand,
  type BattleParticipantSnapshot,
  type BattleState,
} from '@rpg/game-engine';
import {
  syntheticSevenCards,
  measuredHero,
  measuredOpponent,
} from '../../../../tests/fixtures/measured-strike';
import { TOWER_FLOORS } from './config';

test('deterministic comparative matrix records raw/final damage, focus and first-floor impact without tuning NPCs', () => {
  const sword: BattleParticipantSnapshot['equipment'] = [
    {
      id: 'balance-fixture-sword',
      name: 'Espada sintética',
      power: 4,
      effectIds: ['path-sword'],
    },
  ];
  const cases = [
    { name: 'beginner-low-defense', level: 1, strength: 1, defense: 1 },
    { name: 'intermediate-low-defense', level: 4, strength: 5, defense: 2 },
    { name: 'advanced-low-defense', level: 8, strength: 20, defense: 2 },
    { name: 'advanced-high-defense', level: 8, strength: 20, defense: 30 },
    { name: 'minimum-damage', level: 8, strength: 1, defense: 999 },
    { name: 'hp-cap', level: 8, strength: 20, defense: 1, hp: 3 },
    { name: 'no-focus', level: 8, strength: 5, defense: 2, focus: 0 },
    {
      name: 'sword-after-defense',
      level: 8,
      strength: 5,
      defense: 2,
      gear: true,
      afterDefend: true,
    },
    {
      name: 'discount-and-power',
      level: 8,
      strength: 5,
      defense: 2,
      gear: true,
      modifiers: true,
    },
    {
      name: 'basic-guard',
      level: 8,
      strength: 5,
      defense: 2,
      guard: 'basic' as const,
    },
    {
      name: 'fortified-armor',
      level: 8,
      strength: 5,
      defense: 2,
      guard: 'fortified' as const,
      armor: true,
    },
    ...TOWER_FLOORS.slice(0, 3).map((floor) => ({
      name: `tower-floor-${floor.index}`,
      level: floor.snapshot.level,
      strength: 5,
      defense: floor.snapshot.attributes.defense,
      floor,
    })),
  ];
  const cards = syntheticSevenCards(),
    ids = cards.map((card) => card.id);
  const rows: {
    scenario: string;
    seed: number;
    action: 'basic' | 'measured' | 'path';
    level: number;
    cost: number;
    startingFocus: number;
    allowed: boolean;
    rawTerm: number;
    rawMultiplied: number;
    potentialRoundedBeforeGuardOrHp: number;
    applied: number;
    focusAfter: number | undefined;
    guarded: boolean;
    used: boolean;
  }[] = [];
  for (const scenario of cases) {
    const c = scenario as typeof scenario & {
      hp?: number;
      focus?: number;
      gear?: boolean;
      modifiers?: boolean;
      afterDefend?: boolean;
      guard?: 'basic' | 'fortified';
      armor?: boolean;
      floor?: (typeof TOWER_FLOORS)[number];
    };
    const p: BattleParticipantSnapshot = {
      ...measuredHero,
      level: c.level,
      attributes: { ...measuredHero.attributes, strength: c.strength },
      equipment: c.gear ? sword : [],
      specialModifiers: c.modifiers
        ? {
            'measured-strike': { focusDiscount: 1, powerMultiplier: 1.25 },
            'path-strike': { focusDiscount: 1, powerMultiplier: 1.25 },
          }
        : undefined,
    };
    const o: BattleParticipantSnapshot = c.floor?.snapshot ?? {
      ...measuredOpponent,
      arenaProfile: undefined,
      attributes: { ...measuredOpponent.attributes, defense: c.defense },
      equipment: c.armor
        ? [
            {
              id: 'balance-fixture-armor',
              name: 'Armadura sintética',
              power: 0,
              effectIds: ['traveler-armor'],
            },
          ]
        : [],
    };
    for (const seed of [7, 19, 42])
      for (const [action, cardId, multiplier, cost, level] of [
        ['basic', 'arena-card-basic-attack', 1, 0, 1],
        [
          'measured',
          'arena-card-measured-strike',
          arenaCombatConfig.measuredStrikeMultiplier,
          1,
          1,
        ],
        [
          'path',
          'arena-card-path-strike',
          arenaCombatConfig.strikeMultiplier,
          c.modifiers ? 1 : 2,
          2,
        ],
      ] as const) {
        const initial = createArenaDeckBattle(
          p,
          o,
          seed,
          '003a-balance-fixture',
          ids,
          cards,
        );
        const b: BattleState = {
          ...initial,
          player: {
            ...initial.player,
            focusPoints: c.focus ?? 3,
            defendedLastRound: c.afterDefend ?? false,
          },
          opponent: {
            ...initial.opponent,
            hp: c.hp ?? initial.opponent.hp,
            guard: c.guard ?? null,
          },
        };
        const next = resolveArenaCommand(b, b.id, b.round, `card:${cardId}`);
        expect(resolveArenaCommand(b, b.id, b.round, `card:${cardId}`)).toEqual(
          next,
        );
        const allowed = p.level >= level && (c.focus ?? 3) >= cost;
        expect(next !== b).toBe(allowed);
        if (allowed && action !== 'basic')
          expect(next.player.focusPoints).toBe((c.focus ?? 3) - cost);
        if (!allowed) expect(next.deck?.usedIds).toEqual([]);
        const rawTerm =
          arenaOffensiveTerm(p) -
          rules.defenseReductionMultiplier *
            normalizeBattleStat(o.attributes.defense);
        const power = action !== 'basic' && c.modifiers ? 1.25 : 1;
        const swordAfter =
          c.gear && c.afterDefend ? rules.swordAfterDefendMultiplier : 1;
        const swordActive =
          action === 'path' && c.gear ? rules.swordAttackMultiplier : 1;
        const rawMultiplied =
          rawTerm * swordAfter * (multiplier * power) * swordActive;
        rows.push({
          scenario: c.name,
          seed,
          action,
          level: p.level,
          cost,
          startingFocus: c.focus ?? 3,
          allowed,
          rawTerm,
          rawMultiplied,
          potentialRoundedBeforeGuardOrHp: Math.max(
            rules.minimumDamage,
            Math.round(rawMultiplied),
          ),
          applied: next.player.damageDealt,
          focusAfter: next.player.focusPoints,
          guarded: next.log.some(
            (entry) =>
              entry.actorId === p.id &&
              entry.kind === 'damage' &&
              entry.defended,
          ),
          used: next.deck?.usedIds.includes(cardId) ?? false,
        });
      }
  }
  const comparisons = rows
    .filter((row) => row.action === 'basic')
    .map((basic) => {
      const measured = rows.find(
        (row) =>
          row.scenario === basic.scenario &&
          row.seed === basic.seed &&
          row.action === 'measured',
      )!;
      const path = rows.find(
        (row) =>
          row.scenario === basic.scenario &&
          row.seed === basic.seed &&
          row.action === 'path',
      )!;
      return {
        scenario: basic.scenario,
        seed: basic.seed,
        basic: basic.applied,
        measured: measured.allowed ? measured.applied : null,
        path: path.allowed ? path.applied : null,
        measuredExtraDamagePerFocus: measured.allowed
          ? (measured.applied - basic.applied) / measured.cost
          : null,
        pathExtraDamagePerFocus: path.allowed
          ? (path.applied - basic.applied) / path.cost
          : null,
      };
    });
  expect(rows).toHaveLength(126);
  expect(
    comparisons.find((row) => row.scenario === 'minimum-damage'),
  ).toMatchObject({ basic: 1, measured: 1, path: 1 });
  expect(comparisons.find((row) => row.scenario === 'hp-cap')).toMatchObject({
    basic: 3,
    measured: 3,
    path: 3,
  });
  const battles = [];
  for (const floor of TOWER_FLOORS.slice(0, 3))
    for (const seed of [7, 19, 42])
      for (const policy of ['basic', 'measured', 'path'] as const) {
        const hero: BattleParticipantSnapshot = {
          ...measuredHero,
          level: floor.snapshot.level,
          attributes: { life: 4, strength: 2, defense: 2, wisdom: 2 },
        };
        let b = createArenaDeckBattle(
          hero,
          floor.snapshot,
          seed,
          '003a-floor-balance-fixture',
          ids,
          cards,
        );
        const candidate =
          policy === 'basic'
            ? null
            : `arena-card-${policy === 'measured' ? 'measured-strike' : 'path-strike'}`;
        for (let turn = 0; turn < 50 && b.status === 'in_progress'; turn++) {
          const action =
            candidate &&
            arenaCardAvailability(b, candidate).status === 'available'
              ? (`card:${candidate}` as const)
              : 'attack';
          b = resolveArenaCommand(b, b.id, b.round, action);
        }
        expect(b.status).toBe('finished');
        battles.push({
          floor: floor.index,
          seed,
          policy,
          rounds: b.round,
          victory: b.winnerId === hero.id,
          damage: b.player.damageDealt,
          hp: b.player.hp,
          usedCandidate: candidate
            ? b.deck!.usedIds.includes(candidate)
            : false,
        });
      }
  expect(battles).toHaveLength(27);
  mkdirSync('build/task-consolidation-003a', { recursive: true });
  writeFileSync(
    'build/task-consolidation-003a/balance-results.json',
    JSON.stringify(
      {
        version: '003a-candidate-1.15',
        seeds: [7, 19, 42],
        rows,
        comparisons,
        battles,
        officialGrant: false,
        balanceHomologated: false,
      },
      null,
      2,
    ),
  );
});
