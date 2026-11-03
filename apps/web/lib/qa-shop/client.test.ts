// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  purchaseIntent,
  purchaseQAShop,
  readQAShop,
  resumeQAPurchase,
} from './client';
import { isReleasedPath } from '../release-scope';
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  reload: vi.fn(),
  owner: '00000000-0000-4000-8000-000000000001',
}));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: mocks.rpc }),
}));
vi.mock('../supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => mocks.owner,
  getOnlineSessionRevision: () => 1,
  canUseTravelerInCurrentSession: () => true,
  reloadOnlineTraveler: mocks.reload,
}));
const actor = '00000000-0000-4000-8000-000000000002';
it('resume after navigation uses the saved offer and nonce even if inventory already changed', async () => {
  const prior = purchaseIntent(
    mocks.owner,
    actor,
    'equipment',
    'traveler-sword-common',
  );
  mocks.rpc.mockResolvedValue({
    data: {
      version: 1,
      qaOnly: true,
      receiptId: crypto.randomUUID(),
      kind: 'equipment',
      offer: prior.offer,
    },
    error: null,
  });
  mocks.reload.mockResolvedValue(true);
  await resumeQAPurchase(actor);
  expect(mocks.rpc.mock.calls[0][1].p_operation_id).toBe(prior.id);
});
it('another tab holding the purchase lock prevents a second request', async () => {
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: { request: vi.fn((_key, _options, fn) => fn(null)) },
  });
  await expect(purchaseQAShop(actor, 'chest', 'common')).rejects.toThrow(
    'outra aba',
  );
  expect(mocks.rpc).not.toHaveBeenCalled();
});
beforeEach(() => {
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: { request: vi.fn((_key, _options, fn) => fn({ name: 'qa-shop' })) },
  });
  localStorage.clear();
  vi.stubEnv('NEXT_PUBLIC_SHOP_TEST_PREVIEW', '1');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wkdvdzfkbwvhyjmamrsg.supabase.co',
  );
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
  mocks.rpc.mockReset();
  mocks.reload.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
it('requires exact TEST backend and explicit flag for the two routes', () => {
  expect(isReleasedPath('/journey/shop')).toBe(true);
  vi.stubEnv('NEXT_PUBLIC_SHOP_TEST_PREVIEW', '0');
  expect(isReleasedPath('/journey/shop')).toBe(false);
  expect(isReleasedPath('/journey/equipment')).toBe(false);
});
it('refuses production even with a QA flag and TEST URL', () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  expect(isReleasedPath('/journey/shop')).toBe(false);
});
it('refuses another backend', () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://other.supabase.co');
  expect(isReleasedPath('/journey/equipment')).toBe(false);
});
it('retains the purchase identity across navigation/retry', () => {
  const a = purchaseIntent(mocks.owner, actor, 'chest', 'common');
  expect(purchaseIntent(mocks.owner, actor, 'chest', 'common')).toEqual(a);
  expect(() =>
    purchaseIntent(mocks.owner, actor, 'equipment', 'traveler-sword-common'),
  ).toThrow('pendente');
});
it('isolates pending purchase identity by account and avatar', () => {
  expect(purchaseIntent(mocks.owner, actor, 'chest', 'common').id).not.toBe(
    purchaseIntent(mocks.owner, 'other-avatar', 'chest', 'common').id,
  );
});
it('network failure preserves the original intent and never updates local coins', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: 'network' } });
  const intent = purchaseIntent(mocks.owner, actor, 'chest', 'common');
  await expect(purchaseQAShop(actor, 'chest', 'common')).rejects.toThrow();
  expect(purchaseIntent(mocks.owner, actor, 'chest', 'common')).toEqual(intent);
  expect(mocks.reload).not.toHaveBeenCalled();
});
it('clears intent only after a valid matching receipt and canonical reload', async () => {
  mocks.rpc.mockResolvedValue({
    data: {
      version: 1,
      qaOnly: true,
      receiptId: crypto.randomUUID(),
      kind: 'chest',
      offer: 'common',
    },
    error: null,
  });
  mocks.reload.mockResolvedValue(true);
  const first = purchaseIntent(mocks.owner, actor, 'chest', 'common');
  await purchaseQAShop(actor, 'chest', 'common');
  expect(purchaseIntent(mocks.owner, actor, 'chest', 'common').id).not.toBe(
    first.id,
  );
});
it('wrong receipt cannot clear the pending intent', async () => {
  mocks.rpc.mockResolvedValue({
    data: {
      version: 1,
      qaOnly: true,
      receiptId: crypto.randomUUID(),
      kind: 'equipment',
      offer: 'wrong',
    },
    error: null,
  });
  const first = purchaseIntent(mocks.owner, actor, 'chest', 'common');
  await expect(purchaseQAShop(actor, 'chest', 'common')).rejects.toThrow();
  expect(purchaseIntent(mocks.owner, actor, 'chest', 'common')).toEqual(first);
});
it('unregistered profile remains disabled without issuing a purchase', async () => {
  mocks.rpc.mockResolvedValue({
    data: { version: 1, qaOnly: true, enabled: false },
    error: null,
  });
  expect((await readQAShop(actor)).enabled).toBe(false);
  expect(mocks.rpc).toHaveBeenCalledOnce();
  expect(mocks.rpc.mock.calls[0][0]).toBe('get_qa_shop');
});
