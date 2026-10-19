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
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';

const mocks = vi.hoisted(() => ({
  workspaceLoad: vi.fn(),
  workspaceAct: vi.fn(),
  getContext: vi.fn(),
  getOwnJoinRequest: vi.fn(),
  createGuild: vi.fn(),
  requestJoin: vi.fn(),
  reviewJoinRequest: vi.fn(),
  leave: vi.fn(),
  listMembers: vi.fn(),
  listJoinRequests: vi.fn(),
  listMissions: vi.fn(),
  listOwnProgress: vi.fn(),
  createMission: vi.fn(),
  publish: vi.fn(),
  start: vi.fn(),
  submit: vi.fn(),
  review: vi.fn(),
  listProgress: vi.fn(),
  reloadOnlineTraveler: vi.fn(),
  adminStats: vi.fn(),
  adminHistory: vi.fn(),
  adminMissions: vi.fn(),
  adminOldMissions: vi.fn(),
  adminByIds: vi.fn(),
  publicMemberProfile: vi.fn(),
  reviewWithGuidance: vi.fn(),
  removeMember: vi.fn(),
  upcomingLessons: vi.fn(),
  listLessons: vi.fn(),
  saveLesson: vi.fn(),
  setLessonStatus: vi.fn(),
}));

vi.mock('../../lib/supabase/repositories/guild-repository', () => ({
  guildRepository: {
    getContext: mocks.getContext,
    getOwnJoinRequest: mocks.getOwnJoinRequest,
    create: mocks.createGuild,
    requestJoin: mocks.requestJoin,
    reviewJoinRequest: mocks.reviewJoinRequest,
    leave: mocks.leave,
    listMembers: mocks.listMembers,
    listJoinRequests: mocks.listJoinRequests,
    removeMember: mocks.removeMember,
  },
}));
vi.mock(
  '../../lib/supabase/repositories/guild-mission-workspace-repository',
  () => ({
    missionWorkspaceRepository: {
      load: mocks.workspaceLoad,
      act: mocks.workspaceAct,
    },
  }),
);
vi.mock('../../lib/supabase/repositories/guild-mission-repository', () => ({
  guildMissionRepository: {
    list: mocks.listMissions,
    listOwnProgress: mocks.listOwnProgress,
    create: mocks.createMission,
    publish: mocks.publish,
    start: mocks.start,
    submit: mocks.submit,
    review: mocks.review,
    listProgress: mocks.listProgress,
    reviewWithGuidance: mocks.reviewWithGuidance,
  },
}));
vi.mock('../../lib/supabase/repositories/guild-admin-repository', () => ({
  guildAdminRepository: {
    stats: mocks.adminStats,
    history: mocks.adminHistory,
    missions: mocks.adminMissions,
    oldMissions: mocks.adminOldMissions,
    byIds: mocks.adminByIds,
    publicMemberProfile: mocks.publicMemberProfile,
  },
}));
vi.mock('../../lib/supabase/repositories/guild-lesson-repository', () => ({
  guildLessonRepository: {
    upcoming: mocks.upcomingLessons,
    list: mocks.listLessons,
    save: mocks.saveLesson,
    setStatus: mocks.setLessonStatus,
  },
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  reloadOnlineTraveler: mocks.reloadOnlineTraveler,
}));

import { OnlineGuildHub } from './components/online-guild-hub';

const traveler = createTraveler(
  'Ana Clara',
  DEFAULT_APPEARANCE,
  '11111111-1111-4111-8111-111111111111',
  '2026-09-29T12:00:00.000Z',
);
const guild = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Célula Esperança',
  description: 'Grupo jovem',
  created_by_user_id: 'user-1',
  leader_traveler_id: traveler.id,
  status: 'active',
  created_at: '2026-09-29T12:00:00.000Z',
  updated_at: '2026-09-29T12:00:00.000Z',
};
const membership = (role: 'leader' | 'member') => ({
  id: 'membership-1',
  guild_id: guild.id,
  traveler_id: traveler.id,
  role,
  status: 'active',
  joined_at: guild.created_at,
  updated_at: guild.updated_at,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.workspaceAct.mockResolvedValue(undefined);
  mocks.workspaceLoad.mockResolvedValue({
    version: 1,
    guildId: guild.id,
    missions: [],
    progress: [],
    attempts: [],
    history: [],
  });
  mocks.getOwnJoinRequest.mockResolvedValue(null);
  mocks.listMembers.mockResolvedValue([
    {
      traveler_id: traveler.id,
      traveler_name: traveler.name,
      role: 'leader',
      member_status: 'active',
      joined_at: guild.created_at,
    },
  ]);
  mocks.listJoinRequests.mockResolvedValue([]);
  mocks.listMissions.mockResolvedValue([]);
  mocks.listOwnProgress.mockResolvedValue([]);
  mocks.listProgress.mockResolvedValue([]);
  mocks.createGuild.mockResolvedValue(guild.id);
  mocks.requestJoin.mockResolvedValue('request-1');
  mocks.createMission.mockResolvedValue('mission-1');
  mocks.reloadOnlineTraveler.mockResolvedValue(true);
  mocks.adminStats.mockResolvedValue([]);
  mocks.adminHistory.mockResolvedValue([]);
  mocks.adminMissions.mockResolvedValue([]);
  mocks.adminOldMissions.mockResolvedValue([]);
  mocks.adminByIds.mockResolvedValue([]);
  mocks.publicMemberProfile.mockResolvedValue({
    level: 3,
    completed_missions: 7,
  });
  mocks.reviewWithGuidance.mockResolvedValue('completed');
  mocks.removeMember.mockResolvedValue(undefined);
  mocks.upcomingLessons.mockResolvedValue([]);
  mocks.listLessons.mockResolvedValue([]);
  mocks.saveLesson.mockResolvedValue('lesson-1');
  mocks.setLessonStatus.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('OnlineGuildHub', () => {
  test('approved reward remains pending without inflating the approval counter', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('member'),
    });
    mocks.listMissions.mockResolvedValue([
      {
        id: 'approved-mission',
        title: 'Atividade aprovada',
        status: 'published',
        starts_at: null,
        due_at: null,
        mission_type: 'practical_activity',
        reward_tier: 'normal',
      },
    ]);
    mocks.listOwnProgress.mockResolvedValue([
      {
        id: 'approved-progress',
        mission_id: 'approved-mission',
        traveler_id: traveler.id,
        status: 'approved',
        reward_claimed_at: null,
      },
    ]);
    render(<OnlineGuildHub traveler={traveler} />);
    await screen.findByRole('heading', { name: guild.name });
    expect(
      screen.getByText('AGUARDANDO APROVAÇÃO', { exact: true }).parentElement,
    ).toHaveTextContent('0');
    fireEvent.click(screen.getByRole('button', { name: 'Missões' }));
    expect(
      screen.getByText(/Aprovação registrada. Recompensa pendente/),
    ).toBeVisible();
  });
  test('filtra agenda e conclusão; histórico separado e vazio acolhedor', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('member'),
    });
    const base = {
      id: 'done',
      title: 'Missão terminada',
      status: 'published',
      starts_at: null,
      due_at: null,
      mission_type: 'practical_activity',
      reward_tier: 'normal',
    };
    mocks.listMissions.mockResolvedValue([
      base,
      {
        ...base,
        id: 'future',
        title: 'Missão futura',
        starts_at: '2099-01-01T00:00:00Z',
      },
      {
        ...base,
        id: 'expired',
        title: 'Missão expirada',
        due_at: '2020-01-01T00:00:00Z',
      },
      { ...base, id: 'draft', title: 'Missão rascunho', status: 'draft' },
      {
        ...base,
        id: 'cancelled',
        title: 'Missão cancelada',
        status: 'cancelled',
      },
    ]);
    mocks.listOwnProgress.mockResolvedValue([
      { mission_id: 'done', status: 'completed' },
      { mission_id: 'expired', status: 'started' },
    ]);
    render(<OnlineGuildHub traveler={traveler} />);
    await screen.findByRole('heading', { name: guild.name });
    fireEvent.click(screen.getByRole('button', { name: 'Missões' }));
    expect(screen.getByText('Nenhuma nova missão disponível.')).toBeVisible();
    for (const title of [
      'Missão terminada',
      'Missão futura',
      'Missão expirada',
      'Missão rascunho',
      'Missão cancelada',
    ])
      expect(
        screen.queryByRole('heading', { name: title }),
      ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }));
    expect(
      screen.getByRole('heading', { name: 'Missão terminada' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Iniciar Missão' }),
    ).not.toBeInTheDocument();
  });
  test('shows remote empty state and creates Guild through the repository', async () => {
    mocks.getContext.mockResolvedValue(null);
    render(<OnlineGuildHub traveler={traveler} />);
    expect(
      await screen.findByRole('heading', { name: 'Encontre sua comunidade' }),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText('Nome da Guilda'), {
      target: { value: 'Célula Esperança' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Guilda' }));
    await waitFor(() =>
      expect(mocks.createGuild).toHaveBeenCalledWith(
        traveler.id,
        'Célula Esperança',
        '',
      ),
    );
  });

  test('leader uses the dedicated Guild panel instead of the previous creator', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('leader'),
    });
    render(<OnlineGuildHub traveler={traveler} />);
    await screen.findByRole('heading', { name: guild.name });
    fireEvent.click(screen.getByRole('button', { name: 'Miss\u00f5es' }));
    expect(
      screen.getByRole('link', { name: 'Painel da Guilda' }),
    ).toHaveAttribute('href', '/journey/guild/manage');
    expect(mocks.createMission).not.toHaveBeenCalled();
  });

  test('member sees published mission but no administrative form', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('member'),
    });
    mocks.listMissions.mockResolvedValue([
      {
        id: 'mission-1',
        guild_id: guild.id,
        created_by_traveler_id: guild.leader_traveler_id,
        title: 'Leitura da semana',
        description: null,
        mission_type: 'bible_reading',
        bible_reference: 'João 15',
        bible_url: null,
        completion_mode: 'self_complete',
        requires_leader_approval: false,
        reward_tier: 'normal',
        status: 'published',
        starts_at: null,
        due_at: null,
        metadata: null,
        published_at: guild.created_at,
        closed_at: null,
        created_at: guild.created_at,
        updated_at: guild.updated_at,
      },
    ]);
    render(<OnlineGuildHub traveler={traveler} />);
    await screen.findByRole('heading', { name: 'Célula Esperança' });
    fireEvent.click(screen.getByRole('button', { name: 'Missões' }));
    expect(
      screen.queryByRole('heading', { name: 'Criar Missão' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Iniciar Missão' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Recompensa')).toHaveTextContent('+80 XP');
    expect(screen.getByLabelText('Recompensa')).toHaveTextContent(
      '+25 Moedas do Viajante',
    );
    expect(screen.getByLabelText('Recompensa')).toHaveTextContent(
      '+1 Baú Comum',
    );
  });

  test('legacy self-complete mission submits evidence without claiming a reward', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('member'),
    });
    mocks.listMissions.mockResolvedValue([
      {
        id: 'mission-self',
        guild_id: guild.id,
        created_by_traveler_id: guild.leader_traveler_id,
        title: 'Serviço direto',
        description: null,
        mission_type: 'practical_activity',
        bible_reference: null,
        bible_url: null,
        completion_mode: 'self_complete',
        requires_leader_approval: false,
        reward_tier: 'great',
        status: 'published',
        starts_at: null,
        due_at: null,
        metadata: null,
        published_at: guild.created_at,
        closed_at: null,
        created_at: guild.created_at,
        updated_at: guild.updated_at,
      },
    ]);
    mocks.listOwnProgress.mockResolvedValue([
      {
        id: 'progress-1',
        mission_id: 'mission-self',
        traveler_id: traveler.id,
        status: 'started',
        started_at: guild.created_at,
        submitted_at: null,
        completed_at: null,
        approved_at: null,
        approved_by_traveler_id: null,
        completion_note: null,
        reward_claimed_at: null,
        created_at: guild.created_at,
        updated_at: guild.updated_at,
      },
    ]);
    render(<OnlineGuildHub traveler={traveler} />);
    await screen.findByRole('heading', { name: guild.name });
    fireEvent.click(screen.getByRole('button', { name: 'Miss\u00f5es' }));
    fireEvent.change(
      screen.getByLabelText('Comprova\u00e7\u00e3o da conclus\u00e3o'),
      { target: { value: 'Registro objetivo' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Enviar conclus\u00e3o' }),
    );
    await waitFor(() =>
      expect(mocks.workspaceAct).toHaveBeenCalledWith(
        traveler.id,
        'mission-self',
        'submit',
        'Registro objetivo',
        expect.any(String),
        0,
      ),
    );
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.reloadOnlineTraveler).not.toHaveBeenCalled();
  });

  test('management uses the new eight-area workspace and existing membership', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('leader'),
    });
    render(<OnlineGuildHub traveler={traveler} management />);
    await screen.findByRole('heading', { name: 'Painel da Guilda' });
    expect(mocks.workspaceLoad).toHaveBeenCalledWith(traveler.id, 0);
    expect(screen.getAllByRole('option')).toHaveLength(8);
    fireEvent.click(screen.getByRole('button', { name: 'Membros' }));
    expect(screen.getByText(traveler.name)).toBeVisible();
  });

  test('member opening management is denied administrative data and controls', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('member'),
    });
    render(<OnlineGuildHub traveler={traveler} management />);
    await screen.findByRole('link', { name: 'Voltar \u00e0 Guilda' });
    expect(mocks.workspaceLoad).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'Criar miss\u00e3o' }),
    ).toBeNull();
  });

  test('new leader panel keeps lessons and calendar outside this task', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('leader'),
    });
    render(<OnlineGuildHub traveler={traveler} management />);
    await screen.findByRole('heading', { name: 'Painel da Guilda' });
    expect(
      screen.queryByRole('button', { name: /Criar aula|Publicar aula/ }),
    ).toBeNull();
    expect(mocks.saveLesson).not.toHaveBeenCalled();
    expect(mocks.listLessons).not.toHaveBeenCalled();
  });

  test('member sees only published lessons returned by RLS and no leader action', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('member'),
    });
    mocks.listLessons.mockResolvedValue([
      {
        id: 'lesson-1',
        guild_id: guild.id,
        created_by_traveler_id: traveler.id,
        related_mission_id: null,
        title: 'Eu sou a videira',
        theme: 'Permanecer',
        bible_reference: 'João 15',
        bible_url: null,
        introduction: 'Introdução',
        content: 'Conteúdo da aula',
        main_points: ['A videira'],
        discussion_questions: ['Qual imagem Jesus usa?'],
        activity_text: null,
        status: 'published',
        scheduled_at: guild.created_at,
        published_at: guild.created_at,
        completed_at: null,
        created_at: guild.created_at,
        updated_at: guild.updated_at,
      },
    ]);
    render(<OnlineGuildHub traveler={traveler} />);
    await screen.findByRole('heading', { name: 'Célula Esperança' });
    fireEvent.click(screen.getByRole('button', { name: 'Aulas' }));
    expect(
      await screen.findByRole('heading', { name: 'Eu sou a videira' }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Ver aula →' }));
    expect(screen.getByText('Conteúdo da aula')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Editar rascunho' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Publicar aula' }),
    ).not.toBeInTheDocument();
  });

  test('member can read guidance and start a new attempt after rejection', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('member'),
    });
    mocks.listMissions.mockResolvedValue([
      {
        id: 'retry-1',
        guild_id: guild.id,
        created_by_traveler_id: traveler.id,
        title: 'Serviço em equipe',
        description: null,
        mission_type: 'practical_activity',
        bible_reference: null,
        bible_url: null,
        completion_mode: 'leader_approval',
        requires_leader_approval: true,
        reward_tier: 'normal',
        status: 'published',
        starts_at: null,
        due_at: null,
        metadata: null,
        published_at: guild.created_at,
        closed_at: null,
        created_at: guild.created_at,
        updated_at: guild.updated_at,
      },
    ]);
    mocks.listOwnProgress.mockResolvedValue([
      {
        id: 'progress-1',
        mission_id: 'retry-1',
        traveler_id: traveler.id,
        status: 'rejected',
        started_at: guild.created_at,
        submitted_at: guild.created_at,
        completed_at: null,
        approved_at: null,
        approved_by_traveler_id: null,
        completion_note: 'feito',
        review_note: 'Confira a etapa final.',
        reward_claimed_at: null,
        created_at: guild.created_at,
        updated_at: guild.updated_at,
      },
    ]);
    render(<OnlineGuildHub traveler={traveler} />);
    await screen.findByRole('heading', { name: /Esperan/ });
    fireEvent.click(screen.getByRole('button', { name: 'Missões' }));
    expect(screen.getByText(/Confira a etapa final/)).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar nova tentativa' }),
    );
    await waitFor(() =>
      expect(mocks.workspaceAct).toHaveBeenCalledWith(
        traveler.id,
        'retry-1',
        'start',
        '',
        expect.any(String),
        0,
      ),
    );
  });
});
