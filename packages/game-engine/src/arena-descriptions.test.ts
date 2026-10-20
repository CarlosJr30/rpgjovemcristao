import { expect, test } from 'vitest';
import {
  arenaAttributeRules,
  arenaConfirmedLog,
  arenaDamageRule,
  arenaNumber,
  arenaOffensiveTerm,
  calculateDamage,
  calculateInitiative,
  calculateMaxHp,
  createArenaBattle,
  describeArenaAction,
  describeArenaEffect,
  resolveArenaRound,
  type BattleEffectId,
  type BattleParticipantSnapshot,
  type BattleState,
} from './index';
const p: BattleParticipantSnapshot = {
  id: 'p',
  name: 'Lia',
  level: 8,
  attributes: { life: 30, strength: 10, defense: 2, wisdom: 2 },
  equipment: [],
  combatPower: 100,
};
const o: BattleParticipantSnapshot = {
  ...p,
  id: 'o',
  name: 'Treino',
  attributes: { life: 30, strength: 12, defense: 2, wisdom: 1 },
};
const gear = (id: BattleEffectId): BattleParticipantSnapshot['equipment'] => [
  { id, name: id, power: 0, effectIds: [id] },
];
const start = (player = p, opponent = o) =>
  createArenaBattle(player, opponent, 42, 'test');
const ready = (b: BattleState): BattleState => ({
  ...b,
  player: { ...b.player, focusPoints: 3 },
});

test('attack description shares strength/equipment/defense coefficients and real rounding/clamps', () => {
  const equipped = {
    ...p,
    equipment: [{ id: 'weapon', name: 'Teste', power: 3, effectIds: [] }],
  };
  expect(arenaOffensiveTerm(equipped)).toBeCloseTo(25.54);
  expect(calculateDamage(equipped, o)).toBe(23);
  expect(arenaDamageRule()).toContain('2,2 × Força + 0,18');
  expect(arenaDamageRule()).toContain('1,15 × Defesa');
  expect(arenaDamageRule()).toContain('arredonda ao inteiro mais próximo');
  expect(describeArenaAction('attack').headline).toContain('até +1 Foco');
  const attacked = resolveArenaRound(start(equipped), 'attack');
  expect(attacked.player.damageDealt).toBe(calculateDamage(equipped, o));
  const huge = {
    ...p,
    attributes: { ...p.attributes, strength: 2000 },
    equipment: [{ id: 'huge', name: 'Teste', power: 2000, effectIds: [] }],
  };
  expect(arenaOffensiveTerm(huge)).toBeCloseTo(3 + 999 * 2.2 + 999 * 0.18);
  expect(arenaNumber(0.18 + 2.2)).toBe('2,38');
  expect(arenaNumber(1.7999999999999998)).toBe('1,8');
});
test('life is max HP, not healing; capped wisdom and helmet describe actual initiative', () => {
  expect(calculateMaxHp(p.attributes)).toBe(200);
  expect(arenaAttributeRules().life).toContain('20 + 6 × Vida');
  expect(arenaAttributeRules().life).toContain('Não é cura');
  const helmet = { ...p, equipment: gear('traveler-helmet') };
  expect(
    calculateInitiative(helmet, 42, 1) - calculateInitiative(p, 42, 1),
  ).toBe(1);
  expect(describeArenaEffect('traveler-helmet').headline).toBe('+1 Iniciativa');
});
test('defense and armor describe staged ceil/minimum, not universal percentages', () => {
  const naked = resolveArenaRound(start(), 'defend');
  const armored = resolveArenaRound(
    start({ ...p, equipment: gear('traveler-armor') }),
    'defend',
  );
  const raw = calculateDamage(o, p);
  expect(naked.player.damageTaken).toBe(Math.ceil(raw * 0.5));
  expect(armored.player.damageTaken).toBe(
    Math.ceil(Math.ceil(raw * 0.5) * 0.85),
  );
  expect(describeArenaAction('defend').explanation).toContain('×0,5');
  expect(describeArenaAction('defend').explanation).toContain(
    'Arredonda para cima',
  );
  expect(describeArenaEffect('traveler-armor').explanation).toContain(
    'mínimo 1',
  );
  expect(
    calculateDamage(
      { ...o, attributes: { ...o.attributes, strength: 0 } },
      { ...p, attributes: { ...p.attributes, defense: 999 } },
      { defending: true, armored: true },
    ),
  ).toBe(1);
  expect(
    resolveArenaRound(
      start({ ...p, equipment: gear('traveler-armor') }),
      'attack',
    ).player.damageTaken,
  ).toBe(resolveArenaRound(start(), 'attack').player.damageTaken);
});
test('shield registration does not stack protection; fortified guard lasts until a non-dodged hit', () => {
  const basic = resolveArenaRound(ready(start()), 'special:steadfast-guard');
  const shield = resolveArenaRound(
    ready(start({ ...p, equipment: gear('steadfast-shield') })),
    'special:steadfast-guard',
  );
  expect(shield.player.damageTaken).toBe(basic.player.damageTaken);
  expect(shield.player.usedEffects).toEqual(['steadfast-shield']);
  expect(describeArenaEffect('steadfast-shield', shield.player)).toMatchObject({
    usesRemaining: 0,
    headline: 'Registro automático da Guarda; sem redução adicional',
  });
  expect(describeArenaAction('special:steadfast-guard').explanation).toContain(
    '×0,25',
  );
  const guardian = { ...o, arenaProfile: 'guardian' as const };
  const pending = resolveArenaRound(
    ready(start(p, guardian)),
    'special:steadfast-guard',
  );
  expect(pending.player.guard).toBe('fortified');
  expect(describeArenaAction('special:steadfast-guard').duration).toContain(
    'sem prazo fixo',
  );
  expect(resolveArenaRound(pending, 'attack').player.guard).toBeNull();
});
test('sword reinforces a special once and after-defend response remains independent', () => {
  const equipped = { ...p, equipment: gear('path-sword') };
  const b = ready(start(equipped));
  const first = resolveArenaRound(b, 'special:path-strike');
  expect(first.player.damageDealt).toBe(
    calculateDamage(equipped, o, { multiplier: 1.45 * 1.28 }),
  );
  expect(describeArenaEffect('path-sword', first.player).usesRemaining).toBe(0);
  const defended = resolveArenaRound(start(equipped), 'defend');
  const next = resolveArenaRound(defended, 'attack');
  expect(next.player.damageDealt).toBe(
    calculateDamage(equipped, o, { multiplier: 1.2 }),
  );
  expect(next.player.usedEffects).toEqual([]);
  expect(describeArenaEffect('path-sword').explanation).toContain(
    'sem gastar esse reforço',
  );
});
test('amulet boost, cap, cooldown and duration are real; no resource Foco grant', () => {
  const equipped = { ...p, equipment: gear('prudence-amulet') };
  const b = ready(start(equipped));
  expect(describeArenaAction('special:discernment', b.player).headline).toBe(
    'Multiplicador preparado: ×1,4',
  );
  const after = resolveArenaRound(b, 'special:discernment');
  expect(after.player.tacticalMultiplier).toBeCloseTo(1.4);
  expect(after.player.focusPoints).toBe(1);
  expect(describeArenaEffect('prudence-amulet', after.player)).toMatchObject({
    usesRemaining: 1,
    cooldownRemaining: 2,
  });
  const blocked = describeArenaAction('special:discernment', after.player);
  expect(blocked.headline).toBe('Multiplicador preparado: ×1,25');
  let later = resolveArenaRound(after, 'defend');
  expect(later.player.tacticalMultiplier).toBeCloseTo(1.4);
  later = resolveArenaRound(later, 'defend');
  expect(later.player.cooldowns['prudence-amulet']).toBe(0);
  const attack = resolveArenaRound(later, 'attack');
  expect(attack.player.tacticalMultiplier).toBe(1);
  const capped = ready(
    start({ ...equipped, attributes: { ...p.attributes, wisdom: 999 } }),
  );
  expect(
    resolveArenaRound(capped, 'special:discernment').player.tacticalMultiplier,
  ).toBe(1.55);
  expect(
    describeArenaAction('special:discernment', capped.player).headline,
  ).toBe('Multiplicador preparado: ×1,55');
  expect(describeArenaEffect('prudence-amulet').explanation).toContain(
    'ganho pode ser 0',
  );
});
test('boots use projected life threshold without chance and mobility has priority', () => {
  const b = start({ ...p, equipment: gear('pilgrim-boots') });
  const low = { ...b, player: { ...b.player, hp: 70 } };
  const boot = resolveArenaRound(low, 'attack');
  expect(boot.player.damageTaken).toBe(0);
  expect(boot.player.usedEffects).toEqual(['pilgrim-boots']);
  const moved = resolveArenaRound(ready(low), 'special:pilgrim-step');
  expect(moved.player.damageTaken).toBe(0);
  expect(moved.player.usedEffects).toEqual([]);
  expect(describeArenaEffect('pilgrim-boots').headline).toContain(
    '35% da vida máxima',
  );
  expect(describeArenaEffect('pilgrim-boots').explanation).toContain(
    'Sem teste de chance',
  );
  expect(describeArenaAction('special:pilgrim-step').duration).toContain(
    'sem prazo fixo',
  );
});
test('cost/level/power modifiers and confirmed feedback use actual snapshot and accepted log', () => {
  const equipped = {
    ...p,
    specialModifiers: {
      'path-strike': { focusDiscount: 1, powerMultiplier: 1.25 },
    },
  };
  const b = ready(start(equipped));
  expect(describeArenaAction('special:path-strike', b.player)).toMatchObject({
    focusCost: 1,
    minimumLevel: 2,
  });
  expect(
    describeArenaAction('special:path-strike', b.player).explanation,
  ).toContain('×1,25');
  const after = resolveArenaRound(b, 'special:path-strike');
  const entry = after.log.find(
    (entry) => entry.actorId === 'p' && entry.specialId,
  )!;
  expect(after.player.focusPoints).toBe(2);
  expect(arenaConfirmedLog(after, entry)).toContain(
    'Consumiu 1 Foco; Foco após a ação: 2',
  );
  expect(arenaConfirmedLog(b, b.log[0])).toBe(b.log[0].message);
  expect(describeArenaAction(null).explanation).toMatch(/indisponível/);
});
