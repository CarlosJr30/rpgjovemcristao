// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { ReactNode } from 'react';

const mock = vi.hoisted(() => ({
  role: 'member',
  withoutGuild: false,
  getContext: vi.fn(),
  listMembers: vi.fn(),
  listJoinRequests: vi.fn(),
}));
vi.mock('./shell', () => ({
  ReleaseShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock('../journey/state/use-journey', () => ({
  useJourney: () => ({
    status: 'ready',
    traveler: { id: 'synthetic-traveler' },
  }),
}));
vi.mock('../guild-ebd/common-invites', () => ({
  CommonInvites: () => <div>Convites existentes</div>,
}));
vi.mock('../../lib/supabase/repositories/guild-repository', () => ({
  guildRepository: {
    ...mock,
    listMembersScoped: mock.listMembers,
    listRequestsScoped: mock.listJoinRequests,
  },
}));
vi.mock('../guild-governance/scope', () => ({
  GuildScope: ({ children }: { children: (scope: unknown) => ReactNode }) =>
    children({
      context: mock.withoutGuild
        ? null
        : {
            guild: {
              id: 'synthetic-guild',
              name: 'Guilda sintética',
              description: 'Comunidade local',
            },
            membership: { role: mock.role },
          },
      contexts: [],
      guildId: 'synthetic-guild',
      canManage: mock.role === 'leader',
      canCreate: false,
      writesEnabled: true,
      generation: 0,
      refresh: () => {},
    }),
}));
import { ReleaseGuild } from './guild';

beforeEach(() => {
  mock.role = 'member';
  mock.withoutGuild = false;
  vi.clearAllMocks();
  mock.getContext.mockImplementation(async () => ({
    guild: { name: 'Guilda sintética', description: 'Comunidade local' },
    membership: { role: mock.role },
  }));
  mock.listMembers.mockResolvedValue([
    {
      traveler_id: 'synthetic-leader',
      traveler_name: 'Liderança sintética',
      role: 'leader',
    },
  ]);
  mock.listJoinRequests.mockResolvedValue([]);
});
afterEach(cleanup);

test('a player without a Guild receives automatic-invite guidance without querying another community', async () => {
  mock.withoutGuild = true;
  render(<ReleaseGuild />);
  expect(
    await screen.findByRole('heading', { name: 'Participar de uma Guilda' }),
  ).toBeVisible();
  expect(
    screen.getByText(/permite entrada automática após o login/),
  ).toBeVisible();
  expect(screen.getByText(/sem pertencer a uma Guilda/)).toBeVisible();
  expect(mock.listMembers).not.toHaveBeenCalled();
  expect(mock.listJoinRequests).not.toHaveBeenCalled();
});

test('member sees original hall/banner without leader actions or fabricated mission metrics', async () => {
  const { container } = render(<ReleaseGuild management />);
  await screen.findByRole('heading', { name: 'Guilda sintética', level: 2 });
  expect(container.querySelector('[data-guild-scene]')).toHaveAttribute(
    'data-guild-scene',
    'active',
  );
  expect(
    container.querySelector('[data-guild-art="guildBanner"]'),
  ).toBeInTheDocument();
  expect(
    container.querySelector('[data-guild-art="guildLeaderTable"]'),
  ).toBeNull();
  expect(screen.queryByText('PAINEL DO LÍDER')).not.toBeInTheDocument();
  expect(screen.queryByText('Convites existentes')).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText('Resumo das atividades carregadas'),
  ).not.toBeInTheDocument();
  expect(mock.listJoinRequests).not.toHaveBeenCalled();
});

test('leader management restores original table artwork and keeps current membership controls', async () => {
  mock.role = 'leader';
  const { container } = render(<ReleaseGuild management />);
  await screen.findByText('PAINEL DO LÍDER');
  expect(
    container.querySelector('[data-guild-art="guildLeaderTable"]'),
  ).toBeInTheDocument();
  expect(screen.getByText('Convites existentes')).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Solicitações de entrada' }),
  ).toBeInTheDocument();
  expect(mock.listJoinRequests).toHaveBeenCalledWith(
    'synthetic-traveler',
    'synthetic-guild',
  );
  expect(
    screen.getByRole('link', { name: 'Acessar Escola Bíblica Dominical' }),
  ).toHaveAttribute('href', '/journey/guild/ebd');
});
