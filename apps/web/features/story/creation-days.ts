import manifestSource from './creation-content-v1.json';
import type { Point } from './creation-explorer-model';

export type CreationMarker = Readonly<{
  label: string;
  symbol: string;
  point: Point;
  note?: string;
}>;

export type CreationContentDay = Readonly<{
  id: string;
  title: string;
  harmonyLabel: string;
  reference: string;
  passage: string;
  motifs: string;
  objective: string;
  markers: readonly CreationMarker[];
  question: string;
  options: readonly [string, string];
  answer: number;
  explanation: string;
}>;

export type CreationContentQuizQuestion = Readonly<{
  id: string;
  question: string;
  options: readonly string[];
  optionIds: readonly string[];
  answer: number;
  reference: string;
  passage: string;
  explanation: string;
}>;

export type CreationContentManifest = Readonly<{
  revision: number;
  days: readonly CreationContentDay[];
  harmony: readonly string[];
  quiz: readonly CreationContentQuizQuestion[];
}>;

export type CreationDay = CreationContentDay & { correct: 0 | 1 };

export function creationPassageUrl(passage: string) {
  return `https://www.bible.com/pt/bible/129/GEN.${passage}.NVI`;
}

export function parseCreationManifest(value: unknown): CreationContentManifest {
  if (!isRecord(value)) throw new Error('Manifesto da Criação inválido.');
  const revision = value.revision;
  if (!Number.isSafeInteger(revision) || (revision as number) < 1)
    throw new Error('Revisão do manifesto da Criação inválida.');
  if (!Array.isArray(value.days) || value.days.length !== 7)
    throw new Error('O manifesto deve conter os sete dias.');
  if (!Array.isArray(value.harmony) || value.harmony.length !== 7)
    throw new Error('A sequência da Harmonia está incompleta.');
  if (!Array.isArray(value.quiz) || value.quiz.length !== 5)
    throw new Error('O manifesto deve conter cinco questões do quiz.');

  const days = value.days.map(parseDay);
  const quiz = value.quiz.map(parseQuizQuestion);
  const dayIds = days.map(({ id }) => id);
  if (new Set(dayIds).size !== 7 || dayIds.some((id, i) => id !== `creation-day-${i + 1}`))
    throw new Error('Os identificadores dos dias são inválidos.');
  if (value.harmony.some((id, i) => id !== dayIds[i]))
    throw new Error('A sequência da Harmonia não corresponde aos dias.');
  const quizIds = quiz.map(({ id }) => id);
  if (
    new Set(quizIds).size !== 5 ||
    quizIds.some((id) => !/^[a-z][a-z0-9-]{0,31}$/.test(id))
  )
    throw new Error('Os identificadores do quiz devem ser únicos.');

  return {
    revision: revision as number,
    days,
    harmony: value.harmony as string[],
    quiz,
  };
}

export function parseCreationManifestText(text: string, revision: number) {
  const manifest = parseCreationManifest(JSON.parse(text) as unknown);
  if (manifest.revision !== revision)
    throw new Error('O manifesto não corresponde à revisão publicada.');
  return manifest;
}

export function creationDaysFromManifest(
  manifest: CreationContentManifest,
): readonly CreationDay[] {
  return manifest.days.map((day) => ({
    ...day,
    correct: (day.answer - 1) as 0 | 1,
  }));
}

function parseDay(value: unknown): CreationContentDay {
  if (!isRecord(value)) throw new Error('Dia inválido no manifesto.');
  const id = requiredString(value.id);
  const options = requiredStrings(value.options, 2) as [string, string];
  const answer = validAnswer(value.answer, options.length);
  const markers = Array.isArray(value.markers)
    ? value.markers.map((marker) => {
        if (!isRecord(marker) || !isRecord(marker.point))
          throw new Error('Marco inválido no manifesto.');
        const point = marker.point;
        if (
          typeof point.x !== 'number' ||
          typeof point.y !== 'number' ||
          point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100
        )
          throw new Error('Posição de marco inválida no manifesto.');
        return {
          label: requiredString(marker.label),
          symbol: requiredString(marker.symbol),
          point: { x: point.x, y: point.y },
          ...(marker.note === undefined ? {} : { note: requiredString(marker.note) }),
        };
      })
    : [];
  if (!markers.length) throw new Error('O dia deve conter ao menos um marco.');
  return {
    id,
    title: requiredString(value.title),
    harmonyLabel: requiredString(value.harmonyLabel),
    reference: requiredString(value.reference),
    passage: requiredString(value.passage),
    motifs: requiredString(value.motifs),
    objective: requiredString(value.objective),
    markers,
    question: requiredString(value.question),
    options,
    answer,
    explanation: requiredString(value.explanation),
  };
}

function parseQuizQuestion(value: unknown): CreationContentQuizQuestion {
  if (!isRecord(value)) throw new Error('Questão inválida no manifesto.');
  const options = requiredStrings(value.options, 3);
  const optionIds = requiredStrings(value.optionIds, 3);
  if (new Set(options).size !== 3 || new Set(optionIds).size !== 3)
    throw new Error('Alternativas e identificadores devem ser únicos.');
  if (optionIds.some((id) => !/^[a-z][a-z0-9_-]{0,15}$/.test(id)))
    throw new Error('Identificador de alternativa inválido.');
  return {
    id: requiredString(value.id),
    question: requiredString(value.question),
    options,
    optionIds,
    answer: validAnswer(value.answer, options.length),
    reference: requiredString(value.reference),
    passage: requiredString(value.passage),
    explanation: requiredString(value.explanation),
  };
}

function requiredStrings(value: unknown, count: number): string[] {
  if (
    !Array.isArray(value) ||
    value.length !== count ||
    value.some((item) => typeof item !== 'string' || !item.trim())
  )
    throw new Error('Lista de alternativas inválida no manifesto.');
  return value as string[];
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error('Campo de texto obrigatório ausente no manifesto.');
  return value;
}

function validAnswer(value: unknown, count: number): number {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > count)
    throw new Error('Gabarito inválido no manifesto.');
  return value as number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

const bundledManifest = parseCreationManifest(manifestSource);
export const CREATION_DAYS = creationDaysFromManifest(bundledManifest);
export const CREATION_CONTENT_V1 = bundledManifest;
