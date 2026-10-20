'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Traveler } from '../journey/domain/traveler';
import { SnakeChaseGame } from '../journey/components/snake-chase-game';
import { getGameplayAvatarPortrait } from '../journey/data/gameplayAvatarPortrait';
import { useAudioScene } from '../journey/hooks/use-game-audio';
import { STEP_LABELS } from './catalog';
import type { OriginsLesson } from './origins-lessons';
import {
  appendWorkbook,
  emptyWorkbookState,
  lessonQuiz,
  readWorkbook,
  replayWorkbook,
  transitionWorkbook,
  workbookStage,
  type Workbook,
  type WorkbookEvent,
} from './workbook';
import css from './story.module.css';

export function OriginsWorkbook({
  lesson,
  traveler,
  ownerId,
}: {
  lesson: OriginsLesson;
  traveler: Traveler;
  ownerId?: string;
}) {
  const [book, setBook] = useState<Workbook | null>(null);
  const [error, setError] = useState('');
  const [sceneId, setSceneId] = useState(lesson.scenes[0].id);
  const [draft, setDraft] = useState('');
  const [tutorial, setTutorial] = useState(false);
  const scope = useMemo(
    () => ({
      owner: ownerId ?? 'preview',
      traveler: traveler.id,
      storyId: lesson.storyId,
      revision: lesson.revision,
    }),
    [ownerId, traveler.id, lesson.storyId, lesson.revision],
  );
  const pending = useRef(false);
  useEffect(() => {
    let live = true;
    const load = () => {
      try {
        const saved = ownerId
          ? readWorkbook(lesson, scope, localStorage)
          : { scope, events: [] };
        if (live) {
          setBook(saved);
          setError('');
        }
      } catch {
        if (live) {
          setBook(null);
          setError(
            'Não foi possível retomar o caderno. O registro original foi preservado; nenhuma conclusão foi concedida.',
          );
        }
      }
    };
    // Defer to avoid rendering a previous identity while opening storage.
    const timer = setTimeout(load, 0);
    window.addEventListener('storage', load);
    return () => {
      live = false;
      clearTimeout(timer);
      window.removeEventListener('storage', load);
    };
  }, [lesson, scope, ownerId]);
  const current =
    book && JSON.stringify(book.scope) === JSON.stringify(scope) ? book : null;
  const state = current
    ? replayWorkbook(lesson, current.events)
    : emptyWorkbookState();
  const stage = workbookStage(lesson, state),
    quiz = lessonQuiz(lesson, state.attempt);
  useAudioScene(
    stage === 'quiz'
      ? 'quiz'
      : stage === 'reading' || stage === 'reflection'
        ? 'devotional'
        : stage === 'activity' && lesson.storyId === 'garden-choice'
          ? 'snake'
          : null,
  );
  function dispatch(event: WorkbookEvent) {
    if (!current || pending.current) return;
    pending.current = true;
    try {
      if (ownerId)
        setBook(appendWorkbook(lesson, current, event, localStorage));
      else {
        transitionWorkbook(lesson, state, event);
        setBook({ ...current, events: [...current.events, event] });
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Atividade não registrada.');
    } finally {
      pending.current = false;
    }
  }
  const scene = lesson.scenes.find((c) => c.id === sceneId) ?? lesson.scenes[0];
  return (
    <section
      className={`${css.panel} ${css.workbook}`}
      aria-label="Aventura de estudo"
    >
      <p className={css.eyebrow}>
        Prévia educativa · revisão editorial pendente
      </p>
      <h2>Explore esta história</h2>
      <p>{lesson.objective}</p>
      <p className={css.meta}>
        Este caderno guarda somente atividades demonstrativas{' '}
        {ownerId
          ? 'desta conta e deste Viajante neste navegador'
          : 'durante esta visita'}
        . Não conclui histórias oficialmente, não libera a próxima história e
        não concede recompensas. Textos são paráfrases educacionais; o jogador
        não altera os acontecimentos bíblicos.
      </p>
      <p role="status">Etapa da prévia: {STEP_LABELS[stage]}</p>
      {error && <p role="alert">{error}</p>}
      {!current ? (
        <p>Retomada do caderno pendente.</p>
      ) : (
        <>
          <nav
            className={css.sceneGrid}
            aria-label="Acontecimentos da história"
          >
            {lesson.scenes.map((c, index) => (
              <button
                key={c.id}
                aria-pressed={scene.id === c.id}
                onClick={() => {
                  setSceneId(c.id);
                  dispatch({ type: 'visit', sceneId: c.id });
                }}
              >
                <span aria-hidden="true">
                  {state.visited.includes(c.id) ? '✓' : '◇'}
                </span>{' '}
                {index + 1}. {c.title}
              </button>
            ))}
          </nav>
          <article className={css.lessonScene} aria-label={scene.title}>
            <h3>{scene.title}</h3>
            <p>{scene.text}</p>
            <small>{scene.reference} · Paráfrase educacional candidata</small>
          </article>
          {stage === 'explore' && (
            <p>
              Explore os {lesson.scenes.length} acontecimentos para abrir a
              leitura. Visitados: {state.visited.length}/{lesson.scenes.length}.
            </p>
          )}
          {stage === 'reading' && (
            <section aria-label="Leitura obrigatória">
              <h3>Abra a Bíblia e volte à aventura</h3>
              <p>
                Leia os trechos indicados. Sua confirmação é pessoal; abrir um
                link não comprova leitura nem concede progresso oficial.
              </p>
              {lesson.readings.map((r) => (
                <article className={css.readingRow} key={r.chapter}>
                  <strong>{r.reference}</strong>
                  <a
                    className={css.link}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      dispatch({ type: 'reading-open', chapter: r.chapter })
                    }
                  >
                    Abrir {r.reference} ↗
                  </a>
                  <button
                    disabled={
                      !state.opened.includes(r.chapter) ||
                      state.read.includes(r.chapter)
                    }
                    onClick={() =>
                      dispatch({ type: 'reading-confirm', chapter: r.chapter })
                    }
                  >
                    {state.read.includes(r.chapter)
                      ? 'Leitura confirmada'
                      : `Confirmar leitura de Gênesis ${r.chapter}`}
                  </button>
                </article>
              ))}
              <p className={css.meta}>
                Link externo para YouVersion/NVI, seguindo a integração de
                leitura existente. Nenhum texto integral é reproduzido aqui.
              </p>
            </section>
          )}
          {stage === 'activity' && (
            <section aria-label="Atividade da história">
              <h3>{lesson.activity.title}</h3>
              <p>{lesson.activity.instructions}</p>
              <p className={css.meta}>
                Atividade FICTIONAL: exercício do jogo, sem alterar o relato.
              </p>
              {lesson.storyId === 'garden-choice' ? (
                <SnakeChaseGame
                  portrait={getGameplayAvatarPortrait(traveler)}
                  tutorialCompleted={tutorial}
                  onTutorialComplete={() => setTutorial(true)}
                  onComplete={() => dispatch({ type: 'snake-complete' })}
                />
              ) : (
                lesson.activity.tasks.map((task) => (
                  <div className={css.task} key={task.id}>
                    <label>
                      {task.prompt}
                      <select
                        aria-label={task.prompt}
                        value={state.tasks[task.id] ?? ''}
                        onChange={(e) =>
                          dispatch({
                            type: 'task',
                            taskId: task.id,
                            choice: e.target.value,
                          })
                        }
                      >
                        <option value="" disabled>
                          Escolha uma associação
                        </option>
                        {lesson.activity.options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.text}
                          </option>
                        ))}
                      </select>
                    </label>
                    {state.tasks[task.id] !== undefined && (
                      <p role="status">
                        {state.tasks[task.id] === task.answer
                          ? 'Associação correta.'
                          : 'Vamos tentar outra vez.'}{' '}
                        {task.feedback}
                      </p>
                    )}
                  </div>
                ))
              )}
            </section>
          )}
          {stage === 'quiz' && (
            <section aria-label="Quiz da história">
              <h3>O que você compreendeu?</h3>
              <p>
                Acerte as {quiz.length} perguntas para seguir. Você pode tentar
                de novo; não há prêmio por repetição.
              </p>
              {quiz.map((q, index) => (
                <fieldset key={q.id}>
                  <legend>
                    {index + 1}. {q.question}
                  </legend>
                  {q.options.map((option) => (
                    <label className={css.quizOption} key={option.id}>
                      <input
                        type="radio"
                        name={`${lesson.storyId}:${q.id}`}
                        checked={state.answers[q.id] === option.id}
                        onChange={() =>
                          dispatch({
                            type: 'quiz-answer',
                            questionId: q.id,
                            optionId: option.id,
                          })
                        }
                      />
                      {option.text}
                    </label>
                  ))}
                  {state.answers[q.id] && (
                    <p role="status">
                      {state.answers[q.id] === q.correctOptionId
                        ? 'Boa observação.'
                        : 'Releia e tente novamente.'}{' '}
                      {q.explanation} <small>{q.reference}</small>
                    </p>
                  )}
                </fieldset>
              ))}
              <button onClick={() => dispatch({ type: 'quiz-retry' })}>
                Tentar quiz novamente
              </button>
              <button disabled={!quiz.every(q=>state.answers[q.id]===q.correctOptionId)} onClick={()=>dispatch({type:'quiz-confirm'})}>Continuar para reflexão</button>
            </section>
          )}
          {stage === 'reflection' && (
            <section aria-label="Reflexão privada">
              <h3>Uma pausa para refletir</h3>
              <details>
                <summary>Quiz concluído: confira as explicações</summary>
                {quiz.map((q) => (
                  <p key={q.id}>
                    {q.explanation} <small>{q.reference}</small>
                  </p>
                ))}
              </details>
              {lesson.reflection.map((prompt) => (
                <p key={prompt}>{prompt}</p>
              ))}
              <label>
                Rascunho opcional, somente nesta tela
                <textarea
                  rows={4}
                  maxLength={600}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </label>
              <p className={css.meta}>
                Sem nota e sem avaliação de espiritualidade. Seu texto não será
                salvo nem enviado ao líder. Se preferir, reflita em silêncio.
              </p>
              <button
                onClick={() => {
                  setDraft('');
                  dispatch({ type: 'reflect' });
                }}
              >
                Refleti em particular
              </button>
            </section>
          )}
          {stage === 'video' && (
            <section aria-label="Vídeo pendente da prévia">
              <h3>Atividades desta prévia realizadas</h3>
              <p>
                O vídeo obrigatório ainda está pendente. As atividades não
                concluem a história, não liberam a seguinte e não geram XP,
                moedas ou baús.
              </p>
              <p>
                Quando houver vídeo autorizado e registro válido no servidor, a
                conclusão oficial seguirá o fluxo individual existente.
              </p>
              <button onClick={() => dispatch({ type: 'quiz-retry' })}>
                Revisar o quiz sem recompensa
              </button>
            </section>
          )}
        </>
      )}
    </section>
  );
}
