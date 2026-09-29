// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signOutAccount: vi.fn(),
  switchTraveler: vi.fn(),
  onlineSyncStatus: { state: 'idle', message: null },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/journey',
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));
vi.mock('./avatar', () => ({ Avatar: () => <div /> }));
vi.mock('../state/use-journey', () => ({
  signOutAccount: mocks.signOutAccount,
  switchTraveler: mocks.switchTraveler,
  useJourney: () => ({
    status: 'ready',
    traveler: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'TesteBancoreal',
      level: 1,
      xp: 0,
      coins: 0,
      appearance: {},
      avatar: {},
    },
  }),
}));
vi.mock('../../../lib/supabase/auth-context', () => ({
  useAuth: () => ({ status: 'signedIn' }),
}));
vi.mock('../../../lib/supabase/online-sync', () => ({
  getOnlineSyncStatus: () => mocks.onlineSyncStatus,
  subscribeOnlineSync: () => () => undefined,
}));

import { Shell } from './shell';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.switchTraveler.mockReturnValue(true);
  mocks.signOutAccount.mockResolvedValue(true);
});

afterEach(cleanup);

describe('Shell account and traveler actions', () => {
  test('switching traveler never calls account sign out', () => {
    render(<Shell>Conteúdo</Shell>);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Herói' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Trocar Viajante' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Trocar Viajante',
      }),
    );

    expect(mocks.switchTraveler).toHaveBeenCalledTimes(1);
    expect(mocks.signOutAccount).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });

  test('signing out the account uses the account action and navigates to auth', async () => {
    render(<Shell>Conteúdo</Shell>);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Herói' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sair da conta' }));

    await waitFor(() => expect(mocks.signOutAccount).toHaveBeenCalledTimes(1));
    expect(mocks.switchTraveler).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/auth');
  });
});
