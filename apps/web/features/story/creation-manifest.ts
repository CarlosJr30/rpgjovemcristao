import { CREATION_DAYS } from './creation-days';
import { CREATION_QUIZ } from './creation-quiz-content';

// Preserve key order and UTF-8 bytes when staging this JSON for review.
export const CREATION_MANIFEST = JSON.stringify({
  revision: 1,
  days: CREATION_DAYS.map((day) => ({
    ...day,
    harmonyLabel: day.harmonyLabel ?? day.title,
    answer: day.correct + 1,
  })),
  harmony: CREATION_DAYS.map(({ id }) => id),
  quiz: CREATION_QUIZ.map((question) => ({
    ...question,
    options: question.options.map(({ text }) => text),
    optionIds: question.options.map(({ id }) => id),
    answer:
      question.options.findIndex(({ id }) => id === question.correctOptionId) +
      1,
  })),
});

export async function creationManifestId() {
  const bytes = new TextEncoder().encode(CREATION_MANIFEST);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
}
