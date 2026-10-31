import { expect, test, vi } from 'vitest';
const mocked = vi.hoisted(() => ({
  rpc: vi.fn(),
  verify: vi.fn(),
  finish: vi.fn(),
}));
vi.mock('../client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: mocked.rpc }),
}));
vi.mock('../../guild-governance/context-guard', () => ({
  guardGuildContext: () => mocked.verify,
}));
vi.mock('../../guild-governance/selection', () => ({
  beginGuildWork: () => mocked.finish,
}));
import {
  guildChallengeRepository as repository,
  ChallengeRejected,
} from './guild-challenge-repository';
test('discards a late response after identity or community changed', async () => {
  mocked.rpc.mockResolvedValueOnce({ data: {}, error: null });
  mocked.verify.mockImplementationOnce(() => {
    throw Error('context changed');
  });
  await expect(repository.load('actor', 'guild', 'event')).rejects.toThrow(
    'context changed',
  );
});
test('never treats an economic or mismatched receipt as official confirmation', async () => {
  for (const patch of [
    { economicIssued: true },
    { id: 'other' },
    { guildId: 'other' },
    { action: 'practice' },
  ]) {
    mocked.rpc.mockResolvedValueOnce({
      data: {
        id: 'event',
        guildId: 'guild',
        action: 'answer',
        revision: 1,
        replayed: false,
        economicIssued: false,
        ...patch,
      },
      error: null,
    });
    await expect(
      repository.command(
        'actor',
        'guild',
        'answer',
        'event',
        1,
        { choices: [0, 0, 0, 0, 0, 0, 0] },
        'nonce',
      ),
    ).rejects.toThrow('não confirmado');
  }
  expect(mocked.rpc).toHaveBeenLastCalledWith(
    'guild_challenges_command',
    expect.objectContaining({
      p_actor: 'actor',
      p_guild: 'guild',
      p_event: 'event',
      p_request: 'nonce',
      p_revision: 1,
    }),
  );
  expect(mocked.finish).toHaveBeenCalled();
});
test('preserves the difference between authoritative conflict and uncertain network response', async () => {
  mocked.rpc.mockResolvedValueOnce({ data: null, error: { code: 'PT409' } });
  await expect(
    repository.command('actor', 'guild', 'answer', 'event', 1, {}, 'nonce'),
  ).rejects.toBeInstanceOf(ChallengeRejected);
  mocked.rpc.mockResolvedValueOnce({ data: null, error: { code: 'NETWORK' } });
  await expect(
    repository.command('actor', 'guild', 'answer', 'event', 1, {}, 'nonce'),
  ).rejects.not.toBeInstanceOf(ChallengeRejected);
});
