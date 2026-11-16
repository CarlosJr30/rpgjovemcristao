import { beforeEach, expect, test, vi } from 'vitest';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('./client', () => ({ getSupabaseBrowserClient: () => ({ rpc }) }));
import { hasAdultGameAccess, verifiedGameAccess } from './adult-access';
beforeEach(() => rpc.mockReset());
test('accepts only the exact affirmative server contract', () => {
  expect(verifiedGameAccess({ version: 1, allowed: true })).toBe(true);
  for (const value of [
    null,
    true,
    {},
    [],
    { version: 2, allowed: true },
    { version: 1, allowed: 'true' },
    { version: 1, allowed: false },
    { user_metadata: { adult: true } },
  ])
    expect(verifiedGameAccess(value)).toBe(false);
});
test('missing RPC, API error and network outage deny game access', async () => {
  for (const result of [
    { data: null, error: { code: 'PGRST202' } },
    { data: { version: 1, allowed: true }, error: { code: '42501' } },
    { data: { version: 1, allowed: false }, error: null },
  ]) {
    rpc.mockResolvedValueOnce(result);
    expect(await hasAdultGameAccess()).toBe(false);
  }
  rpc.mockRejectedValueOnce(new Error('offline'));
  expect(await hasAdultGameAccess()).toBe(false);
});
test('verified adult contract permits access without a DOB or metadata claim', async () => {
  rpc.mockResolvedValueOnce({
    data: { version: 1, allowed: true },
    error: null,
  });
  expect(await hasAdultGameAccess()).toBe(true);
  expect(rpc).toHaveBeenCalledWith('phase1_game_access');
});
