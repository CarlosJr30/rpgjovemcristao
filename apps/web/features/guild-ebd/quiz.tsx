'use client';
import { useState } from 'react';
import type { ClassQuiz, Lesson, QuizQuestion, QuizResult } from './contracts';
import type { Command } from './participation';
import css from '../guild-missions/panel.module.css';
export const blankQuizQuestions = (): QuizQuestion[] =>
  Array.from({ length: 7 }, () => ({
    prompt: '',
    options: ['', '', '', ''],
    answerKey: 0,
    reference: '',
    feedback: '',
  }));
export function validateQuiz(questions: QuizQuestion[]) {
  return (
    questions.length === 7 &&
    questions.every(
      (q) =>
        q.prompt.trim().length > 0 &&
        q.prompt.length <= 2000 &&
        q.options.length === 4 &&
        q.options.every((v) => !!v.trim() && v.length <= 300) &&
        new Set(q.options.map((v) => v.trim())).size === 4 &&
        Number.isInteger(q.answerKey) &&
        q.answerKey! >= 0 &&
        q.answerKey! <= 3 &&
        q.reference.length <= 100 &&
        (q.feedback ?? '').length <= 1000,
    )
  );
}
export function ClassQuizPanel({
  lesson,
  quiz,
  results,
  actor,
  busy,
  command,
}: {
  lesson: Lesson;
  quiz?: ClassQuiz;
  results: QuizResult[];
  actor: string;
  busy: boolean;
  command: Command;
}) {
  const [editing, setEditing] = useState(false),
    [choices, setChoices] = useState<string[]>(Array(7).fill(''));
  return (
    <section className={css.card} aria-label="Questionário de sete perguntas">
      <h3>Questionário de sete perguntas</h3>
      <p>
        Aprendizagem sem custo e sem recompensas. O servidor corrige as
        respostas; a primeira tentativa é o registro oficial único desta versão.
        Outras tentativas são para aprendizagem.
      </p>
      {lesson.canEdit && lesson.status === 'draft' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setEditing((v) => !v)}
        >
          {quiz ? 'Editar questionário' : 'Preparar questionário'}
        </button>
      )}
      {editing && (
        <>
          {quiz && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (
                  await command(
                    'quiz_remove',
                    lesson.id,
                    lesson.ebd_revision,
                    { lessonId: lesson.id },
                    'Questionário retirado do rascunho; histórico preservado.',
                  )
                )
                  setEditing(false);
              }}
            >
              Retirar questionário do rascunho
            </button>
          )}
          <QuizEditor
            initial={quiz}
            busy={busy}
            onClose={() => setEditing(false)}
            onSave={async (difficulty, questions) => {
              const ok = await command(
                'quiz',
                lesson.id,
                lesson.ebd_revision,
                { lessonId: lesson.id, difficulty, questions },
                'Questionário salvo no rascunho.',
              );
              if (ok) setEditing(false);
              return ok;
            }}
          />
        </>
      )}
      {!quiz && !editing && (
        <p>
          Esta aula não possui questionário. A participação pode acontecer pelo
          conteúdo ou pelas atividades.
        </p>
      )}
      {quiz && !editing && (
        <>
          <p>
            Dificuldade:{' '}
            {
              { easy: 'Inicial', medium: 'Intermediária', hard: 'Avançada' }[
                quiz.difficulty
              ]
            }{' '}
            · Versão {quiz.revision}
          </p>
          <form
            className={css.form}
            aria-label="Responder sete perguntas"
            onSubmit={async (e) => {
              e.preventDefault();
              if (choices.some((v) => v === '')) return;
              await command(
                'quiz_submit',
                lesson.id,
                quiz.revision,
                { quizId: quiz.id, choices: choices.map(Number) },
                'Respostas corrigidas e resultado persistido pelo servidor.',
              );
            }}
          >
            {quiz.questions.map((q, index) => (
              <fieldset key={q.id ?? index}>
                <legend>Pergunta {index + 1} de 7</legend>
                <p>{q.prompt}</p>
                {q.reference && <p>Referência:{q.reference}</p>}
                {q.options.map((option, k) => (
                  <label className={css.check} key={k}>
                    <input
                      type="radio"
                      name={`${quiz.id}-${index}`}
                      required
                      value={k}
                      checked={choices[index] === String(k)}
                      disabled={busy || !lesson.canParticipate}
                      onChange={() =>
                        setChoices((old) =>
                          old.map((v, j) => (j === index ? String(k) : v)),
                        )
                      }
                    />
                    {option}
                  </label>
                ))}
                {lesson.canEdit && typeof q.answerKey === 'number' && (
                  <p>Gabarito do responsável:{q.options[q.answerKey]}</p>
                )}
              </fieldset>
            ))}
            {lesson.canParticipate && (
              <button disabled={busy}>Enviar sete respostas</button>
            )}
          </form>
        </>
      )}
      {results.map((r) => (
        <article className={css.notice} key={`${r.quiz_id}:${r.traveler_id}`}>
          <h4>{r.traveler_id === actor ? 'Seu resultado' : r.traveler_name}</h4>
          <p>
            Registro oficial: {r.score}/7 · Questionário v{r.quizRevision} ·{' '}
            {r.attempts} tentativa(s) de aprendizagem.
          </p>
          <p>
            Acertos na última tentativa:{' '}
            {r.latest.filter((x) => x.correct).length}/7. Este resultado avalia
            o exercício, não a fé.
          </p>
          <ol>
            {r.latest.map((x) => (
              <li key={x.position}>
                Pergunta {x.position}:{' '}
                {x.correct ? 'Resposta correta' : 'Continue aprendendo'}
                {x.feedback && ` · ${x.feedback}`}
              </li>
            ))}
          </ol>
        </article>
      ))}
    </section>
  );
}
export function QuizEditor({
  initial,
  busy,
  onSave,
  onClose,
  perQuestionDifficulty = false,
}: {
  perQuestionDifficulty?: boolean;
  initial?: ClassQuiz;
  busy: boolean;
  onSave: (
    difficulty: ClassQuiz['difficulty'],
    questions: QuizQuestion[],
  ) => Promise<boolean>;
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(
      initial
        ? initial.questions.map((q) => ({
            prompt: q.prompt,
            options: [...q.options],
            answerKey: q.answerKey ?? 0,
            reference: q.reference,
            feedback: q.feedback ?? '',
            ...(perQuestionDifficulty
              ? { difficulty: q.difficulty ?? 'easy' }
              : {}),
          }))
        : blankQuizQuestions(),
    ),
    [difficulty, setDifficulty] = useState<ClassQuiz['difficulty']>(
      initial?.difficulty ?? 'easy',
    ),
    [error, setError] = useState('');
  const update = (index: number, patch: Partial<QuizQuestion>) =>
    setQuestions((old) =>
      old.map((q, j) => (j === index ? { ...q, ...patch } : q)),
    );
  return (
    <form
      className={css.form}
      aria-label="Editor de sete perguntas"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          !validateQuiz(questions) ||
          (perQuestionDifficulty && questions.some((q) => !q.feedback?.trim()))
        ) {
          setError(
            'Preencha sete perguntas com quatro alternativas distintas e uma resposta correta em cada.',
          );
          return;
        }
        setError('');
        await onSave(
          difficulty,
          perQuestionDifficulty
            ? questions.map((q) => ({
                ...q,
                difficulty: q.difficulty ?? 'easy',
              }))
            : questions,
        );
      }}
    >
      {error && <p role="alert">{error}</p>}
      {!perQuestionDifficulty && (
        <label>
          Dificuldade
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as ClassQuiz['difficulty'])
            }
          >
            <option value="easy">Inicial</option>
            <option value="medium">Intermediária</option>
            <option value="hard">Avançada</option>
          </select>
        </label>
      )}
      {questions.map((q, index) => (
        <fieldset key={index}>
          <legend>Pergunta {index + 1}</legend>
          {perQuestionDifficulty && (
            <label>
              Dificuldade da pergunta
              <select
                value={q.difficulty ?? 'easy'}
                onChange={(e) =>
                  update(index, {
                    difficulty: e.target.value as ClassQuiz['difficulty'],
                  })
                }
              >
                <option value="easy">Inicial</option>
                <option value="medium">Intermediária</option>
                <option value="hard">Avançada</option>
              </select>
            </label>
          )}
          <label>
            Enunciado
            <textarea
              required
              maxLength={2000}
              value={q.prompt}
              onChange={(e) => update(index, { prompt: e.target.value })}
            />
          </label>
          {q.options.map((v, k) => (
            <label key={k}>
              Alternativa {k + 1}
              <input
                required
                maxLength={300}
                value={v}
                onChange={(e) =>
                  update(index, {
                    options: q.options.map((o, j) =>
                      j === k ? e.target.value : o,
                    ),
                  })
                }
              />
            </label>
          ))}
          <label>
            Resposta correta
            <select
              value={q.answerKey}
              onChange={(e) =>
                update(index, { answerKey: Number(e.target.value) })
              }
            >
              {q.options.map((_, k) => (
                <option key={k} value={k}>
                  Alternativa {k + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Referência bíblica (opcional)
            <input
              maxLength={100}
              value={q.reference}
              onChange={(e) => update(index, { reference: e.target.value })}
            />
          </label>
          <label>
            Feedback educativo
            <textarea
              maxLength={1000}
              required={perQuestionDifficulty}
              value={q.feedback}
              onChange={(e) => update(index, { feedback: e.target.value })}
            />
          </label>
        </fieldset>
      ))}
      <button disabled={busy}>Salvar sete perguntas</button>
      <button type="button" disabled={busy} onClick={onClose}>
        Cancelar questionário
      </button>
    </form>
  );
}
