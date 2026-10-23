import { seededUnit } from '@rpg/game-engine';
import { fisherYates, scoreGardenQuiz } from '../journey/data/gardenQuiz';
import type { OriginsLesson } from './origins-lessons';
export type WorkbookEvent =
  | { type: 'visit'; sceneId: string }
  | { type: 'reading-open' | 'reading-confirm'; chapter: number }
  | { type: 'task'; taskId: string; choice: string }
  | { type: 'snake-complete' }
  | { type: 'quiz-answer'; questionId: string; optionId: string }
  | { type: 'quiz-retry' }
  | { type:'quiz-confirm' }
  | { type: 'reflect' };
export type WorkbookScope = {
  owner: string;
  traveler: string;
  storyId: string;
  revision: number;
};
export type Workbook = { scope: WorkbookScope; events: WorkbookEvent[] };
export type WorkbookState = {
  visited: string[];
  opened: number[];
  read: number[];
  tasks: Record<string, string>;
  snakeWon: boolean;
  answers: Record<string, string>;
  quizConfirmed:boolean;
  attempt: number;
  reflected: boolean;
};
export const emptyWorkbookState = (): WorkbookState => ({
  visited: [],
  opened: [],
  read: [],
  tasks: {},
  snakeWon: false,
  answers: {},
  quizConfirmed:false,
  attempt: 1,
  reflected: false,
});
export function lessonQuiz(lesson: OriginsLesson, attempt: number) {
  let salt = 0;
  const seed = Array.from(lesson.storyId).reduce(
    (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
    attempt,
  );
  const random = () => seededUnit(seed, attempt, `story-quiz:${salt++}`);
  const positions = fisherYates([0, 1, 2, 3], random);
  return lesson.quiz.map((question, index) => {
    const correct = question.options.find(
      (o) => o.id === question.correctOptionId,
    )!;
    const options = fisherYates(
      question.options.filter((o) => o.id !== correct.id),
      random,
    );
    options.splice(positions[index % 4], 0, correct);
    return { ...question, options };
  });
}
export function workbookStage(
  lesson: OriginsLesson,
  s: WorkbookState,
): 'explore' | 'reading' | 'activity' | 'quiz' | 'reflection' | 'video' {
  if (!lesson.scenes.every((c) => s.visited.includes(c.id))) return 'explore';
  if (!lesson.readings.every((r) => s.read.includes(r.chapter)))
    return 'reading';
  if (
    lesson.storyId === 'garden-choice'
      ? !s.snakeWon
      : !lesson.activity.tasks.every((t) => s.tasks[t.id] === t.answer)
  )
    return 'activity';
  if (
    scoreGardenQuiz(lessonQuiz(lesson, s.attempt), s.answers) !==
    lesson.quiz.length || !s.quizConfirmed
  )
    return 'quiz';
  if (!s.reflected) return 'reflection';
  return 'video'; // A workbook never completes this mandatory step or a story.
}
function object(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
function exact(v: Record<string, unknown>, keys: string[]) {
  if (
    Object.keys(v).length !== keys.length ||
    !keys.every((k) => Object.hasOwn(v, k))
  )
    throw Error('Registro de atividade incompatível; original preservado.');
}
export function transitionWorkbook(
  lesson: OriginsLesson,
  original: WorkbookState,
  value: unknown,
): WorkbookState {
  if (!object(value) || typeof value.type !== 'string')
    throw Error('Atividade inválida.');
  const s = structuredClone(original),
    stage = workbookStage(lesson, s);
  const requireValue = (v: unknown) => {
    if (!v) throw Error('Conclua a etapa anterior ou retome o caderno.');
  };
  switch (value.type) {
    case 'visit':
      exact(value, ['type', 'sceneId']);
      requireValue(lesson.scenes.some((c) => c.id === value.sceneId));
      if (!s.visited.includes(value.sceneId as string))
        s.visited.push(value.sceneId as string);
      break;
    case 'reading-open':
    case 'reading-confirm':
      exact(value, ['type', 'chapter']);
      requireValue(
        stage !== 'explore' &&
          lesson.readings.some((r) => r.chapter === value.chapter),
      );
      if (value.type === 'reading-open') {
        if (!s.opened.includes(value.chapter as number))
          s.opened.push(value.chapter as number);
      } else {
        requireValue(s.opened.includes(value.chapter as number));
        if (!s.read.includes(value.chapter as number))
          s.read.push(value.chapter as number);
      }
      break;
    case 'task':
      exact(value, ['type', 'taskId', 'choice']);
      requireValue(
        ['activity', 'quiz', 'reflection', 'video'].includes(stage) &&
          lesson.activity.tasks.some((t) => t.id === value.taskId) &&
          lesson.activity.options.some((o) => o.id === value.choice),
      );
      s.tasks[value.taskId as string] = value.choice as string;
      s.answers = {};
      s.quizConfirmed=false;
      s.reflected = false;
      break;
    case 'snake-complete':
      exact(value, ['type']);
      requireValue(
        lesson.storyId === 'garden-choice' &&
          ['activity', 'quiz', 'reflection', 'video'].includes(stage),
      );
      s.snakeWon = true;
      break;
    case 'quiz-answer': {
      exact(value, ['type', 'questionId', 'optionId']);
      requireValue(['quiz', 'reflection', 'video'].includes(stage));
      const question = lessonQuiz(lesson, s.attempt).find(
        (q) => q.id === value.questionId,
      );
      requireValue(question?.options.some((o) => o.id === value.optionId));
      s.answers[value.questionId as string] = value.optionId as string;
      s.quizConfirmed=false;
      s.reflected = false;
      break;
    }
    case 'quiz-confirm':
      exact(value,['type']);requireValue(stage==='quiz'&&scoreGardenQuiz(lessonQuiz(lesson,s.attempt),s.answers)===lesson.quiz.length);s.quizConfirmed=true;break;
    case 'quiz-retry':
      exact(value, ['type']);
      requireValue(['quiz', 'reflection', 'video'].includes(stage));
      s.attempt++;
      s.answers = {};
      s.quizConfirmed=false;
      s.reflected = false;
      break;
    case 'reflect':
      exact(value, ['type']);
      requireValue(stage === 'reflection' || stage === 'video');
      s.reflected = true;
      break;
    default:
      throw Error('Nenhum resultado ou prêmio pode ser enviado pelo caderno.');
  }
  return s;
}
export function replayWorkbook(
  lesson: OriginsLesson,
  events: readonly unknown[],
): WorkbookState {
  if (events.length > 512)
    throw Error('Caderno cheio. Seu registro foi preservado.');
  return events.reduce<WorkbookState>(
    (s, event) => transitionWorkbook(lesson, s, event),
    emptyWorkbookState(),
  );
}
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
function workbookKey(scope: WorkbookScope) {
  if (
    ![scope.owner, scope.traveler].every((id) =>
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id),
    )
  )
    throw Error('Conta ou Viajante indisponível.');
  if (!/^[a-z-]{1,60}$/.test(scope.storyId) || scope.revision !== 1)
    throw Error('Revisão indisponível.');
  return `rpg-story-workbook:v1:${scope.owner}:${scope.traveler}:${scope.storyId}:${scope.revision}`;
}
export function readWorkbook(
  lesson: OriginsLesson,
  scope: WorkbookScope,
  storage: StoragePort,
): Workbook {
  if(scope.storyId!==lesson.storyId||scope.revision!==lesson.revision)throw Error('Conteúdo ou revisão incompatível; original preservado.');
  const raw = storage.getItem(workbookKey(scope));
  if (!raw) return { scope, events: [] };
  if (raw.length > 262144)
    throw Error('Registro incompatível; original preservado.');
  const parsed: unknown = JSON.parse(raw);
  if (!object(parsed))
    throw Error('Registro incompatível; original preservado.');
  exact(parsed, ['scope', 'events']);
  if (
    JSON.stringify(parsed.scope) !== JSON.stringify(scope) ||
    !Array.isArray(parsed.events)
  )
    throw Error('Conta ou revisão incompatível; original preservado.');
  replayWorkbook(lesson, parsed.events);
  return parsed as Workbook;
}
export function appendWorkbook(
  lesson: OriginsLesson,
  current: Workbook,
  event: WorkbookEvent,
  storage: StoragePort,
): Workbook {
  const persisted = readWorkbook(lesson, current.scope, storage);
  if (JSON.stringify(persisted.events) !== JSON.stringify(current.events))
    throw Error('Atividades atualizadas em outra aba. Retome o caderno.');
  const before = replayWorkbook(lesson, current.events),
    after = transitionWorkbook(lesson, before, event);
  if (JSON.stringify(before) === JSON.stringify(after)) return current;
  const next = { scope: current.scope, events: [...current.events, event] };
  replayWorkbook(lesson, next.events);
  storage.setItem(workbookKey(current.scope), JSON.stringify(next));
  return next;
}
