import { describe, expect, test } from 'vitest';
import {
  availableEquipmentAbility, battleBalanceConfig, calculateCombatPower, calculateDamage,
  calculateInitiative, calculateMaxHp, calculateTrainingReward, createBattle,
  getEngineStatus, isWithinMatchmakingRange, resolveRound,
  type BattleEffectId, type BattleParticipantSnapshot,
} from './index';

function fighter(id: string, attributes = { life: 4, strength: 4, defense: 4, wisdom: 4 }, effects: BattleEffectId[] = []): BattleParticipantSnapshot {
  const base = { id, name: id, level: 3, attributes, equipment: effects.length ? [{ id: `${id}-item`, name: 'Item', power: 3, effectIds: effects }] : [] };
  return { ...base, combatPower: calculateCombatPower(base) };
}

describe('Battle Engine', () => {
  test('expõe gameplay e calcula HP pela configuração central', () => {
    expect(getEngineStatus().gameplayAvailable).toBe(true);
    expect(calculateMaxHp({ life: 5, strength: 1, defense: 1, wisdom: 1 })).toBe(50);
  });
  test('dano respeita força, defesa, mínimo e postura defensiva', () => {
    const attacker = fighter('a', { life: 2, strength: 8, defense: 1, wisdom: 1 });
    const defender = fighter('b', { life: 2, strength: 1, defense: 5, wisdom: 1 });
    expect(calculateDamage(attacker, defender)).toBeGreaterThan(calculateDamage(attacker, defender, { defending: true }));
    expect(calculateDamage(fighter('weak', { life: 1, strength: 0, defense: 0, wisdom: 0 }), fighter('wall', { life: 1, strength: 0, defense: 99, wisdom: 0 }))).toBe(battleBalanceConfig.minimumDamage);
  });
  test('sabedoria influencia iniciativa com variação determinística', () => {
    const wise = fighter('wise', { life: 2, strength: 2, defense: 2, wisdom: 8 });
    const low = fighter('low', { life: 2, strength: 2, defense: 2, wisdom: 1 });
    expect(calculateInitiative(wise, 42, 1)).toBeGreaterThan(calculateInitiative(low, 42, 1));
    expect(calculateInitiative(wise, 42, 1)).not.toBe(calculateInitiative(wise, 42, 2));
  });
  test('a mesma seed e sequência produzem a mesma batalha', () => {
    const play = () => ['focus', 'attack', 'defend', 'attack', 'attack'].reduce((state, action) => resolveRound(state, action as 'focus' | 'attack' | 'defend'), createBattle(fighter('p'), fighter('o'), 91));
    expect(play()).toEqual(play());
  });
  test('Foco fortalece a próxima ação e é consumido', () => {
    const focused = resolveRound(createBattle(fighter('p'), fighter('o'), 3), 'focus');
    expect(focused.player.focusMultiplier).toBeGreaterThan(1);
    expect(resolveRound(focused, 'attack').player.focusMultiplier).toBe(1);
  });
  test('efeitos de equipamento têm uso e cooldown', () => {
    let state = createBattle(fighter('p', undefined, ['prudence-amulet']), fighter('o'), 7);
    expect(availableEquipmentAbility(state.player)?.id).toBe('prudence-amulet');
    state = resolveRound(state, 'equipment');
    expect(state.player.usedEffects).toContain('prudence-amulet');
    expect(availableEquipmentAbility(state.player)).toBeNull();
    state = resolveRound(state, 'defend');
    expect(availableEquipmentAbility(state.player)).toBeNull();
    state = resolveRound(state, 'defend');
    expect(availableEquipmentAbility(state.player)?.id).toBe('prudence-amulet');
  });
  test('Botas evitam um golpe quando a vida está baixa', () => {
    const attacker = fighter('heavy', { life: 4, strength: 7, defense: 2, wisdom: 3 });
    const boots = fighter('boots', { life: 1, strength: 1, defense: 0, wisdom: 1 }, ['pilgrim-boots']);
    let state = createBattle(attacker, boots, 2);
    while (state.status === 'in_progress' && !state.opponent.usedEffects.includes('pilgrim-boots')) state = resolveRound(state, 'attack');
    expect(state.opponent.usedEffects).toContain('pilgrim-boots');
  });
  test('encerra com vencedor e não aceita novas rodadas', () => {
    let state = createBattle(fighter('p', { life: 8, strength: 20, defense: 8, wisdom: 8 }), fighter('o', { life: 1, strength: 1, defense: 0, wisdom: 0 }), 1);
    state = resolveRound(state, 'attack');
    expect(state.status).toBe('finished'); expect(state.winnerId).toBe('p'); expect(resolveRound(state, 'attack')).toBe(state);
  });
  test('poder, matchmaking, recompensa e anti-farm são centralizados', () => {
    const base = fighter('base'), strong = fighter('strong', { life: 8, strength: 8, defense: 8, wisdom: 8 });
    expect(strong.combatPower).toBeGreaterThan(base.combatPower);
    expect(isWithinMatchmakingRange(500, 540)).toBe(true); expect(isWithinMatchmakingRange(500, 700)).toBe(false);
    expect(calculateTrainingReward(true, 0).rewarded).toBe(true);
    expect(calculateTrainingReward(true, 3).reason).toBe('daily-limit');
    expect(calculateTrainingReward(false, 0).reason).toBe('defeat');
  });
  test('builds TANK/OFFENSIVO e TÁTICO/EQUILIBRADO concluem', () => {
    const duel = (left: BattleParticipantSnapshot, right: BattleParticipantSnapshot, seed: number) => {
      let state = createBattle(left, right, seed);
      while (state.status === 'in_progress') state = resolveRound(state, state.round % 4 === 0 ? 'focus' : 'attack');
      return state;
    };
    expect(duel(fighter('tank', { life: 10, strength: 3, defense: 10, wisdom: 3 }), fighter('offense', { life: 4, strength: 12, defense: 3, wisdom: 3 }), 11).status).toBe('finished');
    expect(duel(fighter('tactical', { life: 5, strength: 5, defense: 5, wisdom: 11 }), fighter('balanced', { life: 7, strength: 7, defense: 7, wisdom: 7 }), 17).status).toBe('finished');
  });
});
