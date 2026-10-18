import {
  createSnakeReplay,
  stepSnakeReplay,
  type SnakeFrame,
  type SnakeProof,
} from '../../../features/journey/data/snake-replay';
import {
  findPath,
  PORTAL_POSITION,
  type Point,
} from '../../../features/journey/components/snake-game-engine';
import {
  initialJourneyState,
  transitionJourney,
  type JourneyAction,
  type JourneyState,
} from '../journey-authority';
import { createGardenQuizSession } from '../../../features/journey/data/gardenQuiz';
export function winningSnakeProof(): SnakeProof {
  const g = createSnakeReplay(),
    frames: SnakeFrame[] = [];
  let path: Point[] = [],
    lives = g.lives,
    goal: Point | null = null;
  for (let i = 0; i < 15000 && !g.finished; i++) {
    const target = g.fragments[0] ?? PORTAL_POSITION;
    if (goal !== target || lives !== g.lives || !path.length) {
      path = findPath(g.player, target);
      goal = target;
      lives = g.lives;
    }
    while (
      path.length &&
      Math.hypot(path[0].x - g.player.x, path[0].y - g.player.y) < 8
    )
      path.shift();
    const waypoint = path[0] ?? target,
      dx = waypoint.x - g.player.x,
      dy = waypoint.y - g.player.y;
    const x = Math.abs(dx) > 3 ? Math.sign(dx) : 0,
      y = x === 0 && Math.abs(dy) > 3 ? Math.sign(dy) : 0;
    const frame: SnakeFrame = [0.016, x, y, true, true, false];
    frames.push(frame);
    stepSnakeReplay(g, frame);
  }
  if (!g.victory)
    throw Error(
      'Synthetic route did not win: ' +
        JSON.stringify({
          lives: g.lives,
          fragments: g.fragmentCount,
          frames: frames.length,
          player: g.player,
        }),
    );
  return { frames, losses: [] };
}
export function journeyActions(proof = winningSnakeProof()): JourneyAction[] {
  const actions: JourneyAction[] = [
    { type: 'advance', step: 'explore' },
    {
      type: 'fragment',
      id: 'water',
      answers: ['water-flow', 'cultivated-soil', 'protected-plants'],
    },
    {
      type: 'fragment',
      id: 'stones',
      answers: ['liberdade', 'orientacao', 'limite'],
    },
    {
      type: 'fragment',
      id: 'leaves',
      answers: ['orientacao', 'escolha', 'consequencia'],
    },
    { type: 'fragment', id: 'wind', answers: ['folhas'] },
    ...[
      'coins-grove',
      'coins-river',
      'chest-path',
      'chest-hidden',
      'hidden-corner',
      'garden-equipment',
    ].map((id) => ({ type: 'collect' as const, id })),
    { type: 'advance', step: 'reading' },
    { type: 'reading', chapter: 'genesis2', action: 'open' },
    { type: 'reading', chapter: 'genesis2', action: 'confirm' },
    { type: 'reading', chapter: 'genesis3', action: 'open' },
    { type: 'reading', chapter: 'genesis3', action: 'confirm' },
    {
      type: 'comprehension',
      answers: {
        care: 'cultivate',
        orientation: 'freedom-limit',
        consequence: 'rupture',
      },
    },
    { type: 'devotional', reflection: 'ReflexÃ£o sintÃ©tica de teste.' },
    { type: 'snake', proof },
  ];
  const state = actions.reduce(
    (s, a) => transitionJourney(s, a).state,
    initialJourneyState(),
  );
  for (const q of createGardenQuizSession(state.progress.quizAttemptId))
    actions.push({
      type: 'quiz-answer',
      questionId: q.id,
      optionId: q.correctOptionId,
    });
  return [
    ...actions,
    { type: 'advance', step: 'reward' },
    { type: 'advance', step: 'diary' },
    { type: 'complete' },
  ];
}
export function readyToComplete(): JourneyState {
  return journeyActions()
    .slice(0, -1)
    .reduce((s, a) => transitionJourney(s, a).state, initialJourneyState());
}
