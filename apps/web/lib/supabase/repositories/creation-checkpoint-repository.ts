/**
 * Client adapter for the local STORY-007 RPC proposal.
 * This module deliberately does not obtain a Supabase client or wire itself into
 * the demo flow. Callers must explicitly inject an RPC function after the
 * versioned database contract has been installed and enabled in TEST.
 */
export type CreationCheckpointSnapshot = {
  version: 1;
  storyId: 'creation';
  revision: number;
  available: boolean;
  completedDays: number[];
  harmonyCompleted: boolean;
  quizAttempts: number;
  bestQuizScore: number | null;
  videoCompleted: boolean;
};

export type CreationDayResult = {
  version: 1;
  completed: boolean;
  correct: boolean;
  day?: number;
  revision?: number;
  reference: string;
};

export type CreationHarmonyResult = {
  version: 1;
  completed: boolean;
  correct: boolean;
  revision?: number;
  reference: string;
};

export type CreationQuizResult = {
  version: 1;
  attemptId: string;
  score: number;
  total: 5;
  perfect: boolean;
  revision: number;
  replayed: boolean;
};

type CreationCheckpointFunction =
  | 'read_creation_checkpoints'
  | 'submit_creation_day'
  | 'submit_creation_harmony'
  | 'submit_creation_quiz';

export type CreationCheckpointRpc = (
  functionName: CreationCheckpointFunction,
  args: {
    p_traveler_id: string;
    p_revision?: number;
    p_day?: number;
    p_answer_index?: number;
    p_order?: number[];
    p_operation_id?: string;
    p_answers?: number[];
  },
) => Promise<{
  data: unknown;
  error: { message: string; code?: string } | null;
}>;

const asObject = (
  value: unknown,
  operation: string,
): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(
      `Resposta inválida ao ${operation} checkpoints da Criação.`,
    );
  return value as Record<string, unknown>;
};

const asInteger = (value: unknown, name: string, min: number, max: number) => {
  if (
    !Number.isInteger(value) ||
    (value as number) < min ||
    (value as number) > max
  )
    throw new Error(`Resposta inválida: ${name} fora do contrato STORY-007.`);
  return value as number;
};

const asBoolean = (value: unknown, name: string): boolean => {
  if (typeof value !== 'boolean')
    throw new Error(`Resposta inválida: ${name} fora do contrato STORY-007.`);
  return value;
};

const parseSnapshot = (value: unknown): CreationCheckpointSnapshot => {
  const row = asObject(value, 'ler');
  if (
    row.version !== 1 ||
    row.storyId !== 'creation' ||
    !Array.isArray(row.completedDays)
  )
    throw new Error('Resposta inválida ao retomar checkpoints da Criação.');
  const completedDays = row.completedDays.map((day) =>
    asInteger(day, 'completedDays', 1, 7),
  );
  if (completedDays.some((day, index) => day !== index + 1))
    throw new Error(
      'Resposta inválida: dias fora da sequ?ncia no contrato STORY-007.',
    );
  return {
    version: 1,
    storyId: 'creation',
    revision: asInteger(row.revision, 'revision', 1, Number.MAX_SAFE_INTEGER),
    available: asBoolean(row.available, 'available'),
    completedDays,
    harmonyCompleted: asBoolean(row.harmonyCompleted, 'harmonyCompleted'),
    quizAttempts: asInteger(
      row.quizAttempts,
      'quizAttempts',
      0,
      Number.MAX_SAFE_INTEGER,
    ),
    bestQuizScore:
      row.bestQuizScore === null
        ? null
        : asInteger(row.bestQuizScore, 'bestQuizScore', 0, 5),
    videoCompleted: asBoolean(row.videoCompleted, 'videoCompleted'),
  };
};

const parseDayResult = (value: unknown): CreationDayResult => {
  const row = asObject(value, 'registrar');
  if (row.version !== 1 || typeof row.reference !== 'string')
    throw new Error('Resposta inválida ao registrar checkpoint diário.');
  const completed = asBoolean(row.completed, 'completed');
  const correct = asBoolean(row.correct, 'correct');
  if (
    completed &&
    (!correct || row.day === undefined || row.revision === undefined)
  )
    throw new Error('Resposta inconsistente ao registrar checkpoint diário.');
  return {
    version: 1,
    completed,
    correct,
    ...(row.day === undefined ? {} : { day: asInteger(row.day, 'day', 1, 7) }),
    ...(row.revision === undefined
      ? {}
      : {
          revision: asInteger(
            row.revision,
            'revision',
            1,
            Number.MAX_SAFE_INTEGER,
          ),
        }),
    reference: row.reference,
  };
};

const parseHarmonyResult = (value: unknown): CreationHarmonyResult => {
  const row = asObject(value, 'registrar');
  if (row.version !== 1 || typeof row.reference !== 'string')
    throw new Error('Resposta inválida ao registrar Harmonia da Criação.');
  const completed = asBoolean(row.completed, 'completed');
  const correct = asBoolean(row.correct, 'correct');
  if (completed && (!correct || row.revision === undefined))
    throw new Error('Resposta inconsistente ao registrar Harmonia da Criação.');
  return {
    version: 1,
    completed,
    correct,
    ...(row.revision === undefined
      ? {}
      : {
          revision: asInteger(
            row.revision,
            'revision',
            1,
            Number.MAX_SAFE_INTEGER,
          ),
        }),
    reference: row.reference,
  };
};

const parseQuizResult = (value: unknown): CreationQuizResult => {
  const row = asObject(value, 'registrar');
  if (row.version !== 1 || typeof row.attemptId !== 'string' || row.total !== 5)
    throw new Error('Resposta inválida ao registrar tentativa do quiz.');
  const score = asInteger(row.score, 'score', 0, 5);
  const perfect = asBoolean(row.perfect, 'perfect');
  if (perfect !== (score === 5))
    throw new Error('Resposta inconsistente ao registrar tentativa do quiz.');
  return {
    version: 1,
    attemptId: row.attemptId,
    score,
    total: 5,
    perfect,
    revision: asInteger(row.revision, 'revision', 1, Number.MAX_SAFE_INTEGER),
    replayed: asBoolean(row.replayed, 'replayed'),
  };
};

export class CreationCheckpointUnavailable extends Error {}

export const createCreationCheckpointRepository = (
  rpc: CreationCheckpointRpc,
) => {
  const invoke = async (
    functionName: CreationCheckpointFunction,
    args: Parameters<CreationCheckpointRpc>[1],
  ) => {
    const result = await rpc(functionName, args);
    if (
      functionName === 'read_creation_checkpoints' &&
      result.error?.code === 'PGRST202'
    )
      throw new CreationCheckpointUnavailable();
    if (result.error)
      throw new Error(`STORY-007 ${functionName}: ${result.error.message}`);
    return result.data;
  };

  return {
    async read(travelerId: string): Promise<CreationCheckpointSnapshot> {
      return parseSnapshot(
        await invoke('read_creation_checkpoints', {
          p_traveler_id: travelerId,
        }),
      );
    },
    async submitDay(
      travelerId: string,
      revision: number,
      day: number,
      answerIndex: number,
    ): Promise<CreationDayResult> {
      if (!Number.isInteger(day) || day < 1 || day > 7)
        throw new RangeError('day deve estar entre 1 e 7.');
      if (!Number.isInteger(answerIndex) || answerIndex < 1 || answerIndex > 5)
        throw new RangeError('answerIndex deve estar entre 1 e 5.');
      return parseDayResult(
        await invoke('submit_creation_day', {
          p_traveler_id: travelerId,
          p_revision: revision,
          p_day: day,
          p_answer_index: answerIndex,
        }),
      );
    },
    async submitHarmony(
      travelerId: string,
      revision: number,
      order: number[],
    ): Promise<CreationHarmonyResult> {
      if (
        order.length !== 7 ||
        order.some((day) => !Number.isInteger(day) || day < 1 || day > 7)
      )
        throw new RangeError('order deve conter sete posições entre 1 e 7.');
      return parseHarmonyResult(
        await invoke('submit_creation_harmony', {
          p_traveler_id: travelerId,
          p_revision: revision,
          p_order: order,
        }),
      );
    },
    async submitQuiz(
      travelerId: string,
      revision: number,
      operationId: string,
      answers: number[],
    ): Promise<CreationQuizResult> {
      if (!operationId.trim())
        throw new TypeError('operationId é obrigatório para idempotência.');
      if (
        answers.length !== 5 ||
        answers.some(
          (answer) => !Number.isInteger(answer) || answer < 1 || answer > 3,
        )
      )
        throw new RangeError(
          'answers deve conter cinco alternativas entre 1 e 3.',
        );
      return parseQuizResult(
        await invoke('submit_creation_quiz', {
          p_traveler_id: travelerId,
          p_revision: revision,
          p_operation_id: operationId,
          p_answers: answers,
        }),
      );
    },
  };
};
