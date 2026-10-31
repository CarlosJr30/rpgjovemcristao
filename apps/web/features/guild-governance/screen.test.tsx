// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { ReactNode } from 'react';
const mock = vi.hoisted(() => ({ owner: 'owner-a', action: vi.fn() }));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({
    status: 'signedIn',
    user: { id: mock.owner, user_metadata: { role: 'admin' } },
  }),
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getOnlineSessionRevision: () => 1,
}));
vi.mock('../../lib/guild-governance/client', () => ({
  governanceAction: mock.action,
}));
vi.mock('../release-ebd/shell', () => ({
  ReleaseAccess: ({ children }: { children: ReactNode }) => <>{children}</>,
  ReleaseShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
import { GovernanceScreen } from './screen';
const status = {
  version: 1,
  administrator: false,
  permissions: [],
  leadership: 'none',
  multiGuildReady: false,
  canCreateAdditionalGuilds: false,
  economicRewardsEnabled: false,
};
beforeEach(() => {
  mock.owner = 'owner-a';
  mock.action.mockReset();
  mock.action.mockResolvedValue(status);
});
afterEach(cleanup);
test('administration starts with invitation only and loads private lists only in their area', async () => {
  mock.action.mockImplementation(async ({ action }: { action: string }) =>
    action === 'scopeStatus'
      ? {
          ...status,
          administrator: true,
          permissions: [
            'leadership.manage',
            'guilds.read',
            'audit.read',
            'admins.manage',
          ],
        }
      : action === 'leaders'
        ? {
            version: 1,
            leaders: [
              {
                id: 'private-account-id',
                name: 'Líder de teste',
                emailHint: 'q***@teste.invalid',
                active: true,
                grantedAt: '2026-01-01T00:00:00Z',
                revision: 1,
              },
            ],
          }
        : action === 'history'
          ? []
          : { version: 1, guilds: [], invitations: [] },
  );
  render(<GovernanceScreen />);
  await screen.findByRole('button', { name: 'Gerar link e QR Code' });
  expect(
    mock.action.mock.calls.every(([x]) => x.action === 'scopeStatus'),
  ).toBe(true);
  expect(screen.queryByText('Histórico de administração')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Gerenciar líderes' }));
  await screen.findByText('Líder de teste');
  expect(
    screen.queryByRole('button', { name: 'Gerar link e QR Code' }),
  ).toBeNull();
  expect(screen.queryByText('private-account-id')).toBeNull();
  expect(
    screen.queryByLabelText('Identificador confirmado da conta'),
  ).toBeNull();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Revogar autorização de Líder de teste',
    }),
  );
  expect(
    screen.getByRole('button', { name: 'Confirmar revogação' }),
  ).toBeInTheDocument();
  expect(mock.action.mock.calls.some(([x]) => x.action === 'command')).toBe(
    false,
  );
  fireEvent.change(screen.getByLabelText('Motivo administrativo'), {
    target: { value: 'Revogação autorizada de teste' },
  });
  fireEvent.submit(
    screen.getByRole('form', { name: 'Confirmar revogação de Líder de teste' }),
  );
  await screen.findByText('Operação confirmada pelo servidor.');
  expect(mock.action).toHaveBeenCalledWith(
    expect.objectContaining({
      action: 'command',
      kind: 'revoke_leadership',
      id: 'private-account-id',
      data: { reason: 'Revogação autorizada de teste' },
    }),
    'owner-a',
  );
});
test('normal account with forged user metadata gets no admin forms or private workspace', async () => {
  render(<GovernanceScreen />);
  await screen.findByText(
    'Esta conta não possui permissões de Administrador Geral.',
  );
  expect(
    screen.queryByRole('button', { name: 'Emitir convite individual' }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Registrar permissões' }),
  ).toBeNull();
  expect(mock.action).toHaveBeenCalledTimes(1);
});
test('read-only administrative scope displays existing aliases and no management controls', async () => {
  mock.action.mockImplementation(async ({ action }: { action: string }) =>
    action === 'scopeStatus'
      ? { ...status, administrator: true, permissions: ['guilds.read'] }
      : {
          version: 1,
          guilds: [
            {
              id: 'private-id',
              name: 'Comunidade de teste',
              status: 'active',
              leader_alias: 'Apelido autorizado',
              members: 2,
            },
          ],
          invitations: [],
        },
  );
  render(<GovernanceScreen />);
  await screen.findByText(/Comunidade de teste/);
  expect(screen.queryByText('private-id')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Emitir convite individual' }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Registrar permissões' }),
  ).toBeNull();
});
test('account change discards delayed private administrative results', async () => {
  let resolve!: (v: unknown) => void;
  mock.action.mockImplementation((_data: unknown, owner: string) =>
    owner === 'owner-a'
      ? new Promise((r) => {
          resolve = r;
        })
      : Promise.resolve(status),
  );
  const view = render(<GovernanceScreen />);
  mock.owner = 'owner-b';
  view.rerender(<GovernanceScreen />);
  await screen.findByText(
    'Esta conta não possui permissões de Administrador Geral.',
  );
  resolve({ ...status, administrator: true, permissions: ['admins.manage'] });
  await new Promise((r) => setTimeout(r, 0));
  expect(
    screen.queryByRole('button', { name: 'Registrar permissões' }),
  ).toBeNull();
});
