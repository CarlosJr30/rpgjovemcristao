'use client';

import { useState, type FormEvent } from 'react';
import { scoreGardenQuiz } from '../journey/data/gardenQuiz';
import { CREATION_DAYS, creationPassageUrl } from './creation-days';
import { CREATION_QUIZ } from './creation-quiz-content';
import css from './creation-explorer.module.css';

export type QuizAnswers = Readonly<Record<string, string>>;

function focusQuestion(element: HTMLHeadingElement | null) {
  element?.focus();
}

export function CreationQuiz({
  onComplete,
}: {
  onComplete: (answers: QuizAnswers) => void;
}) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [selected, setSelected] = useState<string>();
  const index = Object.keys(answers).length;
  const question = CREATION_QUIZ[index];

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !question ||
      !question.options.some((option) => option.id === selected) ||
      !selected
    )
      return;
    const next = { ...answers, [question.id]: selected };
    setAnswers(next);
    setSelected(undefined);
    if (index === CREATION_QUIZ.length - 1) onComplete(next);
  }

  return (
    <section className={css.panel} aria-labelledby="creation-quiz-title">
      <h2 id="creation-quiz-title" tabIndex={-1}>
        Quiz Bíblico da Criação
      </h2>
      <p>Quiz demonstrativo. Perguntas em revisão editorial.</p>
      {question && (
        <form onSubmit={confirm}>
          <h3
            id="creation-question"
            tabIndex={-1}
            key={question.id}
            ref={focusQuestion}
          >
            Pergunta {index + 1} de {CREATION_QUIZ.length} · {question.question}
          </h3>
          <fieldset aria-labelledby="creation-question">
            {question.options.map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                />
                {option.text}
              </label>
            ))}
            <button type="submit" disabled={!selected}>
              Confirmar resposta
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}

export function CreationJourneySummary({
  answers,
  discoveries,
  onRepeat,
}: {
  answers: QuizAnswers;
  discoveries: readonly string[];
  onRepeat: () => void;
}) {
  const score = scoreGardenQuiz(CREATION_QUIZ, answers);
  return (
    <section className={css.panel} aria-labelledby="creation-summary-title">
      <h2 id="creation-summary-title" tabIndex={-1}>
        Resumo da Jornada
      </h2>
      <p role="status">
        Você concluiu o Quiz da Criação! {score} de {CREATION_QUIZ.length}{' '}
        acertos.
      </p>
      <p>
        Descobertas na demonstração · {discoveries.length} de{' '}
        {CREATION_DAYS.length} dias.
      </p>
      <p>
        O vídeo obrigatório ainda falta para a conclusão oficial futura da fase.
      </p>
      <p>
        Recompensa futura prevista para 5 de 5: 60 XP e 1 Baú Raro, uma vez por
        identidade elegível. A demo não entrega recompensas.
      </p>
      <button type="button" onClick={onRepeat}>
        Repetir quiz
      </button>
      <h3>Revisão das respostas</h3>
      <ol>
        {CREATION_QUIZ.map((question) => (
          <li key={question.id}>
            <strong>{question.question}</strong>
            <p>
              {answers[question.id] === question.correctOptionId
                ? 'Você acertou.'
                : 'Você errou.'}{' '}
              Resposta correta:{' '}
              {
                question.options.find(
                  ({ id }) => id === question.correctOptionId,
                )?.text
              }
              .
            </p>
            <p>
              {question.explanation}{' '}
              <a
                href={creationPassageUrl(question.passage)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {question.reference} (NVI) ↗
              </a>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
