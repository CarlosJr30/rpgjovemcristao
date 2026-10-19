// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import type { Attempt, Mission, Progress, Workspace } from './contracts';
const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  getContext: vi.fn(),
  listMembers: vi.fn(),
  listJoinRequests: vi.fn(),
  review: vi.fn(),
  save: vi.fn(),
  transition: vi.fn(),
  act: vi.fn(),
}));
vi.mock(
  '../../lib/supabase/repositories/guild-mission-workspace-repository',
  () => ({ missionWorkspaceRepository: mocks }),
);
vi.mock('../../lib/supabase/repositories/guild-repository', () => ({
  guildRepository: mocks,
}));
vi.mock('../guild-invites/invite-panel', () => ({
  GuildInvitePanel: () => <p>Convite existente preservado</p>,
}));
import { GuildLeaderPanel } from './leader-panel';
import { MemberMission } from './member-mission';
const traveler = createTraveler(
  'Lia',
  DEFAULT_APPEARANCE,
  'leader',
  '2026-10-19T12:00:00Z',
);
const mission = {
  id: 'mission',
  guild_id: 'guild',
  title: 'Atividade de teste',
  description: 'Objetivo de teste',
  mission_type: 'practical_activity',
  reward_tier: 'normal',
  status: 'published',
  starts_at: null,
  due_at: null,
  workspace_revision: 1,
  audience: 'all',
  target_traveler_ids: [],
  created_by_traveler_id: 'leader',
  bible_reference: null,
  bible_url: null,
  completion_mode: 'leader_approval',
  requires_leader_approval: true,
  metadata: null,
  published_at: '2026-10-19T12:00:00Z',
  closed_at: null,
  created_at: '2026-10-19T12:00:00Z',
  updated_at: '2026-10-19T12:00:00Z',
  objective: 'Objetivo de teste',
  instructions: 'Instruções de teste',
  evidence_criterion: 'Texto objetivo',
} as Mission;
let workspace: Workspace;
beforeEach(() => {
  vi.clearAllMocks();
  workspace = {
    version: 1,
    guildId: 'guild',
    missions: [mission],
    progress: [],
    attempts: [],
    history: [],
  };
  mocks.getContext.mockResolvedValue({
    guild: { id: 'guild', name: 'Grupo', leader_traveler_id: 'leader' },
    membership: { role: 'leader' },
  });
  mocks.listMembers.mockResolvedValue([
    {
      traveler_id: 'leader',
      traveler_name: 'Lia',
      role: 'leader',
      member_status: 'active',
    },
    {
      traveler_id: 'member',
      traveler_name: 'Rui',
      role: 'member',
      member_status: 'active',
    },
  ]);
  mocks.listJoinRequests.mockResolvedValue([]);
  mocks.load.mockImplementation(async () => workspace);
  mocks.review.mockResolvedValue('approved');
});
afterEach(cleanup);
async function openArea(name: string) {
  await screen.findByRole('heading', { name: 'Painel da Guilda' });
  fireEvent.click(screen.getByRole('button', { name }));
}
test('leader panel exposes the eight requested areas and preserves invite entry', async () => {
  render(<GuildLeaderPanel traveler={traveler} />);
  await openArea('Membros');
  expect(screen.getByText('Rui')).toBeVisible();
  expect(screen.getByText('Convite existente preservado')).toBeVisible();
  expect(screen.getAllByRole('option')).toHaveLength(8);
  expect(
    screen.queryByRole('button', { name: /aula|ranking|calendário/i }),
  ).toBeNull();
});
test('member cannot open the leader workspace or load private data', async () => {
  mocks.getContext.mockResolvedValue({
    guild: { id: 'guild' },
    membership: { role: 'member' },
  });
  render(<GuildLeaderPanel traveler={traveler} />);
  await screen.findByText(/disponível à liderança/);
  expect(mocks.load).not.toHaveBeenCalled();
});
test('rejection requires guidance and approval is announced as reward pending', async () => {
  workspace.progress = [
    {
      id: 'progress',
      mission_id: 'mission',
      traveler_id: 'member',
      status: 'pending_approval',
      submission_revision: 1,
    } as Progress,
  ];
  workspace.attempts = [
    {
      id: 'attempt',
      mission_id: 'mission',
      traveler_id: 'member',
      traveler_name: 'Rui',
      revision: 1,
      note: 'Atividade realizada',
      submitted_at: '2026-10-19T12:00:00Z',
      decision: null,
    } as Attempt,
  ];
  render(<GuildLeaderPanel traveler={traveler} />);
  await openArea('Aprovações pendentes (1)');
  fireEvent.click(screen.getByRole('button', { name: 'Rejeitar conclusão' }));
  expect(screen.getByRole('alert')).toHaveTextContent('justificativa');
  expect(mocks.review).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Aprovar conclusão' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Recompensa pendente'),
  );
  expect(mocks.review).toHaveBeenCalledWith(
    'leader',
    'attempt',
    1,
    'approved',
    '',
    expect.any(String),
  );
});
test('member requires proof and sends a stable request without claiming rewards', async () => {
  mocks.act.mockResolvedValue(undefined);
  const onAction = vi.fn(async (fn: () => Promise<unknown>) => fn());
  render(
    <MemberMission
      mission={mission}
      progress={{ status: 'started', submission_revision: 0 } as Progress}
      travelerId="member"
      now={Date.now()}
      onAction={onAction}
    />,
  );
  expect(
    screen.getByRole('button', { name: 'Enviar conclusão' }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Comprovação da conclusão'), {
    target: { value: 'Registro objetivo' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar conclusão' }));
  await waitFor(() =>
    expect(mocks.act).toHaveBeenCalledWith(
      'member',
      'mission',
      'submit',
      'Registro objetivo',
      expect.any(String),
      0,
    ),
  );
});
test('approved member sees pending reward and no second submission action', () => {
  render(
    <MemberMission
      mission={mission}
      progress={{ status: 'approved', reward_claimed_at: null } as Progress}
      travelerId="member"
      now={Date.now()}
      onAction={vi.fn()}
    />,
  );
  expect(screen.getByText(/nenhum saldo foi alterado/)).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Enviar conclusão' })).toBeNull();
});
test('backend error stays visible instead of replacing data with simulated missions', async () => {
  mocks.load.mockRejectedValue(new Error('missing RPC'));
  render(<GuildLeaderPanel traveler={traveler} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'atualização autorizada do banco',
  );
  expect(screen.queryByRole('button', { name: 'Criar missão' })).toBeNull();
});
