// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { blankQuizQuestions, ClassQuizPanel, validateQuiz } from './quiz';
import { fixtureLesson } from './fixtures.test-data';
import type { ClassQuiz } from './contracts';
afterEach(cleanup);
const questions = () =>
  blankQuizQuestions().map((q, i) => ({
    ...q,
    prompt: 'Question ' + i,
    options: ['A', 'B', 'C', 'D'],
    answerKey: i % 4,
  }));
const lesson = fixtureLesson({ canParticipate: false });
const quiz: ClassQuiz = {
  id: 'quiz',
  lessonId: 'lesson',
  revision: 1,
  difficulty: 'easy',
  questions: questions().map((q) => ({
    prompt: q.prompt,
    options: q.options,
    reference: q.reference,
  })),
};
test('published quizzes require seven complete questions with exactly four distinct alternatives', () => {
  expect(validateQuiz(questions())).toBe(true);
  expect(validateQuiz(questions().slice(1))).toBe(false);
  expect(
    validateQuiz(
      questions().map((q, i) =>
        i === 0 ? { ...q, options: ['A', 'A', 'B', 'C'] } : q,
      ),
    ),
  ).toBe(false);
  expect(
    validateQuiz(
      questions().map((q, i) => (i === 0 ? { ...q, answerKey: 4 } : q)),
    ),
  ).toBe(false);
});
test('student sees all seven groups, submits choices only and never sends an arbitrary grade', async () => {
  const command = vi.fn().mockResolvedValue(true);
  render(
    <ClassQuizPanel
      lesson={{
        ...lesson,
        status: 'published',
        canEdit: false,
        canParticipate: true,
      }}
      quiz={quiz}
      results={[]}
      actor="student"
      busy={false}
      command={command}
    />,
  );
  const form = screen.getByRole('form', { name: 'Responder sete perguntas' });
  expect(within(form).getAllByRole('group')).toHaveLength(7);
  within(form)
    .getAllByRole('group')
    .forEach((g) => {
      expect(within(g).getAllByRole('radio')).toHaveLength(4);
      fireEvent.click(within(g).getAllByRole('radio')[0]);
    });
  expect(screen.queryByText(/Gabarito do responsável/)).not.toBeInTheDocument();
  fireEvent.submit(form);
  expect(command).toHaveBeenCalledWith(
    'quiz_submit',
    'lesson',
    1,
    { quizId: 'quiz', choices: [0, 0, 0, 0, 0, 0, 0] },
    expect.any(String),
  );
});
test('lesson without quiz is valid content-only and does not promise rewards', () => {
  render(
    <ClassQuizPanel
      lesson={{ ...lesson, canEdit: false, status: 'published' }}
      results={[]}
      actor="student"
      busy={false}
      command={vi.fn()}
    />,
  );
  expect(screen.getByText(/não possui questionário/)).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Enviar sete respostas' }),
  ).not.toBeInTheDocument();
});
test('teacher editor keeps exactly seven questions and draft save is separate from publication', () => {
  render(
    <ClassQuizPanel
      lesson={lesson}
      results={[]}
      actor="teacher"
      busy={false}
      command={vi.fn()}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Preparar questionário' }),
  );
  const form = screen.getByRole('form', { name: 'Editor de sete perguntas' });
  expect(within(form).getAllByRole('group')).toHaveLength(7);
  expect(
    screen.getByRole('button', { name: 'Salvar sete perguntas' }),
  ).toBeInTheDocument();
});
