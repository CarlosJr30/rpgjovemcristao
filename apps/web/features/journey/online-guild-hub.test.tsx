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
    expect(screen.getByText('Tudo concluído por enquanto.')).toBeVisible();
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

  test('leader creates a draft by tier without XP or coin fields', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('leader'),
    });
    render(<OnlineGuildHub traveler={traveler} />);
    await screen.findByRole('heading', { name: 'Célula Esperança' });
    fireEvent.click(screen.getByRole('button', { name: 'Missões' }));
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'Servir em comunidade' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(
      screen.getByText(/Valores oficiais; não podem ser editados/),
    ).toBeVisible();
    expect(
      screen.getByText('+80 XP · +25 Moedas do Viajante · +1 Baú Comum'),
    ).toBeVisible();
    expect(screen.queryByLabelText(/XP/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Moedas/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    await waitFor(() =>
      expect(mocks.createMission).toHaveBeenCalledWith(
        expect.objectContaining({
          travelerId: traveler.id,
          title: 'Servir em comunidade',
          rewardTier: 'normal',
          publish: false,
        }),
      ),
    );
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

  test('self-complete processes the reward and refreshes the Traveler cache', async () => {
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
    mocks.submit.mockResolvedValue('completed');

    render(<OnlineGuildHub traveler={traveler} />);
    await screen.findByRole('heading', { name: 'Célula Esperança' });
    fireEvent.click(screen.getByRole('button', { name: 'Missões' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Marcar como concluída' }),
    );

    await waitFor(() =>
      expect(mocks.reloadOnlineTraveler).toHaveBeenCalledWith(traveler.id),
    );
  });

  test('leader management shows real counters, drafts, approvals, members and history', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('leader'),
    });
    const mission = {
      id: 'mission-1',
      guild_id: guild.id,
      created_by_traveler_id: traveler.id,
      title: 'Serviço da semana',
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
    };
    mocks.adminMissions.mockResolvedValue([
      mission,
      { ...mission, id: 'draft-1', title: 'Rascunho novo', status: 'draft' },
    ]);
    mocks.adminStats.mockResolvedValue([
      {
        mission_id: mission.id,
        participants: 2,
        completed: 1,
        pending: 1,
        completed_recent: 1,
      },
    ]);
    mocks.listProgress.mockResolvedValue([
      {
        traveler_id: 'member-1',
        traveler_name: 'Felipe',
        progress_status: 'pending_approval',
        completion_note: 'Atividade feita',
        submitted_at: guild.created_at,
        completed_at: null,
      },
    ]);
    mocks.listMembers.mockResolvedValue([
      {
        traveler_id: traveler.id,
        traveler_name: traveler.name,
        role: 'leader',
        member_status: 'active',
        joined_at: guild.created_at,
      },
      {
        traveler_id: 'member-1',
        traveler_name: 'Felipe',
        role: 'member',
        member_status: 'active',
        joined_at: guild.created_at,
      },
    ]);
    mocks.adminHistory.mockResolvedValue([
      {
        id: 'event-1',
        guild_id: guild.id,
        actor_traveler_id: traveler.id,
        event_type: 'mission_published',
        entity_type: 'mission',
        entity_id: mission.id,
        metadata: {},
        created_at: guild.created_at,
      },
    ]);
    render(<OnlineGuildHub traveler={traveler} management />);
    expect(await screen.findByText('PAINEL DO LÍDER')).toBeVisible();
    expect(screen.getByLabelText('Resumo da Guilda')).toHaveTextContent(
      '2 membros',
    );
    expect(screen.getByLabelText('Resumo da Guilda')).toHaveTextContent(
      '1 aprovações',
    );
    expect(screen.getByText(/Missão publicada/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Conteúdo' }));
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'all' },
    });
    expect(screen.getByText('Rascunho novo')).toBeVisible();
    expect(screen.getByText('Serviço da semana')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovações (1)' }));
    expect(screen.getAllByText('Felipe').length).toBeGreaterThan(0);
    let finishReview!: (value: string) => void;
    mocks.reviewWithGuidance.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finishReview = resolve;
        }),
    );
    const approve = screen.getByRole('button', { name: 'Aprovar' });
    fireEvent.click(approve);
    expect(approve).toBeDisabled();
    fireEvent.click(approve);
    expect(mocks.reviewWithGuidance).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(mocks.reviewWithGuidance).toHaveBeenCalledWith(
        'mission-1',
        'member-1',
        traveler.id,
        true,
        '',
      ),
    );
    finishReview('completed');
    expect(await screen.findByText('MISSÃO APROVADA')).toBeVisible();
    expect(
      screen.getByText('Recompensa processada para Felipe:'),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Membros' }));
    fireEvent.click(screen.getByLabelText('Ações para Felipe'));
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Ver perfil público' })[1],
    );
    await waitFor(() =>
      expect(mocks.publicMemberProfile).toHaveBeenCalledWith(
        traveler.id,
        'member-1',
      ),
    );
    expect(
      await screen.findByText(/Nível 3 · 7 missões concluídas/),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Remover da Guilda' }),
    ).toBeVisible();
  });

  test('member opening management sees normal Guild without admin controls', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('member'),
    });
    render(<OnlineGuildHub traveler={traveler} management />);
    await screen.findByRole('heading', { name: /Esperan/ });
    expect(screen.queryByText('Painel do Líder')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '+ Criar missão' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Gerenciar Guilda')).not.toBeInTheDocument();
  });

  test('leader publishes a lesson with a related mission while keeping draft controls private', async () => {
    mocks.getContext.mockResolvedValue({
      guild,
      membership: membership('leader'),
    });
    render(<OnlineGuildHub traveler={traveler} management />);
    await screen.findByText('PAINEL DO LÍDER');
    fireEvent.click(screen.getByRole('button', { name: '+ Criar aula' }));
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'Eu sou a videira' },
    });
    fireEvent.change(screen.getByLabelText('Tema *'), {
      target: { value: 'Permanecer em Cristo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.change(screen.getByLabelText('Passagem *'), {
      target: { value: 'João 15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.change(screen.getByLabelText('Conteúdo principal *'), {
      target: { value: 'Leitura e estudo de João 15.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.change(screen.getByLabelText('Perguntas, uma por linha'), {
      target: { value: 'Qual imagem Jesus usa?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.change(screen.getByLabelText('Data da aula *'), {
      target: { value: '2026-10-01T19:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publicar aula' }));
    await waitFor(() =>
      expect(mocks.saveLesson).toHaveBeenCalledWith(
        expect.objectContaining({
          leaderTravelerId: traveler.id,
          title: 'Eu sou a videira',
          bibleReference: 'João 15',
          discussionQuestions: ['Qual imagem Jesus usa?'],
          publish: true,
        }),
      ),
    );
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
      expect(mocks.start).toHaveBeenCalledWith('retry-1', traveler.id),
    );
  });
});
