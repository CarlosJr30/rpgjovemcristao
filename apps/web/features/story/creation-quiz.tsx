'use client';

import { useRef, useState, type FormEvent } from 'react';
import { scoreGardenQuiz } from '../journey/data/gardenQuiz';
import {
  CREATION_DAYS,
  creationPassageUrl,
} from './creation-days';
import { CREATION_QUIZ, type CreationQuizQuestion } from './creation-quiz-content';
import { CREATION_DEMO_FEEDBACK } from './creation-demo-feedback';
import css from './creation-explorer.module.css';

export type QuizAnswers = Readonly<Record<string, string>>;

function focusQuestion(element: HTMLHeadingElement | null) {
  element?.focus();
}

export function CreationQuiz({
  onComplete,
  remote = false,
  questions = CREATION_QUIZ,
}: {
  onComplete: (answers: QuizAnswers) => void | Promise<boolean>;
  remote?: boolean;
  questions?: readonly CreationQuizQuestion[];
}) {
  const request = useRef(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [selected, setSelected] = useState<string>();
  const index = Object.keys(answers).length;
  const question = questions[index];

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      request.current ||
      !question ||
      !question.options.some((option) => option.id === selected) ||
      !selected
    )
      return;
    const next = { ...answers, [question.id]: selected };
    if (remote && index === questions.length - 1) {
      request.current = true;
      setPending(true);
      try {
        const confirmed = await onComplete(next);
        if (!confirmed) {
          setFailed(true);
          return;
        }
      } finally {
        request.current = false;
        setPending(false);
      }
    }
    setAnswers(next);
    setSelected(undefined);
    if (!remote && index === questions.length - 1) onComplete(next);
  }

  return (
    <section className={css.panel} aria-labelledby="creation-quiz-title">
      <h2 id="creation-quiz-title" tabIndex={-1}>
        Quiz Bíblico da Criação
      </h2>
      {!remote && <p>Quiz demonstrativo. As respostas locais não geram progresso oficial.</p>}
      {question && (
        <form onSubmit={confirm}>
          <h3
            id="creation-question"
            tabIndex={-1}
            key={question.id}
            ref={focusQuestion}
          >
            Pergunta {index + 1} de {questions.length} · {question.question}
          </h3>
          <fieldset
            disabled={pending || failed}
            aria-labelledby="creation-question"
          >
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
          {failed && (
            <p role="alert">Não foi possível confirmar a tentativa.</p>
          )}
          {failed && (
            <button type="submit" disabled={pending}>
              Reenviar tentativa
            </button>
          )}
        </form>
      )}
    </section>
  );
}

export function CreationJourneySummary({
  answers,
  discoveries,
  onRepeat,
  onOpenVideo,
}: {
  answers: QuizAnswers;
  discoveries: readonly string[];
  onRepeat: () => void;
  onOpenVideo: () => void;
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
      <p>Harmonia da Criação · concluída na demonstração.</p>
      <ol aria-label="Resumo dos sete dias da Criação">
        {CREATION_DAYS.map((day, index) => (
          <li key={day.id}>
            <strong>
              Dia {index + 1} · {day.title}.
            </strong>{' '}
            {CREATION_DEMO_FEEDBACK[day.id].explanation}
          </li>
        ))}
      </ol>
      <p>
        Leia <a href={creationPassageUrl('1')}>Gênesis 1 (NVI)</a> e{' '}
        <a href={creationPassageUrl('2.1-3')}>Gênesis 2:1–3 (NVI)</a>.
      </p>
      <p>
        Se desejar, faça uma pausa para refletir sobre a Criação e agradecer a
        Deus em oração.
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
      </button>{' '}
      <button type="button" onClick={onOpenVideo}>
        Abrir etapa do vídeo obrigatório
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
