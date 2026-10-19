import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Traveler,
} from '../../features/journey/domain/traveler';
import { createGardenQuizSession } from '../../features/journey/data/gardenQuiz';
import { comprehensionQuestions } from '../../features/journey/data/reading-comprehension';
import {
  verifySnakeProof,
  type SnakeProof,
} from '../../features/journey/data/snake-replay';
import {
  PHASE_STEPS,
  type GardenStep,
} from '../../features/journey/data/phaseProgress';

export const JOURNEY_KEYS = [
  'gardenStep',
  'gardenExploredPoints',
  'gardenFragments',
  'explorationObjectives',
  'gardenCollectedLoot',
  'gardenOpenedChests',
  'gardenSecrets',
  'gardenEvents',
  'bibleReading',
  'devotionalCompleted',
  'devotionalReflection',
  'quizAttemptId',
  'gardenRewardGranted',
  'gardenCompleted',
  'gardenDiscoveryFound',
] as const;
export type JourneyProgress = Pick<
  Traveler['progress'],
  (typeof JOURNEY_KEYS)[number]
>;
export type JourneyState = {
  progress: JourneyProgress;
  snakeWon: boolean;
  quizAnswers: Record<string, string>;
  legacyQuizCompleted?: boolean;
};
export type JourneyAction =
  | { type: 'advance'; step: GardenStep }
  | { type: 'collect'; id: string }
  | { type: 'fragment'; id: string; answers: string[] }
  | {
      type: 'reading';
      chapter: 'genesis2' | 'genesis3';
      action: 'open' | 'confirm';
    }
  | { type: 'comprehension'; answers: Record<string, string> }
  | { type: 'devotional'; reflection: string }
  | { type: 'snake'; proof: SnakeProof }
  | { type: 'quiz-answer'; questionId: string; optionId: string }
  | { type: 'complete' };
export function initialJourneyState(): JourneyState {
  const p = createTraveler(
    'Sintetico',
    DEFAULT_APPEARANCE,
    '11111111-1111-4111-8111-111111111111',
    '2026-10-17T00:00:00.000Z',
  ).progress;
  return {
    progress: Object.fromEntries(
      JOURNEY_KEYS.map((k) => [k, p[k]]),
    ) as JourneyProgress,
    snakeWon: false,
    quizAnswers: {},
  };
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const requireCondition = (condition: unknown) => {
  if (!condition) throw Error('Invalid journey evidence or order');
};
const sameSet = (a: unknown, b: readonly string[]) =>
  Array.isArray(a) &&
  a.length === b.length &&
  new Set(a).size === b.length &&
  b.every((v) => a.includes(v));
const rewardIds = [
  'coins-grove',
  'coins-river',
  'chest-path',
  'chest-hidden',
  'hidden-corner',
  'wind-pattern',
  'garden-equipment',
] as const;
/** Pure authoritative transition: input actions never carry reward values. */
export function transitionJourney(
  original: JourneyState,
  value: unknown,
  now = new Date().toISOString(),
): { state: JourneyState; rewardKey: string | null } {
  requireCondition(record(value) && typeof value.type === 'string');
  const a = value as unknown as JourneyAction;
  const allowed: Record<string, string[]> = {
    advance: ['type', 'step'],
    collect: ['type', 'id'],
    fragment: ['type', 'id', 'answers'],
    reading: ['type', 'chapter', 'action'],
    comprehension: ['type', 'answers'],
    devotional: ['type', 'reflection'],
    snake: ['type', 'proof'],
    'quiz-answer': ['type', 'questionId', 'optionId'],
    complete: ['type'],
  };
  requireCondition(
    Object.hasOwn(allowed,a.type) && Object.keys(a).length===allowed[a.type].length && Object.keys(a).every((k) => allowed[a.type].includes(k)),
  );
  const state = structuredClone(original),
    p = state.progress;
  let rewardKey: string | null = null;
  const reading = () =>
    p.bibleReading.genesis2Confirmed && p.bibleReading.genesis3Confirmed;
  const prepared = () =>
    p.gardenFragments === 3 &&
    reading() &&
    p.bibleReading.comprehensionCompleted &&
    p.devotionalCompleted;
  const quizDone = () =>
    state.legacyQuizCompleted ||
    createGardenQuizSession(p.quizAttemptId).every((q) =>
      Object.hasOwn(state.quizAnswers, q.id),
    );
  if (a.type === 'advance') {
    requireCondition(PHASE_STEPS.includes(a.step));
    const i = PHASE_STEPS.indexOf(a.step);
    if (i >= 2) requireCondition(p.gardenFragments === 3 || p.gardenCompleted);
    if (i >= 3) requireCondition(reading() || p.gardenCompleted);
    if (i >= 4)
      requireCondition(
        p.bibleReading.comprehensionCompleted || p.gardenCompleted,
      );
    if (i >= 6) requireCondition(p.devotionalCompleted || p.gardenCompleted);
    if (i >= 8) requireCondition(state.snakeWon || p.gardenCompleted);
    if (i >= 9) requireCondition(quizDone() || p.gardenCompleted);
    if (a.step === 'done') requireCondition(p.gardenCompleted);
    p.gardenStep = a.step;
  } else if (a.type === 'collect') {
    requireCondition(p.gardenStep === 'explore' || p.gardenCompleted);
    requireCondition(
      typeof a.id === 'string' &&
        [...rewardIds, 'blocked-passage'].includes(
          a.id as (typeof rewardIds)[number],
        ),
    );
    if (a.id === 'chest-hidden')
      requireCondition(p.gardenEvents.includes('wind-pattern'));
    if (a.id === 'garden-equipment')
      requireCondition(p.gardenOpenedChests.includes('chest-hidden'));
    // The wind puzzle needs the answer, not an editable event marker.
    requireCondition(a.id !== 'wind-pattern');
    const list = a.id.startsWith('coins-')
      ? p.gardenCollectedLoot
      : a.id.startsWith('chest-')
        ? p.gardenOpenedChests
        : a.id === 'hidden-corner'
          ? p.gardenSecrets
          : p.gardenEvents;
    if (!list.includes(a.id)) {
      list.push(a.id);
      if (a.id !== 'blocked-passage') rewardKey = a.id;
    }
  } else if (a.type === 'fragment') {
    requireCondition(p.gardenStep === 'explore' || p.gardenCompleted);
    const answers: Record<string, readonly string[]> = {
      water: ['water-flow', 'cultivated-soil', 'protected-plants'],
      stones: ['liberdade', 'orientacao', 'limite'],
      leaves: ['orientacao', 'escolha', 'consequencia'],
      wind: ['folhas'],
    };
    requireCondition(
      typeof a.id==='string' && Object.hasOwn(answers,a.id) && Array.isArray(a.answers) &&
        (a.id === 'water'
          ? sameSet(a.answers, answers.water)
          : JSON.stringify(a.answers) === JSON.stringify(answers[a.id])),
    );
    if (a.id === 'wind') {
      if (!p.gardenEvents.includes('wind-pattern')) {
        p.gardenEvents.push('wind-pattern');
        rewardKey = 'wind-pattern';
      }
    } else if (!p.gardenExploredPoints.includes(a.id)) {
      p.gardenExploredPoints.push(a.id);
      p.gardenFragments = p.gardenExploredPoints.length;
      const objectives: Record<string, string> = {
        water: 'care-signs',
        stones: 'limit-sequence',
        leaves: 'choice-consequence-order',
      };
      p.explorationObjectives.push(objectives[a.id]);
    }
  } else if (a.type === 'reading') {
    requireCondition(
      ['genesis2', 'genesis3'].includes(a.chapter) &&
        ['open', 'confirm'].includes(a.action) &&
        p.gardenFragments === 3,
    );
    const opened =
        a.chapter === 'genesis2' ? 'genesis2Opened' : 'genesis3Opened',
      confirmed =
        a.chapter === 'genesis2' ? 'genesis2Confirmed' : 'genesis3Confirmed';
    if (a.action === 'open') p.bibleReading[opened] ??= now;
    else {
      requireCondition(p.bibleReading[opened]);
      p.bibleReading[confirmed] = true;
    }
  } else if (a.type === 'comprehension') {
    requireCondition(
      reading() &&
        record(a.answers) &&
        Object.keys(a.answers).length === comprehensionQuestions.length &&
        comprehensionQuestions.every(
          (q) => a.answers[q.id] === q.correctOptionId,
        ),
    );
    p.bibleReading.comprehensionCompleted = true;
  } else if (a.type === 'devotional') {
    requireCondition(
      p.bibleReading.comprehensionCompleted &&
        typeof a.reflection === 'string' &&
        a.reflection.trim().length >= 3 &&
        a.reflection.length <= 800,
    );
    p.devotionalCompleted = true;
    p.devotionalReflection = a.reflection.trim();
  } else if (a.type === 'snake') {
    requireCondition(prepared() && verifySnakeProof(a.proof));
    state.snakeWon = true;
    state.quizAnswers = {};
    state.legacyQuizCompleted = false;
    p.quizAttemptId++;
    p.gardenStep = 'quiz';
  } else if (a.type === 'quiz-answer') {
    requireCondition(
      state.snakeWon &&
        typeof a.questionId === 'string' &&
        typeof a.optionId === 'string',
    );
    const questions = createGardenQuizSession(p.quizAttemptId),
      q = questions.find((q) => q.id === a.questionId);
    requireCondition(q?.options.some((o) => o.id === a.optionId));
    if (Object.hasOwn(state.quizAnswers, a.questionId)) {
      requireCondition(state.quizAnswers[a.questionId] === a.optionId);
    } else {
      requireCondition(
        questions[Object.keys(state.quizAnswers).length]?.id === a.questionId,
      );
      state.quizAnswers[a.questionId] = a.optionId;
    }
  } else if (a.type === 'complete') {
    if (!p.gardenRewardGranted) {
      requireCondition(prepared() && state.snakeWon && quizDone());
      rewardKey = 'phase:garden-choice';
    }
    p.gardenRewardGranted = true;
    p.gardenCompleted = true;
    p.gardenDiscoveryFound =
      p.gardenDiscoveryFound || p.gardenExploredPoints.includes('water');
    p.gardenStep = 'done';
  }
  return { state, rewardKey };
}
