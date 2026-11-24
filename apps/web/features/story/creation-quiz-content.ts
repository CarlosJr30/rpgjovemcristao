import type { GardenQuizSessionQuestion } from '../journey/data/gardenQuiz';
import {
  CREATION_CONTENT_V1,
  type CreationContentManifest,
  type CreationContentQuizQuestion,
} from './creation-days';

export function creationQuizFromManifest(
  manifest: CreationContentManifest,
): readonly (GardenQuizSessionQuestion & { passage: string })[] {
  return manifest.quiz.map((question: CreationContentQuizQuestion) => ({
    id: question.id,
    question: question.question,
    options: question.options.map((text, index) => ({
      id: question.optionIds[index],
      text,
    })),
    correctOptionId: question.optionIds[question.answer - 1] as 'a' | 'b' | 'c',
    reference: question.reference,
    passage: question.passage,
    explanation: question.explanation,
  }));
}

// Conteúdo demonstrativo versionado; aprovação editorial final pendente.
export const CREATION_QUIZ = creationQuizFromManifest(CREATION_CONTENT_V1);
