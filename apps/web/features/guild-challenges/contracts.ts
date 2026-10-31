import type { QuizQuestion } from '../guild-ebd/contracts';
export type ChallengeStatus =
  'draft' | 'published' | 'running' | 'closed' | 'cancelled';
export type ChallengeMode = 'individual' | 'cooperative' | 'competitive';
export type ChallengeQuestion = QuizQuestion & {
  difficulty: 'easy' | 'medium' | 'hard';
};
export type ChallengeEvent = {
  id: string;
  title: string;
  description: string;
  theme: string;
  reference: string;
  criteria: string;
  mode: ChallengeMode;
  status: ChallengeStatus;
  revision: number;
  ruleVersion: 1;
  meetingId: string | null;
  startsAt: string;
  endsAt: string;
  beganAt: string | null;
  manualIds: string[];
  canAnswer: boolean | null;
  canPractice: boolean;
  enrolment: string | null;
  progressReceived: number;
  eligibleCount: number;
};
export type ChallengeWorkspace = {
  version: 1;
  guildId: string;
  leader: boolean;
  offset: number;
  economicRewardsEnabled: false;
  events: Array<{
    id: string;
    title: string;
    mode: ChallengeMode;
    status: ChallengeStatus;
    revision: number;
    starts_at: string;
    ends_at: string;
    created_at: string;
  }>;
  event: ChallengeEvent | null;
  questions: ChallengeQuestion[];
  teams: Array<{ id: string; name: string; position: number }>;
  roster: Array<{
    id: string;
    avatarId: string;
    alias: string;
    teamId: string | null;
    status: 'invited' | 'accepted' | 'declined' | 'withdrawn';
    revision: number;
    frozen: boolean;
    own: boolean;
  }>;
  myResult: {
    choices: number[];
    score: number | null;
    submittedAt: string;
    ruleVersion: 1;
    practiceCount: number;
  } | null;
  latestPractice: { score: number; choices: number[] } | null;
  board: {
    maxPerPlayer: number;
    persons: Array<{
      rosterId: string;
      avatarId: string;
      teamId: string | null;
      quizScore: number | null;
      manualPoints: number;
      points: number;
      completed: boolean;
    }>;
    teams: Array<{
      id: string;
      eligible: number;
      totalPoints: number;
      average: number;
      percent: number;
      place: number;
      completed: boolean;
    }>;
  } | null;
  members: Array<{ id: string; name: string }>;
  meetings: Array<{ id: string; title: string }>;
  manualActivities: Array<{ id: string; title: string }>;
  history: Array<{
    action: string;
    revision: number;
    createdAt: string;
    reason: string;
  }>;
};
export type ChallengeAction =
  'save' | 'state' | 'invite' | 'enrol' | 'team' | 'answer' | 'practice';
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
const states = ['draft', 'published', 'running', 'closed', 'cancelled'];
export function parseChallengeWorkspace(
  input: unknown,
  guild: string,
  event: string | null,
): ChallengeWorkspace {
  const bad = () => {
    throw Error(
      'Resposta de gincana ou sigilo invalido. Atualize sua comunidade.',
    );
  };
  if (
    !object(input) ||
    input.version !== 1 ||
    input.guildId !== guild ||
    typeof input.leader !== 'boolean' ||
    input.economicRewardsEnabled !== false ||
    !Number.isInteger(input.offset)
  )
    return bad();
  for (const key of [
    'events',
    'questions',
    'teams',
    'roster',
    'members',
    'meetings',
    'manualActivities',
    'history',
  ])
    if (!Array.isArray(input[key]) || !(input[key] as unknown[]).every(object))
      return bad();
  if (
    input.event !== null &&
    (!object(input.event) ||
      input.event.id !== event ||
      !states.includes(String(input.event.status)) ||
      !Number.isInteger(input.event.revision) ||
      input.event.ruleVersion !== 1 ||
      !Array.isArray(input.event.manualIds))
  )
    return bad();
  if (input.event === null && event !== null) return bad();
  for (const q of input.questions as Record<string, unknown>[])
    if (
      typeof q.prompt !== 'string' ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      !q.options.every((x) => typeof x === 'string') ||
      !['easy', 'medium', 'hard'].includes(String(q.difficulty))
    )
      return bad();
  if (
    input.myResult !== null &&
    (!object(input.myResult) ||
      !Array.isArray(input.myResult.choices) ||
      input.myResult.choices.length !== 7 ||
      input.myResult.ruleVersion !== 1)
  )
    return bad();
  if (
    input.latestPractice !== null &&
    (!object(input.latestPractice) ||
      !Array.isArray(input.latestPractice.choices))
  )
    return bad();
  if (
    input.board !== null &&
    (!object(input.board) ||
      !Array.isArray(input.board.persons) ||
      !Array.isArray(input.board.teams))
  )
    return bad();
  const w = input as unknown as ChallengeWorkspace,
    draftEditor = w.leader && w.event?.status === 'draft',
    closed = w.event?.status === 'closed';
  if (
    !draftEditor &&
    !closed &&
    (w.questions.some(
      (q) => q.answerKey !== undefined || q.feedback !== undefined,
    ) ||
      w.myResult?.score != null ||
      w.latestPractice !== null ||
      w.board !== null)
  )
    return bad();
  return w;
}
