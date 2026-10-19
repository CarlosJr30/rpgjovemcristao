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

const {
  router,
  signIn,
  signUp,
  getSession,
  getAuthenticatedUser,
  hasPersistedSupabaseSession,
  continueLocally,
} = vi.hoisted(() => ({
  router: { replace: vi.fn() },
  signIn: vi.fn(),
  signUp: vi.fn(),
  getSession: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  hasPersistedSupabaseSession: vi.fn(),
  continueLocally: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));
vi.mock('../../lib/supabase/auth', () => ({
  signIn,
  signOut: vi.fn(),
  signUp,
  getSession,
  getAuthenticatedUser,
}));
vi.mock('../../lib/supabase/client', () => ({ hasPersistedSupabaseSession }));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({
    status: 'signedOut',
    session: null,
    user: null,
    isAuthenticated: false,
    continueLocally,
  }),
}));

import { AuthScreen } from './auth-screen';

const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
const session = { user };

const submitSignIn = () => {
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: 'teste@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: 'senha-segura' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
};

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, '', '/auth');
  hasPersistedSupabaseSession.mockReturnValue(true);
});

afterEach(cleanup);

describe('Auth sign in contract', () => {
  test('returns an existing player to a validated pending internal destination', async () => {
    window.history.replaceState(
      {},
      '',
      '/auth?next=%2Fjourney%2Fguild%3Fcode%3Dtest-invite',
    );
    signIn.mockResolvedValue({ data: { user, session }, error: null });
    getSession.mockResolvedValue(session);
    getAuthenticatedUser.mockResolvedValue(user);
    render(<AuthScreen />);
    submitSignIn();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        '/journey/guild?code=test-invite',
      ),
    );
  });

  test('does not accept login without a persisted SDK session', async () => {
    signIn.mockResolvedValue({ data: { user, session }, error: null });
    getSession.mockResolvedValue(session);
    getAuthenticatedUser.mockResolvedValue(user);
    hasPersistedSupabaseSession.mockReturnValue(false);
    render(<AuthScreen />);
    submitSignIn();
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(router.replace).not.toHaveBeenCalled();
  });
  test('registers name, email and password and verifies a real session before creating the hero', async () => {
    signUp.mockResolvedValue({ data: { user, session }, error: null });
    getSession.mockResolvedValue(session);
    getAuthenticatedUser.mockResolvedValue(user);
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    fireEvent.change(screen.getByLabelText('Nome de exibição'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha-segura' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/journey/create'),
    );
    expect(signUp).toHaveBeenCalledWith(
      'ana@example.com',
      'senha-segura',
      'Ana',
    );
    expect(getAuthenticatedUser).toHaveBeenCalledTimes(1);
  });

  test('does not pretend registration authenticated when confirmation is still required', async () => {
    signUp.mockResolvedValue({ data: { user, session: null }, error: null });
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    fireEvent.change(screen.getByLabelText('Nome de exibição'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha-segura' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Cadastro recebido.',
    );
    expect(router.replace).not.toHaveBeenCalled();
    expect(getAuthenticatedUser).not.toHaveBeenCalled();
  });

  test('rejects a malformed email before sending a registration request', async () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    fireEvent.change(screen.getByLabelText('Nome de exibição'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana-invalid' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha-segura' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByRole('alert')).toBeVisible();
    expect(signUp).not.toHaveBeenCalled();
  });
  test('navigates only after signIn, getSession, getUser and storage agree', async () => {
    signIn.mockResolvedValue({ data: { user, session }, error: null });
    getSession.mockResolvedValue(session);
    getAuthenticatedUser.mockResolvedValue(user);
    render(<AuthScreen />);

    submitSignIn();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(getAuthenticatedUser).toHaveBeenCalledTimes(1);
  });

  test('does not navigate when signIn returns no session', async () => {
    signIn.mockResolvedValue({ data: { user, session: null }, error: null });
    render(<AuthScreen />);

    submitSignIn();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível entrar.',
    );
    expect(router.replace).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
  });

  test('offers only account actions and never enables local-only entry', () => {
    render(<AuthScreen />);
    expect(
      screen.queryByRole('button', { name: /somente neste navegador/i }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(
      screen.queryByRole('button', { name: /somente neste navegador/i }),
    ).toBeNull();
    expect(continueLocally).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
