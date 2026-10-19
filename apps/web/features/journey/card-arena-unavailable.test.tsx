// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const { update, getSession } = vi.hoisted(() => ({
  update: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({
    status: 'signedIn',
    user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
  }),
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
}));
vi.mock('../../lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ auth: { getSession } }),
}));
vi.mock('./state/use-journey', () => ({ updateTraveler: update }));
import { CardArena } from './components/card-arena';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { journeyRepository } from './persistence/journey-storage';
import { cardArenaStorage } from './persistence/card-arena-storage';
import { arenaRepository } from './persistence/arena-storage';
const traveler = createTraveler(
  'Viajante sintético',
  DEFAULT_APPEARANCE,
  '00000000-0000-4000-8000-00000000007d',
  '2026-10-17T00:00:00.000Z',
);
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  getSession.mockResolvedValue({
    data: { session: { access_token: 'synthetic-test-token' } },
    error: null,
  });
  vi.spyOn(journeyRepository, 'activeTravelerId').mockReturnValue(traveler.id);
  vi.spyOn(arenaRepository, 'list').mockReturnValue([]);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
test.each([401, 503, 'network'] as const)(
  'online backend failure %s never starts a local battle or grants resources',
  async (failure) => {
    const snapshot = JSON.stringify(traveler);
    const start = vi.spyOn(cardArenaStorage, 'start');
    const transport = vi.fn();
    if (failure === 'network')
      transport.mockRejectedValue(
        new TypeError('Synthetic network unavailable'),
      );
    else transport.mockResolvedValue(new Response('{}', { status: failure }));
    vi.stubGlobal('fetch', transport);
    render(<CardArena traveler={traveler} />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Treinar com Davi, o Aprendiz',
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Nenhuma batalha ou recompensa local foi criada',
      ),
    );
    expect(transport).toHaveBeenCalledTimes(1);
    const [url, request] = transport.mock.calls[0];
    expect(url).toBe('/api/economy');
    expect(JSON.parse(request.body)).toEqual({
      operation: 'start-card-battle',
      travelerId: traveler.id,
      opponentId: 'training-apprentice',
    });
    expect(start).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('button', { name: /^Ampliar / })).toHaveLength(
      0,
    );
    expect(JSON.stringify(traveler)).toBe(snapshot);
    expect(
      Object.keys(localStorage).filter((key) =>
        key.startsWith('rpg-jovem-cristao:card-arena:'),
      ),
    ).toEqual([]);
  },
);
