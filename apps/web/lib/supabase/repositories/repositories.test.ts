import { beforeEach, describe, expect, test, vi } from 'vitest';

const { client, rpc, from } = vi.hoisted(() => {
  const rpc = vi.fn();
  const from = vi.fn();
  return { client: { rpc, from }, rpc, from };
});

vi.mock('../client', () => ({ getSupabaseBrowserClient: () => client }));

import { travelerRepository } from './traveler-repository';
import { walletRepository } from './wallet-repository';

beforeEach(() => {
  rpc.mockReset();
  from.mockReset();
});

describe('online repositories', () => {
  test('creates a traveler through the atomic RPC without sending user_id', async () => {
    rpc.mockResolvedValue({ data: 'traveler-1', error: null });
    const traveler = {
      id: 'traveler-1',
      name: 'TesteSupabase',
      avatar: { gender: 'male', hairColor: '#3b2416' },
      appearance: { skin: 'medio', hair: 'curto', outfit: 'musgo' },
    } as Parameters<typeof travelerRepository.createTraveler>[0];

    await expect(travelerRepository.createTraveler(traveler)).resolves.toBe(
      'traveler-1',
    );
    expect(rpc).toHaveBeenCalledWith('create_traveler', {
      p_id: 'traveler-1',
      p_name: 'TesteSupabase',
      p_body_type: 'male',
      p_skin_tone: 'medio',
      p_hair_style: 'curto',
      p_hair_color: '#3b2416',
      p_avatar_variant: 'musgo',
    });
  });

  test('preserves database diagnostics when traveler creation is rejected', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: '42501',
        message: 'permission denied',
        details: 'rls',
        hint: null,
      },
    });
    const traveler = {
      id: 'traveler-1',
      name: 'TesteSupabase',
      avatar: { gender: 'male', hairColor: '#3b2416' },
      appearance: { skin: 'medio', hair: 'curto', outfit: 'musgo' },
    } as Parameters<typeof travelerRepository.createTraveler>[0];

    await expect(
      travelerRepository.createTraveler(traveler),
    ).rejects.toMatchObject({
      message: 'Não foi possível criar o Viajante online.',
      developmentDetails: expect.stringContaining('code=42501'),
    });
  });

  test('requires a semantic server operation instead of an arbitrary spend amount', () => {
    expect(walletRepository).not.toHaveProperty('spendCoins');
    expect(walletRepository).not.toHaveProperty('addCoins');
    expect(rpc).not.toHaveBeenCalled();
  });

  test('sets the active traveler through one atomic RPC', async () => {
    rpc.mockResolvedValue({ data: undefined, error: null });
    await travelerRepository.setActiveTraveler('traveler-1');
    expect(rpc).toHaveBeenCalledWith('set_active_traveler', {
      p_traveler_id: 'traveler-1',
    });
  });
});
