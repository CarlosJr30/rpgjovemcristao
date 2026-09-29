// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: {
    current: {
      status: 'signedOut',
      session: null,
      user: null,
      isAuthenticated: false,
      continueLocally: vi.fn(),
    } as Record<string, unknown>,
  },
  journey: { current: { status: 'empty' } as Record<string, unknown> },
  registerTraveler: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => '/journey/create',
}));
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));
vi.mock('@rpg/ui', () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} />
  ),
}));
vi.mock('../components/avatar', () => ({ Avatar: () => <div /> }));
vi.mock('../components/shell', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../state/use-journey', () => ({
  useJourney: () => mocks.journey.current,
  registerTraveler: mocks.registerTraveler,
}));
vi.mock('../../../lib/supabase/auth-context', () => ({
  useAuth: () => mocks.auth.current,
}));

import { CreateScreen } from './create';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const signedIn = {
  status: 'signedIn',
  session: { user: { id: userId } },
  user: { id: userId },
  isAuthenticated: true,
  continueLocally: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.journey.current = { status: 'empty' };
  mocks.auth.current = {
    status: 'signedOut',
    session: null,
    user: null,
    isAuthenticated: false,
    continueLocally: vi.fn(),
  };
  mocks.registerTraveler.mockResolvedValue(null);
});

afterEach(cleanup);

describe('CreateScreen auth guard', () => {
  test('existing traveler can continue or open creation for another traveler', () => {
    mocks.auth.current = signedIn;
    mocks.journey.current = {
      status: 'ready',
      traveler: { name: 'TesteBancoreal' },
    };

    render(<CreateScreen />);

    expect(
      screen.getByText(/Continue o caminho de TesteBancoreal/),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: /Continuar jornada/ }),
    ).toBeVisible();
    expect(screen.queryByLabelText('Nome do Viajante')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Criar outro Viajante' }),
    );

    expect(screen.getByLabelText('Nome do Viajante')).toBeVisible();
    expect(
      screen.getByRole('button', { name: /Criar Viajante/ }),
    ).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Nome do Viajante'), {
      target: { value: 'TesteWorkLocal' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Criar Viajante/ }));

    return waitFor(() =>
      expect(mocks.registerTraveler).toHaveBeenCalledWith(
        'TesteWorkLocal',
        expect.any(Object),
        'male',
        userId,
      ),
    );
  });

  test('shows session verification instead of a false login error while auth loads', () => {
    mocks.auth.current = {
      ...mocks.auth.current,
      status: 'loading',
    };

    render(<CreateScreen />);

    expect(screen.getByText('Verificando sessão…')).toBeVisible();
    expect(
      screen.queryByText(/Entre em uma conta ou escolha explicitamente/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Criar Viajante/ }),
    ).toBeDisabled();
  });

  test('authenticated user with no travelers can create online', async () => {
    mocks.auth.current = signedIn;
    render(<CreateScreen />);

    const button = screen.getByRole('button', { name: /Criar Viajante/ });
    expect(button).toBeEnabled();
    expect(screen.getByText(/Salvo online/)).toBeVisible();
    fireEvent.change(screen.getByLabelText('Nome do Viajante'), {
      target: { value: 'TesteSupabaseFinal' },
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(mocks.registerTraveler).toHaveBeenCalledWith(
        'TesteSupabaseFinal',
        expect.any(Object),
        'male',
        userId,
      ),
    );
  });

  test('explicit local-only mode can create locally', async () => {
    mocks.auth.current = {
      status: 'local',
      session: null,
      user: null,
      isAuthenticated: false,
      continueLocally: vi.fn(),
    };
    render(<CreateScreen />);

    const button = screen.getByRole('button', { name: /Criar Viajante/ });
    expect(button).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Nome do Viajante'), {
      target: { value: 'Viajante Local' },
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(mocks.registerTraveler).toHaveBeenCalledWith(
        'Viajante Local',
        expect.any(Object),
        'male',
        null,
      ),
    );
  });

  test('signed-out user without local-only choice remains blocked', () => {
    render(<CreateScreen />);

    expect(
      screen.getByRole('button', { name: /Criar Viajante/ }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Entre em uma conta ou escolha explicitamente/),
    ).toBeVisible();
  });
});
