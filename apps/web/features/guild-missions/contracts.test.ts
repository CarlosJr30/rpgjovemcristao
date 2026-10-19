import { expect, test } from 'vitest';
import {
  canParticipate,
  eligibleForTraveler,
  emptyMission,
  rewardLabel,
  validateMission,
  type Mission,
  type Progress,
} from './contracts';
const valid = () => ({
  ...emptyMission(),
  title: 'Atividade do grupo',
  description: 'Descricao objetiva',
  objective: 'Objetivo definido pelo lider',
  instructions: 'Como realizar',
  evidenceCriterion: 'Registro textual',
});
test('selected audience follows the current Traveler rather than another avatar of the same account', () => {
  expect(
    eligibleForTraveler(
      { audience: 'selected', target_traveler_ids: ['member-a'] },
      'member-a',
    ),
  ).toBe(true);
  expect(
    eligibleForTraveler(
      { audience: 'selected', target_traveler_ids: ['member-a'] },
      'member-b',
    ),
  ).toBe(false);
  expect(
    eligibleForTraveler(
      { audience: 'all', target_traveler_ids: [] },
      'member-b',
    ),
  ).toBe(true);
});
test('complete mission contract validates fields, targets and deadlines without raw economy values', () => {
  expect(validateMission(valid())).toBeNull();
  for (const field of [
    'title',
    'description',
    'objective',
    'instructions',
    'evidenceCriterion',
  ] as const)
    expect(validateMission({ ...valid(), [field]: ' ' })).not.toBeNull();
  expect(validateMission({ ...valid(), audience: 'selected' })).toContain(
    'Selecione',
  );
  expect(
    validateMission({
      ...valid(),
      startsAt: '2030-01-02T12:00',
      dueAt: '2030-01-01T12:00',
    }),
  ).toContain('datas');
  expect(
    validateMission({ ...valid(), rewardTier: 'hacked' as 'normal' }),
  ).toContain('inválida');
  expect(valid()).not.toHaveProperty('xp');
  expect(valid()).not.toHaveProperty('coins');
});
test('approval is independent from granting a reward and windows are enforced', () => {
  expect(
    rewardLabel({ status: 'approved', reward_claimed_at: null } as Progress),
  ).toContain('pendente');
  expect(
    rewardLabel({ status: 'completed', reward_claimed_at: null } as Progress),
  ).toContain('pendente');
  expect(
    rewardLabel({
      status: 'completed',
      reward_claimed_at: '2026-10-19T12:00:00Z',
    } as Progress),
  ).toContain('registrada');
  const mission = {
    status: 'published',
    starts_at: '2030-01-01T00:00:00Z',
    due_at: '2030-01-02T00:00:00Z',
  } as Mission;
  expect(canParticipate(mission, Date.parse('2030-01-01T12:00:00Z'))).toBe(
    true,
  );
  expect(canParticipate(mission, Date.parse('2030-01-02T00:00:00Z'))).toBe(
    false,
  );
  expect(
    canParticipate(
      { ...mission, status: 'cancelled' },
      Date.parse('2030-01-01T12:00:00Z'),
    ),
  ).toBe(false);
});
