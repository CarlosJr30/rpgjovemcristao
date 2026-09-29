// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  state: { current: { status: 'empty' } as Record<string, unknown> },
  auth: { current: { status: 'signedIn' } as Record<string, unknown> },
  travelers: [] as Array<Record<string, unknown>>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('@rpg/ui', () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} />
  ),
}));
vi.mock('../state/use-journey', () => ({
  resumeJourney: vi.fn(),
  useJourney: () => mocks.state.current,
}));
vi.mock('../components/shell', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../components/avatar', () => ({ Avatar: () => <div /> }));
vi.mock('../components/landscape', () => ({ Landscape: () => <div /> }));
vi.mock('../../../lib/supabase/auth-context', () => ({
  useAuth: () => mocks.auth.current,
}));
vi.mock('../../../lib/supabase/online-sync', () => ({
  getCurrentRemoteActiveTravelerId: () => null,
  listTravelersForCurrentSession: () => mocks.travelers,
}));

import { Home } from './home';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.current = { status: 'empty' };
  mocks.auth.current = { status: 'signedIn' };
  mocks.travelers = [];
});

afterEach(cleanup);

describe('Home traveler selection routing', () => {
  test('authenticated account without travelers goes to creation', async () => {
    render(<Home />);

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith('/journey/create'),
    );
  });

  test('authenticated account with one traveler still shows the selector and create option', () => {
    mocks.state.current = {
      status: 'logged-out',
      traveler: { id: '11111111-1111-4111-8111-111111111111' },
    };
    mocks.travelers = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'TesteBancoreal',
        level: 1,
        appearance: {},
        avatar: {},
      },
    ];

    render(<Home />);

    expect(screen.getByRole('heading', { name: 'Escolha seu Viajante' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'TesteBancoreal' })).toBeVisible();
    expect(screen.getByRole('link', { name: '+ Criar novo Viajante' })).toHaveAttribute(
      'href',
      '/journey/create',
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
