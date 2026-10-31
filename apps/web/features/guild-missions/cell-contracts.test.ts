import { expect, test } from 'vitest';
import { blankCell, cellPayload, parseCellWorkspace } from './cell-contracts';
import { emptyMission } from './contracts';
test('edited server rows cannot smuggle privileges, balances or status into the save payload', () => {
  const form = {
    ...emptyMission(),
    title: 'Atividade',
    description: 'Descrição',
    objective: 'Objetivo',
    instructions: 'Orientações',
    evidenceCriterion: 'Confirmação',
  };
  const extra = {
    ...blankCell('actor', 'activity'),
    id: 'old',
    status: 'published',
    canValidate: true,
    xp: 100,
  };
  const p = cellPayload(form, extra);
  expect(p).not.toHaveProperty('id');
  expect(p).not.toHaveProperty('status');
  expect(p).not.toHaveProperty('canValidate');
  expect(p).not.toHaveProperty('xp');
  expect(p).not.toHaveProperty('rewardTier');
});
test('meeting needs a date and rejects credential-bearing or executable access URLs', () => {
  const m = blankCell('actor', 'meeting');
  expect(() => cellPayload(emptyMission(), m)).toThrow(/data/);
  const f = { ...emptyMission(), startsAt: '2026-11-01T15:00' };
  for (const url of [
    'javascript:alert(1)',
    'https://user:password@example.invalid',
  ])
    expect(() =>
      cellPayload(f, { ...m, meetingType: 'digital', accessDetails: url }),
    ).toThrow();
  expect(
    cellPayload(f, {
      ...m,
      meetingType: 'digital',
      accessDetails: 'https://example.invalid/meeting',
    }).accessDetails,
  ).toBe('https://example.invalid/meeting');
});
test('workspace refuses another Guild, malformed or duplicate missions rather than showing empty success', () => {
  const base = {
    version: 1,
    guildId: 'own',
    leader: false,
    missions: [],
    progress: [],
    members: [],
    delegations: [],
    validations: [],
    history: [],
  };
  expect(parseCellWorkspace(base, 'own').missions).toEqual([]);
  expect(() => parseCellWorkspace(base, 'other')).toThrow();
  expect(() =>
    parseCellWorkspace({ ...base, missions: [null] }, 'own'),
  ).toThrow();
  const m = {
    id: 'one',
    kind: 'activity',
    status: 'published',
    revision: 1,
    targetIds: [],
  };
  expect(() =>
    parseCellWorkspace({ ...base, missions: [m, m] }, 'own'),
  ).toThrow();
});
