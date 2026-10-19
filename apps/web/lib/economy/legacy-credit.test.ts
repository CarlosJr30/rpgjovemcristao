import { expect, test, vi } from 'vitest';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc }),
}));
import { walletRepository } from '../supabase/repositories/wallet-repository';

test('browser repository no longer exposes arbitrary credit or balance writes', () => {
  expect(walletRepository).not.toHaveProperty('addCoins');
  expect(walletRepository).not.toHaveProperty('setCoins');
  expect(walletRepository).not.toHaveProperty('spendCoins');
  expect(rpc).not.toHaveBeenCalled();
});
