// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { ReactNode } from 'react';
const mock = vi.hoisted(() => ({ owner: '', action: vi.fn(), ready: false }));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () =>
    mock.owner
      ? { status: 'signedIn', user: { id: mock.owner } }
      : { status: 'signedOut' },
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getOnlineSessionRevision: () => 1,
  canUseTravelerInCurrentSession: () => true,
}));
vi.mock('../../lib/guild-governance/client', () => ({
  governanceAction: mock.action,
}));
vi.mock('../journey/state/use-journey', () => ({
  useJourney: () =>
    mock.ready
      ? {
          status: 'ready',
          traveler: { id: '11111111-1111-4111-8111-111111111111' },
        }
      : { status: 'loading' },
}));
vi.mock('../release-ebd/shell', () => ({
  ReleaseShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
import { LeadershipInvitation } from './invitation';
const id = '22222222-2222-4222-8222-222222222222',
  token = 'b'.repeat(64);
beforeEach(() => {
  mock.owner = '';
  mock.ready = false;
  mock.action.mockReset();
  mock.action.mockResolvedValue({
    id,
    kind: 'leadership',
    expiresAt: '2030-01-01T00:00:00Z',
  });
  window.history.replaceState(null, '', '/guilda/lideranca/convite#' + token);
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});
test('public presentation strips fragment saves invite without authentication and uses a clean login return', async () => {
  const { container } = render(<LeadershipInvitation />);
  const link = await screen.findByRole('link', {
    name: 'Entrar ou criar conta para continuar',
  });
  expect(window.location.hash).toBe('');
  expect(container.textContent).not.toContain(token);
  expect(link).toHaveAttribute(
    'href',
    '/auth?next=%2Fguilda%2Flideranca%2Fconvite',
  );
  expect(mock.action).toHaveBeenCalledWith({ action: 'remember', token });
  expect(mock.action.mock.calls.every((c) => c[0].action === 'remember')).toBe(
    true,
  );
});
test('authenticated recipient must explicitly accept using owned avatar without submitting token in body', async () => {
  mock.owner = 'owner';
  mock.ready = true;
  render(<LeadershipInvitation />);
  const button = await screen.findByRole('button', {
    name: 'Aceitar autorização de liderança',
  });
  expect(mock.action.mock.calls.every((c) => c[0].action === 'remember')).toBe(
    true,
  );
  fireEvent.click(button);
  await screen.findByText('Autorização de liderança confirmada.');
  const call = mock.action.mock.calls.find((c) => c[0].action === 'accept');
  expect(call?.[0]).toEqual({
    action: 'accept',
    id,
    requestId: expect.any(String),
    travelerId: '11111111-1111-4111-8111-111111111111',
  });
  expect(call?.[1]).toBe('owner');
  expect(JSON.stringify(call)).not.toContain(token);
});
test('denied recipient never sees success and cannot trigger repeated in-flight acceptance', async () => {
  mock.owner = 'owner';
  mock.ready = true;
  let reject!: (e: Error) => void;
  mock.action.mockImplementation(({ action }: { action: string }) =>
    action === 'accept'
      ? new Promise((_r, j) => {
          reject = j;
        })
      : Promise.resolve({
          id,
          kind: 'leadership',
          expiresAt: '2030-01-01T00:00:00Z',
        }),
  );
  render(<LeadershipInvitation />);
  const button = await screen.findByRole('button', {
    name: 'Aceitar autorização de liderança',
  });
  fireEvent.click(button);
  fireEvent.click(button);
  await waitFor(() =>
    expect(
      mock.action.mock.calls.filter((c) => c[0].action === 'accept'),
    ).toHaveLength(1),
  );
  reject(Error('Unavailable'));
  await screen.findByRole('alert');
  expect(screen.queryByText('Autorização de liderança confirmada.')).toBeNull();
});
