// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const {
  getSession,
  getAuthenticatedUser,
  onAuthStateChange,
  hydrateOnlineTravelers,
  profileEnsure,
} = vi.hoisted(() => ({
  getSession: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  hydrateOnlineTravelers: vi.fn(),
  profileEnsure: vi.fn(),
}));

vi.mock('./auth', () => ({
  getSession,
  getAuthenticatedUser,
  onAuthStateChange,
}));
vi.mock('./online-sync', () => ({
  hydrateOnlineTravelers,
  protectSignedOutCache: vi.fn(),
  setCurrentOnlineUser: vi.fn(),
}));
vi.mock('./repositories/profile-repository', () => ({
  profileRepository: { ensure: profileEnsure },
}));

import { AuthProvider, useAuth } from './auth-context';

const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
const session = { user };

function Probe() {
  const auth = useAuth();
  return (
    <p>
      {auth.status}:{auth.user?.id ?? 'none'}
    </p>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getSession.mockResolvedValue(session);
  getAuthenticatedUser.mockResolvedValue(user);
  onAuthStateChange.mockReturnValue({ unsubscribe: vi.fn() });
  profileEnsure.mockResolvedValue(undefined);
  hydrateOnlineTravelers.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('AuthProvider bootstrap', () => {
  test('keeps the gate loading until the persisted session is restored', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(screen.getByText('loading:none')).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByText(`signedIn:${user.id}`),
      ).toBeVisible(),
    );
    expect(hydrateOnlineTravelers).toHaveBeenCalledWith(user.id);
  });

  test('restores the same session after a provider remount like an F5', async () => {
    const first = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText(`signedIn:${user.id}`);
    first.unmount();

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText(`signedIn:${user.id}`)).toBeVisible();
    expect(getSession).toHaveBeenCalledTimes(2);
    expect(getAuthenticatedUser).toHaveBeenCalledTimes(2);
  });

  test('online session clears a residual local-only choice', async () => {
    localStorage.setItem('rpg-jovem-cristao:auth-mode:v1', 'local');

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText(`signedIn:${user.id}`)).toBeVisible();
    expect(localStorage.getItem('rpg-jovem-cristao:auth-mode:v1')).toBeNull();
  });
});
