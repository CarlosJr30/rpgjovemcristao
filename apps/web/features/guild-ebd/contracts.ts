import type { GuildLessonRow } from '../../lib/supabase/database.types';
import { guildMissionRewards, type GuildRewardTier } from '@rpg/game-engine';

export type Material = {
  kind: 'link' | 'image' | 'pdf' | 'text' | 'reference';
  title: string;
  value: string;
};
export type LessonInput = {
  title: string;
  theme: string;
  description: string;
  content: string;
  reference: string;
  scheduledAt: string;
  teacherId: string;
  audience: 'all' | 'selected';
  targetIds: string[];
  materials: Material[];
  objectives: string;
  rewardTier: GuildRewardTier | '';
};
export type Lesson = GuildLessonRow & {
  ebd_class_id?: string | null;
  canParticipate?: boolean;
  teacher_id: string;
  ebd_revision: number;
  audience: 'all' | 'selected';
  target_ids: string[];
  materials: Material[];
  objectives: string;
  reward_tier: GuildRewardTier | null;
  canEdit: boolean;
  canPublish: boolean;
  canAttend: boolean;
};
export type ActivityInput = {
  lessonId: string;
  title: string;
  kind: 'choice' | 'open' | 'reflective' | 'in_person' | 'homework';
  prompt: string;
  options: string[];
  answerKey: number | null;
  deadline: string;
  attemptLimit: number;
  criterion: 'participation' | 'correct' | 'manual';
};
export type Activity = {
  id: string;
  lesson_id: string;
  title: string;
  kind: ActivityInput['kind'];
  prompt: string;
  options: string[];
  answer_key?: number | null;
  deadline: string | null;
  attempt_limit: number;
  criterion: ActivityInput['criterion'];
  revision: number;
};
export type Answer = {
  id: string;
  activity_id: string;
  traveler_id: string;
  traveler_name: string;
  attempt: number;
  response: string;
  choice: number | null;
  status: 'pending' | 'completed' | 'revise';
  feedback: string;
  revision: number;
  submitted_at: string;
  evaluated_at: string | null;
};
export type Attendance = {
  lesson_id: string;
  traveler_id: string;
  status: 'pending' | 'present' | 'absent' | 'justified';
  reason: string;
  revision: number;
  marked_by: string;
  updated_at: string;
};
export type Teacher = {
  traveler_id: string;
  active: boolean;
  can_publish: boolean;
  can_attend: boolean;
  revision: number;
};
export type Workspace = {
  version: 1 | 2;
  classId?: string;
  teacherCandidates?: { id: string; name: string }[];
  quizzes?: ClassQuiz[];
  quizResults?: QuizResult[];
  eligibility?: {
    lesson_id: string;
    traveler_id: string;
    eligible: boolean;
    xp_contract: 50;
    xp_issued: 0;
  }[];
  guildId: string;
  leader: boolean;
  teacher: boolean;
  total: number;
  lessons: Lesson[];
  activities: Activity[];
  answers: Answer[];
  attendance: Attendance[];
  members: { id: string; name: string; leader: boolean }[];
  teachers: Teacher[];
  rewards: {
    lesson_id: string;
    traveler_id: string;
    tier: GuildRewardTier;
    criterion: string;
  }[];
  history: {
    id: number;
    lesson_id: string | null;
    actor_id: string;
    action: string;
    entity_id: string;
    revision: number;
    created_at: string;
  }[];
};
export const states: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  published: 'Publicada',
  closed: 'Encerrada',
  archived: 'Arquivada',
  completed: 'Realizada (legado)',
  cancelled: 'Cancelada (legado)',
};
export const kinds = {
  choice: 'Múltipla escolha',
  open: 'Pergunta aberta',
  reflective: 'Exercício reflexivo',
  in_person: 'Encontro presencial',
  homework: 'Tarefa para casa',
} as const;
export const answerStates = {
  pending: 'Aguardando avaliação',
  completed: 'Concluída',
  revise: 'Revisar resposta',
};
export const blankLesson = (actor: string): LessonInput => ({
  title: '',
  theme: '',
  description: '',
  content: '',
  reference: '',
  scheduledAt: '',
  teacherId: actor,
  audience: 'all',
  targetIds: [],
  materials: [],
  objectives: '',
  rewardTier: '',
});
export function localDate(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function fromLesson(l: Lesson): LessonInput {
  return {
    title: l.title,
    theme: l.theme,
    description: l.introduction,
    content: l.content,
    reference: l.bible_reference,
    scheduledAt: localDate(l.scheduled_at),
    teacherId: l.teacher_id,
    audience: l.audience,
    targetIds: l.target_ids,
    materials: l.materials,
    objectives: l.objectives,
    rewardTier: l.reward_tier ?? '',
  };
}
export function safeMaterialUrl(value: string) {
  if (
    value.length > 500 ||
    !/^https:\/\/[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}(\/[A-Za-z0-9/._~!$&()*+,;=:@%?#-]*)?$/.test(
      value,
    )
  )
    return false;
  const host = new URL(value).hostname.toLowerCase();
  return !/(^|\.)(localhost|local|internal|invalid|test|example)$/.test(host);
}
export function validateLesson(f: LessonInput, classMode = false) {
  if (
    f.title.trim().length < 2 ||
    f.title.length > 100 ||
    (!classMode && f.theme.trim().length < 2) ||
    f.theme.length > 100
  )
    return 'Informe título e tema (2 a 100 caracteres).';
  if (
    f.description.length > 2000 ||
    f.content.length > 10000 ||
    f.reference.length > 100 ||
    f.objectives.length > 2000
  )
    return 'Revise os limites de texto da aula.';
  if (
    !f.teacherId ||
    (f.audience === 'selected' && !f.targetIds.length) ||
    f.targetIds.length > 100
  )
    return 'Escolha o professor e o público da aula.';
  if (f.scheduledAt && Number.isNaN(new Date(f.scheduledAt).getTime()))
    return 'Informe uma data válida.';
  if (
    f.materials.length > 20 ||
    f.materials.some(
      (m) =>
        !m.title.trim() ||
        m.title.length > 100 ||
        !m.value.trim() ||
        m.value.length > 2000 ||
        (['link', 'image', 'pdf'].includes(m.kind) &&
          !safeMaterialUrl(m.value)),
    )
  )
    return 'Revise os materiais: texto limitado ou link HTTPS público válido, sem credenciais ou portas.';
  return '';
}
export type QuizQuestion = {
  id?: string;
  position?: number;
  prompt: string;
  options: string[];
  answerKey?: number;
  reference: string;
  feedback?: string;
};
export type ClassQuiz = {
  id: string;
  lessonId: string;
  revision: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
};
export type QuizResult = {
  quiz_id: string;
  traveler_id: string;
  traveler_name: string;
  lessonId: string;
  quizRevision: number;
  score: number;
  attempt: number;
  attempts: number;
  submitted_at: string;
  latest: {
    position: number;
    choice: number;
    correct: boolean;
    feedback: string;
  }[];
};
export const rewardLabel = (tier: GuildRewardTier) => {
  const r = guildMissionRewards[tier];
  return `${r.xp} XP · ${r.coins} moedas · ${r.chestQuantity} ${r.chestLabel}`;
};
export const dateLabel = (v: string | null) =>
  v ? new Date(v).toLocaleString('pt-BR') : 'Data a definir';
