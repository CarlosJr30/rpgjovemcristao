'use client';

import { guildMissionRewards, type GuildRewardTier } from '@rpg/game-engine';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import type { Traveler } from '../domain/traveler';
import {
  guildRepository,
  type OnlineGuildContext,
} from '../../../lib/supabase/repositories/guild-repository';
import {
  guildMissionRepository,
  type CreateGuildMissionInput,
  type GuildCompletionMode,
  type GuildMissionType,
} from '../../../lib/supabase/repositories/guild-mission-repository';
import type {
  GuildJoinRequestRow,
  GuildJoinRequestSummary,
  GuildMemberSummary,
  GuildMissionProgressRow,
  GuildMissionProgressSummary,
  GuildMissionRow,
  GuildActivityRow,
  GuildAdminMissionStats,
  GuildLessonRow,
} from '../../../lib/supabase/database.types';
import { reloadOnlineTraveler } from '../../../lib/supabase/online-sync';
import { guildAdminRepository } from '../../../lib/supabase/repositories/guild-admin-repository';
import {
  guildLessonRepository,
  type GuildLessonInput,
} from '../../../lib/supabase/repositories/guild-lesson-repository';
import {
  GuildRewardDetails,
  GuildRewardPreview,
  guildRewardTierLabels,
} from './guild-reward-summary';
import styles from '../journey.module.css';
import {
  missionIsPlayable,
  playerMissionSection,
} from '../data/guildPlayerVisibility';
import { useGuildClock } from '../hooks/use-guild-clock';
import { gameAudio } from '../audio/audio-manager';
import { GuildHero } from './guild-hero';
import hall from './guild-experience.module.css';
import { guildStatusLabel } from '../data/guildPresentation';
import { GuildArtwork, GuildHall } from './guild-artwork';
import { GuildChat } from './guild-chat';

type LoadedState = Readonly<{
  context: OnlineGuildContext | null;
  ownRequest: GuildJoinRequestRow | null;
  members: GuildMemberSummary[];
  joinRequests: GuildJoinRequestSummary[];
  missions: GuildMissionRow[];
  ownProgress: GuildMissionProgressRow[];
  missionProgress: Record<string, GuildMissionProgressSummary[]>;
  stats: GuildAdminMissionStats[];
  history: GuildActivityRow[];
  lessons: GuildLessonRow[];
}>;

const emptyState: LoadedState = {
  context: null,
  ownRequest: null,
  members: [],
  joinRequests: [],
  missions: [],
  ownProgress: [],
  missionProgress: {},
  stats: [],
  history: [],
  lessons: [],
};
const missionTypeLabels: Record<GuildMissionType, string> = {
  bible_reading: 'Leitura bíblica',
  lesson: 'Lição',
  quiz: 'Quiz',
  practical_activity: 'Atividade prática',
  individual_challenge: 'Desafio individual',
  collective_challenge: 'Desafio coletivo',
  special_mission: 'Missão especial',
  journey_gate: 'Gate da Jornada',
};
const progressLabels: Record<string, string> = {
  available: 'DISPONÍVEL',
  started: 'EM ANDAMENTO',
  pending_approval: 'AGUARDANDO APROVAÇÃO',
  completed: 'CONCLUÍDA',
  rejected: 'NOVA TENTATIVA SOLICITADA',
};

const emptyMissionForm = (): Omit<
  CreateGuildMissionInput,
  'travelerId' | 'publish'
> => ({
  title: '',
  description: '',
  missionType: 'practical_activity',
  bibleReference: '',
  bibleUrl: '',
  completionMode: 'leader_approval',
  rewardTier: 'normal',
  startsAt: '',
  dueAt: '',
});

const emptyLessonForm = () => ({
  title: '',
  theme: '',
  bibleReference: '',
  bibleUrl: '',
  introduction: '',
  content: '',
  mainPoints: '',
  discussionQuestions: '',
  activityText: '',
  scheduledAt: '',
  relatedMissionId: '',
});
type LessonForm = ReturnType<typeof emptyLessonForm>;

export function OnlineGuildHub({
  traveler,
  management = false,
}: {
  traveler: Traveler;
  management?: boolean;
}) {
  const [state, setState] = useState<LoadedState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const approvalInFlight = useRef(false);
  const [reviewing, setReviewing] = useState(false);
  const [approvedReward, setApprovedReward] = useState<{
    name: string;
    tier: GuildRewardTier;
  } | null>(null);
  const [tab, setTab] = useState<
    'overview' | 'missions' | 'lessons' | 'members' | 'history'
  >('overview');
  const [revision, setRevision] = useState(0);
  const [guildName, setGuildName] = useState('');
  const [guildDescription, setGuildDescription] = useState('');
  const [guildId, setGuildId] = useState('');
  const [missionForm, setMissionForm] = useState(emptyMissionForm);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const now = useGuildClock(
    state.missions.flatMap((mission) => [
      Date.parse(mission.starts_at ?? ''),
      Date.parse(mission.due_at ?? ''),
    ]),
  );
  const [adminTab, setAdminTab] = useState<
    'overview' | 'content' | 'approvals' | 'members' | 'agenda' | 'history'
  >('overview');
  const [contentTab, setContentTab] = useState<
    'missions' | 'lessons' | 'challenges'
  >('missions');
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [showLessonCreator, setShowLessonCreator] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<{
    level: number;
    completed_missions: number;
  } | null>(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [lessonsLoaded, setLessonsLoaded] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [oldMissionsLoaded, setOldMissionsLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterType, setFilterType] = useState('all');
  const [filterDue, setFilterDue] = useState('all');
  const [filterReward, setFilterReward] = useState('all');
  const [search, setSearch] = useState('');
  const [guidance, setGuidance] = useState<Record<string, string>>({});
  const [historyLimit, setHistoryLimit] = useState(20);
  const [oldMissionCount, setOldMissionCount] = useState(20);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const context = await guildRepository.getContext(traveler.id);
      if (!context) {
        const ownRequest = await guildRepository.getOwnJoinRequest(traveler.id);
        setState({ ...emptyState, ownRequest });
        return;
      }
      const leader = context.membership.role === 'leader';
      const [
        members,
        missions,
        ownProgress,
        joinRequests,
        stats,
        history,
        lessons,
      ] = await Promise.all([
        guildRepository.listMembers(traveler.id),
        management && leader
          ? guildAdminRepository.missions(context.guild.id)
          : guildMissionRepository.list(context.guild.id),
        guildMissionRepository.listOwnProgress(traveler.id),
        leader
          ? guildRepository.listJoinRequests(traveler.id)
          : Promise.resolve([]),
        leader && management
          ? guildAdminRepository.stats(traveler.id)
          : Promise.resolve([]),
        leader && management
          ? guildAdminRepository.history(context.guild.id, 0, 5)
          : Promise.resolve([]),
        guildLessonRepository.upcoming(context.guild.id).catch(() => []),
      ]);
      if (ownProgress.some((progress) => progress.reward_claimed_at)) {
        await reloadOnlineTraveler(traveler.id);
      }
      const pendingMissionIds = new Set(
        stats
          .filter((item) => Number(item.pending) > 0)
          .map((item) => item.mission_id),
      );
      const missingPendingIds = [...pendingMissionIds].filter(
        (id) => !missions.some((mission) => mission.id === id),
      );
      const pendingOlderMissions =
        leader && management
          ? await guildAdminRepository.byIds(
              context.guild.id,
              missingPendingIds,
            )
          : [];
      const loadedMissions = [...missions, ...pendingOlderMissions];
      const progressEntries = leader
        ? await Promise.all(
            loadedMissions
              .filter(
                (mission) => !management || pendingMissionIds.has(mission.id),
              )
              .map(
                async (mission) =>
                  [
                    mission.id,
                    await guildMissionRepository.listProgress(
                      mission.id,
                      traveler.id,
                    ),
                  ] as const,
              ),
          )
        : [];
      setState({
        context,
        ownRequest: null,
        members,
        joinRequests,
        missions: loadedMissions,
        ownProgress,
        missionProgress: Object.fromEntries(progressEntries),
        stats,
        history,
        lessons,
      });
      if (management) {
        setHistoryLimit(20);
        setOldMissionCount(20);
        setLessonsLoaded(false);
        setHistoryLoaded(false);
        setOldMissionsLoaded(false);
      }
    } catch {
      setError(
        management
          ? 'Não foi possível carregar o painel da Guilda. Tente novamente; nenhum dado local substituirá o Supabase.'
          : 'Não foi possível conectar à Guilda. Seus dados locais não substituíram o estado remoto.',
      );
    } finally {
      setLoading(false);
    }
  }, [traveler.id, management]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, revision]);
  useEffect(() => {
    const guildId = state.context?.guild.id;
    if (!guildId || loading) return;
    if (
      ((management &&
        state.context?.membership.role === 'leader' &&
        (adminTab === 'agenda' ||
          (adminTab === 'content' && contentTab === 'lessons'))) ||
        (!management && tab === 'lessons')) &&
      !lessonsLoaded
    ) {
      void guildLessonRepository
        .list(guildId)
        .then((lessons) => {
          setState((old) => ({ ...old, lessons }));
          setLessonsLoaded(true);
        })
        .catch(() =>
          setFeedback(
            'Aulas indisponíveis. Confira se a migration 0005 foi aplicada.',
          ),
        );
    }
    if (!management || state.context?.membership.role !== 'leader') return;
    if (adminTab === 'history' && !historyLoaded) {
      void guildAdminRepository
        .history(guildId)
        .then((history) => {
          setState((old) => ({ ...old, history }));
          setHistoryLoaded(true);
        })
        .catch(() => setFeedback('Não foi possível carregar o histórico.'));
    }
    if (
      adminTab === 'content' &&
      contentTab === 'missions' &&
      !oldMissionsLoaded
    ) {
      void guildAdminRepository
        .oldMissions(guildId)
        .then((oldMissions) => {
          setState((old) => ({
            ...old,
            missions: [
              ...old.missions.filter(
                (item) =>
                  !oldMissions.some((mission) => mission.id === item.id),
              ),
              ...oldMissions,
            ],
          }));
          setOldMissionsLoaded(true);
        })
        .catch(() =>
          setFeedback('Não foi possível carregar missões encerradas.'),
        );
    }
  }, [
    adminTab,
    contentTab,
    historyLoaded,
    lessonsLoaded,
    loading,
    management,
    oldMissionsLoaded,
    state.context?.guild.id,
    state.context?.membership.role,
    tab,
  ]);
  const refresh = (message: string) => {
    setFeedback(message);
    setRevision((value) => value + 1);
  };
  const act = async (
    operation: () => Promise<unknown>,
    success: string,
    refreshReward = false,
  ) => {
    setFeedback('Salvando sua atividade…');
    try {
      await operation();
      gameAudio.playEffect(refreshReward ? 'reward' : 'guildApproval');
      if (refreshReward) await reloadOnlineTraveler(traveler.id);
      refresh(success);
    } catch {
      setFeedback('A operação foi recusada ou não pôde ser salva.');
    }
  };

  if (loading)
    return (
      <section className={styles.guildHub}>
        <p role="status">Carregando Guilda…</p>
      </section>
    );
  if (error)
    return (
      <section className={styles.guildHub}>
        <div className={styles.guildWarning} role="alert">
          {error}
        </div>
        <button onClick={() => void load()}>Tentar novamente</button>
      </section>
    );

  if (!state.context) {
    return (
      <GuildHall className={styles.guildHub}>
        <header className={styles.guildHeroBanner}>
          <p className={styles.eyebrow}>GUILDA / CÉLULA · SUPABASE</p>
          <h1>Encontre sua comunidade</h1>
          <p>
            Crie uma Guilda ou solicite entrada usando o identificador
            compartilhado pelo líder.
          </p>
        </header>
        {state.ownRequest ? (
          <section className={styles.guildJoinCard}>
            <h2>Pedido aguardando aprovação</h2>
            <p>
              Seu pedido foi enviado e permanece pendente. Nenhuma Guilda é
              liberada automaticamente.
            </p>
            <code>{state.ownRequest.guild_id}</code>
          </section>
        ) : (
          <div className={styles.guildOnboardingGrid}>
            <form
              className={styles.guildJoinCard}
              onSubmit={(event) => {
                event.preventDefault();
                void act(
                  () =>
                    guildRepository.create(
                      traveler.id,
                      guildName.trim(),
                      guildDescription.trim(),
                    ),
                  'Guilda criada. Você agora é o líder.',
                );
              }}
            >
              <h2>Criar Guilda</h2>
              <label>
                Nome da Guilda
                <input
                  required
                  minLength={2}
                  maxLength={60}
                  value={guildName}
                  onChange={(event) => setGuildName(event.target.value)}
                />
              </label>
              <label>
                Descrição opcional
                <textarea
                  maxLength={500}
                  value={guildDescription}
                  onChange={(event) => setGuildDescription(event.target.value)}
                />
              </label>
              <button type="submit">Criar Guilda</button>
            </form>
            <form
              className={styles.guildJoinCard}
              onSubmit={(event) => {
                event.preventDefault();
                void act(
                  () =>
                    guildRepository.requestJoin(guildId.trim(), traveler.id),
                  'Pedido enviado ao líder.',
                );
              }}
            >
              <h2>Entrar em uma Guilda</h2>
              <label>
                ID da Guilda
                <input
                  required
                  pattern="[0-9a-fA-F-]{36}"
                  maxLength={36}
                  value={guildId}
                  onChange={(event) => setGuildId(event.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </label>
              <button type="submit">Solicitar entrada</button>
            </form>
          </div>
        )}
        <p role="status" aria-live="polite">
          {feedback}
        </p>
      </GuildHall>
    );
  }

  const { context } = state;
  const isLeader = context.membership.role === 'leader';
  const leaderName =
    context.guild.leader_traveler_id === traveler.id
      ? traveler.name
      : (state.members.find(
          (member) => member.traveler_id === context.guild.leader_traveler_id,
        )?.traveler_name ?? 'Liderança não informada');
  const ownProgress = new Map(
    state.ownProgress.map((progress) => [progress.mission_id, progress]),
  );
  const pendingRequests = state.joinRequests.filter(
    (request) => request.request_status === 'pending',
  );
  const missionGroups = {
    available: state.missions.filter(
      (mission) =>
        (!ownProgress.has(mission.id) ||
          ownProgress.get(mission.id)?.status === 'available') &&
        playerMissionSection(
          mission,
          ownProgress.get(mission.id)?.status,
          now,
        ) === 'available',
    ),
    started: state.missions.filter(
      (mission) =>
        ownProgress.get(mission.id)?.status === 'started' &&
        missionIsPlayable(mission, now),
    ),
    pending: state.missions.filter(
      (mission) => ownProgress.get(mission.id)?.status === 'pending_approval',
    ),
    rejected: state.missions.filter(
      (mission) =>
        ownProgress.get(mission.id)?.status === 'rejected' &&
        missionIsPlayable(mission, now),
    ),
    completed: state.missions.filter(
      (mission) => ownProgress.get(mission.id)?.status === 'completed',
    ),
  };

  if (management && isLeader) {
    const statsById = new Map(
      state.stats.map((item) => [item.mission_id, item]),
    );
    const active = state.missions.filter(
      (mission) =>
        mission.status === 'published' &&
        (!mission.due_at || Date.parse(mission.due_at) > now),
    );
    const drafts = state.missions.filter(
      (mission) => mission.status === 'draft',
    );
    const closed = state.missions.filter(
      (mission) =>
        mission.status === 'closed' ||
        (mission.status === 'published' &&
          mission.due_at &&
          Date.parse(mission.due_at) <= now),
    );
    const pendingCount = state.stats.reduce(
      (sum, item) => sum + Number(item.pending),
      0,
    );
    const pendingMissions = state.missions.filter(
      (mission) => Number(statsById.get(mission.id)?.pending) > 0,
    );
    const approvalItems = pendingMissions
      .flatMap((mission) =>
        (state.missionProgress[mission.id] ?? [])
          .filter((item) => item.progress_status === 'pending_approval')
          .map((item) => ({
            mission,
            item,
            key: `${mission.id}:${item.traveler_id}`,
          })),
      )
      .sort(
        (a, b) =>
          Number(b.mission.mission_type === 'journey_gate') -
            Number(a.mission.mission_type === 'journey_gate') ||
          Date.parse(a.item.submitted_at ?? '') -
            Date.parse(b.item.submitted_at ?? ''),
      );
    const selectedApprovalItem =
      approvalItems.find((entry) => entry.key === selectedApproval) ??
      approvalItems[0];
    const nextApproval = () => {
      const index = approvalItems.findIndex(
        (entry) => entry.key === selectedApprovalItem?.key,
      );
      setSelectedApproval(
        approvalItems[index + 1]?.key ?? approvalItems[0]?.key ?? null,
      );
    };
    const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
    const agendaEvents = [
      ...state.missions
        .filter((mission) => mission.status === 'published')
        .flatMap((mission) => [
          mission.starts_at
            ? {
                id: `start:${mission.id}`,
                date: mission.starts_at,
                label: `Início · ${mission.title}`,
                type: 'mission',
              }
            : null,
          mission.due_at
            ? {
                id: `due:${mission.id}`,
                date: mission.due_at,
                label: `Prazo · ${mission.title}`,
                type: 'mission',
              }
            : null,
        ])
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
      ...state.lessons
        .filter(
          (lesson) => lesson.status === 'published' && lesson.scheduled_at,
        )
        .map((lesson) => ({
          id: `lesson:${lesson.id}`,
          date: lesson.scheduled_at!,
          label: `Aula · ${lesson.title}`,
          type: 'lesson',
        })),
    ].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const upcomingEvents = agendaEvents.filter(
      (entry) =>
        Date.parse(entry.date) >= now && Date.parse(entry.date) <= weekEnd,
    );
    const weekEvents = upcomingEvents.slice(0, 3);
    const dueToday = active.filter(
      (mission) =>
        mission.due_at &&
        new Date(mission.due_at).toDateString() ===
          new Date(now).toDateString(),
    ).length;
    const visibleMissions = state.missions.filter((mission) => {
      if (mission.status === 'cancelled') return false;
      if (
        filterStatus === 'active' &&
        (mission.status !== 'published' ||
          (mission.due_at && Date.parse(mission.due_at) <= now))
      )
        return false;
      if (
        filterStatus === 'closed' &&
        mission.status !== 'closed' &&
        !(
          mission.status === 'published' &&
          mission.due_at &&
          Date.parse(mission.due_at) <= now
        )
      )
        return false;
      if (
        !['all', 'active', 'closed'].includes(filterStatus) &&
        mission.status !== filterStatus
      )
        return false;
      if (filterType !== 'all' && mission.mission_type !== filterType)
        return false;
      if (filterReward !== 'all' && mission.reward_tier !== filterReward)
        return false;
      if (filterDue === 'with_due' && !mission.due_at) return false;
      if (
        filterDue === 'overdue' &&
        (!mission.due_at || Date.parse(mission.due_at) > now)
      )
        return false;
      return mission.title
        .toLocaleLowerCase('pt-BR')
        .includes(search.toLocaleLowerCase('pt-BR'));
    });
    const historyLabels: Record<string, string> = {
      guild_created: 'Guilda criada',
      member_joined: 'Membro entrou',
      member_left: 'Membro saiu',
      member_removed: 'Membro removido',
      mission_created: 'Missão criada',
      mission_published: 'Missão publicada',
      mission_closed: 'Missão encerrada',
      draft_deleted: 'Rascunho excluído',
      mission_submitted: 'Missão enviada para aprovação',
      mission_completed: 'Missão concluída',
      mission_rejected: 'Nova tentativa solicitada',
      reward_processed: 'Recompensa processada',
      lesson_created: 'Aula criada',
      lesson_published: 'Aula publicada',
      lesson_completed: 'Aula realizada',
      lesson_cancelled: 'Aula cancelada',
    };
    const describeEvent = (event: GuildActivityRow) => {
      const actor = state.members.find(
        (member) => member.traveler_id === event.actor_traveler_id,
      )?.traveler_name;
      const mission = state.missions.find(
        (item) => item.id === event.entity_id,
      )?.title;
      return [
        actor,
        historyLabels[event.event_type] ?? event.event_type,
        mission ? `“${mission}”` : null,
      ]
        .filter(Boolean)
        .join(' · ');
    };
    const startCreate = () => {
      setEditingId(null);
      setMissionForm(emptyMissionForm());
      setShowCreator(true);
      setContentTab('missions');
      setAdminTab('content');
    };
    const startEdit = (mission: GuildMissionRow) => {
      setEditingId(mission.id);
      setMissionForm({
        title: mission.title,
        description: mission.description ?? '',
        missionType: mission.mission_type as GuildMissionType,
        bibleReference: mission.bible_reference ?? '',
        bibleUrl: mission.bible_url ?? '',
        completionMode: mission.completion_mode as GuildCompletionMode,
        rewardTier: mission.reward_tier as GuildRewardTier,
        startsAt: mission.starts_at?.slice(0, 16) ?? '',
        dueAt: mission.due_at?.slice(0, 16) ?? '',
      });
      setShowCreator(true);
      setContentTab('missions');
      setAdminTab('content');
    };
    const saveMission = (publish: boolean) => {
      const id = editingId;
      void act(
        async () => {
          if (id) {
            await guildMissionRepository.updateDraft(id, {
              ...missionForm,
              travelerId: traveler.id,
              publish: false,
            });
            if (publish) await guildMissionRepository.publish(id, traveler.id);
          } else
            await guildMissionRepository.create({
              ...missionForm,
              travelerId: traveler.id,
              publish,
            });
          setShowCreator(false);
          setEditingId(null);
          setMissionForm(emptyMissionForm());
        },
        publish ? 'Missão publicada.' : 'Rascunho salvo.',
      );
    };
    const showDetails = (mission: GuildMissionRow) => {
      setSelectedMissionId(mission.id);
      void guildMissionRepository
        .listProgress(mission.id, traveler.id)
        .then((progress) =>
          setState((old) => ({
            ...old,
            missionProgress: { ...old.missionProgress, [mission.id]: progress },
          })),
        )
        .catch(() =>
          setFeedback('Não foi possível carregar o relatório da missão.'),
        );
    };
    const selectedMission = state.missions.find(
      (mission) => mission.id === selectedMissionId,
    );
    const startLesson = () => {
      setEditingLessonId(null);
      setLessonForm(emptyLessonForm());
      setShowLessonCreator(true);
      setContentTab('lessons');
      setAdminTab('content');
    };
    const editLesson = (lesson: GuildLessonRow) => {
      setEditingLessonId(lesson.id);
      setLessonForm({
        title: lesson.title,
        theme: lesson.theme,
        bibleReference: lesson.bible_reference,
        bibleUrl: lesson.bible_url ?? '',
        introduction: lesson.introduction,
        content: lesson.content,
        mainPoints: Array.isArray(lesson.main_points)
          ? lesson.main_points.join('\n')
          : '',
        discussionQuestions: Array.isArray(lesson.discussion_questions)
          ? lesson.discussion_questions.join('\n')
          : '',
        activityText: lesson.activity_text ?? '',
        scheduledAt: lesson.scheduled_at?.slice(0, 16) ?? '',
        relatedMissionId: lesson.related_mission_id ?? '',
      });
      setShowLessonCreator(true);
      setContentTab('lessons');
      setAdminTab('content');
    };
    const saveLesson = (publish: boolean) => {
      const input: GuildLessonInput = {
        ...lessonForm,
        id: editingLessonId ?? undefined,
        leaderTravelerId: traveler.id,
        publish,
        mainPoints: lessonForm.mainPoints
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        discussionQuestions: lessonForm.discussionQuestions
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      };
      void act(
        async () => {
          await guildLessonRepository.save(input);
          setShowLessonCreator(false);
          setEditingLessonId(null);
          setLessonForm(emptyLessonForm());
        },
        publish ? 'Aula publicada.' : 'Rascunho de aula salvo.',
      );
    };
    const reviewApproval = async (approve: boolean) => {
      if (!selectedApprovalItem || approvalInFlight.current) return;
      approvalInFlight.current = true;
      setReviewing(true);
      setApprovedReward(null);
      setFeedback('Salvando sua decisão…');
      try {
        await guildMissionRepository.reviewWithGuidance(
          selectedApprovalItem.mission.id,
          selectedApprovalItem.item.traveler_id,
          traveler.id,
          approve,
          approve ? '' : (guidance[selectedApprovalItem.key] ?? ''),
        );
        nextApproval();
        if (approve) {
          gameAudio.playEffect('guildApproval');
          setApprovedReward({
            name: selectedApprovalItem.item.traveler_name,
            tier: selectedApprovalItem.mission.reward_tier as GuildRewardTier,
          });
        }
        refresh(
          approve
            ? 'Missão aprovada. Recompensa processada uma vez pelo servidor.'
            : 'Nova tentativa solicitada.',
        );
      } catch {
        setFeedback('A revisão não pôde ser salva. Tente novamente.');
      } finally {
        approvalInFlight.current = false;
        setReviewing(false);
      }
    };
    return (
      <GuildHall className={`${styles.guildHub} ${styles.guildAdmin}`}>
        <GuildHero
          name={context.guild.name}
          leader={leaderName}
          description={
            context.guild.description ||
            'Prepare encontros e acompanhe as missões da sua comunidade.'
          }
          participation="Líder da comunidade"
          management
          available={active.length}
          pending={pendingCount}
          completed={state.stats.reduce(
            (sum, item) => sum + Number(item.completed),
            0,
          )}
        >
          <div
            className={styles.guildAdminMetrics}
            aria-label="Resumo da Guilda"
          >
            <span>
              <b>
                {
                  state.members.filter(
                    (item) => item.member_status === 'active',
                  ).length
                }
              </b>{' '}
              membros
            </span>
            <span>
              <b>{active.length}</b> missões ativas
            </span>
            <span>
              <b>{pendingCount}</b> aprovações
            </span>
            <span>
              <b>{upcomingEvents.length}</b> atividades esta semana
            </span>
          </div>
          <Link href="/journey/guild">Voltar à Guilda</Link>
        </GuildHero>
        <div className={styles.guildAdminToolbar}>
          <nav className={styles.guildTabs} aria-label="Painel do Líder">
            {(
              [
                ['overview', 'Início'],
                ['content', 'Conteúdo'],
                ['approvals', `Aprovações (${pendingCount})`],
                ['members', 'Membros'],
                ['agenda', 'Agenda'],
                ['history', 'Histórico'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                aria-pressed={adminTab === key}
                onClick={() => setAdminTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          <label className={styles.guildAdminMobileNav}>
            Seções
            <select
              value={adminTab}
              onChange={(event) =>
                setAdminTab(event.target.value as typeof adminTab)
              }
            >
              <option value="overview">Início</option>
              <option value="content">Conteúdo</option>
              <option value="approvals">Aprovações ({pendingCount})</option>
              <option value="members">Membros</option>
              <option value="agenda">Agenda</option>
              <option value="history">Histórico</option>
            </select>
          </label>
          {(adminTab === 'overview' ||
            (adminTab === 'content' && contentTab === 'missions')) && (
            <button className={styles.primaryLink} onClick={startCreate}>
              + Criar missão
            </button>
          )}
          {adminTab === 'content' && contentTab === 'lessons' && (
            <button className={styles.primaryLink} onClick={startLesson}>
              + Criar aula
            </button>
          )}
        </div>
        <p role="status" aria-live="polite">
          {feedback}
        </p>
        {approvedReward && (
          <div className={hall.attention}>
            <strong>MISSÃO APROVADA</strong>
            <p>Recompensa processada para {approvedReward.name}:</p>
            <GuildRewardDetails tier={approvedReward.tier} showChest />
          </div>
        )}
        {adminTab === 'overview' && (
          <>
            <section
              className={styles.guildAdminSection}
              aria-labelledby="leader-attention"
            >
              <h2 id="leader-attention">Precisa da sua atenção</h2>
              <div className={styles.guildAdminList}>
                {pendingCount > 0 && (
                  <button onClick={() => setAdminTab('approvals')}>
                    <span>{pendingCount} missões aguardando revisão</span>
                    <b>Revisar →</b>
                  </button>
                )}
                {pendingRequests.length > 0 && (
                  <button onClick={() => setAdminTab('members')}>
                    <span>{pendingRequests.length} pedidos para entrar</span>
                    <b>Ver →</b>
                  </button>
                )}
                {dueToday > 0 && (
                  <button
                    onClick={() => {
                      setFilterStatus('active');
                      setContentTab('missions');
                      setAdminTab('content');
                    }}
                  >
                    <span>{dueToday} missão termina hoje</span>
                    <b>Ver →</b>
                  </button>
                )}
                {!pendingCount && !pendingRequests.length && !dueToday && (
                  <p>Tudo certo por aqui.</p>
                )}
              </div>
            </section>
            <section
              className={styles.guildAdminSection}
              aria-labelledby="leader-actions"
            >
              <h2 id="leader-actions">Ação rápida</h2>
              <div className={styles.guildAdminQuickActions}>
                <button onClick={startCreate}>+ Criar missão</button>
                <button onClick={startLesson}>+ Criar aula</button>
                <button
                  onClick={() => {
                    startCreate();
                    setMissionForm((old) => ({
                      ...old,
                      missionType: 'practical_activity',
                    }));
                  }}
                >
                  + Criar atividade
                </button>
                <button onClick={() => setAdminTab('approvals')}>
                  Ver aprovações
                </button>
              </div>
            </section>
            <section
              className={styles.guildAdminSection}
              aria-labelledby="leader-week"
            >
              <h2 id="leader-week">Esta semana</h2>
              <div className={styles.guildAdminTimeline}>
                {weekEvents.map((event) => (
                  <p key={event.id}>
                    <time dateTime={event.date}>
                      {new Date(event.date).toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                      })}
                    </time>
                    <span>{event.label}</span>
                  </p>
                ))}
                {!weekEvents.length && (
                  <p>Nenhuma atividade marcada para os próximos dias.</p>
                )}
              </div>
              <button
                className={styles.guildAdminTextAction}
                onClick={() => setAdminTab('agenda')}
              >
                Ver agenda →
              </button>
            </section>
            <section
              className={styles.guildAdminSection}
              aria-labelledby="leader-recent"
            >
              <h2 id="leader-recent">Atividade recente</h2>
              <div className={styles.guildAdminTimeline}>
                {state.history.slice(0, 5).map((event) => (
                  <p key={event.id}>
                    <time dateTime={event.created_at}>
                      {new Date(event.created_at).toLocaleDateString('pt-BR')}
                    </time>
                    <span>{describeEvent(event)}</span>
                  </p>
                ))}
                {!state.history.length && (
                  <p>As atividades da Guilda aparecerão aqui.</p>
                )}
              </div>
              <button
                className={styles.guildAdminTextAction}
                onClick={() => setAdminTab('history')}
              >
                Ver histórico completo →
              </button>
            </section>
          </>
        )}
        {adminTab === 'content' && (
          <>
            <nav
              className={styles.guildAdminSubnav}
              aria-label="Conteúdo da Guilda"
            >
              {(
                [
                  ['missions', 'Missões'],
                  ['lessons', 'Aulas'],
                  ['challenges', 'Desafios'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={contentTab === key}
                  onClick={() => setContentTab(key)}
                >
                  {label}
                </button>
              ))}
            </nav>
          </>
        )}
        {adminTab === 'content' && contentTab === 'missions' && (
          <>
            {showCreator && (
              <>
                <MissionCreator
                  travelerId={traveler.id}
                  value={missionForm}
                  onChange={setMissionForm}
                  onSave={saveMission}
                  heading={editingId ? 'Editar rascunho' : 'Criar Missão'}
                />
                <button
                  onClick={() => {
                    setShowCreator(false);
                    setEditingId(null);
                  }}
                >
                  Cancelar edição
                </button>
              </>
            )}
            <section className={styles.guildAdminSection}>
              <h2>Missões</h2>
              <div className={styles.guildAdminFilters}>
                <label>
                  Pesquisar título
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                  >
                    <option value="active">Ativas</option>
                    <option value="all">Todas</option>
                    <option value="draft">Rascunhos</option>
                    <option value="closed">Encerradas</option>
                  </select>
                </label>
                <label>
                  Tipo
                  <select
                    value={filterType}
                    onChange={(event) => setFilterType(event.target.value)}
                  >
                    <option value="all">Todos</option>
                    {Object.entries(missionTypeLabels).map(([key, label]) => (
                      <option value={key} key={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Prazo
                  <select
                    value={filterDue}
                    onChange={(event) => setFilterDue(event.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="with_due">Com prazo</option>
                    <option value="overdue">Expiradas</option>
                  </select>
                </label>
                <label>
                  Recompensa
                  <select
                    value={filterReward}
                    onChange={(event) => setFilterReward(event.target.value)}
                  >
                    <option value="all">Todas</option>
                    {Object.keys(guildMissionRewards).map((key) => (
                      <option value={key} key={key}>
                        {guildRewardTierLabels[key as GuildRewardTier]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className={styles.guildAdminMeta}>
                {active.length} ativas · {drafts.length} rascunhos ·{' '}
                {closed.length} encerradas/expiradas
              </p>
              <div className={styles.guildAdminMissionList}>
                {visibleMissions.map((mission) => {
                  const item = statsById.get(mission.id);
                  return (
                    <article
                      className={styles.guildAdminMissionCard}
                      key={mission.id}
                    >
                      <div>
                        <span className={styles.guildAdminChip}>
                          {mission.status === 'draft'
                            ? 'Rascunho'
                            : mission.status === 'published'
                              ? 'Ativa'
                              : 'Encerrada'}
                        </span>
                        <small>
                          {
                            missionTypeLabels[
                              mission.mission_type as GuildMissionType
                            ]
                          }
                        </small>
                      </div>
                      <h3>{mission.title}</h3>
                      <p>
                        {mission.due_at
                          ? `Termina ${new Date(mission.due_at).toLocaleDateString('pt-BR')}`
                          : 'Sem prazo'}
                      </p>
                      <GuildRewardDetails
                        tier={mission.reward_tier as GuildRewardTier}
                      />
                      <p>
                        {Number(item?.completed ?? 0)} /{' '}
                        {
                          state.members.filter(
                            (member) => member.member_status === 'active',
                          ).length
                        }{' '}
                        concluíram
                      </p>
                      <button onClick={() => showDetails(mission)}>
                        Ver missão →
                      </button>
                    </article>
                  );
                })}
                {!visibleMissions.length && (
                  <p>
                    Você ainda não publicou nenhuma missão com estes filtros.{' '}
                    <button onClick={startCreate}>Criar primeira missão</button>
                  </p>
                )}
              </div>
              {closed.length >= oldMissionCount && (
                <button
                  onClick={() =>
                    void guildAdminRepository
                      .oldMissions(context.guild.id, oldMissionCount)
                      .then((next) => {
                        setState((old) => ({
                          ...old,
                          missions: [...old.missions, ...next],
                        }));
                        setOldMissionCount((old) => old + 20);
                      })
                      .catch(() =>
                        setFeedback(
                          'Não foi possível carregar missões antigas.',
                        ),
                      )
                  }
                >
                  Carregar missões antigas
                </button>
              )}
            </section>
            {selectedMission && (
              <section
                className={styles.guildAdminDetail}
                aria-label="Detalhe da missão"
              >
                <h2>{selectedMission.title}</h2>
                {selectedMission.description && (
                  <p>{selectedMission.description}</p>
                )}
                <p>
                  {
                    missionTypeLabels[
                      selectedMission.mission_type as GuildMissionType
                    ]
                  }{' '}
                  · {selectedMission.status}
                </p>
                <p>
                  {Number(statsById.get(selectedMission.id)?.participants ?? 0)}{' '}
                  participantes ·{' '}
                  {Number(statsById.get(selectedMission.id)?.completed ?? 0)}{' '}
                  concluídos ·{' '}
                  {Number(statsById.get(selectedMission.id)?.pending ?? 0)}{' '}
                  pendentes
                </p>
                <p>
                  Período:{' '}
                  {new Date(selectedMission.created_at).toLocaleDateString(
                    'pt-BR',
                  )}{' '}
                  –{' '}
                  {selectedMission.closed_at
                    ? new Date(selectedMission.closed_at).toLocaleDateString(
                        'pt-BR',
                      )
                    : 'em andamento'}
                </p>
                <GuildRewardDetails
                  tier={selectedMission.reward_tier as GuildRewardTier}
                />
                <p>
                  {Number(statsById.get(selectedMission.id)?.completed ?? 0)}{' '}
                  recompensas concedidas para esta missão.
                </p>
                {(state.missionProgress[selectedMission.id] ?? []).map(
                  (item) => (
                    <p key={item.traveler_id}>
                      {item.traveler_name} ·{' '}
                      {progressLabels[item.progress_status] ??
                        item.progress_status}
                    </p>
                  ),
                )}
                <div className={styles.guildAdminActions}>
                  {selectedMission.status === 'draft' && (
                    <>
                      <button
                        onClick={() => {
                          startEdit(selectedMission);
                          setSelectedMissionId(null);
                        }}
                      >
                        Editar rascunho
                      </button>
                      <button
                        onClick={() =>
                          void act(
                            () =>
                              guildMissionRepository.publish(
                                selectedMission.id,
                                traveler.id,
                              ),
                            'Missão publicada.',
                          )
                        }
                      >
                        Publicar
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Cancelar este rascunho?'))
                            void act(
                              () =>
                                guildMissionRepository.deleteDraft(
                                  selectedMission.id,
                                  traveler.id,
                                ),
                              'Rascunho cancelado.',
                            );
                        }}
                      >
                        Cancelar rascunho
                      </button>
                    </>
                  )}
                  {selectedMission.status === 'published' && (
                    <>
                      <button
                        onClick={() => {
                          setAdminTab('approvals');
                          setSelectedApproval(null);
                        }}
                      >
                        Ver aprovações
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Encerrar esta missão?'))
                            void act(
                              () =>
                                guildMissionRepository.close(
                                  selectedMission.id,
                                  traveler.id,
                                ),
                              'Missão encerrada.',
                            );
                        }}
                      >
                        Encerrar missão
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedMissionId(null)}>
                    Fechar detalhe
                  </button>
                </div>
              </section>
            )}
          </>
        )}
        {adminTab === 'content' && contentTab === 'lessons' && (
          <section className={styles.guildAdminSection}>
            <h2>Aulas da Guilda</h2>
            {showLessonCreator && (
              <LessonCreator
                value={lessonForm}
                onChange={setLessonForm}
                onSave={saveLesson}
                onCancel={() => {
                  setShowLessonCreator(false);
                  setEditingLessonId(null);
                }}
                missions={state.missions.filter(
                  (mission) => mission.status !== 'cancelled',
                )}
                heading={
                  editingLessonId ? 'Editar rascunho de aula' : 'Criar aula'
                }
              />
            )}
            <div className={styles.guildAdminMissionList}>
              {state.lessons
                .filter((lesson) => lesson.status !== 'cancelled')
                .map((lesson) => (
                  <article
                    key={lesson.id}
                    className={styles.guildAdminMissionCard}
                  >
                    <span className={styles.guildAdminChip}>
                      {lesson.status === 'draft'
                        ? 'Rascunho'
                        : lesson.status === 'completed'
                          ? 'Realizada'
                          : 'Publicada'}
                    </span>
                    <h3>{lesson.title}</h3>
                    <p>
                      {lesson.theme} · {lesson.bible_reference}
                    </p>
                    <p>
                      {lesson.scheduled_at
                        ? new Date(lesson.scheduled_at).toLocaleString('pt-BR')
                        : 'Data a definir'}
                    </p>
                    <button onClick={() => setSelectedLessonId(lesson.id)}>
                      Ver aula →
                    </button>
                  </article>
                ))}
              {!state.lessons.length && <p>Nenhuma aula preparada ainda.</p>}
            </div>
            {state.lessons
              .filter((lesson) => lesson.id === selectedLessonId)
              .map((lesson) => (
                <article
                  key={lesson.id}
                  className={styles.guildAdminDetail}
                  aria-label="Detalhe da aula"
                >
                  <h3>{lesson.title}</h3>
                  <p>
                    {lesson.theme} · {lesson.bible_reference}
                  </p>
                  {lesson.bible_url && (
                    <a
                      href={lesson.bible_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir passagem bíblica ↗
                    </a>
                  )}
                  <p>{lesson.introduction}</p>
                  <p>{lesson.content}</p>
                  {Array.isArray(lesson.main_points) &&
                    lesson.main_points.length > 0 && (
                      <>
                        <h4>Pontos principais</h4>
                        <ul>
                          {lesson.main_points.map((point, index) => (
                            <li key={index}>{String(point)}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  {Array.isArray(lesson.discussion_questions) &&
                    lesson.discussion_questions.length > 0 && (
                      <>
                        <h4>Perguntas para discussão</h4>
                        <ul>
                          {lesson.discussion_questions.map(
                            (question, index) => (
                              <li key={index}>{String(question)}</li>
                            ),
                          )}
                        </ul>
                      </>
                    )}
                  {lesson.activity_text && (
                    <p>Atividade: {lesson.activity_text}</p>
                  )}
                  {lesson.related_mission_id && (
                    <p>
                      Missão relacionada:{' '}
                      {state.missions.find(
                        (mission) => mission.id === lesson.related_mission_id,
                      )?.title ?? 'Missão da Guilda'}
                    </p>
                  )}
                  <div className={styles.guildAdminActions}>
                    {lesson.status === 'draft' && (
                      <button
                        onClick={() => {
                          editLesson(lesson);
                          setSelectedLessonId(null);
                        }}
                      >
                        Editar rascunho
                      </button>
                    )}
                    {lesson.status === 'published' && (
                      <>
                        <button
                          onClick={() =>
                            void act(
                              () =>
                                guildLessonRepository.setStatus(
                                  lesson.id,
                                  traveler.id,
                                  'completed',
                                ),
                              'Aula marcada como realizada.',
                            )
                          }
                        >
                          Marcar realizada
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Cancelar esta aula?'))
                              void act(
                                () =>
                                  guildLessonRepository.setStatus(
                                    lesson.id,
                                    traveler.id,
                                    'cancelled',
                                  ),
                                'Aula cancelada.',
                              );
                          }}
                        >
                          Cancelar aula
                        </button>
                      </>
                    )}
                    <button onClick={() => setSelectedLessonId(null)}>
                      Fechar
                    </button>
                  </div>
                </article>
              ))}
          </section>
        )}
        {adminTab === 'content' && contentTab === 'challenges' && (
          <section className={styles.guildAdminSection}>
            <h2>Desafios</h2>
            <p>
              Nos desafios coletivos, a meta é todos os membros ativos
              concluírem a atividade. A recompensa individual segue o tier
              central; não há prêmio coletivo extra.
            </p>
            <button
              className={styles.primaryLink}
              onClick={() => {
                startCreate();
                setMissionForm({
                  ...emptyMissionForm(),
                  missionType: 'collective_challenge',
                });
              }}
            >
              + Criar desafio coletivo
            </button>
            <div className={styles.guildAdminMissionList}>
              {state.missions
                .filter((mission) =>
                  [
                    'individual_challenge',
                    'collective_challenge',
                    'special_mission',
                    'journey_gate',
                  ].includes(mission.mission_type),
                )
                .map((mission) => (
                  <article
                    key={mission.id}
                    className={styles.guildAdminMissionCard}
                  >
                    <span className={styles.guildAdminChip}>
                      {mission.mission_type === 'journey_gate'
                        ? 'Desafio de Jornada'
                        : mission.mission_type === 'collective_challenge'
                          ? 'Coletivo'
                          : 'Desafio'}
                    </span>
                    <h3>{mission.title}</h3>
                    <p>
                      {mission.mission_type === 'collective_challenge'
                        ? `${Number(statsById.get(mission.id)?.completed ?? 0)} / ${state.members.filter((member) => member.member_status === 'active').length} membros concluíram`
                        : `${Number(statsById.get(mission.id)?.completed ?? 0)} concluídos`}{' '}
                      · {Number(statsById.get(mission.id)?.pending ?? 0)}{' '}
                      aguardam validação
                    </p>
                    <GuildRewardDetails
                      tier={mission.reward_tier as GuildRewardTier}
                    />
                    <button
                      onClick={() => {
                        setContentTab('missions');
                        showDetails(mission);
                      }}
                    >
                      Ver desafio →
                    </button>
                  </article>
                ))}
              {!state.missions.some((mission) =>
                [
                  'individual_challenge',
                  'collective_challenge',
                  'special_mission',
                  'journey_gate',
                ].includes(mission.mission_type),
              ) && <p>Nenhum desafio criado.</p>}
            </div>
          </section>
        )}
        {adminTab === 'approvals' && (
          <section className={styles.guildAdminSection}>
            <h2>
              Aprovações <small>{pendingCount} pendentes</small>
            </h2>
            <div className={styles.guildAdminInbox}>
              <div className={styles.guildAdminInboxList}>
                {approvalItems.map(({ mission, item, key }) => (
                  <button
                    key={key}
                    aria-pressed={selectedApprovalItem?.key === key}
                    onClick={() => setSelectedApproval(key)}
                  >
                    <b>{item.traveler_name}</b>
                    <span>
                      {mission.mission_type === 'journey_gate' && (
                        <em>Desafio de Jornada · </em>
                      )}
                      {mission.title}
                    </span>
                    <small>
                      {item.submitted_at
                        ? new Date(item.submitted_at).toLocaleString('pt-BR')
                        : ''}
                    </small>
                    <strong>Revisar →</strong>
                  </button>
                ))}
                {!approvalItems.length && (
                  <p>Tudo certo por aqui. Nenhuma missão aguarda revisão.</p>
                )}
              </div>
              {selectedApprovalItem && (
                <article
                  className={styles.guildAdminApprovalDetail}
                  aria-label="Detalhe da aprovação"
                >
                  <p className={styles.eyebrow}>
                    {selectedApprovalItem.mission.mission_type ===
                    'journey_gate'
                      ? 'DESAFIO DE JORNADA'
                      : 'REVISÃO DE MISSÃO'}
                  </p>
                  <h3>{selectedApprovalItem.item.traveler_name}</h3>
                  <p>Missão: {selectedApprovalItem.mission.title}</p>
                  <p>
                    Enviado em{' '}
                    {selectedApprovalItem.item.submitted_at
                      ? new Date(
                          selectedApprovalItem.item.submitted_at,
                        ).toLocaleString('pt-BR')
                      : 'data indisponível'}
                  </p>
                  <p>
                    {selectedApprovalItem.mission.description ??
                      'Atividade da Guilda.'}
                  </p>
                  <p>
                    Nota objetiva:{' '}
                    {selectedApprovalItem.item.completion_note ||
                      'Sem nota de conclusão.'}
                  </p>
                  <div className={styles.guildAdminReward}>
                    <b>
                      Ao aprovar, {selectedApprovalItem.item.traveler_name}{' '}
                      receberá:
                    </b>
                    <GuildRewardDetails
                      tier={
                        selectedApprovalItem.mission
                          .reward_tier as GuildRewardTier
                      }
                    />
                  </div>
                  <label>
                    Orientação para nova tentativa (opcional)
                    <textarea
                      maxLength={500}
                      value={guidance[selectedApprovalItem.key] ?? ''}
                      onChange={(event) =>
                        setGuidance((old) => ({
                          ...old,
                          [selectedApprovalItem.key]: event.target.value,
                        }))
                      }
                      placeholder="Oriente sobre a atividade, sem avaliar espiritualidade."
                    />
                  </label>
                  <div className={styles.guildAdminActions}>
                    <button
                      className={styles.primaryLink}
                      disabled={reviewing}
                      onClick={() => void reviewApproval(true)}
                    >
                      Aprovar
                    </button>
                    <button
                      disabled={reviewing}
                      onClick={() => void reviewApproval(false)}
                    >
                      Solicitar nova tentativa
                    </button>
                  </div>
                </article>
              )}
            </div>
          </section>
        )}
        {adminTab === 'members' && (
          <section className={styles.guildAdminSection}>
            <h2>Membros</h2>
            <div className={styles.guildMemberList}>
              {state.members.map((member) => (
                <article
                  key={member.traveler_id}
                  className={styles.guildAdminMember}
                >
                  <span className={styles.guildAdminAvatar} aria-hidden="true">
                    {member.traveler_name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <b>{member.traveler_name}</b>
                    <span>
                      {member.role === 'leader'
                        ? 'Líder'
                        : member.role === 'co_leader'
                          ? 'Co-líder'
                          : member.role === 'moderator'
                            ? 'Moderador'
                            : 'Membro'}{' '}
                      · {member.member_status}
                    </span>
                    <small>
                      Entrou em{' '}
                      {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                    </small>
                  </div>
                  <details>
                    <summary aria-label={`Ações para ${member.traveler_name}`}>
                      ⋯
                    </summary>
                    <button
                      onClick={() => {
                        setSelectedMemberId(member.traveler_id);
                        setSelectedMemberProfile(null);
                        void guildAdminRepository
                          .publicMemberProfile(traveler.id, member.traveler_id)
                          .then(setSelectedMemberProfile)
                          .catch(() =>
                            setFeedback(
                              'Não foi possível carregar o perfil público.',
                            ),
                          );
                      }}
                    >
                      Ver perfil público
                    </button>
                    {member.role === 'member' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Remover este membro da Guilda?'))
                            void act(
                              () =>
                                guildRepository.removeMember(
                                  member.traveler_id,
                                  traveler.id,
                                ),
                              'Membro removido da Guilda.',
                            );
                        }}
                      >
                        Remover da Guilda
                      </button>
                    )}
                  </details>
                </article>
              ))}
            </div>
            {state.members
              .filter((member) => member.traveler_id === selectedMemberId)
              .map((member) => (
                <article
                  key={member.traveler_id}
                  className={styles.guildAdminDetail}
                  aria-label="Perfil público do membro"
                >
                  <span className={styles.guildAdminAvatar} aria-hidden="true">
                    {member.traveler_name.slice(0, 1).toUpperCase()}
                  </span>
                  <h3>{member.traveler_name}</h3>
                  <p>
                    {member.role === 'leader' ? 'Líder' : 'Membro'} ·{' '}
                    {member.member_status}
                  </p>
                  {selectedMemberProfile ? (
                    <p>
                      Nível {selectedMemberProfile.level} ·{' '}
                      {selectedMemberProfile.completed_missions} missões
                      concluídas na Guilda.
                    </p>
                  ) : (
                    <p>Carregando participação...</p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedMemberId(null);
                      setSelectedMemberProfile(null);
                    }}
                  >
                    Fechar perfil
                  </button>
                </article>
              ))}
            <section className={styles.guildAdminRequests}>
              <h3>Pedidos de entrada</h3>
              {pendingRequests.map((request) => (
                <article
                  className={styles.guildRequestCard}
                  key={request.request_id}
                >
                  <b>{request.traveler_name}</b>
                  <div className={styles.guildAdminActions}>
                    <button
                      onClick={() =>
                        void act(
                          () =>
                            guildRepository.reviewJoinRequest(
                              request.request_id,
                              traveler.id,
                              true,
                            ),
                          'Membro aceito.',
                        )
                      }
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() =>
                        void act(
                          () =>
                            guildRepository.reviewJoinRequest(
                              request.request_id,
                              traveler.id,
                              false,
                            ),
                          'Pedido rejeitado.',
                        )
                      }
                    >
                      Recusar
                    </button>
                  </div>
                </article>
              ))}
              {!pendingRequests.length && <p>Nenhum pedido pendente.</p>}
            </section>
          </section>
        )}
        {adminTab === 'agenda' && (
          <section className={styles.guildAdminSection}>
            <h2>Agenda da Guilda</h2>
            <p>Aulas e datas de missões publicadas.</p>
            <div className={styles.guildAdminTimeline}>
              {agendaEvents.map((event) => (
                <article key={event.id}>
                  <time dateTime={event.date}>
                    {new Date(event.date).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </time>
                  <span>{event.label}</span>
                  <span className={styles.guildAdminChip}>
                    {event.type === 'lesson' ? 'Aula' : 'Missão'}
                  </span>
                </article>
              ))}
              {!agendaEvents.length && <p>Nenhuma data agendada.</p>}
            </div>
          </section>
        )}
        {adminTab === 'history' && (
          <section className={styles.guildAdminSection}>
            <h2>Histórico</h2>
            <label>
              Filtrar eventos
              <select
                value={historyFilter}
                onChange={(event) => setHistoryFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="mission">Missões</option>
                <option value="member">Membros</option>
                <option value="approval">Aprovações</option>
                <option value="reward">Recompensas</option>
                <option value="lesson">Aulas</option>
              </select>
            </label>
            {state.history
              .filter(
                (event) =>
                  historyFilter === 'all' ||
                  (historyFilter === 'approval'
                    ? [
                        'mission_submitted',
                        'mission_completed',
                        'mission_rejected',
                      ].includes(event.event_type)
                    : historyFilter === 'reward'
                      ? event.event_type === 'reward_processed'
                      : historyFilter === 'member'
                        ? event.entity_type === 'member' ||
                          event.event_type.startsWith('member_')
                        : event.entity_type === historyFilter),
              )
              .map((event) => (
                <article className={styles.guildAdminHistory} key={event.id}>
                  <time dateTime={event.created_at}>
                    {new Date(event.created_at).toLocaleString('pt-BR')}
                  </time>
                  <b>{describeEvent(event)}</b>
                </article>
              ))}
            {!state.history.length && (
              <p>As atividades da Guilda aparecerão aqui.</p>
            )}
            {state.history.length >= historyLimit && (
              <button
                onClick={() =>
                  void guildAdminRepository
                    .history(context.guild.id, historyLimit)
                    .then((next) => {
                      setState((old) => ({
                        ...old,
                        history: [...old.history, ...next],
                      }));
                      setHistoryLimit((old) => old + 20);
                    })
                    .catch(() =>
                      setFeedback('Não foi possível carregar mais atividades.'),
                    )
                }
              >
                Carregar mais
              </button>
            )}
          </section>
        )}
      </GuildHall>
    );
  }

  return (
    <GuildHall className={styles.guildHub}>
      <GuildHero
        name={context.guild.name}
        leader={leaderName}
        description={
          context.guild.description ||
          'Uma comunidade de Viajantes que coopera em cada missão.'
        }
        participation={
          isLeader ? 'Líder da comunidade' : 'Membro da comunidade'
        }
        available={
          missionGroups.available.length +
          missionGroups.started.length +
          missionGroups.rejected.length
        }
        pending={missionGroups.pending.length}
        completed={missionGroups.completed.length}
      >
        <span className={styles.guildRoleBadge}>
          {isLeader ? 'Líder' : 'Membro'} · {state.members.length}{' '}
          {state.members.length === 1 ? 'membro' : 'membros'}
        </span>
        <small>
          ID para pedidos de entrada: <code>{context.guild.id}</code>
        </small>
        {isLeader && (
          <Link className={styles.primaryLink} href="/journey/guild/manage">
            Gerenciar Guilda
          </Link>
        )}
      </GuildHero>
      <nav className={styles.guildTabs} aria-label="Seções da Guilda">
        <button
          onClick={() => setTab('overview')}
          aria-pressed={tab === 'overview'}
        >
          Visão geral
        </button>
        <button
          onClick={() => setTab('missions')}
          aria-pressed={tab === 'missions'}
        >
          Missões
        </button>
        <button
          onClick={() => setTab('lessons')}
          aria-pressed={tab === 'lessons'}
        >
          Aulas
        </button>
        {!isLeader && (
          <button
            onClick={() => setTab('history')}
            aria-pressed={tab === 'history'}
          >
            Histórico
          </button>
        )}
        <button
          onClick={() => setTab('members')}
          aria-pressed={tab === 'members'}
        >
          Membros
        </button>
      </nav>
      <GuildChat guildId={context.guild.id} travelerId={traveler.id} />
      <p role="status" aria-live="polite">
        {feedback}
      </p>

      {tab === 'overview' && (
        <div className={styles.guildOnboardingGrid}>
          <section className={styles.guildChallengePanel}>
            <h2>Resumo</h2>
            <p>
              {
                state.missions.filter((item) =>
                  isLeader
                    ? item.status === 'published'
                    : playerMissionSection(
                        item,
                        ownProgress.get(item.id)?.status,
                        now,
                      ) === 'available',
                ).length
              }{' '}
              {isLeader
                ? 'Missões publicadas'
                : 'missões disponíveis para você'}
            </p>
            <p>
              {missionGroups.pending.length} aguardando{' '}
              {isLeader ? 'sua aprovação' : 'aprovação do líder'}
            </p>
            {!isLeader && (
              <button
                className={styles.primaryLink}
                onClick={() => setTab('missions')}
              >
                Ver minhas missões →
              </button>
            )}
            <p>Recompensas são calculadas e processadas pelo sistema.</p>
          </section>
          <section className={styles.guildChallengePanel}>
            <h2>Privacidade</h2>
            <p>
              O líder vê apenas nome do Viajante, status e nota objetiva da
              Missão. E-mail, conta, Diário e reflexões privadas não são
              compartilhados.
            </p>
          </section>
          {state.lessons.find(
            (lesson) => lesson.status === 'published' && lesson.scheduled_at,
          ) && (
            <section className={styles.guildChallengePanel}>
              <h2>Próxima aula</h2>
              {state.lessons
                .filter(
                  (lesson) =>
                    lesson.status === 'published' && lesson.scheduled_at,
                )
                .slice(0, 1)
                .map((lesson) => (
                  <div key={lesson.id}>
                    <h3>{lesson.title}</h3>
                    <p>
                      {lesson.theme} · {lesson.bible_reference}
                    </p>
                    <p>
                      {new Date(lesson.scheduled_at!).toLocaleString('pt-BR')}
                    </p>
                    <button
                      onClick={() => {
                        setTab('lessons');
                        setSelectedLessonId(lesson.id);
                      }}
                    >
                      Ver aula →
                    </button>
                  </div>
                ))}
            </section>
          )}
        </div>
      )}

      {tab === 'lessons' && (
        <section className={styles.guildChallengePanel}>
          <h2>Aulas</h2>
          <div className={styles.guildAdminMissionList}>
            {state.lessons
              .filter((lesson) =>
                ['published', 'completed'].includes(lesson.status),
              )
              .map((lesson) => (
                <article
                  key={lesson.id}
                  className={styles.guildAdminMissionCard}
                >
                  <span className={styles.guildAdminChip}>
                    {lesson.status === 'completed'
                      ? 'Realizada'
                      : 'Próxima aula'}
                  </span>
                  <h3>{lesson.title}</h3>
                  <p>
                    {lesson.theme} · {lesson.bible_reference}
                  </p>
                  <p>
                    {lesson.scheduled_at
                      ? new Date(lesson.scheduled_at).toLocaleString('pt-BR')
                      : 'Data a definir'}
                  </p>
                  <button onClick={() => setSelectedLessonId(lesson.id)}>
                    Ver aula →
                  </button>
                </article>
              ))}
            {!state.lessons.some((lesson) =>
              ['published', 'completed'].includes(lesson.status),
            ) && <p>Nenhuma aula publicada ainda.</p>}
          </div>
          {state.lessons
            .filter(
              (lesson) =>
                lesson.id === selectedLessonId &&
                ['published', 'completed'].includes(lesson.status),
            )
            .map((lesson) => (
              <article key={lesson.id} className={styles.guildAdminDetail}>
                <h3>{lesson.title}</h3>
                <p>
                  {lesson.theme} · {lesson.bible_reference}
                </p>
                {lesson.bible_url && (
                  <a
                    href={lesson.bible_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir passagem bíblica ↗
                  </a>
                )}
                <p>{lesson.introduction}</p>
                <p>{lesson.content}</p>
                {Array.isArray(lesson.main_points) &&
                  lesson.main_points.length > 0 && (
                    <>
                      <h4>Pontos principais</h4>
                      <ul>
                        {lesson.main_points.map((point, index) => (
                          <li key={index}>{String(point)}</li>
                        ))}
                      </ul>
                    </>
                  )}
                {Array.isArray(lesson.discussion_questions) &&
                  lesson.discussion_questions.length > 0 && (
                    <>
                      <h4>Perguntas para discussão</h4>
                      <ul>
                        {lesson.discussion_questions.map((question, index) => (
                          <li key={index}>{String(question)}</li>
                        ))}
                      </ul>
                    </>
                  )}
                {lesson.activity_text && (
                  <p>Atividade: {lesson.activity_text}</p>
                )}
                <button onClick={() => setSelectedLessonId(null)}>
                  Fechar
                </button>
              </article>
            ))}
        </section>
      )}

      {tab === 'members' && (
        <section className={styles.guildChallengePanel}>
          <h2>Membros</h2>
          <div className={styles.guildMemberList}>
            {state.members.map((member) => (
              <article key={member.traveler_id}>
                <b>{member.traveler_name}</b>
                <span>
                  {member.role === 'leader' ? 'Líder' : 'Membro'} ·{' '}
                  {member.member_status}
                </span>
              </article>
            ))}
          </div>
          {isLeader && (
            <>
              <h3>Pedidos pendentes</h3>
              {pendingRequests.map((request) => (
                <article
                  className={styles.guildRequestCard}
                  key={request.request_id}
                >
                  <div>
                    <b>{request.traveler_name}</b>
                    <small>
                      {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    </small>
                  </div>
                  <div>
                    <button
                      onClick={() =>
                        void act(
                          () =>
                            guildRepository.reviewJoinRequest(
                              request.request_id,
                              traveler.id,
                              true,
                            ),
                          'Membro aceito.',
                        )
                      }
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() =>
                        void act(
                          () =>
                            guildRepository.reviewJoinRequest(
                              request.request_id,
                              traveler.id,
                              false,
                            ),
                          'Pedido rejeitado.',
                        )
                      }
                    >
                      Rejeitar
                    </button>
                  </div>
                </article>
              ))}
              {!pendingRequests.length && <p>Nenhum pedido pendente.</p>}
            </>
          )}
        </section>
      )}

      {(tab === 'missions' || tab === 'history') && (
        <>
          {tab === 'missions' && (
            <>
              {isLeader && (
                <MissionCreator
                  travelerId={traveler.id}
                  value={missionForm}
                  onChange={setMissionForm}
                  onSave={(publish) =>
                    void act(
                      () =>
                        guildMissionRepository.create({
                          ...missionForm,
                          travelerId: traveler.id,
                          publish,
                        }),
                      publish ? 'Missão publicada.' : 'Rascunho salvo.',
                    )
                  }
                />
              )}
              <MissionSection
                title={isLeader ? 'Missões da Guilda' : 'Disponíveis'}
                missions={isLeader ? state.missions : missionGroups.available}
                render={(mission) => (
                  <MissionCard
                    key={mission.id}
                    now={now}
                    mission={mission}
                    progress={ownProgress.get(mission.id)}
                    isLeader={isLeader}
                    note={notes[mission.id] ?? ''}
                    setNote={(value) =>
                      setNotes((current) => ({
                        ...current,
                        [mission.id]: value,
                      }))
                    }
                    onAction={(operation, message, refreshReward) =>
                      void act(operation, message, refreshReward)
                    }
                    travelerId={traveler.id}
                    leaderProgress={state.missionProgress[mission.id] ?? []}
                  />
                )}
              />
              {!isLeader && (
                <>
                  <MissionSection
                    title="Em andamento"
                    missions={missionGroups.started}
                    render={(mission) => (
                      <MissionCard
                        key={mission.id}
                        now={now}
                        mission={mission}
                        progress={ownProgress.get(mission.id)}
                        isLeader={false}
                        note={notes[mission.id] ?? ''}
                        setNote={(value) =>
                          setNotes((current) => ({
                            ...current,
                            [mission.id]: value,
                          }))
                        }
                        onAction={(operation, message, refreshReward) =>
                          void act(operation, message, refreshReward)
                        }
                        travelerId={traveler.id}
                        leaderProgress={[]}
                      />
                    )}
                  />
                  <MissionSection
                    title="Aguardando aprovação"
                    missions={missionGroups.pending}
                    render={(mission) => (
                      <MissionCard
                        key={mission.id}
                        now={now}
                        mission={mission}
                        progress={ownProgress.get(mission.id)}
                        isLeader={false}
                        note=""
                        setNote={() => undefined}
                        onAction={() => undefined}
                        travelerId={traveler.id}
                        leaderProgress={[]}
                      />
                    )}
                  />
                  <MissionSection
                    title="Nova tentativa solicitada"
                    missions={missionGroups.rejected}
                    render={(mission) => (
                      <MissionCard
                        key={mission.id}
                        now={now}
                        mission={mission}
                        progress={ownProgress.get(mission.id)}
                        isLeader={false}
                        note=""
                        setNote={() => undefined}
                        onAction={(operation, message, refreshReward) =>
                          void act(operation, message, refreshReward)
                        }
                        travelerId={traveler.id}
                        leaderProgress={[]}
                      />
                    )}
                  />
                </>
              )}
            </>
          )}
          {tab === 'history' && (
            <MissionSection
              title="Histórico"
              missions={missionGroups.completed}
              render={(mission) => (
                <MissionCard
                  key={mission.id}
                  now={now}
                  mission={mission}
                  progress={ownProgress.get(mission.id)}
                  isLeader={false}
                  note=""
                  setNote={() => undefined}
                  onAction={() => undefined}
                  travelerId={traveler.id}
                  leaderProgress={[]}
                />
              )}
            />
          )}
        </>
      )}
    </GuildHall>
  );
}

function MissionCreator({
  travelerId,
  value,
  onChange,
  onSave,
  heading = 'Criar Missão',
}: {
  travelerId: string;
  value: Omit<CreateGuildMissionInput, 'travelerId' | 'publish'>;
  onChange: (
    value: Omit<CreateGuildMissionInput, 'travelerId' | 'publish'>,
  ) => void;
  onSave: (publish: boolean) => void;
  heading?: string;
}) {
  void travelerId;
  const [step, setStep] = useState(1);
  const set = <K extends keyof typeof value>(key: K, next: (typeof value)[K]) =>
    onChange({ ...value, [key]: next });
  const chooseTemplate = (template: string) => {
    const templates: Record<string, Partial<typeof value>> = {
      reading: {
        title: 'Leitura Bíblica',
        description: 'Leia a passagem indicada e conclua a atividade.',
        missionType: 'bible_reading',
        completionMode: 'self_complete',
      },
      weekly: {
        title: 'Desafio da Semana',
        description: 'Realize a atividade prática durante esta semana.',
        missionType: 'individual_challenge',
      },
      practice: {
        title: 'Atividade Prática',
        description: 'Conclua a atividade combinada com a célula.',
        missionType: 'practical_activity',
      },
      quiz: {
        title: 'Quiz / Estudo',
        description: 'Revise o conteúdo e responda ao estudo.',
        missionType: 'quiz',
      },
      special: {
        title: 'Missão Especial',
        description: 'Participe da missão especial da Guilda.',
        missionType: 'special_mission',
      },
      collective: {
        title: 'Desafio Coletivo',
        description: 'Concluam esta atividade em conjunto como Guilda.',
        missionType: 'collective_challenge',
      },
    };
    if (templates[template])
      onChange({
        ...value,
        ...templates[template],
        rewardTier: value.rewardTier,
      });
  };
  const submit = (event: FormEvent, publish: boolean) => {
    event.preventDefault();
    if (value.title.trim().length >= 2) onSave(publish);
  };
  return (
    <form
      className={styles.guildAdminWizard}
      onSubmit={(event) => submit(event, true)}
    >
      <h2>{heading}</h2>
      <p className={styles.eyebrow}>Etapa {step} de 5</p>
      <progress value={step} max={5} aria-label={`Etapa ${step} de 5`} />
      {step === 1 && (
        <>
          <label>
            Começar com um modelo
            <select
              defaultValue=""
              onChange={(event) => chooseTemplate(event.target.value)}
            >
              <option value="">Em branco</option>
              <option value="reading">Leitura Bíblica</option>
              <option value="weekly">Desafio da Semana</option>
              <option value="practice">Atividade Prática</option>
              <option value="quiz">Quiz / Estudo</option>
              <option value="special">Missão Especial</option>
              <option value="collective">Desafio Coletivo</option>
            </select>
          </label>
          <label>
            Título *
            <input
              required
              minLength={2}
              maxLength={100}
              value={value.title}
              onChange={(event) => set('title', event.target.value)}
            />
          </label>
          <label>
            Descrição
            <textarea
              maxLength={1000}
              value={value.description}
              onChange={(event) => set('description', event.target.value)}
            />
          </label>
          <label>
            Tipo *
            <select
              value={value.missionType}
              onChange={(event) =>
                set('missionType', event.target.value as GuildMissionType)
              }
            >
              {Object.entries(missionTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {step === 2 && (
        <>
          <label>
            Referência bíblica opcional
            <input
              maxLength={100}
              value={value.bibleReference}
              onChange={(event) => set('bibleReference', event.target.value)}
            />
          </label>
          <label>
            URL da Bíblia opcional
            <input
              type="url"
              pattern="https://www\.bible\.com/.*"
              value={value.bibleUrl}
              onChange={(event) => set('bibleUrl', event.target.value)}
            />
          </label>
        </>
      )}
      {step === 3 && (
        <>
          <label>
            Forma de conclusão
            <select
              value={value.completionMode}
              onChange={(event) =>
                set('completionMode', event.target.value as GuildCompletionMode)
              }
            >
              <option value="self_complete">Conclusão direta</option>
              <option value="leader_approval">Aprovação do líder</option>
            </select>
          </label>
        </>
      )}
      {step === 4 && (
        <>
          <label>
            Recompensa
            <select
              value={value.rewardTier}
              onChange={(event) =>
                set('rewardTier', event.target.value as GuildRewardTier)
              }
            >
              {Object.keys(guildMissionRewards).map((tier) => (
                <option key={tier} value={tier}>
                  {guildRewardTierLabels[tier as GuildRewardTier]}
                </option>
              ))}
            </select>
          </label>
          <GuildRewardPreview tier={value.rewardTier} />
        </>
      )}
      {step === 5 && (
        <>
          <label>
            Início opcional
            <input
              type="datetime-local"
              value={value.startsAt}
              onChange={(event) => set('startsAt', event.target.value)}
            />
          </label>
          <label>
            Prazo opcional
            <input
              type="datetime-local"
              value={value.dueAt}
              onChange={(event) => set('dueAt', event.target.value)}
            />
          </label>
        </>
      )}
      <div className={styles.guildAdminWizardActions}>
        {step > 1 && (
          <button type="button" onClick={() => setStep(step - 1)}>
            Voltar
          </button>
        )}
        <button
          type="button"
          disabled={value.title.trim().length < 2}
          onClick={() => onSave(false)}
        >
          Salvar rascunho
        </button>
        {step < 5 ? (
          <button
            type="button"
            disabled={step === 1 && value.title.trim().length < 2}
            onClick={() => setStep(step + 1)}
          >
            Continuar
          </button>
        ) : (
          <button type="submit">Publicar missão</button>
        )}
      </div>
    </form>
  );
}

function LessonCreator({
  value,
  onChange,
  onSave,
  onCancel,
  missions,
  heading,
}: {
  value: LessonForm;
  onChange: (value: LessonForm) => void;
  onSave: (publish: boolean) => void;
  onCancel: () => void;
  missions: GuildMissionRow[];
  heading: string;
}) {
  const [step, setStep] = useState(1);
  const set = (key: keyof LessonForm, next: string) =>
    onChange({ ...value, [key]: next });
  const canSave =
    value.title.trim().length >= 2 &&
    value.theme.trim().length >= 2 &&
    value.bibleReference.trim().length >= 2;
  const canContinue =
    step === 1
      ? value.title.trim().length >= 2 && value.theme.trim().length >= 2
      : step === 2
        ? value.bibleReference.trim().length >= 2
        : step === 3
          ? value.content.trim().length > 0
          : true;
  return (
    <form
      className={styles.guildAdminWizard}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave && value.content.trim() && value.scheduledAt) onSave(true);
      }}
    >
      <p className={styles.eyebrow}>
        {heading} · {step} de 6
      </p>
      <progress value={step} max={6} aria-label={`Etapa ${step} de 6`} />
      {step === 1 && (
        <>
          <h3>Título e tema</h3>
          <label>
            Título *
            <input
              required
              minLength={2}
              maxLength={100}
              value={value.title}
              onChange={(event) => set('title', event.target.value)}
            />
          </label>
          <label>
            Tema *
            <input
              required
              minLength={2}
              maxLength={100}
              value={value.theme}
              onChange={(event) => set('theme', event.target.value)}
            />
          </label>
        </>
      )}
      {step === 2 && (
        <>
          <h3>Passagem bíblica</h3>
          <label>
            Passagem *
            <input
              required
              minLength={2}
              maxLength={100}
              value={value.bibleReference}
              onChange={(event) => set('bibleReference', event.target.value)}
            />
          </label>
          <label>
            URL da Bíblia (opcional)
            <input
              type="url"
              pattern="https://www\.bible\.com/.*"
              value={value.bibleUrl}
              onChange={(event) => set('bibleUrl', event.target.value)}
            />
          </label>
        </>
      )}
      {step === 3 && (
        <>
          <h3>Conteúdo</h3>
          <label>
            Introdução
            <textarea
              maxLength={2000}
              value={value.introduction}
              onChange={(event) => set('introduction', event.target.value)}
            />
          </label>
          <label>
            Conteúdo principal *
            <textarea
              required
              maxLength={10000}
              value={value.content}
              onChange={(event) => set('content', event.target.value)}
            />
          </label>
          <label>
            Pontos principais, um por linha
            <textarea
              maxLength={3600}
              value={value.mainPoints}
              onChange={(event) => set('mainPoints', event.target.value)}
            />
          </label>
        </>
      )}
      {step === 4 && (
        <>
          <h3>Perguntas para discussão</h3>
          <p>
            Use perguntas sobre o conteúdo da aula. Não peça orações, confissões
            ou avaliações pessoais.
          </p>
          <label>
            Perguntas, uma por linha
            <textarea
              maxLength={3600}
              value={value.discussionQuestions}
              onChange={(event) =>
                set('discussionQuestions', event.target.value)
              }
            />
          </label>
        </>
      )}
      {step === 5 && (
        <>
          <h3>Atividade opcional</h3>
          <label>
            Atividade
            <textarea
              maxLength={2000}
              value={value.activityText}
              onChange={(event) => set('activityText', event.target.value)}
            />
          </label>
          <label>
            Missão relacionada
            <select
              value={value.relatedMissionId}
              onChange={(event) => set('relatedMissionId', event.target.value)}
            >
              <option value="">Nenhuma</option>
              {missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.title}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {step === 6 && (
        <>
          <h3>Data e publicação</h3>
          <label>
            Data da aula *
            <input
              required
              type="datetime-local"
              value={value.scheduledAt}
              onChange={(event) => set('scheduledAt', event.target.value)}
            />
          </label>
          <p>
            <b>{value.title || 'Nova aula'}</b> ·{' '}
            {value.bibleReference || 'Passagem a definir'}
          </p>
          <p>Ao publicar, os membros da Guilda poderão ler esta aula.</p>
        </>
      )}
      <div className={styles.guildAdminWizardActions}>
        <button
          type="button"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
        >
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </button>
        <button type="button" disabled={!canSave} onClick={() => onSave(false)}>
          Salvar rascunho
        </button>
        {step < 6 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep(step + 1)}
          >
            Continuar
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSave || !value.content.trim() || !value.scheduledAt}
          >
            Publicar aula
          </button>
        )}
      </div>
    </form>
  );
}

function MissionSection({
  title,
  missions,
  render,
}: {
  title: string;
  missions: GuildMissionRow[];
  render: (mission: GuildMissionRow) => React.ReactNode;
}) {
  return (
    <section className={styles.guildChallengePanel}>
      <h2>{title}</h2>
      <div className={styles.guildSpecialGrid}>
        {missions.map(render)}
        {!missions.length &&
          (title === 'Disponíveis' ? (
            <div className={styles.guildEmpty}>
              <span aria-hidden="true">✦</span>
              <h3>Tudo concluído por enquanto.</h3>
              <p>Novas missões da sua célula aparecerão aqui.</p>
            </div>
          ) : (
            <p>
              {title === 'Histórico'
                ? 'Suas missões concluídas serão guardadas aqui.'
                : 'Nenhuma missão nesta seção.'}
            </p>
          ))}
      </div>
    </section>
  );
}

function MissionCard({
  now,
  mission,
  progress,
  isLeader,
  note,
  setNote,
  onAction,
  travelerId,
  leaderProgress,
}: {
  now: number;
  mission: GuildMissionRow;
  progress?: GuildMissionProgressRow;
  isLeader: boolean;
  note: string;
  setNote: (value: string) => void;
  onAction: (
    operation: () => Promise<unknown>,
    message: string,
    refreshReward?: boolean,
  ) => void;
  travelerId: string;
  leaderProgress: GuildMissionProgressSummary[];
}) {
  const expired = Boolean(mission.due_at && Date.parse(mission.due_at) <= now);
  const rewardTier = mission.reward_tier as GuildRewardTier;
  const pending = leaderProgress.filter(
    (item) => item.progress_status === 'pending_approval',
  );
  return (
    <article
      className={styles.guildSpecialCard}
      data-special={['epic', 'extraordinary'].includes(rewardTier)}
    >
      <GuildArtwork slot="guildMissionParchment" className={hall.parchment} />
      <span>
        {missionTypeLabels[mission.mission_type as GuildMissionType]} ·{' '}
        {guildStatusLabel(mission.status)}
      </span>
      <h3>{mission.title}</h3>
      {mission.description && (
        <p className={hall.excerpt}>{mission.description}</p>
      )}
      <details>
        <summary>Ver missão</summary>
        {mission.description && <p>{mission.description}</p>}
        {mission.bible_reference && (
          <p>Referência: {mission.bible_reference}</p>
        )}
        {mission.bible_url && (
          <a href={mission.bible_url} target="_blank" rel="noopener noreferrer">
            Abrir na Bíblia ↗
          </a>
        )}
      </details>
      {mission.due_at && (
        <p>Prazo: {new Date(mission.due_at).toLocaleString('pt-BR')}</p>
      )}
      <GuildRewardDetails
        tier={rewardTier}
        showChest={
          ['epic', 'extraordinary'].includes(rewardTier) ||
          progress?.status === 'completed'
        }
      />
      {expired && <p className={styles.guildWarning}>Missão expirada.</p>}
      <b className={hall.status}>
        {expired &&
        progress?.status !== 'completed' &&
        progress?.status !== 'pending_approval'
          ? 'EXPIRADA'
          : progress
            ? (progressLabels[progress.status] ?? progress.status)
            : 'DISPONÍVEL'}
      </b>
      {!isLeader &&
        missionIsPlayable(mission, now) &&
        (!progress ||
          progress.status === 'available' ||
          progress.status === 'rejected') && (
          <button
            onClick={() =>
              onAction(
                () => guildMissionRepository.start(mission.id, travelerId),
                'Missão iniciada.',
              )
            }
          >
            {progress?.status === 'rejected'
              ? 'Iniciar nova tentativa'
              : 'Iniciar Missão'}
          </button>
        )}
      {!isLeader &&
        missionIsPlayable(mission, now) &&
        progress?.status === 'started' && (
          <>
            <label>
              Nota objetiva opcional
              <textarea
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Registre somente informação ligada à atividade; não inclua orações ou Diário privado."
              />
            </label>
            <button
              onClick={() =>
                onAction(
                  () =>
                    guildMissionRepository.submit(mission.id, travelerId, note),
                  mission.completion_mode === 'self_complete'
                    ? 'Missão concluída e recompensa recebida.'
                    : 'Missão enviada para aprovação.',
                  mission.completion_mode === 'self_complete',
                )
              }
            >
              {mission.completion_mode === 'self_complete'
                ? 'Marcar como concluída'
                : 'Enviar para aprovação'}
            </button>
          </>
        )}
      {progress?.status === 'completed' && (
        <p className={styles.guildSuccess}>
          ✓ Concluída · recompensa processada
        </p>
      )}
      {progress?.status === 'rejected' && progress.review_note && (
        <p className={styles.guildWarning}>
          Orientação do líder: {progress.review_note}
        </p>
      )}
      {isLeader && mission.status === 'draft' && (
        <button
          onClick={() =>
            onAction(
              () => guildMissionRepository.publish(mission.id, travelerId),
              'Missão publicada.',
            )
          }
        >
          Publicar
        </button>
      )}
      {isLeader &&
        pending.map((item) => (
          <div className={styles.guildRequestCard} key={item.traveler_id}>
            <div>
              <b>{item.traveler_name}</b>
              <span>{item.completion_note || 'Sem nota de conclusão.'}</span>
            </div>
            <div>
              <button
                onClick={() =>
                  onAction(
                    () =>
                      guildMissionRepository.review(
                        mission.id,
                        item.traveler_id,
                        travelerId,
                        true,
                      ),
                    'Missão aprovada e recompensa processada.',
                  )
                }
              >
                Aprovar
              </button>
              <button
                onClick={() =>
                  onAction(
                    () =>
                      guildMissionRepository.review(
                        mission.id,
                        item.traveler_id,
                        travelerId,
                        false,
                      ),
                    'Nova tentativa solicitada.',
                  )
                }
              >
                Solicitar nova tentativa
              </button>
            </div>
          </div>
        ))}
    </article>
  );
}
