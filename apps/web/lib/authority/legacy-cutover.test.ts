import { beforeEach, expect, it, vi } from 'vitest';
const { client, from, rpc } = vi.hoisted(() => {
  const from = vi.fn(),
    rpc = vi.fn();
  return { from, rpc, client: { from, rpc } };
});
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => client,
}));
import { walletRepository } from '../supabase/repositories/wallet-repository';
import { inventoryRepository } from '../supabase/repositories/inventory-repository';
import { statsRepository } from '../supabase/repositories/stats-repository';
import { travelerRepository } from '../supabase/repositories/traveler-repository';
import { chestRepository } from '../supabase/repositories/chest-repository';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../features/journey/domain/traveler';
import { hasEconomicChange } from './legacy-cutover';
beforeEach(() => vi.clearAllMocks());
it('retired economic adapters reject before network and retain explicit recovery messages', async () => {
  const actions = [
    () => walletRepository.setCoins('t', 999),
    () => walletRepository.addCoins('t', 999),
    () => walletRepository.spendCoins('t', 1),
    () => inventoryRepository.addItem('t', 'fake'),
    () => inventoryRepository.setQuantity('t', 'fake', 99),
    () => inventoryRepository.removeItem('t', 'fake'),
    () =>
      statsRepository.updateBaseStats('t', {
        life: 999,
        strength: 999,
        defense: 999,
        wisdom: 999,
      }),
  ];
  for (const action of actions)
    await expect(action()).rejects.toThrow('Economia online pausada');
  await expect(
    chestRepository.claimPhaseReward('t', 'phase:garden-choice'),
  ).rejects.toThrow('pausada');
  await expect(travelerRepository.deleteTraveler('t', 'u')).rejects.toThrow(
    'preservado',
  );
  expect(from).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});
it('traveler save transmits only cosmetic columns, never ownership, progress, XP or level', async () => {
  const eq = vi.fn();
  const chain = { eq, update: vi.fn() };
  eq.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  from.mockReturnValue(chain);
  const t = createTraveler(
    'Ana',
    DEFAULT_APPEARANCE,
    '10000000-0000-4000-8000-000000000001',
    '2026-10-20T12:00:00Z',
  );
  await travelerRepository.updateTraveler(t.id, 'u', {
    ...t,
    xp: 999,
    level: 99,
  });
  expect(chain.update).toHaveBeenCalledWith({
    name: t.name,
    body_type: t.avatar.gender,
    skin_tone: t.appearance.skin,
    hair_style: t.appearance.hair,
    hair_color: t.avatar.hairColor,
    avatar_variant: t.appearance.outfit,
  });
});
it('offline preview cannot be cached as online economic progress while cosmetic and diary changes remain possible', () => {
  const t = createTraveler(
    'Ana',
    DEFAULT_APPEARANCE,
    '10000000-0000-4000-8000-000000000001',
    '2026-10-20T12:00:00Z',
  );
  expect(
    hasEconomicChange(t, {
      ...t,
      name: 'Bia',
      progress: { ...t.progress, diaryEntries: 1 },
    }),
  ).toBe(false);
  expect(hasEconomicChange(t, { ...t, xp: 8, coins: 3 })).toBe(true);
  expect(hasEconomicChange(t, { ...t, inventory: [] })).toBe(true);
  expect(
    hasEconomicChange(t, { ...t, chests: { ...t.chests, common: 1 } }),
  ).toBe(true);
  expect(hasEconomicChange(t, { ...t, equipped: {} })).toBe(true);
});
