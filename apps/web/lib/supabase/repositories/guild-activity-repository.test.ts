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
  guildActivityRepository,
  CellCommandRejected,
} from './guild-activity-repository';
const frame = {
  version: 1,
  guildId: 'guild',
  leader: false,
  missions: [],
  progress: [],
  members: [],
  delegations: [],
  history: [],
  validations: [],
};
test('late workspace response is discarded after account/avatar/Guild invalidates the request', async () => {
  mocked.rpc.mockResolvedValueOnce({ data: frame, error: null });
  mocked.verify.mockImplementationOnce(() => {
    throw Error('scope changed');
  });
  await expect(guildActivityRepository.load('actor', 'guild')).rejects.toThrow(
    'scope changed',
  );
});
test('command pins actor Guild action entity and nonce, rejecting another receipt scope or economic flag', async () => {
  for (const data of [
    {
      id: 'entity',
      guildId: 'other',
      action: 'save',
      revision: 1,
      replayed: false,
      economicIssued: false,
    },
    {
      id: 'entity',
      guildId: 'guild',
      action: 'save',
      revision: 1,
      replayed: false,
      economicIssued: true,
    },
  ]) {
    mocked.rpc.mockResolvedValueOnce({ data, error: null });
    await expect(
      guildActivityRepository.command(
        'actor',
        'guild',
        'save',
        'entity',
        0,
        {},
        'nonce',
      ),
    ).rejects.toThrow(/não foi confirmado/);
  }
  expect(mocked.rpc).toHaveBeenLastCalledWith(
    'guild_activity_command',
    expect.objectContaining({
      p_actor: 'actor',
      p_guild: 'guild',
      p_action: 'save',
      p_id: 'entity',
      p_request: 'nonce',
    }),
  );
  expect(mocked.finish).toHaveBeenCalled();
});
test('PT409 is a definitive conflict while uncertain network failure keeps an unconfirmed result distinct', async () => {
  mocked.rpc.mockResolvedValueOnce({ error: { code: 'PT409' }, data: null });
  await expect(
    guildActivityRepository.command(
      'actor',
      'guild',
      'participate',
      'entity',
      0,
      {},
      'nonce',
    ),
  ).rejects.toBeInstanceOf(CellCommandRejected);
  mocked.rpc.mockResolvedValueOnce({ error: { code: 'NETWORK' }, data: null });
  await expect(
    guildActivityRepository.command(
      'actor',
      'guild',
      'participate',
      'entity',
      0,
      {},
      'nonce',
    ),
  ).rejects.not.toBeInstanceOf(CellCommandRejected);
});
