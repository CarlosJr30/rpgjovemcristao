import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  verify: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: mocks.rpc }),
}));
vi.mock('../supabase/online-sync', () => ({
  canUseTravelerInCurrentSession: () => true,
  getCurrentOnlineUserId: () => 'actor',
  getOnlineSessionRevision: () => 1,
}));
vi.mock('./context-guard', () => ({ guardGuildContext: () => mocks.verify }));
vi.mock('./creation-intent', () => ({
  beginGuildCreation: () => ({
    id: 'intent',
    request: 'request',
    name: 'Guilda',
    description: '',
  }),
  confirmGuildCreation: mocks.confirm,
}));
import { guildRepository } from '../supabase/repositories/guild-repository';
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());
const id = '10000000-0000-4000-8000-000000000001';
test('own-creation capability comes from the authenticated server and fails closed', async () => {
  mocks.rpc.mockResolvedValueOnce({
    data: { version: 1, available: true },
    error: null,
  });
  await expect(guildRepository.canCreateOwnGuild('actor')).resolves.toBe(true);
  expect(mocks.rpc).toHaveBeenCalledWith('community_own_guild_capability', {
    p_actor: 'actor',
  });

  mocks.rpc.mockResolvedValueOnce({
    data: null,
    error: { code: 'PGRST202' },
  });
  await expect(guildRepository.canCreateOwnGuild('actor')).resolves.toBe(false);
  mocks.rpc.mockResolvedValueOnce({
    data: { version: 2, available: true },
    error: null,
  });
  await expect(guildRepository.canCreateOwnGuild('actor')).resolves.toBe(false);
});
test('sends only actor and persisted intent, confirms server receipt', async () => {
  mocks.rpc.mockResolvedValue({
    data: { id, status: 'created', version: 1 },
    error: null,
  });
  await expect(guildRepository.createOwn('actor', 'Guilda', '')).resolves.toBe(
    id,
  );
  expect(mocks.rpc).toHaveBeenCalledWith('community_create_own_guild', {
    p_actor: 'actor',
    p_request: 'request',
    p_name: 'Guilda',
    p_description: '',
  });
  expect(mocks.confirm).toHaveBeenCalledWith('actor', 'intent');
});
test('denial preserves pending intent and explains server refusal', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { code: '23505' } });
  await expect(
    guildRepository.createOwn('actor', 'Guilda', ''),
  ).rejects.toThrow('já criou');
  expect(mocks.confirm).not.toHaveBeenCalled();
});
test('invalid receipt cannot clear recovery intent', async () => {
  mocks.rpc.mockResolvedValue({
    data: { id: 'invalid', status: 'created', version: 1 },
    error: null,
  });
  await expect(
    guildRepository.createOwn('actor', 'Guilda', ''),
  ).rejects.toThrow('confirmada');
  expect(mocks.confirm).not.toHaveBeenCalled();
});
test('context switch during request cannot confirm another session result', async () => {
  mocks.rpc.mockResolvedValue({
    data: { id, status: 'created', version: 1 },
    error: null,
  });
  mocks.verify.mockImplementationOnce(() => {
    throw Error('Context changed');
  });
  await expect(
    guildRepository.createOwn('actor', 'Guilda', ''),
  ).rejects.toThrow('Context changed');
  expect(mocks.confirm).not.toHaveBeenCalled();
});
