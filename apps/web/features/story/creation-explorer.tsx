'use client';

import Link from 'next/link';
import {
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type FormEvent,
} from 'react';
import type { ArchiveSnapshot } from '../../lib/supabase/online-sync';
import { useStoryProgress } from './use-story-progress';
import { ArchiveAccess } from '../release-ebd/archive';
import { AvatarRuntime } from '../journey/components/avatar-runtime';
import type { Point } from './creation-explorer-model';
import { movePoint, pointIsNear } from './creation-explorer-model';
import { CREATION_DAYS } from './creation-days';
import { CreationHarmony } from './creation-harmony';
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

function AuthenticatedExplorer({ snapshot }: { snapshot: ArchiveSnapshot }) {
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
}: {
  traveler: ArchiveSnapshot['traveler'];
  canonicalSteps?: readonly string[];
}) {
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [position, setPosition] = useState<Point>(INITIAL);
  const [message, setMessage] = useState(
    'Explore o santuário e interaja com o portal.',
  );
  const [answer, setAnswer] = useState<number>();
  const [visited, setVisited] = useState<readonly string[]>([]);
  const [feedback, setFeedback] = useState<'retry' | 'correct'>();
  const [harmonyUnlocked, setHarmonyUnlocked] = useState(false);
  const [harmonyOpen, setHarmonyOpen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  const day = dayIndex === null ? undefined : CREATION_DAYS[dayIndex];
  const dayNumber = dayIndex === null ? 0 : dayIndex + 1;
  const challengeOpen = day?.markers.every(({ label }) =>
    visited.includes(label),
  );
  const points = !day
    ? [
        {
          point: PORTAL,
          label: 'Portal · Dia 1',
          symbol: '◉',
        },
      ]
    : [...day.markers, RETURN_MARKER];
  const nearby = points.find(({ point }) => pointIsNear(position, point));

  function changeScene(next: number | null, finished = false) {
    if (finished) setHarmonyUnlocked(true);
    setHarmonyOpen(false);
    setDayIndex(next);
    setPosition(next === null ? INITIAL : START);
    setVisited([]);
    setAnswer(undefined);
    setFeedback(undefined);
    setMessage(
      next !== null
        ? CREATION_DAYS[next].objective
        : finished
          ? 'Você percorreu os sete dias da demonstração.'
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
    if (point === PORTAL) return changeScene(0);
    if (point === EXIT) return changeScene(null);
    const marker = day?.markers.find((entry) => entry.point === point);
    if (!day || !marker || visited.includes(marker.label)) return;
    setVisited((current) => [...current, marker.label]);
    const remaining = day.markers.length - visited.length - 1;
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

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (day && challengeOpen && answer !== undefined)
      setFeedback(answer === day.correct ? 'correct' : 'retry');
  }

  return (
    <article className={css.page}>
      <Link className={css.back} href="/journey/stories/creation">
        ← Voltar à história
      </Link>
      <header className={css.header}>
        <p className={css.eyebrow}>
          Protótipo jogável · progresso oficial somente leitura
        </p>
        <h1>Santuário da Jornada</h1>
        <p>
          Espaço fictício do jogo, criado como entrada para os mundos bíblicos.
        </p>
      </header>
      <div className={css.notice} role="note">
        A demonstração reinicia ao atualizar a página ou trocar de dispositivo.
        Recomeçar pelo portal leva ao Dia 1.
        {canonicalSteps.length > 0 && (
          <span>
            {' '}
            Registros canônicos consultados: {canonicalSteps.length} etapa(s).
          </span>
        )}
      </div>
      <div className={css.layout}>
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
                  {CREATION_DAYS.map((day, index) => (
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
            <Link href="/journey/diary">Abrir Diário Bíblico</Link>
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
                <a
                  href={`https://www.bible.com/pt/bible/129/GEN.${day.passage}.NVI`}
                >
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
              {CREATION_DAYS.map((day, index) => (
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
              aria-label="Desafio demonstrativo"
            >
              <fieldset>
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
                {feedback === 'correct' &&
                  `Resposta correta. Explicação do relato: ${day.explanation}`}
                {feedback === 'retry' &&
                  'Tente novamente. Você pode responder quantas vezes quiser.'}
              </p>
              {feedback === 'correct' && (
                <button
                  type="button"
                  onClick={() =>
                    dayNumber < CREATION_DAYS.length
                      ? changeScene(dayNumber)
                      : changeScene(null, true)
                  }
                >
                  {dayNumber < CREATION_DAYS.length
                    ? `Prosseguir para o Dia ${dayNumber + 1}`
                    : 'Voltar ao Santuário e liberar Harmonia'}
                </button>
              )}
            </form>
          )}
          <p className={css.pending}>
            Atividade demonstrativa; conteúdo aguardando revisão editorial. Não
            representa conclusão canônica.
          </p>
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
              <button
                type="button"
                aria-expanded={harmonyOpen}
                onClick={() => setHarmonyOpen((open) => !open)}
              >
                {harmonyOpen
                  ? 'Fechar Harmonia da Criação'
                  : 'Abrir Harmonia da Criação'}
              </button>
            ) : (
              <p>
                Complete os sete dias da demonstração para abrir Harmonia da
                Criação.
              </p>
            ))}
        </aside>
      </div>
      {!day && harmonyOpen && <CreationHarmony />}
    </article>
  );
}
