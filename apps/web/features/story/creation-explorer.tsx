'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
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
  CreationAttemptLimitReached,
  CreationCheckpointUnavailable,
  type CreationCheckpointSnapshot,
} from '../../lib/supabase/repositories/creation-checkpoint-repository';
import { creationManifestId } from './creation-manifest';
import {
  parseCreationManifestText,
  CREATION_CONTENT_V1,
  type CreationContentManifest,
} from './creation-days';
import { CREATION_DEMO_FEEDBACK } from './creation-demo-feedback';
import { creationQuizFromManifest } from './creation-quiz-content';
import {
  clearPendingQuiz,
  discardPendingQuizForOtherTraveler,
  invalidatePendingQuiz,
  preparePendingQuiz,
  readPendingQuiz,
} from './creation-pending-quiz';
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

const subscribeToBrowser = () => () => {};
type BrowserGraphics = 'pending' | 'available' | 'unavailable';
const browserGraphicsSnapshot = (): BrowserGraphics =>
  typeof WebGL2RenderingContext === 'undefined' ? 'unavailable' : 'available';
const serverWebGL2Snapshot = (): BrowserGraphics => 'pending';
const CreationDayOne = dynamic(() => import('./creation-day-one'), {
  ssr: false,
  loading: () => <p role="status">Carregando a exploração 3D…</p>,
});
const CreationDays3D = dynamic(() => import('./creation-days-3d'), {
  ssr: false,
  loading: () => <p role="status">Carregando o mundo 3D…</p>,
});
const DAY_ONE_STUDY = {
  question: 'Que expressão introduz a fala divina em Gênesis 1:3?',
  options: ['Disse Deus', 'Respondeu Moisés'],
  correctIndex: 0,
  explanation: 'O versículo começa introduzindo a fala de Deus.',
};
const START: Point = { x: 22, y: 52 };
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
  if (failed || initial === null)
    return (
      <section>
        <p role="alert">
          Não foi possível consultar os checkpoints. Verifique sua conexão e
          sessão.
        </p>
        <button
          onClick={() => {
            setFailed(false);
            setInitial(undefined);
            setAttempt(attempt + 1);
          }}
        >
          Tentar novamente
        </button>
        <CreationExplorerView traveler={snapshot.traveler} explorationOnly />
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
  return (
    <CreationExplorerView traveler={snapshot.traveler} />
  );
}

export function CreationExplorerView({
  traveler,
  remote,
  explorationOnly = false,
}: {
  traveler: ArchiveSnapshot['traveler'];
  explorationOnly?: boolean;
  remote?: {
    initial: CreationCheckpointSnapshot;
    content?: CreationContentManifest;
    accountId: string;
    hasPendingQuiz?: boolean;
    repository: typeof checkpointRepository;
  };
}) {
  const initialDayIndex = Math.min(
    remote?.initial.completedDays.length ?? 0,
    (remote?.content ?? CREATION_CONTENT_V1).days.length - 1,
  );
  const [dayIndex, setDayIndex] = useState(initialDayIndex);
  const [unavailable3DDays, setUnavailable3DDays] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [dayOnePlaying, setDayOnePlaying] = useState(false);
  const [requestedMarker, setRequestedMarker] = useState<{ id: string; nonce: number }>();
  const markerRequestNonce = useRef(0);
  const [position, setPosition] = useState<Point>(START);
  const [message, setMessage] = useState(
    'Explore o Dia 1 e encontre o Marco da Luz.',
  );
  const [answer, setAnswer] = useState<number>();
  const [visited, setVisited] = useState<readonly string[]>([]);
  const visitedMarkerIds = useRef(new Set<string>());
  const [feedback, setFeedback] = useState<'retry' | 'correct'>();
  const [saved, setSaved] = useState(remote?.initial);
  const [savingDay, setSavingDay] = useState(false);
  const dayRequest = useRef(false);
  const [attemptRejected, setAttemptRejected] = useState(false);
  const [pendingDayAnswer, setPendingDayAnswer] = useState<number>();
  const [quizLimitReached, setQuizLimitReached] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [checkpointError, setCheckpointError] = useState<'read' | 'revision'>();
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
  const days = content.days;
  const quiz = useMemo(() => creationQuizFromManifest(content), [content]);
  const quizScope =
    remote &&
    JSON.stringify([remote.accountId, traveler.id, revision, manifestHash]);
  const completedDays = saved?.completedDays.length ?? 0;
  const harmonyUnlocked = Boolean(remote && completedDays === days.length);
  const [harmonyStarted, setHarmonyStarted] = useState(false);
  const [section, setSection] = useState<
    'harmony' | 'quiz' | 'summary' | 'video' | 'finale' | null
  >(null);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const browserGraphics = useSyncExternalStore(
    subscribeToBrowser,
    browserGraphicsSnapshot,
    serverWebGL2Snapshot,
  );
  const [discoveries, setDiscoveries] = useState<readonly string[]>([]);
  const [quizAttempt, setQuizAttempt] = useState(0);
  const [quizResult, setQuizResult] = useState<{
    attempt: number;
    answers: QuizAnswers;
    score?: 5 | null;
  }>();
  const stage = useRef<HTMLDivElement>(null);
  const pages = useRef<HTMLDivElement>(null);
  const returnToDay = useRef(false);

  useEffect(() => {
    if (diaryOpen || section) {
      const current = pages.current?.querySelector('[data-current="true"]');
      const heading =
        current?.querySelector<HTMLElement>('#creation-question') ??
        current?.querySelector<HTMLElement>('h2');
      heading?.focus();
    } else if (returnToDay.current) {
      returnToDay.current = false;
      (
        stage.current ??
        pages.current?.querySelector<HTMLElement>(
          '[aria-label="Exploração 3D do Dia 1"]',
        )
      )?.focus();
    }
  }, [diaryOpen, section]);

  const day = days[dayIndex]!;
  const dayNumber = dayIndex + 1;
  const dayConfirmed = Boolean(saved?.completedDays.includes(dayNumber));
  const attemptConsumed = attemptRejected || Boolean(saved?.consumedDays?.includes(dayNumber));
  const canEvaluate = !explorationOnly && (!remote ||
    (saved?.consumedDays !== undefined && completedDays === dayIndex && !attemptConsumed));
  const canRender3D = browserGraphics === 'available' && !unavailable3DDays.has(dayNumber);
  const dayOne3D = dayNumber === 1 && canRender3D;
  const daysTwoToSeven3D = dayNumber > 1 && canRender3D;
  const waitingForBrowserGraphics = browserGraphics === 'pending';
  const study = dayOne3D && !remote ? DAY_ONE_STUDY : null;
  const challengeOpen = day.markers.every(({ id }) =>
    visited.includes(id),
  );
  const points = day.markers;
  const nearby = points.find(({ point }) => pointIsNear(position, point));

  function markSceneUnavailable(failedDay: number) {
    setUnavailable3DDays((current) => {
      const next = new Set(current);
      next.add(failedDay);
      return next;
    });
  }
  function changeScene(next: number) {
    if (dayRequest.current) return;
    setSaveError('');
    setDayIndex(next);
    setDayOnePlaying(false);
    setRequestedMarker(undefined);
    setPosition(START);
    visitedMarkerIds.current = new Set();
    setVisited([]);
    setAnswer(undefined);
    setPendingDayAnswer(undefined);
    setAttemptRejected(false);
    setFeedback(undefined);
    setMessage(days[next].objective);
    stage.current?.focus();
  }

  function interact() {
    if (nearby) activate(nearby.point);
    else
      setMessage('Contorne o obstáculo e aproxime-se do ponto de interação.');
  }

  function activate(point: Point) {
    const marker = day.markers.find((entry) => entry.point === point);
    if (!marker) return;
    activateMarker(marker.id);
  }

  function activateMarker(markerId: string) {
    const marker = day.markers.find((entry) => entry.id === markerId);
    if (!marker || visitedMarkerIds.current.has(marker.id)) return;
    visitedMarkerIds.current.add(marker.id);
    setVisited([...visitedMarkerIds.current]);
    const remaining = day.markers.filter(
      ({ id }) => !visitedMarkerIds.current.has(id),
    ).length;
    if (!remaining) {
      setDiscoveries((current) =>
        current.includes(day.id) ? current : [...current, day.id],
      );
    }
    setMessage(
      remaining
        ? `${marker.label}: ${marker.note} Faltam ${remaining} de ${day.markers.length} marcos.`
        : remote || explorationOnly
          ? 'Confira a avaliação no painel de objetivos.'
          : `Desafio do Dia ${dayNumber} disponível no painel de objetivos.`,
    );
  }

  function visitAccessiblePoint(point: Point) {
    const marker = day.markers.find((entry) => entry.point === point);
    if (daysTwoToSeven3D && marker) {
      markerRequestNonce.current += 1;
      setRequestedMarker({ id: marker.id, nonce: markerRequestNonce.current });
      return;
    }
    if (dayOne3D) {
      if (!challengeOpen) setDayOnePlaying(true);
      return;
    }
    activate(point);
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
    if (
      !day || !challengeOpen || answer === undefined || dayRequest.current ||
      !canEvaluate
    )
      return;
    if (!remote) {
      setFeedback(answer === (study ?? CREATION_DEMO_FEEDBACK[day.id]).correctIndex ? 'correct' : 'retry');
      return;
    }
    dayRequest.current = true;
    setPendingDayAnswer(answer);
    setSavingDay(true);
    setFeedback(undefined);
    setSaveError('');
    try {
      const current = await refreshRemote();
      if (
        current.consumedDays === undefined ||
        current.consumedDays.includes(dayNumber) ||
        current.completedDays.length !== dayIndex
      ) {
        setPendingDayAnswer(undefined);
        return;
      }
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
      setPendingDayAnswer(undefined);
      setAttemptRejected(!result.completed);
      setFeedback(result.completed ? 'correct' : 'retry');
    } catch (error) {
      if (error instanceof CreationAttemptLimitReached) {
        setPendingDayAnswer(undefined);
        setAttemptRejected(true);
        await refreshRemote().catch(() => {});
        return;
      }
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
      setCheckpointError(undefined);
      return state;
    } catch (error) {
      if (!current()) throw error;
      setSaved(undefined);
      setSection(null);
      setHarmonyStarted(false);
      setQuizResult(undefined);
      setQuizAttempt(0);
      setCheckpointError(error instanceof CreationCheckpointUnavailable ? 'revision' : 'read');
      throw error;
    }
  }, [repository, manifestHash, revision, traveler.id, quizScope, setSection, setQuizAttempt]);

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
    } catch (error) {
      if (error instanceof CreationAttemptLimitReached) {
        setQuizLimitReached(true);
        setPendingQuiz(false);
        try {
          clearPendingQuiz(quizScope);
        } catch {
          // Storage cannot change the server quota.
        }
      }
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

  return (
    <article className={css.page}>
      <Link className={css.back} href="/journey">
        ← Voltar à Jornada
      </Link>
      <header className={css.header}>
        <p className={css.eyebrow}>
          {remote
            ? 'Checkpoints da Criação'
            : explorationOnly
              ? 'Exploração da Criação'
              : 'Demonstração local · sem progresso oficial'}
        </p>
        <h1>Dia {dayNumber} — {day.title}</h1>
      </header>
      <div className={css.notice} role="note">
        {checkpointError || explorationOnly
          ? 'Progresso oficial temporariamente indisponível.'
          : remote
            ? `Dias confirmados pelo servidor: ${completedDays} de 7. Continuando no Dia ${dayNumber}.`
            : 'A demonstração sempre começa no Dia 1 e reinicia ao atualizar a página ou trocar de dispositivo. As respostas locais não geram progresso oficial.'}
      </div>
      <div className={css.layout} hidden={diaryOpen || section !== null}>
        <section className={css.playArea} aria-label="Exploração">
          {waitingForBrowserGraphics ? (
            <p role="status">Preparando o mundo da Criação…</p>
          ) : dayOne3D ? (
            <>
              <CreationDayOne
                appearance={traveler.appearance}
                identity={traveler.avatar}
                playing={dayOnePlaying}
                completed={Boolean(challengeOpen)}
                onStart={() => setDayOnePlaying(true)}
                onComplete={() => {
                  setDayOnePlaying(false);
                  if (day) activate(day.markers[0].point);
                }}
                onUnavailable={() => {
                  markSceneUnavailable(1);
                  setDayOnePlaying(false);
                  if (!remote) {
                    setAnswer(undefined);
                    setFeedback(undefined);
                  }
                }}
              />
              <p className={css.controls}>Mova-se com WASD, setas ou os controles de toque. Use E ou o botão do marco para observar.</p>
              <div className={css.actions}>
                <Link href="/journey">Voltar à Jornada</Link>
                <button type="button" onClick={() => setDiaryOpen(true)}>Abrir Diário Bíblico</button>
              </div>
            </>
          ) : daysTwoToSeven3D ? (
            <>
              <CreationDays3D
                key={dayNumber}
                dayNumber={dayNumber as 2 | 3 | 4 | 5 | 6 | 7}
                title={day.title}
                reference={day.reference}
                markers={day.markers}
                appearance={traveler.appearance}
                identity={traveler.avatar}
                completedMarkers={visited}
                requestedMarker={requestedMarker}
                onCompleteMarker={(id) => {
                  activateMarker(id);
                  setRequestedMarker(undefined);
                }}
                onUnavailable={() => {
                  markSceneUnavailable(dayNumber);
                  setRequestedMarker(undefined);
                  if (!remote) {
                    setAnswer(undefined);
                    setFeedback(undefined);
                  }
                }}
              />
              <p className={css.controls}>Mova-se com WASD, setas ou os controles de toque. Aproxime-se dos marcos e pressione E para observar.</p>
              <div className={css.actions}>
                <Link href="/journey">Voltar à Jornada</Link>
                <button type="button" onClick={() => setDiaryOpen(true)}>Abrir Diário Bíblico</button>
              </div>
            </>
          ) : <>
          <div
            className={css.stage}
            data-area={day.id}
            ref={stage}
            tabIndex={0}
            role="group"
            aria-label={`Exploração do Dia ${dayNumber}`}
            aria-describedby="explorer-controls"
            onKeyDown={handleKeyDown}
            onClick={handleFloorClick}
          >
            <div key={dayNumber} className={css.sceneWash} aria-hidden="true" />
            <div className={css.horizon} aria-hidden="true" />
            <h2 className={css.sceneTitle}>
              Dia {dayNumber} — {day.title}
            </h2>
            <div className={css.light} aria-hidden="true">
              {dayNumber > 1 && day.motifs}
            </div>
            {points.map(({ id, point, label, symbol }) => (
              <button
                key={id ?? label}
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
                  {label}
                  {id && visited.includes(id) ? ' ✓' : ''}
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
          </>}
        </section>
        <aside className={css.panel}>
            <h2>Objetivo do dia</h2>
          <p className={css.objective} role="status">
            {message}
          </p>
          <>
            <p>
              <a href={creationPassageUrl(day.passage)}>
                Ler {day.reference} (NVI)
              </a>
            </p>
            <p>A paisagem e os marcos são recursos fictícios do jogo.</p>
            {day.markers.some(
              ({ id, note }) => note && visited.includes(id),
            ) && (
              <ul
                className={css.dayList}
                aria-label="Notas dos marcos visitados"
              >
                {day.markers
                  .filter(
                    ({ id, note }) => note && visited.includes(id),
                  )
                  .map(({ id, label, note }) => (
                    <li key={id}>
                      <strong>{label}.</strong> {note}
                    </li>
                  ))}
              </ul>
            )}
          </>
          {remote && (checkpointError || saved?.consumedDays === undefined) && (
            <div>
              <p role="alert">
                {checkpointError === 'revision'
                  ? 'Revisão da Criação indisponível ou incompatível.'
                  : checkpointError === 'read'
                    ? 'Não foi possível confirmar o acesso aos checkpoints.'
                    : 'O servidor ainda não informa o estado das tentativas oficiais. Você pode continuar explorando.'}
              </p>
              {checkpointError === 'revision' ? (
                <button type="button" onClick={() => window.location.reload()}>
                  Recarregar a Jornada
                </button>
              ) : (
                <button type="button" onClick={() => void refreshRemote().catch(() => {})}>
                  Tentar novamente
                </button>
              )}
            </div>
          )}
          {remote && !dayConfirmed && attemptConsumed && (
            <p role="status">
              {feedback === 'retry' && 'Sua resposta foi incorreta. '}
              Você já utilizou sua tentativa oficial neste dia. Ainda pode explorar a história e revisar a passagem bíblica. Uma nova avaliação dependerá de uma revisão autorizada.
            </p>
          )}
          {challengeOpen && canEvaluate && (
            <form
              className={dayOne3D ? css.dayOneChallenge : undefined}
              onSubmit={submitAnswer}
              tabIndex={-1}
              ref={focusChallenge}
              aria-label={
                remote ? 'Desafio da Criação' : 'Desafio demonstrativo'
              }
            >
              {dayOne3D && (
                <div className={css.dayOneChallengeHeader}>
                  <div className={css.dayOnePortrait}>
                    <AvatarRuntime traveler={traveler} mode="thumbnail" label={`Viajante ${traveler.name}`} />
                  </div>
                  <p><strong>Desafio do Dia 1</strong><span>Gênesis 1:3–5</span></p>
                </div>
              )}
              <fieldset disabled={savingDay}>
                <legend>{study?.question ?? day.question}</legend>
                {(study?.options ?? day.options).map((option, index) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name="creation-answer"
                      checked={answer === index}
                      disabled={pendingDayAnswer !== undefined && pendingDayAnswer !== index}
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
                {feedback === 'correct' && !remote &&
                  ('Resposta correta. ' + (study ?? CREATION_DEMO_FEEDBACK[day.id]).explanation)}
                {feedback === 'retry' && !remote &&
                  'Tente novamente. Você pode responder quantas vezes quiser.'}
              </p>
              {feedback === 'correct' && !remote && (
                <button
                  type="button"
                  onClick={() =>
                    dayNumber < days.length
                      ? changeScene(dayNumber)
                      : openHarmony()
                  }
                >
                  {dayNumber < days.length
                    ? `Prosseguir para o Dia ${dayNumber + 1}`
                    : 'Abrir Harmonia da Criação'}
                </button>
              )}
            </form>
          )}
          {dayConfirmed && (
            <div>
              <p role="status">
                {feedback === 'correct' && 'Resposta correta. '}
                Dia concluído e confirmado pelo servidor.
              </p>
              {dayNumber < days.length && (
                <button type="button" onClick={() => changeScene(dayNumber)}>
                  Prosseguir para o Dia {dayNumber + 1}
                </button>
              )}
            </div>
          )}
          {!remote && !explorationOnly && (
            <p className={css.pending}>
              Atividade demonstrativa. Conteúdo aguardando revisão editorial.
            </p>
          )}
          <h3>Navegação acessível</h3>
          <ul className={css.poiList} aria-label="Navegação acessível">
            {points.map(({ id, label, point }) => (
              <li key={id ?? label}>
                <button disabled={dayOnePlaying} onClick={() => visitAccessiblePoint(point)}>
                  {label}
                  {id && visited.includes(id) ? ' · Visitado' : ''}
                </button>
              </li>
            ))}
          </ul>
          {remote && harmonyUnlocked && dayConfirmed && (
            <button type="button" onClick={() => void openHarmony()}>
              Abrir Harmonia da Criação
            </button>
          )}
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
            aria-label="Navegação da Criação"
          >
            <button
              type="button"
              onClick={() => {
                returnToDay.current = true;
                setSection(null);
              }}
            >
              Voltar ao Dia {dayNumber}
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
              attemptLimitReached={quizLimitReached}
            />
          </div>
        )}
        {remote && saved && !diaryOpen && section === 'summary' && (
          <section data-current="true">
            <h2 tabIndex={-1}>Resultado do Quiz</h2>
            <p role="status">
              {(quizResult ? quizResult.score : saved.bestQuizScore) === 5
                ? '5 de 5 acertos.'
                : 'Tentativa registrada. A pontuação parcial fica reservada.'}
              Tentativas registradas: {saved.quizAttempts}.
            </p>
            <button disabled={quizLimitReached} onClick={() => void openQuiz(true)}>Repetir quiz</button>
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
                  returnToDay.current = true;
                  setDiaryOpen(false);
                }}
              >
                Voltar ao Dia {dayNumber}
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
