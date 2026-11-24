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
import {
  CREATION_DAYS,
  movePoint,
  pointIsNear,
} from './creation-explorer-model';
import css from './creation-explorer.module.css';

type Scene = 'sanctuary' | 'day-one';
const PORTAL: Point = { x: 78, y: 50 };
const MARKER: Point = { x: 72, y: 50 };
const START: Point = { x: 22, y: 52 };
const INITIAL: Point = { x: 18, y: 50 };
const EXIT: Point = { x: 18, y: 52 };
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
  const [scene, setScene] = useState<Scene>('sanctuary');
  const [position, setPosition] = useState<Point>(INITIAL);
  const [message, setMessage] = useState(
    'Explore o santuário e interaja com o portal.',
  );
  const [answer, setAnswer] = useState('');
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [feedback, setFeedback] = useState<'retry' | 'correct'>();
  const stage = useRef<HTMLDivElement>(null);

  const points =
    scene === 'sanctuary'
      ? [
          {
            point: PORTAL,
            label: 'Portal · Dia 1',
            symbol: '◉',
          },
        ]
      : [
          {
            point: MARKER,
            label: 'Marco da luz',
            symbol: '✦',
          },
          {
            point: EXIT,
            label: 'Retornar ao Santuário',
            symbol: '↩',
          },
        ];
  const nearby = points.find(({ point }) => pointIsNear(position, point));

  function changeScene(next: Scene) {
    setScene(next);
    setPosition(next === 'day-one' ? START : INITIAL);
    setChallengeOpen(false);
    setAnswer('');
    setFeedback(undefined);
    setMessage(
      next === 'day-one'
        ? 'Encontre o marco da luz para abrir o desafio.'
        : 'Você voltou ao Santuário da Jornada.',
    );
    stage.current?.focus({ preventScroll: true });
  }

  function openChallenge() {
    setChallengeOpen(true);
    setMessage('Desafio do Dia 1 disponível no painel de objetivos.');
  }

  function interact() {
    if (nearby) activate(nearby.point);
    else
      setMessage('Contorne o obstáculo e aproxime-se do ponto de interação.');
  }

  function activate(point: Point) {
    if (point === MARKER) openChallenge();
    else changeScene(point === PORTAL ? 'day-one' : 'sanctuary');
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
    setFeedback(answer === 'light' ? 'correct' : 'retry');
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
        Demonstração temporária: posição e respostas podem ser perdidas ao
        atualizar a página. Nenhuma conclusão é salva nem há concessão de
        recompensas.
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
            className={`${css.stage} ${scene === 'day-one' ? css.dayScene : ''}`}
            ref={stage}
            tabIndex={0}
            role="group"
            aria-label="Mapa de exploração"
            aria-describedby="explorer-controls"
            onKeyDown={handleKeyDown}
            onClick={handleFloorClick}
          >
            <div key={scene} className={css.sceneWash} aria-hidden="true" />
            <div className={css.horizon} aria-hidden="true" />
            {scene === 'sanctuary' ? (
              <>
                <p className={css.sceneTitle}>Santuário fictício</p>
                <div className={css.daySigils} aria-hidden="true">
                  {CREATION_DAYS.map((day, index) => (
                    <span key={day}>{index === 0 ? '✦' : '◇'}</span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className={css.sceneTitle}>Dia 1 — Luz e trevas</p>
                <div className={css.light} aria-hidden="true" />
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
                <span>{point === EXIT ? 'Retornar' : label}</span>
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
          {scene === 'day-one' ? (
            <p>Gênesis 1:3–5 (NVI)</p>
          ) : (
            <ol className={css.dayList} aria-label="Sete símbolos da Criação">
              {CREATION_DAYS.map((day, index) => (
                <li key={day}>
                  <span aria-hidden="true">{index === 0 ? '✦' : '◇'}</span>{' '}
                  {day} · {index === 0 ? 'Em demonstração' : 'Em preparação'}
                </li>
              ))}
            </ol>
          )}
          {scene === 'day-one' && challengeOpen && (
            <form onSubmit={submitAnswer}>
              <fieldset>
                <legend>O que Deus criou no primeiro dia?</legend>
                <label>
                  <input
                    type="radio"
                    name="creation-answer"
                    value="light"
                    checked={answer === 'light'}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      setFeedback(undefined);
                    }}
                  />{' '}
                  A luz.
                </label>
                <label>
                  <input
                    type="radio"
                    name="creation-answer"
                    value="sky"
                    checked={answer === 'sky'}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      setFeedback(undefined);
                    }}
                  />{' '}
                  O firmamento.
                </label>
                <button type="submit" disabled={!answer}>
                  Conferir resposta
                </button>
              </fieldset>
              <p role="status" className={css.feedback} data-result={feedback}>
                {feedback === 'correct' &&
                  'Resposta correta. Deus disse que houvesse luz, separou a luz das trevas e chamou a luz de Dia e as trevas de Noite.'}
                {feedback === 'retry' &&
                  'Tente novamente. Você pode responder quantas vezes quiser.'}
              </p>
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
                <button onClick={() => activate(point)}>{label}</button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </article>
  );
}
