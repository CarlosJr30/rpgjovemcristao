'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type FormEvent,
} from 'react';
import type { ArchiveSnapshot } from '../../lib/supabase/online-sync';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';
import {
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../../lib/supabase/online-sync';
import {
  createCreationCheckpointRepository,
  CreationCheckpointUnavailable,
  type CreationCheckpointSnapshot,
} from '../../lib/supabase/repositories/creation-checkpoint-repository';
import { creationManifestId } from './creation-manifest';
import {
  creationDaysFromManifest,
  parseCreationManifestText,
  CREATION_CONTENT_V1,
  type CreationContentManifest,
} from './creation-days';
import { creationQuizFromManifest } from './creation-quiz-content';
import {
  clearPendingQuiz,
  discardPendingQuizForOtherTraveler,
  invalidatePendingQuiz,
  preparePendingQuiz,
  readPendingQuiz,
} from './creation-pending-quiz';
import { useStoryProgress } from './use-story-progress';
import { ArchiveAccess } from '../release-ebd/archive';
import { AvatarRuntime } from '../journey/components/avatar-runtime';
import type { Point } from './creation-explorer-model';
import { movePoint, pointIsNear } from './creation-explorer-model';
import { creationPassageUrl } from './creation-days';
import { CreationHarmony } from './creation-harmony';
import { CreationFinale, CreationVideoStage } from './creation-finale';
import {
  CreationJourneySummary,
  CreationQuiz,
  type QuizAnswers,
} from './creation-quiz';
import { CreationDiaryChapter } from '../journey/components/creation-diary-chapter';
import book from '../journey/components/diary-experience.module.css';
import css from './creation-explorer.module.css';

const PORTAL: Point = { x: 78, y: 50 };
const START: Point = { x: 22, y: 52 };
const INITIAL: Point = { x: 18, y: 50 };
const EXIT: Point = { x: 18, y: 52 };
const RETURN_MARKER = {
  point: EXIT,
  label: 'Retornar ao Santuário',
  symbol: '↩',
};
const KEYS: Record<string, Point> = {
  w: { x: 0, y: -5 },
  arrowup: { x: 0, y: -5 },
  s: { x: 0, y: 5 },
  arrowdown: { x: 0, y: 5 },
  a: { x: -5, y: 0 },
  arrowleft: { x: -5, y: 0 },
  d: { x: 5, y: 0 },
  arrowright: { x: 5, y: 0 },
};

function focusChallenge(form: HTMLFormElement | null) {
  form?.focus();
}

export function CreationExplorerScreen() {
  return (
    <ArchiveAccess>
      {(snapshot) => <AuthenticatedExplorer snapshot={snapshot} />}
    </ArchiveAccess>
  );
}

const checkpointRepository = createCreationCheckpointRepository(
  async (name, args) => getSupabaseBrowserClient().rpc(name, args),
);

function AuthenticatedExplorer({ snapshot }: { snapshot: ArchiveSnapshot }) {
  if (
    process.env.NEXT_PUBLIC_CREATION_CHECKPOINTS !== 'true' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') !==
      'https://wkdvdzfkbwvhyjmamrsg.supabase.co'
  )
    return <DemoExplorer snapshot={snapshot} />;
  const accountId = getCurrentOnlineUserId();
  if (!accountId) return <DemoExplorer snapshot={snapshot} />;
  return (
    <CheckpointExplorer
      accountId={accountId}
      key={snapshot.traveler.id + ':' + getOnlineSessionRevision()}
      snapshot={snapshot}
    />
  );
}

export function CheckpointExplorer(props: CheckpointExplorerProps) {
  return (
    <CheckpointSession
      key={props.accountId + ':' + props.snapshot.traveler.id}
      {...props}
    />
  );
}

type CheckpointExplorerProps = {
  accountId: string;
  snapshot: ArchiveSnapshot;
  repository?: typeof checkpointRepository;
};

function CheckpointSession({
  snapshot,
  accountId,
  repository = checkpointRepository,
}: CheckpointExplorerProps) {
  const [initial, setInitial] = useState<CreationCheckpointSnapshot | null>();
  const [failed, setFailed] = useState(false);
  const [content, setContent] = useState<CreationContentManifest>();
  const [contentError, setContentError] = useState('');
  const [hasPendingQuiz, setHasPendingQuiz] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const id = snapshot.traveler.id;
  useEffect(() => {
    let active = true;
    try {
      discardPendingQuizForOtherTraveler(accountId, id);
    } catch {
      // An unavailable store is handled when a quiz is submitted.
    }
    repository.read(id).then(
      async (progress) => {
        if (!active) return;
        if (!progress.available) {
          setInitial(progress);
          return;
        }
        let parsed: CreationContentManifest;
        try {
          if (!progress.manifestText || !progress.manifestHash)
            throw new Error('Published content is missing.');
          parsed = parseCreationManifestText(
            progress.manifestText,
            progress.revision,
          );
          if (
            (await creationManifestId(progress.manifestText)) !==
            progress.manifestHash
          )
            throw new Error('Published content integrity mismatch.');
        } catch {
          if (!active) return;
          setContent(undefined);
          setContentError(
            'O conteúdo publicado não pôde ser validado. Recarregue a revisão autorizada.',
          );
          setInitial(progress);
          return;
        }
        if (!active) return;
        setContent(parsed);
        setContentError('');
        const scope = JSON.stringify([
          accountId,
          id,
          progress.revision,
          progress.manifestHash,
        ]);
        try {
          if (progress.available)
            setHasPendingQuiz(Boolean(readPendingQuiz(scope)));
          else {
            invalidatePendingQuiz();
            setHasPendingQuiz(false);
          }
        } catch {
          // Optional browser storage does not authorize checkpoints.
        }
        setInitial(progress);
      },
      (error: unknown) => {
        if (!active) return;
        if (error instanceof CreationCheckpointUnavailable) setInitial(null);
        else setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [accountId, id, attempt, repository]);
  if (failed)
    return (
      <section>
        <p role="alert">
          Não foi possível consultar os checkpoints. Verifique sua conexão e
          sessão.
        </p>
        <button
          onClick={() => {
            setFailed(false);
            setAttempt(attempt + 1);
          }}
        >
          Tentar novamente
        </button>
      </section>
    );
  if (initial === undefined)
    return <p role="status">Consultando checkpoints da Criação…</p>;
  if (!initial || !initial.available)
    return <DemoExplorer snapshot={snapshot} />;
  if (contentError || !content)
    return (
      <section>
        <p role="alert">{contentError || 'Manifesto autorizado indispon?vel.'}</p>
        <button
          type="button"
          onClick={() => {
            setContentError('');
            setInitial(undefined);
            setAttempt((value) => value + 1);
          }}
        >
          Recarregar conte?do autorizado
        </button>
      </section>
    );
  return (
    <CreationExplorerView
      key={initial.revision}
      traveler={snapshot.traveler}
      remote={{ initial, content, repository, accountId, hasPendingQuiz }}
    />
  );
}

function DemoExplorer({ snapshot }: { snapshot: ArchiveSnapshot }) {
  const progress = useStoryProgress(snapshot.traveler.id);
  const saved = progress.records?.find(
    (record) => record.story_id === 'creation',
  );
  return (
    <CreationExplorerView
      traveler={snapshot.traveler}
      canonicalSteps={saved?.completed_steps ?? []}
    />
  );
}

export function CreationExplorerView({
  traveler,
  canonicalSteps = [],
  remote,
}: {
  traveler: ArchiveSnapshot['traveler'];
  canonicalSteps?: readonly string[];
  remote?: {
    initial: CreationCheckpointSnapshot;
    content?: CreationContentManifest;
    accountId: string;
    hasPendingQuiz?: boolean;
    repository: typeof checkpointRepository;
  };
}) {
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [position, setPosition] = useState<Point>(INITIAL);
  const [message, setMessage] = useState(
    'Explore o santuário e interaja com o portal.',
  );
  const [answer, setAnswer] = useState<number>();
  const [visited, setVisited] = useState<readonly string[]>([]);
  const [feedback, setFeedback] = useState<'retry' | 'correct'>();
  const [demoHarmonyUnlocked, setHarmonyUnlocked] = useState(false);
  const [saved, setSaved] = useState(remote?.initial);
  const [savingDay, setSavingDay] = useState(false);
  const dayRequest = useRef(false);
  const [saveError, setSaveError] = useState('');
  const [blocked, setBlocked] = useState('');
  const [pendingQuiz, setPendingQuiz] = useState(
    remote?.hasPendingQuiz ?? false,
  );
  const quizRequest = useRef(false);
  const mounted = useRef(false);
  const readGeneration = useRef(0);
  const repository = remote?.repository;
  const manifestHash = remote?.initial.manifestHash;
  const revision = remote?.initial.revision;
  const content = remote?.content ?? CREATION_CONTENT_V1;
  const days = useMemo(() => creationDaysFromManifest(content), [content]);
  const quiz = useMemo(() => creationQuizFromManifest(content), [content]);
  const quizScope =
    remote &&
    JSON.stringify([remote.accountId, traveler.id, revision, manifestHash]);
  const completedDays = saved?.completedDays.length ?? 0;
  const harmonyUnlocked = remote
    ? completedDays === days.length
    : demoHarmonyUnlocked;
  const nextDayIndex = Math.min(completedDays, days.length - 1);
  const [harmonyStarted, setHarmonyStarted] = useState(false);
  const [section, setSection] = useState<
    'harmony' | 'quiz' | 'summary' | 'video' | 'finale' | null
  >(null);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [discoveries, setDiscoveries] = useState<readonly string[]>([]);
  const [quizAttempt, setQuizAttempt] = useState(0);
  const [quizResult, setQuizResult] = useState<{
    attempt: number;
    answers: QuizAnswers;
    score?: number;
  }>();
  const stage = useRef<HTMLDivElement>(null);
  const pages = useRef<HTMLDivElement>(null);
  const returnToMap = useRef(false);

  useEffect(() => {
    if (diaryOpen || section) {
      const current = pages.current?.querySelector('[data-current="true"]');
      const heading =
        current?.querySelector<HTMLElement>('#creation-question') ??
        current?.querySelector<HTMLElement>('h2');
      heading?.focus();
    } else if (returnToMap.current) {
      returnToMap.current = false;
      stage.current?.focus();
    }
  }, [diaryOpen, section]);

  const day = dayIndex === null ? undefined : days[dayIndex];
  const dayNumber = dayIndex === null ? 0 : dayIndex + 1;
  const challengeOpen = day?.markers.every(({ label }) =>
    visited.includes(label),
  );
  const points = !day
    ? [
        {
          point: PORTAL,
          label: `Portal · Dia ${nextDayIndex + 1}`,
          symbol: '◉',
        },
      ]
    : [...day.markers, RETURN_MARKER];
  const nearby = points.find(({ point }) => pointIsNear(position, point));

  function changeScene(next: number | null, finished = false) {
    if (dayRequest.current) return;
    setSaveError('');
    if (finished && !remote) setHarmonyUnlocked(true);
    setDayIndex(next);
    setPosition(next === null ? INITIAL : START);
    setVisited([]);
    setAnswer(undefined);
    setFeedback(undefined);
    setMessage(
      next !== null
        ? days[next].objective
        : finished
          ? remote
            ? 'Você voltou ao Santuário após os sete checkpoints.'
            : 'Você percorreu os sete dias da demonstração.'
          : 'Você voltou ao Santuário da Jornada.',
    );
    stage.current?.focus();
  }

  function interact() {
    if (nearby) activate(nearby.point);
    else
      setMessage('Contorne o obstáculo e aproxime-se do ponto de interação.');
  }

  function activate(point: Point) {
    if (point === PORTAL) return changeScene(nextDayIndex);
    if (point === EXIT) return changeScene(null);
    const marker = day?.markers.find((entry) => entry.point === point);
    if (!day || !marker || visited.includes(marker.label)) return;
    setVisited((current) => [...current, marker.label]);
    const remaining = day.markers.length - visited.length - 1;
    if (!remaining) {
      setDiscoveries((current) =>
        current.includes(day.id) ? current : [...current, day.id],
      );
    }
    setMessage(
      remaining
        ? `${marker.label}: ${marker.note} Faltam ${remaining} de ${day.markers.length} marcos.`
        : `Desafio do Dia ${dayNumber} disponível no painel de objetivos.`,
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const key = event.key.toLowerCase();
    const delta = Object.hasOwn(KEYS, key) ? KEYS[key] : undefined;
    if (delta) {
      event.preventDefault();
      setPosition((current) =>
        movePoint(current, { x: current.x + delta.x, y: current.y + delta.y }),
      );
    } else if ((key === 'e' || key === 'enter') && !event.repeat) {
      event.preventDefault();
      interact();
    }
  }

  function handleFloorClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest('button'))
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const destination = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
    setPosition((current) => movePoint(current, destination));
    event.currentTarget.focus({ preventScroll: true });
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!day || !challengeOpen || answer === undefined || dayRequest.current)
      return;
    if (!remote) {
      setFeedback(answer === day.correct ? 'correct' : 'retry');
      return;
    }
    dayRequest.current = true;
    setSavingDay(true);
    setFeedback(undefined);
    setSaveError('');
    try {
      await refreshRemote();
      const result = await remote.repository.submitDay(
        traveler.id,
        remote.initial.revision,
        dayNumber,
        answer + 1,
      );
      if (result.completed) {
        const state = await refreshRemote();
        if (!state.completedDays.includes(dayNumber))
          throw new Error('Checkpoint missing');
      }
      setFeedback(result.completed ? 'correct' : 'retry');
    } catch {
      setSaveError(
        'Não foi possível confirmar o checkpoint. Tente novamente ou recarregue a Jornada.',
      );
    } finally {
      dayRequest.current = false;
      setSavingDay(false);
    }
  }

  const refreshRemote = useCallback(async () => {
    if (!repository || !manifestHash)
      throw new Error('Checkpoint mode unavailable');
    const generation = ++readGeneration.current;
    const current = () =>
      mounted.current && readGeneration.current === generation;
    try {
      const state = await repository.read(traveler.id);
      if (!current()) throw new Error('Checkpoint read superseded');
      if (
        !state.available ||
        state.revision !== revision ||
        state.manifestHash !== manifestHash
      ) {
        try {
          if (quizScope) clearPendingQuiz(quizScope);
        } catch {
          // The server result still invalidates the view when storage is blocked.
        }
        setPendingQuiz(false);
        throw new CreationCheckpointUnavailable();
      }
      setSaved(state);
      setBlocked('');
      return state;
    } catch (error) {
      if (!current()) throw error;
      setSaved(undefined);
      setSection(null);
      setHarmonyStarted(false);
      setQuizResult(undefined);
      setQuizAttempt(0);
      setBlocked(
        error instanceof CreationCheckpointUnavailable
          ? 'Revisão da Criação indisponível ou incompatível.'
          : 'Não foi possível confirmar o acesso aos checkpoints.',
      );
      throw error;
    }
  }, [repository, manifestHash, revision, traveler.id, quizScope]);

  useEffect(() => {
    if (!repository) return;
    readGeneration.current++;
    mounted.current = true;
    const recheck = () => {
      if (document.visibilityState !== 'hidden')
        void refreshRemote().catch(() => {});
    };
    window.addEventListener('focus', recheck);
    window.addEventListener('pageshow', recheck);
    document.addEventListener('visibilitychange', recheck);
    const timer = window.setInterval(recheck, 30_000);
    return () => {
      mounted.current = false;
      window.removeEventListener('focus', recheck);
      window.removeEventListener('pageshow', recheck);
      document.removeEventListener('visibilitychange', recheck);
      window.clearInterval(timer);
    };
  }, [repository, refreshRemote]);

  async function verifyHarmony(order: number[]) {
    if (!remote || !manifestHash) return false;
    const state = await refreshRemote();
    if (state.completedDays.length !== 7) return false;
    try {
      const result = await remote.repository.submitHarmony(
        traveler.id,
        state.revision,
        order,
      );
      return result.completed && (await refreshRemote()).harmonyCompleted;
    } catch (error) {
      await refreshRemote().catch(() => {});
      throw error;
    }
  }

  async function recordQuiz(answers: number[], displayAnswers?: QuizAnswers) {
    if (!repository || !quizScope || !manifestHash || quizRequest.current)
      return false;
    quizRequest.current = true;
    try {
      const current = await refreshRemote();
      if (!current.harmonyCompleted) return false;
      const pending = preparePendingQuiz(quizScope, answers);
      setPendingQuiz(true);
      const result = await repository.submitQuiz(
        traveler.id,
        current.revision,
        pending.id,
        pending.answers,
      );
      if (
        result.attemptId !== pending.id ||
        result.revision !== current.revision
      )
        throw new Error('Quiz receipt mismatch');
      await refreshRemote();
      clearPendingQuiz(quizScope, pending.id);
      setPendingQuiz(false);
      setQuizResult({
        attempt: quizAttempt,
        answers: displayAnswers ?? {},
        score: result.score,
      });
      setSection('summary');
      return true;
    } catch {
      await refreshRemote().catch(() => {});
      return false;
    } finally {
      quizRequest.current = false;
    }
  }

  async function submitQuiz(answers: QuizAnswers) {
    if (!remote) {
      setQuizResult({ attempt: quizAttempt, answers });
      setSection('summary');
      return true;
    }
    const indices = quiz.map(
      (question) =>
        question.options.findIndex(
          (option) => option.id === answers[question.id],
        ) + 1,
    );
    return recordQuiz(indices, answers);
  }

  async function resumeQuiz() {
    if (!quizScope || !pendingQuiz) return;
    try {
      const pending = readPendingQuiz(quizScope);
      if (pending && !(await recordQuiz(pending.answers)))
        setSaveError('Não foi possível confirmar a tentativa pendente.');
    } catch {
      setSaveError('Não foi possível recuperar a tentativa pendente.');
    }
  }

  async function openHarmony() {
    if (remote) {
      const state = await refreshRemote().catch(() => undefined);
      if (state?.completedDays.length !== 7) return;
    }
    setHarmonyStarted(true);
    setSection('harmony');
  }

  async function openQuiz(repeat = false) {
    const state = remote
      ? await refreshRemote().catch(() => undefined)
      : undefined;
    if (remote && !state?.harmonyCompleted) return;
    if (remote && pendingQuiz) return resumeQuiz();
    setQuizAttempt((attempt) => (repeat ? attempt + 1 : Math.max(1, attempt)));
    setSection(
      !repeat &&
        ((state && state.quizAttempts > 0 && quizAttempt === 0) ||
          (quizResult && quizResult.attempt === quizAttempt))
        ? 'summary'
        : 'quiz',
    );
  }

  if (blocked)
    return (
      <section>
        <p role="alert">{blocked}</p>
        <button
          type="button"
          onClick={() => void refreshRemote().catch(() => {})}
        >
          Tentar novamente
        </button>
      </section>
    );

  return (
    <article className={css.page}>
      <Link className={css.back} href="/journey/stories/creation">
        ← Voltar à história
      </Link>
      <header className={css.header}>
        <p className={css.eyebrow}>
          {remote
            ? 'Checkpoints da Criação'
            : 'Protótipo jogável · progresso oficial somente leitura'}
        </p>
        <h1>Santuário da Jornada</h1>
        <p>
          Espaço fictício do jogo, criado como entrada para os mundos bíblicos.
        </p>
      </header>
      <div className={css.notice} role="note">
        {remote
          ? `Dias confirmados pelo servidor: ${completedDays} de 7.`
          : 'A demonstração reinicia ao atualizar a página ou trocar de dispositivo.'}
        {canonicalSteps.length > 0 && (
          <span>
            {' '}
            Registros canônicos consultados: {canonicalSteps.length} etapa(s).
          </span>
        )}
      </div>
      <div className={css.layout} hidden={diaryOpen || section !== null}>
        <section className={css.playArea} aria-label="Exploração">
          <div
            className={css.stage}
            data-area={day?.id ?? 'sanctuary'}
            ref={stage}
            tabIndex={0}
            role="group"
            aria-label="Mapa de exploração"
            aria-describedby="explorer-controls"
            onKeyDown={handleKeyDown}
            onClick={handleFloorClick}
          >
            <div key={dayNumber} className={css.sceneWash} aria-hidden="true" />
            <div className={css.horizon} aria-hidden="true" />
            {!day ? (
              <>
                <p className={css.sceneTitle}>Santuário fictício</p>
                <div className={css.daySigils} aria-hidden="true">
                  {days.map((day, index) => (
                    <span key={day.id}>{index === 0 ? '✦' : '◇'}</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className={css.sceneTitle}>
                  Dia {dayNumber} — {day.title}
                </h2>
                <div className={css.light} aria-hidden="true">
                  {dayNumber > 1 && day.motifs}
                </div>
              </>
            )}
            {points.map(({ point, label, symbol }) => (
              <button
                key={label}
                type="button"
                className={css.poi}
                data-nearby={nearby?.point === point}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                aria-label={label}
                onClick={() => {
                  if (pointIsNear(position, point)) activate(point);
                  else {
                    setPosition((current) => movePoint(current, point));
                    stage.current?.focus({ preventScroll: true });
                    setMessage(
                      'Use Interagir quando estiver perto ou contorne o obstáculo.',
                    );
                  }
                }}
              >
                {symbol}
                <span>
                  {point === EXIT ? 'Retornar' : label}
                  {visited.includes(label) ? ' ✓' : ''}
                </span>
              </button>
            ))}
            <div className={css.barrier} aria-hidden="true" />
            <div
              data-testid="traveler-position"
              className={css.avatar}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <AvatarRuntime
                traveler={traveler}
                mode="thumbnail"
                label={`Viajante ${traveler.name}`}
              />
            </div>
          </div>
          <p className={css.controls} id="explorer-controls">
            Com o mapa em foco, use WASD ou setas. Também é possível clicar ou
            tocar no chão. Perto de um marco, use E, Enter ou Interagir.
          </p>
          <div className={css.actions}>
            <button onClick={interact}>Interagir</button>
            {nearby && (
              <span className={css.nearby}>Ao alcance: {nearby.label}</span>
            )}
            <button type="button" onClick={() => setDiaryOpen(true)}>
              Abrir Diário Bíblico
            </button>
          </div>
        </section>
        <aside className={css.panel}>
          <h2>Painel de objetivos</h2>
          <p className={css.objective} role="status">
            {message}
          </p>
          {day ? (
            <>
              <p>
                <a href={creationPassageUrl(day.passage)}>
                  Ler {day.reference} (NVI)
                </a>
              </p>
              <p>A paisagem e os marcos são recursos fictícios do jogo.</p>
              {day.markers.some(
                ({ label, note }) => note && visited.includes(label),
              ) && (
                <ul
                  className={css.dayList}
                  aria-label="Notas dos marcos visitados"
                >
                  {day.markers
                    .filter(
                      ({ label, note }) => note && visited.includes(label),
                    )
                    .map(({ label, note }) => (
                      <li key={label}>
                        <strong>{label}.</strong> {note}
                      </li>
                    ))}
                </ul>
              )}
            </>
          ) : (
            <ol className={css.dayList} aria-label="Sete símbolos da Criação">
              {days.map((day, index) => (
                <li key={day.id}>
                  Dia {index + 1} · {day.title}
                </li>
              ))}
            </ol>
          )}
          {day && challengeOpen && (
            <form
              onSubmit={submitAnswer}
              tabIndex={-1}
              ref={focusChallenge}
              aria-label={
                remote ? 'Desafio da Criação' : 'Desafio demonstrativo'
              }
            >
              <fieldset disabled={savingDay}>
                <legend>{day.question}</legend>
                {day.options.map((option, index) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name="creation-answer"
                      checked={answer === index}
                      onChange={() => {
                        setAnswer(index);
                        setFeedback(undefined);
                      }}
                    />
                    {option}
                  </label>
                ))}
                <button type="submit" disabled={answer === undefined}>
                  Conferir resposta
                </button>
              </fieldset>
              <p role="status" className={css.feedback} data-result={feedback}>
                {saveError}
                {feedback === 'correct' &&
                  `Resposta correta. Explicação do relato: ${day.explanation}`}
                {feedback === 'retry' &&
                  'Tente novamente. Você pode responder quantas vezes quiser.'}
              </p>
              {feedback === 'correct' && (
                <button
                  type="button"
                  onClick={() =>
                    dayNumber < days.length
                      ? changeScene(dayNumber)
                      : changeScene(null, true)
                  }
                >
                  {dayNumber < days.length
                    ? `Prosseguir para o Dia ${dayNumber + 1}`
                    : 'Voltar ao Santuário e liberar Harmonia'}
                </button>
              )}
            </form>
          )}
          {!remote && (
            <p className={css.pending}>
              Atividade demonstrativa. Conteúdo aguardando revisão editorial.
            </p>
          )}
          <h3>Navegação acessível</h3>
          <ul className={css.poiList} aria-label="Navegação acessível">
            {points.map(({ label, point }) => (
              <li key={label}>
                <button onClick={() => activate(point)}>
                  {label}
                  {visited.includes(label) ? ' · Visitado' : ''}
                </button>
              </li>
            ))}
          </ul>
          {!day &&
            (harmonyUnlocked ? (
              <button type="button" onClick={openHarmony}>
                Abrir Harmonia da Criação
              </button>
            ) : (
              <p>
                Complete os sete dias da demonstração para abrir Harmonia da
                Criação.
              </p>
            ))}
        </aside>
      </div>
      {remote && pendingQuiz && (
        <div>
          <button type="button" onClick={resumeQuiz}>
            Retomar tentativa pendente do quiz
          </button>
          {saveError && <p role="status">{saveError}</p>}
        </div>
      )}
      <div ref={pages}>
        {section && !diaryOpen && (
          <nav
            className={`${css.actions} ${css.flowNav}`}
            aria-label="Navegação da demonstração"
          >
            <button
              type="button"
              onClick={() => {
                returnToMap.current = true;
                setSection(null);
              }}
            >
              Voltar ao Santuário
            </button>
            {section !== 'harmony' && (
              <button type="button" onClick={openHarmony}>
                Voltar à Harmonia
              </button>
            )}
            <button type="button" onClick={() => setDiaryOpen(true)}>
              Abrir Diário Bíblico
            </button>
            {quizResult && section !== 'summary' && (
              <button type="button" onClick={() => setSection('summary')}>
                Ver resumo da Jornada
              </button>
            )}
          </nav>
        )}
        {harmonyStarted && (
          <div
            hidden={diaryOpen || section !== 'harmony'}
            data-current={!diaryOpen && section === 'harmony'}
          >
            <CreationHarmony
              onStartQuiz={() => void openQuiz()}
              verified={saved?.harmonyCompleted}
              onVerify={remote ? verifyHarmony : undefined}
              days={days}
            />
          </div>
        )}
        {quizAttempt > 0 && (
          <div
            hidden={diaryOpen || section !== 'quiz'}
            data-current={!diaryOpen && section === 'quiz'}
          >
            <CreationQuiz
              key={quizAttempt}
              onComplete={submitQuiz}
              remote={Boolean(remote)}
              questions={quiz}
            />
          </div>
        )}
        {remote && saved && !diaryOpen && section === 'summary' && (
          <section data-current="true">
            <h2 tabIndex={-1}>Resultado do Quiz</h2>
            <p role="status">
              {quizResult?.score ?? saved.bestQuizScore} de 5 acertos.
              Tentativas registradas: {saved.quizAttempts}.
            </p>
            <button onClick={() => void openQuiz(true)}>Repetir quiz</button>
          </section>
        )}
        {!remote && quizResult && !diaryOpen && section === 'summary' && (
          <div data-current="true">
            <CreationJourneySummary
              answers={quizResult.answers}
              discoveries={discoveries}
              onOpenVideo={() => setSection('video')}
              onRepeat={() => {
                setQuizAttempt((attempt) => attempt + 1);
                setSection('quiz');
              }}
            />
          </div>
        )}
        {quizResult && !diaryOpen && section === 'video' && (
          <div data-current="true">
            <CreationVideoStage onContinue={() => setSection('finale')} />
          </div>
        )}
        {quizResult && !diaryOpen && section === 'finale' && (
          <div data-current="true">
            <CreationFinale
              answers={quizResult.answers}
              discoveries={discoveries.length}
            />
          </div>
        )}
        {diaryOpen && (
          <div data-current="true">
            <div className={`${css.actions} ${css.flowNav}`}>
              <button
                type="button"
                onClick={() => {
                  returnToMap.current = section === null;
                  setDiaryOpen(false);
                }}
              >
                Voltar à demonstração
              </button>
            </div>
            <div className={book.book}>
              <CreationDiaryChapter discoveries={discoveries} />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
