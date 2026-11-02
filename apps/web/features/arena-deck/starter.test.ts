import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { requestArenaStarter } from './starter';
const m = vi.hoisted(() => ({
  owner: 'owner',
  revision: 1,
  usable: true,
  rpc: vi.fn(),
}));
vi.mock('../../lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: m.rpc }),
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => m.owner,
  getOnlineSessionRevision: () => m.revision,
  canUseTravelerInCurrentSession: () => m.usable,
}));
const traveler = '11111111-1111-4111-8111-111111111111',
  receipt = {
    receiptId: '22222222-2222-4222-8222-222222222222',
    travelerId: traveler,
    catalogVersion: 'fixture-starter',
    status: 'available',
  };
beforeEach(() => {
  vi.clearAllMocks();
  m.owner = 'owner';
  m.revision = 1;
  m.usable = true;
  m.rpc.mockResolvedValue({ data: receipt, error: null });
});
afterEach(() => vi.unstubAllEnvs());
it('calls only the fixed starter with own traveler, never actor amounts or card IDs', async () => {
  await expect(requestArenaStarter('owner', traveler)).resolves.toEqual(
    receipt,
  );
  expect(m.rpc).toHaveBeenCalledExactlyOnceWith('claim_arena_starter', {
    p_traveler_id: traveler,
  });
});
it('denies a different account before any call', async () => {
  await expect(requestArenaStarter('other', traveler)).rejects.toThrow();
  expect(m.rpc).not.toHaveBeenCalled();
});
it('denies unusable avatar', async () => {
  m.usable = false;
  await expect(requestArenaStarter('owner', traveler)).rejects.toThrow();
  expect(m.rpc).not.toHaveBeenCalled();
});
it.each(['owner', 'session', 'avatar'])(
  'discards delayed result after %s change',
  async (kind) => {
    m.rpc.mockImplementation(async () => {
      if (kind === 'owner') m.owner = 'other';
      else if (kind === 'session') m.revision++;
      else m.usable = false;
      return { data: receipt, error: null };
    });
    await expect(requestArenaStarter('owner', traveler)).rejects.toThrow();
  },
);
it('preserves a legitimate prior allocation to another own avatar without inventing a transfer', async () => {
  const data = {
    ...receipt,
    travelerId: '33333333-3333-4333-8333-333333333333',
    status: 'claimed-on-another-traveler',
  };
  m.rpc.mockResolvedValue({ data, error: null });
  await expect(requestArenaStarter('owner', traveler)).resolves.toEqual(data);
});
it.each([
  null,
  { ...receipt, receiptId: 'forged' },
  { ...receipt, travelerId: '33333333-3333-4333-8333-333333333333' },
  { ...receipt, status: 'granted-admin' },
])('fails closed for wrong receipt %#', async (data) => {
  m.rpc.mockResolvedValue({ data, error: null });
  await expect(requestArenaStarter('owner', traveler)).rejects.toThrow();
});
it('redacts RPC errors rather than exposing database messages or payloads', async () => {
  m.rpc.mockResolvedValue({
    data: null,
    error: { message: 'private database detail' },
  });
  await expect(requestArenaStarter('owner', traveler)).rejects.toThrow(
    'tentar novamente com segurança',
  );
});
