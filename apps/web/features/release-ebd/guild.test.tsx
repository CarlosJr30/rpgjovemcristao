// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { ReactNode } from 'react';

const mock = vi.hoisted(() => ({
  role: 'member',
  canCreate: false,
  canCreateOwnGuild: false,
  createOwn: vi.fn(),
  createScoped: vi.fn(),
  reviewScoped: vi.fn(),
  beginCreation: vi.fn(),
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
vi.mock('../../lib/guild-governance/creation-intent', () => ({
  pendingGuildCreation: () => null,
  beginGuildCreation: mock.beginCreation,
  confirmGuildCreation: vi.fn(),
}));
afterEach(() => vi.unstubAllEnvs());
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
      context: {
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
      canCreate: mock.canCreate,
      canCreateOwnGuild: mock.canCreateOwnGuild,
      writesEnabled: true,
      generation: 0,
      refresh: () => {},
    }),
}));
import { ReleaseGuild } from './guild';

beforeEach(() => {
  mock.role = 'member';
  mock.canCreate = false;
  mock.canCreateOwnGuild = false;
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
  mock.beginCreation.mockImplementation((_actor, name, description) => ({
    id: '00000000-0000-4000-8000-000000000010',
    request: '00000000-0000-4000-8000-000000000011',
    name,
    description,
  }));
  mock.createOwn.mockResolvedValue('00000000-0000-4000-8000-000000000012');
  mock.createScoped.mockResolvedValue('00000000-0000-4000-8000-000000000013');
  mock.reviewScoped.mockResolvedValue(undefined);
});
afterEach(cleanup);

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

test('server-disabled own creation stays unavailable and does not expose a form', async () => {
  render(<ReleaseGuild />);
  expect(
    await screen.findByText(
      'A criação própria não está autorizada ou disponível neste ambiente. Tente novamente mais tarde.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Criar Guilda e assumir liderança' }),
  ).toBeNull();
});

test('server capability exposes own-creation form and submits through the own-create RPC', async () => {
  mock.canCreateOwnGuild = true;
  render(<ReleaseGuild />);
  const form = await screen.findByRole('button', {
    name: 'Criar Guilda e assumir liderança',
  });
  fireEvent.change(screen.getByLabelText('Nome da Guilda'), {
    target: { value: 'Guilda nova' },
  });
  fireEvent.submit(form.closest('form')!);
  await vi.waitFor(() =>
    expect(mock.createOwn).toHaveBeenCalledWith(
      'synthetic-traveler',
      'Guilda nova',
      '',
    ),
  );
  expect(mock.createScoped).not.toHaveBeenCalled();
});

test('legacy leadership creation remains on the scoped command path', async () => {
  mock.canCreate = true;
  render(<ReleaseGuild />);
  const button = await screen.findByRole('button', {
    name: 'Criar Guilda e assumir liderança',
  });
  fireEvent.change(screen.getByLabelText('Nome da Guilda'), {
    target: { value: 'Guilda antiga' },
  });
  fireEvent.submit(button.closest('form')!);
  await vi.waitFor(() => expect(mock.createScoped).toHaveBeenCalled());
  expect(mock.createOwn).not.toHaveBeenCalled();
});

test('leader can approve or reject the existing join requests', async () => {
  mock.role = 'leader';
  mock.listJoinRequests.mockResolvedValue([
    {
      request_id: '00000000-0000-4000-8000-000000000020',
      traveler_id: 'candidate',
      traveler_name: 'Viajante candidato',
    },
  ]);
  render(<ReleaseGuild management />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Aprovar Viajante candidato' }),
  );
  await vi.waitFor(() =>
    expect(mock.reviewScoped).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000020',
      'synthetic-traveler',
      'synthetic-guild',
      true,
      expect.stringMatching(/^[a-f0-9-]{36}$/i),
    ),
  );
  const reject = screen.getByRole('button', {
    name: 'Recusar Viajante candidato',
  });
  await vi.waitFor(() => expect(reject).toBeEnabled());
  fireEvent.click(reject);
  await vi.waitFor(() =>
    expect(mock.reviewScoped).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000020',
      'synthetic-traveler',
      'synthetic-guild',
      false,
      expect.stringMatching(/^[a-f0-9-]{36}$/i),
    ),
  );
});
