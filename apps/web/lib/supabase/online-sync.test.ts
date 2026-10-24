import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../features/journey/domain/traveler';
import { journeyRepository } from '../../features/journey/persistence/journey-storage';
import {
  createOnlineTraveler,
  getCurrentRemoteActiveTravelerId,
  getLocalTravelerSnapshot,
  hydrateOnlineTravelers,
  listTravelersForCurrentSession,
  reloadOnlineTraveler,
  selectOnlineTraveler,
  setCurrentOnlineUser,
} from './online-sync';
import { equipmentRepository } from './repositories/equipment-repository';
import { inventoryRepository } from './repositories/inventory-repository';
import { statsRepository } from './repositories/stats-repository';
import { travelerRepository } from './repositories/traveler-repository';
import { walletRepository } from './repositories/wallet-repository';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const travelerA = '11111111-1111-4111-8111-111111111111';
const travelerB = '22222222-2222-4222-8222-222222222222';
const localTraveler = '33333333-3333-4333-8333-333333333333';
const newTravelerId = '44444444-4444-4444-8444-444444444444';

beforeEach(() => {
  vi.restoreAllMocks();
  const storage = new MemoryStorage();
  Object.assign(globalThis, {
    localStorage: storage,
    window: { localStorage: storage, dispatchEvent: vi.fn() },
  });
  setCurrentOnlineUser(null);
  journeyRepository.saveNew(
    createTraveler(
      'Ana',
      DEFAULT_APPEARANCE,
      travelerA,
      '2026-09-26T00:00:00.000Z',
    ),
  );
  journeyRepository.saveNew(
    createTraveler(
      'Bia',
      DEFAULT_APPEARANCE,
      travelerB,
      '2026-09-26T00:00:00.000Z',
    ),
  );
  journeyRepository.saveNew(
    createTraveler(
      'Lia',
      DEFAULT_APPEARANCE,
      localTraveler,
      '2026-09-26T00:00:00.000Z',
    ),
  );
  storage.setItem(
    'rpg-jovem-cristao:online-owner:v1',
    JSON.stringify({ [travelerA]: userA, [travelerB]: userB }),
  );
});

describe('online cache ownership', () => {
  test('does not overwrite the cache when a remote read completes after account switch', async () => {
    setCurrentOnlineUser(userA);
    const original = getLocalTravelerSnapshot(travelerA);
    let complete!: (value: Awaited<ReturnType<typeof travelerRepository.getTravelerById>>) => void;
    vi.spyOn(travelerRepository, 'getTravelerById').mockReturnValue(new Promise(resolve => { complete = resolve; }));
    vi.spyOn(statsRepository, 'getTravelerStats').mockResolvedValue({traveler_id:travelerA,base_life:1,base_strength:1,base_defense:1,base_wisdom:1,created_at:'2026-10-23T00:00:00Z',updated_at:'2026-10-23T00:00:00Z'});
    vi.spyOn(walletRepository, 'getWallet').mockResolvedValue({traveler_id:travelerA,coins:123,created_at:'2026-10-23T00:00:00Z',updated_at:'2026-10-23T00:00:00Z'});
    vi.spyOn(inventoryRepository,'getInventory').mockResolvedValue([]);
    vi.spyOn(equipmentRepository,'getEquippedItems').mockResolvedValue([]);
    const pending=reloadOnlineTraveler(travelerA);
    setCurrentOnlineUser(userB);
    complete({id:travelerA,user_id:userA,name:'Stale server response',body_type:'male',skin_tone:'medio',hair_style:'curto',hair_color:null,avatar_variant:'musgo',level:1,xp:0,is_active:true,created_at:'2026-10-23T00:00:00Z',updated_at:'2026-10-23T00:00:00Z'});
    await expect(pending).resolves.toBe(false);
    expect(getLocalTravelerSnapshot(travelerA)).toEqual(original);
  });
  test('isolates cached travelers between users and the local-only flow', () => {
    setCurrentOnlineUser(userA);
    expect(
      listTravelersForCurrentSession().map((traveler) => traveler.id),
    ).toEqual([travelerA]);

    setCurrentOnlineUser(userB);
    expect(
      listTravelersForCurrentSession().map((traveler) => traveler.id),
    ).toEqual([travelerB]);

    setCurrentOnlineUser(null);
    expect(
      listTravelersForCurrentSession().map((traveler) => traveler.id),
    ).toEqual([localTraveler]);
  });

  test('returns a detached local snapshot without uploading it', () => {
    const snapshot = getLocalTravelerSnapshot(localTraveler);
    expect(snapshot?.id).toBe(localTraveler);
    if (!snapshot) throw new Error('snapshot missing');
    snapshot.coins = 99;
    expect(getLocalTravelerSnapshot(localTraveler)?.coins).toBe(0);
  });
});

describe('online traveler creation', () => {
  test('confirms the atomic RPC and essential remote rows before caching', async () => {
    const traveler = createTraveler(
      'TesteSupabase',
      DEFAULT_APPEARANCE,
      newTravelerId,
      '2026-09-26T01:00:00.000Z',
    );
    const createRemote = vi
      .spyOn(travelerRepository, 'createTraveler')
      .mockImplementation(async () => {
        expect(getLocalTravelerSnapshot(newTravelerId)).toBeNull();
        return newTravelerId;
      });
    vi.spyOn(travelerRepository, 'getTravelerById').mockResolvedValue({
      id: newTravelerId,
      user_id: userA,
      name: 'TesteSupabase',
      body_type: 'male',
      skin_tone: 'medio',
      hair_style: 'curto',
      hair_color: '#3b2416',
      avatar_variant: 'musgo',
      level: 1,
      xp: 0,
      is_active: true,
      created_at: '2026-09-26T01:00:00.000Z',
      updated_at: '2026-09-26T01:00:00.000Z',
    });
    const getStats = vi
      .spyOn(statsRepository, 'getTravelerStats')
      .mockResolvedValue({
        traveler_id: newTravelerId,
        base_life: 1,
        base_strength: 1,
        base_defense: 1,
        base_wisdom: 1,
        created_at: '2026-09-26T01:00:00.000Z',
        updated_at: '2026-09-26T01:00:00.000Z',
      });
    const getWallet = vi
      .spyOn(walletRepository, 'getWallet')
      .mockResolvedValue({
        traveler_id: newTravelerId,
        coins: 0,
        created_at: '2026-09-26T01:00:00.000Z',
        updated_at: '2026-09-26T01:00:00.000Z',
      });
    vi.spyOn(inventoryRepository, 'getInventory').mockResolvedValue([]);
    vi.spyOn(equipmentRepository, 'getEquippedItems').mockResolvedValue([]);
    const setActive = vi
      .spyOn(travelerRepository, 'setActiveTraveler')
      .mockResolvedValue(undefined);

    await expect(createOnlineTraveler(userA, traveler)).resolves.toEqual({
      status: 'created',
      travelerId: newTravelerId,
    });
    expect(createRemote).toHaveBeenCalledWith(traveler);
    expect(setActive).toHaveBeenCalledWith(newTravelerId);
    expect(getStats).toHaveBeenCalledWith(newTravelerId);
    expect(getWallet).toHaveBeenCalledWith(newTravelerId);
    expect(getLocalTravelerSnapshot(newTravelerId)?.name).toBe('TesteSupabase');
    expect(journeyRepository.activeTravelerId()).toBe(newTravelerId);
  });

  test('does not cache or start a session when authenticated creation fails', async () => {
    const traveler = createTraveler(
      'TesteSupabase',
      DEFAULT_APPEARANCE,
      newTravelerId,
      '2026-09-26T01:00:00.000Z',
    );
    vi.spyOn(travelerRepository, 'createTraveler').mockRejectedValue(
      new Error('permission denied'),
    );

    await expect(createOnlineTraveler(userA, traveler)).resolves.toEqual({
      status: 'error',
      message: 'Não conseguimos salvar seu Viajante online. Tente novamente.',
    });
    expect(getLocalTravelerSnapshot(newTravelerId)).toBeNull();
    expect(journeyRepository.activeTravelerId()).toBeNull();
  });
});

describe('online traveler selection', () => {
  test.each([1, 2])(
    'automatically restores the active traveler among %i saved traveler(s)',
    async (travelerCount) => {
      const rows = [
        {
          id: travelerA,
          user_id: userA,
          name: 'Ana',
          body_type: 'male',
          skin_tone: 'medio',
          hair_style: 'curto',
          hair_color: '#3b2416',
          avatar_variant: 'musgo',
          level: 1,
          xp: 0,
          is_active: true,
          journey_progress:
            travelerCount === 1
              ? {
                  ...createTraveler(
                    'Ana',
                    DEFAULT_APPEARANCE,
                    travelerA,
                    '2026-09-26T00:00:00.000Z',
                  ).progress,
                  gardenStep: 'explore',
                  gardenFragments: 2,
                }
              : null,
          created_at: '2026-09-26T00:00:00.000Z',
          updated_at: '2026-09-26T00:00:00.000Z',
        },
        {
          id: newTravelerId,
          user_id: userA,
          name: 'Nova',
          body_type: 'female',
          skin_tone: 'escuro',
          hair_style: 'longo',
          hair_color: '#3b2416',
          avatar_variant: 'azul',
          level: 1,
          xp: 0,
          is_active: false,
          created_at: '2026-09-26T01:00:00.000Z',
          updated_at: '2026-09-26T01:00:00.000Z',
        },
      ];
      vi.spyOn(travelerRepository, 'getTravelersByUser').mockResolvedValue(
        rows.slice(0, travelerCount),
      );
      vi.spyOn(statsRepository, 'getTravelerStats').mockImplementation(
        async (id) => ({
          traveler_id: id,
          base_life: 1,
          base_strength: 1,
          base_defense: 1,
          base_wisdom: 1,
          created_at: '2026-09-26T00:00:00.000Z',
          updated_at: '2026-09-26T00:00:00.000Z',
        }),
      );
      vi.spyOn(walletRepository, 'getWallet').mockImplementation(
        async (id) => ({
          traveler_id: id,
          coins: 0,
          created_at: '2026-09-26T00:00:00.000Z',
          updated_at: '2026-09-26T00:00:00.000Z',
        }),
      );
      vi.spyOn(inventoryRepository, 'getInventory').mockResolvedValue([]);
      vi.spyOn(equipmentRepository, 'getEquippedItems').mockResolvedValue([]);

      setCurrentOnlineUser(userA);
      await hydrateOnlineTravelers(userA);

      expect(listTravelersForCurrentSession()).toHaveLength(travelerCount);
      expect(getCurrentRemoteActiveTravelerId()).toBe(travelerA);
      expect(journeyRepository.activeTravelerId()).toBe(travelerA);
      expect(
        getLocalTravelerSnapshot(travelerA)?.progress.gardenFragments,
      ).toBe(travelerCount === 1 ? 2 : 0);
    },
  );

  test('waits for set_active_traveler when switching travelers', async () => {
    setCurrentOnlineUser(userA);
    const setActive = vi
      .spyOn(travelerRepository, 'setActiveTraveler')
      .mockResolvedValue(undefined);

    await expect(selectOnlineTraveler(travelerA)).resolves.toBe(true);

    expect(setActive).toHaveBeenCalledWith(travelerA);
    expect(getCurrentRemoteActiveTravelerId()).toBe(travelerA);
  });
});
