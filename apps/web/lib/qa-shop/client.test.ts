// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  purchaseIntent,
  purchaseQAShop,
  readQAShop,
  resumeQAPurchase,
  openShopChest,
} from './client';
import { isReleasedPath } from '../release-scope';
import { startIntent } from '../../features/chest-reveal/visual-store';
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
const production = () => {
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wspafhlbtlpabypzymjo.supabase.co',
  );
  vi.stubEnv('NEXT_PUBLIC_SHOP_PRODUCTION_RELEASE', '1');
};
it('production route requires explicit production flag and exact backend', () => {
  production();
  expect(isReleasedPath('/journey/shop')).toBe(true);
  vi.stubEnv('NEXT_PUBLIC_SHOP_PRODUCTION_RELEASE', '0');
  expect(isReleasedPath('/journey/shop')).toBe(false);
});
it('production receipt and intent use the bounded productive RPC without QA namespace', async () => {
  production();
  mocks.rpc.mockResolvedValue({
    data: {
      version: 1,
      qaOnly: false,
      receiptId: crypto.randomUUID(),
      kind: 'chest',
      offer: 'common',
    },
    error: null,
  });
  mocks.reload.mockResolvedValue(true);
  await purchaseQAShop(actor, 'chest', 'common');
  expect(mocks.rpc.mock.calls[0][0]).toBe('purchase_shop');
  expect(Object.keys(localStorage).some((k) => k.includes('qa-shop'))).toBe(
    false,
  );
});
it('productive state never accepts a QA budget response', async () => {
  production();
  mocks.rpc.mockResolvedValue({
    data: {
      version: 1,
      qaOnly: true,
      enabled: true,
      coins: 255,
      balanceVerified: true,
    },
    error: null,
  });
  await expect(readQAShop(actor)).rejects.toThrow();
  expect(mocks.rpc.mock.calls[0][0]).toBe('get_shop');
});
it('041 purchase opts in explicitly and retains its contract when retried', async () => {
  production();
  mocks.rpc.mockResolvedValue({
    data: {
      version: 1,
      qaOnly: false,
      receiptId: crypto.randomUUID(),
      kind: 'chest',
      offer: 'common',
    },
    error: null,
  });
  mocks.reload.mockResolvedValue(false);
  await expect(
    purchaseQAShop(actor, 'chest', 'common', true),
  ).rejects.toThrow();
  const first = mocks.rpc.mock.calls[0];
  expect(first[0]).toBe('purchase_expansion_chest');
  mocks.reload.mockResolvedValue(true);
  await purchaseQAShop(actor, 'chest', 'common');
  expect(mocks.rpc.mock.calls[1]).toEqual(first);
});
it('productive state preserves explicit legacy reconciliation block without issuing a purchase', async () => {
  production();
  mocks.rpc.mockResolvedValue({
    data: {
      version: 1,
      qaOnly: false,
      enabled: false,
      reason: 'legacy-reconciliation-required',
    },
    error: null,
  });
  expect((await readQAShop(actor)).reason).toBe(
    'legacy-reconciliation-required',
  );
  expect(mocks.rpc).toHaveBeenCalledOnce();
});
it('definitive authenticated hold clears only the failed productive intent', async () => {
  production();
  const before = purchaseIntent(mocks.owner, actor, 'chest', 'common');
  mocks.rpc.mockResolvedValue({
    data: { version: 1, qaOnly: false, status: 'suspended' },
    error: null,
  });
  await expect(purchaseQAShop(actor, 'chest', 'common')).rejects.toThrow(
    'suspensa',
  );
  expect(purchaseIntent(mocks.owner, actor, 'chest', 'common').id).not.toBe(
    before.id,
  );
});
it('productive opening dispatch keeps the existing type and operation identity', async () => {
  production();
  mocks.rpc.mockResolvedValue({ data: { coins: 25 }, error: null });
  const id = crypto.randomUUID();
  await openShopChest(actor, 'epic', id);
  expect(mocks.rpc).toHaveBeenCalledWith('open_shop_chest', {
    p_actor: actor,
    p_chest_type: 'epic',
    p_operation_id: id,
  });
});
it('productive opening hold uses the existing definitive suspension contract', async () => {
  production();
  mocks.rpc.mockResolvedValue({ data: { status: 'suspended' }, error: null });
  await expect(
    openShopChest(actor, 'common', crypto.randomUUID()),
  ).rejects.toThrow('suspenso');
});
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
  expect(a.openingId).not.toBe(a.id);
  expect(() =>
    purchaseIntent(mocks.owner, actor, 'equipment', 'traveler-sword-common'),
  ).toThrow('pendente');
});

it('an unresolved opening prevents another debit before creating a purchase intent', async () => {
  startIntent(mocks.owner, actor, 'common');
  await expect(purchaseQAShop(actor, 'chest', 'common')).rejects.toThrow(
    'abertura pendente',
  );
  expect(mocks.rpc).not.toHaveBeenCalled();
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
