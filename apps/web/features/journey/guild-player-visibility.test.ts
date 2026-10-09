import { expect, test } from 'vitest';
import {
  localContentDeadline,
  missionIsPlayable,
  playerMissionSection,
  playerContentSection,
  playerSpecialSection,
  playerPhaseSection,
} from './data/guildPlayerVisibility';
import type { GuildContent } from './data/guildContent';

const now = Date.parse('2026-10-04T15:00:00Z');
const active = { status: 'published', starts_at: null, due_at: null };

test('desafio de fase separa realização, recompensa pendente e histórico', () => {
  expect(playerPhaseSection('submitted')).toBe('available');
  expect(playerPhaseSection('revision-requested')).toBe('available');
  expect(playerPhaseSection('approved')).toBe('pending');
  expect(playerPhaseSection('reward-available')).toBe('pending');
  expect(playerPhaseSection('completed')).toBe('history');
  expect(playerPhaseSection('locked')).toBe('hidden');
  expect(playerPhaseSection('unknown')).toBe('hidden');
});

test('desafios especiais vencidos não são jogáveis; histórico e recompensas permanecem', () => {
  const challenge = {
    status: 'available' as const,
    expiresAt: new Date(now).toISOString(),
  };
  expect(playerSpecialSection(challenge, now)).toBe('hidden');
  expect(
    playerSpecialSection({ ...challenge, expiresAt: 'inválido' }, now),
  ).toBe('hidden');
  expect(playerSpecialSection({ ...challenge, expiresAt: null }, now)).toBe(
    'available',
  );
  expect(playerSpecialSection({ ...challenge, status: 'completed' }, now)).toBe(
    'history',
  );
  expect(
    playerSpecialSection({ ...challenge, status: 'reward-available' }, now),
  ).toBe('pending');
});

test('jogador só recebe missões publicadas, vigentes e realizáveis', () => {
  for (const progress of [undefined, 'available', 'started', 'rejected'])
    expect(playerMissionSection(active, progress, now)).toBe('available');
  for (const status of ['draft', 'cancelled', 'closed'])
    expect(playerMissionSection({ ...active, status }, 'started', now)).toBe(
      'hidden',
    );
  expect(
    playerMissionSection(
      { ...active, starts_at: '2026-10-05T00:00:00Z' },
      undefined,
      now,
    ),
  ).toBe('hidden');
  expect(
    playerMissionSection(
      { ...active, due_at: new Date(now).toISOString() },
      'rejected',
      now,
    ),
  ).toBe('hidden');
  expect(
    missionIsPlayable(
      { ...active, starts_at: new Date(now).toISOString() },
      now,
    ),
  ).toBe(true);
  expect(missionIsPlayable({ ...active, starts_at: 'inválido' }, now)).toBe(
    false,
  );
  expect(playerMissionSection(active, 'unknown', now)).toBe('hidden');
});

test('histórico e aprovação continuam acessíveis mesmo após encerrar missão', () => {
  expect(
    playerMissionSection({ ...active, status: 'closed' }, 'completed', now),
  ).toBe('history');
  expect(
    playerMissionSection(
      { ...active, due_at: '2020-01-01' },
      'pending_approval',
      now,
    ),
  ).toBe('pending');
});

test('atividade local concluída sai da lista e prazo inclui todo o dia local', () => {
  const item = { status: 'active', date: '2026-10-04' } as GuildContent;
  const deadline = localContentDeadline(item.date);
  expect(playerContentSection(item, undefined, deadline - 1)).toBe('available');
  expect(playerContentSection(item, undefined, deadline)).toBe('hidden');
  expect(playerContentSection(item, 'claimed', deadline)).toBe('history');
  expect(playerContentSection(item, 'approved', deadline)).toBe('pending');
  expect(
    playerContentSection({ ...item, status: 'archived' }, undefined, now),
  ).toBe('hidden');
});
