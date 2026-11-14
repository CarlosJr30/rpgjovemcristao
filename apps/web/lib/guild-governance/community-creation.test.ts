import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  verify: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: mocks.rpc }),
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
import { communityCreationTestUI } from './community-creation';
import { guildRepository } from '../supabase/repositories/guild-repository';
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());
const id = '10000000-0000-4000-8000-000000000001';
test('UI defaults closed and refuses PROD backend even with switch enabled', () => {
  vi.stubEnv('NEXT_PUBLIC_COMMUNITY_CREATION_TEST', '');
  expect(communityCreationTestUI()).toBe(false);
  vi.stubEnv('NEXT_PUBLIC_COMMUNITY_CREATION_TEST', '1');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://other.supabase.co');
  expect(communityCreationTestUI()).toBe(false);
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wkdvdzfkbwvhyjmamrsg.supabase.co',
  );
  expect(communityCreationTestUI()).toBe(true);
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
