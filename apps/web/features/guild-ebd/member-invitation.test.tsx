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
const mock = vi.hoisted(() => ({ owner: '', action: vi.fn(), ready: true }));
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
vi.mock('../journey/state/use-journey', () => ({
  useJourney: () =>
    mock.ready
      ? {
          status: 'ready',
          traveler: { id: '10000000-0000-4000-8000-000000000001' },
        }
      : { status: 'empty' },
}));
vi.mock('../release-ebd/shell', () => ({
  ReleaseShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock('../../lib/ebd-classes/invites-client', () => ({
  memberInviteAction: mock.action,
}));
import { MemberInvitation } from './member-invitation';
beforeEach(() => {
  mock.owner = '';
  mock.ready = true;
  mock.action.mockReset();
  mock.action.mockResolvedValue({
    guildName: 'Comunidade',
    className: 'Classe',
    expiresAt: '2026-11-10T00:00:00Z',
  });
  window.history.replaceState(null, '', '/guilda/participar#' + 'a'.repeat(64));
});
afterEach(cleanup);
test('secret removed before clean login return and safe labels rendered', async () => {
  render(<MemberInvitation />);
  await screen.findByRole('heading', { name: 'Comunidade' });
  expect(window.location.hash).toBe('');
  expect(
    screen.getByRole('link', { name: 'Entrar ou criar conta para continuar' }),
  ).toHaveAttribute('href', '/auth?next=%2Fguilda%2Fparticipar');
  expect(mock.action).toHaveBeenCalledWith({
    action: 'remember',
    token: 'a'.repeat(64),
  });
});
test('avatar creation keeps clean invitation destination', async () => {
  mock.owner = 'owner';
  mock.ready = false;
  render(<MemberInvitation />);
  await screen.findByRole('heading', { name: 'Comunidade' });
  expect(
    screen.getByRole('link', { name: 'Criar ou retomar meu avatar' }),
  ).toHaveAttribute('href', '/journey/create?next=%2Fguilda%2Fparticipar');
});
test('accept requires deliberate action and never requests a privileged role', async () => {
  mock.owner = 'owner';
  render(<MemberInvitation />);
  await screen.findByRole('button', { name: 'Participar desta comunidade' });
  expect(mock.action.mock.calls.some((c) => c[0].action === 'accept')).toBe(
    false,
  );
  mock.action.mockResolvedValueOnce({
    guildId: '00000000-0000-4000-8000-000000000100',
    classId: null,
    enrolled: true,
    replayed: false,
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Participar desta comunidade' }),
  );
  await screen.findByText(/Participação confirmada/);
  expect(mock.action.mock.calls.at(-1)?.[0]).toEqual({
    action: 'accept',
    actor: '10000000-0000-4000-8000-000000000001',
    requestId: expect.any(String),
  });
});
test('failed acceptance cannot display success', async () => {
  mock.owner = 'owner';
  render(<MemberInvitation />);
  await screen.findByRole('button', { name: 'Participar desta comunidade' });
  mock.action.mockRejectedValueOnce(Error('Revoked'));
  fireEvent.click(
    screen.getByRole('button', { name: 'Participar desta comunidade' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      /entrada não foi confirmada/,
    ),
  );
  expect(screen.queryByText(/Participação confirmada/)).toBeNull();
});
