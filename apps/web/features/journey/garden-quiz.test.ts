import { describe, expect, test } from 'vitest';
import { GARDEN_QUIZ_BANK, createGardenQuizSession, scoreGardenQuiz } from './data/gardenQuiz';

describe('Quiz da Fase 1.1', () => {
  test('mantém banco com pelo menos 12 perguntas e IDs próprios', () => {
    expect(GARDEN_QUIZ_BANK.length).toBeGreaterThanOrEqual(12);
    for (const item of GARDEN_QUIZ_BANK) {
      expect(new Set(item.options.map((option) => option.id)).size).toBe(4);
      expect(item.options.some((option) => option.id === item.correctOptionId)).toBe(true);
    }
  });

  test.each([1, 2, 7, 31, 99])('shuffle seed %i preserva gabarito e distribui A/B/C/D', (seed) => {
    const session = createGardenQuizSession(seed);
    const positions = session.map((item) => item.options.findIndex((option) => option.id === item.correctOptionId));
    expect(session).toHaveLength(5);
    expect(new Set(positions)).toEqual(new Set([0, 1, 2, 3]));
    expect(session.every((item) => item.options[item.options.findIndex((option) => option.id === item.correctOptionId)].id === item.correctOptionId)).toBe(true);
  });

  test('score continua correto depois do shuffle', () => {
    const session = createGardenQuizSession(42);
    const answers = Object.fromEntries(session.map((item, index) => [item.id, index < 3 ? item.correctOptionId : item.options.find((option) => option.id !== item.correctOptionId)!.id]));
    expect(scoreGardenQuiz(session, answers)).toBe(3);
  });

  test('nova tentativa altera perguntas ou alternativas de forma reproduzível', () => {
    expect(createGardenQuizSession(8)).toEqual(createGardenQuizSession(8));
    expect(createGardenQuizSession(8)).not.toEqual(createGardenQuizSession(9));
  });
});
