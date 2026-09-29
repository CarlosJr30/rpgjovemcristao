import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from '../domain/traveler';
import { journeyRepository } from '../persistence/journey-storage';

const {
  getSession,
  getAuthenticatedUser,
  createOnlineTraveler,
  signOut,
  onlineSession,
} = vi.hoisted(() => ({
    getSession: vi.fn(),
    getAuthenticatedUser: vi.fn(),
    createOnlineTraveler: vi.fn(),
    signOut: vi.fn(),
    onlineSession: { userId: null as string | null },
  }));

vi.mock('../../../lib/supabase/auth', () => ({
  getSession,
  getAuthenticatedUser,
  signOut,
}));

vi.mock('../../../lib/supabase/online-sync', () => ({
  ONLINE_CACHE_EVENT: 'online-cache-change',
  canUseTravelerInCurrentSession: vi.fn(() => true),
  createOnlineTraveler,
  getCurrentOnlineUserId: vi.fn(() => onlineSession.userId),
  queueOnlineTravelerSync: vi.fn(),
  selectOnlineTraveler: vi.fn(async () => true),
}));

import {
  registerTraveler,
  signOutAccount,
  switchTraveler,
} from './use-journey';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

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

beforeEach(() => {
  const storage = new MemoryStorage();
  Object.assign(globalThis, {
    localStorage: storage,
    window: { localStorage: storage },
  });
  vi.clearAllMocks();
  onlineSession.userId = null;
  getSession.mockResolvedValue(null);
  getAuthenticatedUser.mockResolvedValue(null);
  signOut.mockResolvedValue({ error: null });
});

describe('traveler and account session actions', () => {
  test('switching traveler clears only the active traveler and never signs out Auth', () => {
    const traveler = createTraveler(
      'TesteBancoreal',
      DEFAULT_APPEARANCE,
      '11111111-1111-4111-8111-111111111111',
      '2026-09-27T00:00:00.000Z',
    );
    journeyRepository.saveNew(traveler);
    journeyRepository.startSession(traveler.id);
    onlineSession.userId = userId;

    expect(switchTraveler()).toBe(true);

    expect(signOut).not.toHaveBeenCalled();
    expect(journeyRepository.activeTravelerId()).toBeNull();
    expect(journeyRepository.listSaved()).toEqual([traveler]);
  });

  test('signing out the account calls Supabase signOut and clears the active traveler', async () => {
    const traveler = createTraveler(
      'TesteBancoreal',
      DEFAULT_APPEARANCE,
      '11111111-1111-4111-8111-111111111111',
      '2026-09-27T00:00:00.000Z',
    );
    journeyRepository.saveNew(traveler);
    journeyRepository.startSession(traveler.id);
    onlineSession.userId = userId;

    await expect(signOutAccount()).resolves.toBe(true);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(journeyRepository.activeTravelerId()).toBeNull();
    expect(journeyRepository.listSaved()).toEqual([traveler]);
  });
});

describe('traveler registration session gate', () => {
  test('does not infer local-only mode while authentication is unresolved', async () => {
    await expect(
      registerTraveler(
        'TestePersistenciaReal',
        DEFAULT_APPEARANCE,
        'male',
        undefined,
      ),
    ).resolves.toBe(
      'Entre em sua conta ou escolha continuar somente neste navegador.',
    );

    expect(getSession).not.toHaveBeenCalled();
    expect(createOnlineTraveler).not.toHaveBeenCalled();
    expect(journeyRepository.listSaved()).toEqual([]);
  });

  test('does not persist locally when an expected authenticated session is missing', async () => {
    await expect(
      registerTraveler(
        'TestePersistenciaReal',
        DEFAULT_APPEARANCE,
        'male',
        userId,
      ),
    ).resolves.toBe(
      'Não foi possível validar sua sessão do Supabase. Entre novamente e tente de novo.',
    );

    expect(createOnlineTraveler).not.toHaveBeenCalled();
    expect(journeyRepository.listSaved()).toEqual([]);
    expect(journeyRepository.activeTravelerId()).toBeNull();
  });

  test('keeps local-only creation for a genuinely signed-out user', async () => {
    await expect(
      registerTraveler('Viajante Local', DEFAULT_APPEARANCE, 'male', null),
    ).resolves.toBeNull();

    expect(createOnlineTraveler).not.toHaveBeenCalled();
    expect(journeyRepository.listSaved()).toHaveLength(1);
    expect(journeyRepository.activeTravelerId()).not.toBeNull();
  });
});
