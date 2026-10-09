import { expect, test } from 'vitest';
import {
  createBattle,
  resolveRound,
  type BattleParticipantSnapshot,
} from '@rpg/game-engine';
import { battleFeedback } from './data/battlePresentation';

const fighter = (
  id: string,
  effectIds: BattleParticipantSnapshot['equipment'][number]['effectIds'] = [],
): BattleParticipantSnapshot => ({
  id,
  name: id,
  level: 1,
  combatPower: 50,
  attributes: { life: 1, strength: 2, defense: 1, wisdom: 1 },
  equipment: effectIds.length
    ? [{ id: 'item', name: 'Item', power: 1, effectIds }]
    : [],
});

test('cada dano real aponta atacante, adversário e valor, sem duplicar escolha', () => {
  const before = createBattle(fighter('Ana'), fighter('Bia'), 8);
  const after = resolveRound(before, 'attack');
  const feedback = battleFeedback(before, after);
  const damage = after.log
    .slice(before.log.length)
    .filter((entry) => entry.kind === 'damage');
  expect(feedback.filter((event) => event.amount !== undefined)).toHaveLength(
    damage.length,
  );
  for (const event of feedback.filter((event) => event.amount !== undefined)) {
    expect(event.actorId).not.toBe(event.targetId);
    expect(event.amount).toBe(
      damage.find((entry) => entry.actorId === event.actorId)?.amount,
    );
    expect(event.description).toContain(`${event.actorId} → ${event.targetId}`);
  }
});

test('habilidade usa nome existente e defesa não inventa bônus numérico', () => {
  const before = createBattle(
    fighter('Ana', ['path-sword']),
    fighter('Bia'),
    8,
  );
  expect(
    battleFeedback(before, resolveRound(before, 'equipment')).some(
      (event) => event.label === 'Golpe do Caminho',
    ),
  ).toBe(true);
  const defended = resolveRound(before, 'defend');
  const feedback = battleFeedback(before, defended);
  expect(
    feedback.some(
      (event) => event.kind === 'defend' && event.actorId === 'Ana',
    ),
  ).toBe(true);
  expect(
    feedback.find(
      (event) => event.targetId === 'Ana' && event.kind === 'attack',
    )?.defended,
  ).toBe(true);
  expect(
    feedback.find((event) => event.kind === 'defend')?.amount,
  ).toBeUndefined();
});

test('esquiva das botas aparece no defensor, inclusive quando nome contém ação', () => {
  const before = createBattle(
    fighter('Ana Atacar.'),
    fighter('Bia', ['pilgrim-boots']),
    8,
  );
  const lowHp = { ...before, opponent: { ...before.opponent, hp: 2 } };
  const feedback = battleFeedback(lowHp, resolveRound(lowHp, 'attack'));
  expect(feedback).toContainEqual(
    expect.objectContaining({ kind: 'dodge', targetId: 'Bia', amount: 0 }),
  );
});
