import { CREATION_DEMO_FEEDBACK } from './creation-demo-feedback';
import type { GardenQuizSessionQuestion } from '../journey/data/gardenQuiz';
import {
  CREATION_CONTENT_V1,
  type CreationContentManifest,
  type CreationContentQuizQuestion,
} from './creation-days';

export type CreationQuizQuestion = Pick<GardenQuizSessionQuestion, 'id' | 'question' | 'options' | 'reference'> & { passage: string };

export function creationQuizFromManifest(
  manifest: CreationContentManifest,
): readonly CreationQuizQuestion[] {
  return manifest.quiz.map((question: CreationContentQuizQuestion) => ({
    id: question.id,
    question: question.question,
    options: question.options.map((text, index) => ({
      id: question.optionIds[index],
      text,
    })),
    reference: question.reference,
    passage: question.passage,
  }));
}

// Conteúdo demonstrativo versionado; aprovação editorial final pendente.
export const CREATION_QUIZ = creationQuizFromManifest(CREATION_CONTENT_V1).map((question) => {
  const feedback = CREATION_DEMO_FEEDBACK[question.id];
  return {
    ...question,
    correctOptionId: question.options[feedback.correctIndex].id,
    explanation: feedback.explanation,
  };
});
