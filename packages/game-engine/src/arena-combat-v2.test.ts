import { expect, test } from 'vitest';
import {
  arenaCombatConfig,
  arenaFocus,
  arenaSpecials,
  specialAvailability,
  specialLoadout,
  specialCost,
  createArenaBattle,
  resolveArenaRound,
  chooseArenaOpponentAction,
  calculateDamage,
  type BattleParticipantSnapshot,
  type BattleState,
  type ArenaProfile,
} from './index';

const snapshot = (
  id: string,
  level = 8,
  profile?: ArenaProfile,
): BattleParticipantSnapshot => ({
  id,
  name: id,
  level,
  attributes: { life: 30, strength: 4, defense: 2, wisdom: 8 },
  equipment: [],
  combatPower: 100,
  arenaProfile: profile,
});
const initial = (level = 8, profile?: ArenaProfile) =>
  createArenaBattle(snapshot('p', level), snapshot('o', 8, profile), 42);
const focus = (state: BattleState, points: number): BattleState => ({
  ...state,
  player: { ...state.player, focusPoints: points },
});

test('ataque e defesa geram Foco limitado e preservam a fórmula de dano', () => {
  let state = initial();
  const expected = calculateDamage(
    state.player.snapshot,
    state.opponent.snapshot,
  );
  state = resolveArenaRound(state, 'attack');
  expect(
    state.log.find((entry) => entry.actorId === 'p' && entry.kind === 'damage')
      ?.amount,
  ).toBe(expected);
  expect(arenaFocus(state.player)).toBe(1);
  state = resolveArenaRound(state, 'defend');
  expect(arenaFocus(state.player)).toBe(2);
  state = resolveArenaRound(state, 'attack');
  expect(arenaFocus(state.player)).toBe(3);
  expect(arenaFocus(resolveArenaRound(state, 'attack').player)).toBe(3);
});

test.each(arenaSpecials.filter((special) => !special.cardOnly))(
  '$name: desbloqueio central e consumo exato de Foco',
  (special) => {
    const locked = focus(initial(special.minimumLevel - 1), 3);
    expect(specialAvailability(locked.player, special.id)).toBe('locked');
    expect(resolveArenaRound(locked, `special:${special.id}`)).toBe(locked);
    const unlocked = focus(initial(special.minimumLevel), 3);
    expect(specialAvailability(unlocked.player, special.id)).toBe('available');
    const after = resolveArenaRound(unlocked, `special:${special.id}`);
    expect(arenaFocus(after.player)).toBe(3 - special.focusCost);
    expect(after.player.abilitiesUsed).toBe(1);
  },
);

test('nível 1 apenas básico/defesa; custo insuficiente e ações desconhecidas não gastam turno', () => {
  const low = initial(1);
  expect(specialLoadout(low.player.snapshot)).toEqual([]);
  const state = initial(8);
  expect(specialAvailability(state.player, 'path-strike')).toBe('focus');
  expect(resolveArenaRound(state, 'special:path-strike')).toBe(state);
  expect(resolveArenaRound(state, 'special:unknown' as never)).toBe(state);
  expect(resolveArenaRound(state, 'equipment' as never)).toBe(state);
});

test('Defesa protege mesmo contra iniciativa maior; Guarda forte protege próximo golpe e se consome', () => {
  const before = initial();
  const attacked = resolveArenaRound(before, 'attack');
  const defended = resolveArenaRound(before, 'defend');
  expect(defended.player.damageTaken).toBeLessThan(attacked.player.damageTaken);
  const guarded = resolveArenaRound(
    focus(before, 3),
    'special:steadfast-guard',
  );
  expect(guarded.player.damageTaken).toBeLessThan(defended.player.damageTaken);
  expect(guarded.player.guard).toBeNull();
  const both = {
    ...before,
    opponent: {
      ...before.opponent,
      snapshot: {
        ...before.opponent.snapshot,
        arenaProfile: 'guardian' as const,
      },
    },
  };
  const pendingGuard = resolveArenaRound(
    focus(both, 3),
    'special:steadfast-guard',
  );
  expect(pendingGuard.player.guard).toBe('fortified');
  expect(resolveArenaRound(pendingGuard, 'attack').player.guard).toBeNull();
});

test('Golpe usa multiplicador central; Discernimento usa Sabedoria no próximo ataque', () => {
  const state = initial();
  const strike = resolveArenaRound(focus(state, 3), 'special:path-strike');
  expect(strike.player.damageDealt).toBe(
    calculateDamage(state.player.snapshot, state.opponent.snapshot, {
      multiplier: arenaCombatConfig.strikeMultiplier,
    }),
  );
  const insightful = resolveArenaRound(focus(state, 3), 'special:discernment');
  expect(insightful.player.tacticalMultiplier).toBeGreaterThan(1);
  const next = resolveArenaRound(insightful, 'attack');
  expect(next.player.tacticalMultiplier).toBe(1);
  expect(next.player.damageDealt).toBeGreaterThan(
    resolveArenaRound(state, 'attack').player.damageDealt,
  );
});

test('Passo garante uma esquiva temporária sem remover a esquiva automática das botas', () => {
  const state = initial();
  const mobile = resolveArenaRound(focus(state, 3), 'special:pilgrim-step');
  const dodged = mobile.player.mobilityReady
    ? resolveArenaRound(mobile, 'attack')
    : mobile;
  expect(
    dodged.log.some(
      (entry) => entry.targetId === 'p' && entry.presentation === 'dodge',
    ),
  ).toBe(true);
  expect(dodged.player.mobilityReady).toBe(false);
  const equipped = {
    ...state,
    player: {
      ...state.player,
      hp: 2,
      snapshot: {
        ...state.player.snapshot,
        equipment: [
          {
            id: 'boots',
            name: 'Botas',
            power: 0,
            effectIds: ['pilgrim-boots' as const],
          },
        ],
      },
    },
  };
  expect(resolveArenaRound(equipped, 'attack').player.usedEffects).toContain(
    'pilgrim-boots',
  );
});

test('efeitos definidos da arma/Guarda conservam usos; extensão não atribui bônus a itens', () => {
  const state = initial();
  const sword = {
    ...state,
    player: {
      ...state.player,
      snapshot: {
        ...state.player.snapshot,
        equipment: [
          {
            id: 'sword',
            name: 'Espada',
            power: 0,
            effectIds: ['path-sword' as const],
          },
        ],
      },
    },
  };
  const first = resolveArenaRound(focus(sword, 3), 'special:path-strike');
  expect(first.player.usedEffects).toEqual(['path-sword']);
  const second = resolveArenaRound(focus(first, 3), 'special:path-strike');
  expect(second.player.usedEffects).toEqual(['path-sword']);
  expect(specialCost(state.player.snapshot, arenaSpecials[0])).toBe(2);
  expect(state.player.snapshot.specialModifiers).toBeUndefined();
});

test('loadout deduplica, limita e valida; defaults aceitam estados antigos sem novos campos', () => {
  const state = initial();
  const custom = {
    ...state.player.snapshot,
    specialLoadout: ['path-strike', 'path-strike', 'pilgrim-step'] as const,
  };
  expect(specialLoadout(custom)).toEqual(['path-strike', 'pilgrim-step']);
  expect(
    specialAvailability({ ...state.player, snapshot: custom }, 'discernment'),
  ).toBe('unequipped');
  expect(specialLoadout({ ...custom, specialLoadout: {} as never })).toEqual(
    [],
  );
  expect(
    specialAvailability(
      { ...state.player, snapshot: { ...custom, level: NaN } },
      'path-strike',
    ),
  ).toBe('locked');
  const old = { ...state.player };
  delete old.focusPoints;
  delete old.guard;
  expect(arenaFocus(old)).toBe(0);
  expect(
    resolveArenaRound({ ...state, player: old }, 'attack').player.focusPoints,
  ).toBe(1);
  expect(specialLoadout(state.player.snapshot)).toHaveLength(4);
});

test.each(['agile', 'offensive', 'guardian', 'tactical'] as const)(
  'IA %s considera somente estado comprometido e luta com identidade',
  (profile) => {
    const state = initial(8, profile);
    const ready = { ...state, opponent: { ...state.opponent, focusPoints: 3 } };
    const expected = {
      agile: 'attack',
      offensive: 'special:path-strike',
      guardian: 'special:steadfast-guard',
      tactical: 'special:discernment',
    };
    expect(chooseArenaOpponentAction(ready)).toBe(expected[profile]);
    expect(chooseArenaOpponentAction(ready)).toBe(
      chooseArenaOpponentAction({
        ...ready,
        log: [
          ...ready.log,
          {
            round: 99,
            actorId: 'p',
            kind: 'action',
            message: 'fake future choice',
          },
        ],
      }),
    );
    let combat = state;
    const sequence: string[] = [];
    for (let index = 0; index < 5; index++) {
      sequence.push(chooseArenaOpponentAction(combat));
      combat = resolveArenaRound(combat, 'attack');
    }
    expect(sequence).toContain(
      profile === 'agile'
        ? 'attack'
        : profile === 'offensive'
          ? 'special:path-strike'
          : profile === 'guardian'
            ? 'special:steadfast-guard'
            : 'special:discernment',
    );
  },
);

test.each([true, false])(
  'encerra vitória=%s e não permite turno/recurso após término',
  (win) => {
    const strong = {
      ...snapshot(win ? 'p' : 'o'),
      attributes: { life: 10, strength: 99, defense: 30, wisdom: 30 },
    };
    const weak = {
      ...snapshot(win ? 'o' : 'p'),
      attributes: { life: 1, strength: 1, defense: 0, wisdom: 0 },
    };
    const finished = resolveArenaRound(
      createArenaBattle(win ? strong : weak, win ? weak : strong, 3),
      'attack',
    );
    expect(finished.status).toBe('finished');
    expect(finished.winnerId).toBe(win ? 'p' : 'o');
    expect(resolveArenaRound(finished, 'attack')).toBe(finished);
  },
);
