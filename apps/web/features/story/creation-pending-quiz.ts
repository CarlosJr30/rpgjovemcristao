const KEY = 'rpg.creation.pending-quiz.v1';

type PendingQuiz = { scope: string; id: string; answers: number[] };

export function readPendingQuiz(
  scope: string,
  discardOtherScope = true,
): PendingQuiz | undefined {
  const stored = sessionStorage.getItem(KEY);
  if (!stored) return;
  let value: Partial<PendingQuiz> | null;
  try {
    value = JSON.parse(stored);
  } catch {
    sessionStorage.removeItem(KEY);
    return;
  }
  if (value?.scope !== scope) {
    if (discardOtherScope) sessionStorage.removeItem(KEY);
    return;
  }
  if (
    typeof value.id !== 'string' ||
    !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value.id) ||
    !Array.isArray(value.answers) ||
    value.answers.length !== 5 ||
    value.answers.some((answer) => ![1, 2, 3].includes(answer))
  ) {
    sessionStorage.removeItem(KEY);
    return;
  }
  return { scope, id: value.id, answers: value.answers };
}

export function preparePendingQuiz(
  scope: string,
  answers: number[],
): PendingQuiz {
  const pending = readPendingQuiz(scope);
  if (pending) {
    if (pending.answers.some((answer, index) => answer !== answers[index]))
      throw new Error('Resume the pending quiz before starting another');
    return pending;
  }
  const next = { scope, id: crypto.randomUUID(), answers };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearPendingQuiz(scope: string, id?: string) {
  const pending = readPendingQuiz(scope, false);
  if (pending && (!id || pending.id === id)) sessionStorage.removeItem(KEY);
}

export function invalidatePendingQuiz() {
  sessionStorage.removeItem(KEY);
}

export function discardPendingQuizForOtherTraveler(
  accountId: string,
  travelerId: string,
) {
  const stored = sessionStorage.getItem(KEY);
  if (!stored) return;
  try {
    const scope = JSON.parse(JSON.parse(stored).scope);
    if (
      Array.isArray(scope) &&
      scope[0] === accountId &&
      scope[1] === travelerId
    )
      return;
  } catch {
    // A malformed entry is never sent.
  }
  invalidatePendingQuiz();
}
