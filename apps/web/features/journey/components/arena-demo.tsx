'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COMBAT_CARDS,
  cardPlayError,
  combatCard,
  concedeCardBattle,
  createCardBattle,
  endCardTurn,
  enemyCardIntent,
  playCombatCard,
  resolveCardEnemyTurn,
  type CardBattle,
  type CardCommand,
} from '@rpg/game-engine';
import { createTraveler, DEFAULT_APPEARANCE } from '../domain/traveler';
import { TRAINING_OPPONENTS, travelerBattleSnapshot } from '../data/arena';
import { CardFace, CardPreview, Fighter } from './card-arena-presentation';
import styles from './card-arena.module.css';
import demo from './arena-demo.module.css';

// Fictitious identity, never read from a profile or written to a repository.
const traveler = createTraveler(
  'Viajante Demo',
  DEFAULT_APPEARANCE,
  '00000000-0000-4000-8000-00000000007c',
  '2026-10-17T00:00:00.000Z',
);
const duration = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 460;
function createDemoBattle(opponentId: string) {
  const opponent =
    TRAINING_OPPONENTS.find((item) => item.id === opponentId) ??
    TRAINING_OPPONENTS[0];
  return createCardBattle(
    travelerBattleSnapshot(traveler),
    opponent,
    crypto.getRandomValues(new Uint32Array(1))[0],
    crypto.randomUUID(),
  );
}
function Outcome({
  battle,
  close,
  restart,
  busy,
}: {
  battle: CardBattle;
  close: () => void;
  restart: () => void;
  busy: boolean;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialog.current
      ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
      ?.focus();
  }, []);
  return (
    <div className={styles.veil}>
      <div
        className={`${styles.preview} ${styles.result}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-result-title"
        ref={dialog}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close();
          if (event.key === 'Tab') {
            const buttons = dialog.current!.querySelectorAll<HTMLButtonElement>(
              'button:not(:disabled)',
            );
            const first = buttons[0],
              last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <h2 id="demo-result-title">
          {battle.winner === 'player'
            ? 'Vitória na demonstração!'
            : 'Derrota na demonstração'}
        </h2>
        <p>
          Treino fictício concluído. Nenhuma moeda, XP, carta ou progresso foi
          concedido ou salvo.
        </p>
        <button className={styles.primary} disabled={busy} onClick={restart}>
          Jogar novamente
        </button>
        <button onClick={close}>Fechar resultado</button>
      </div>
    </div>
  );
}

export function ArenaDemo({
  journeyNavigation = false,
}: {
  journeyNavigation?: boolean;
}) {
  const [battle, setBattle] = useState<CardBattle | null>(null);
  const [opponentId, setOpponentId] = useState(TRAINING_OPPONENTS[0].id);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const acting = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function start() {
    if (acting.current) return;
    setBattle(createDemoBattle(opponentId));
    setSelected(null);
    setResultOpen(false);
  }
  const apply = useCallback((next: CardBattle) => {
    acting.current = true;
    setBusy(true);
    setBattle(next);
    setSelected(null);
    if (next.phase === 'finished') setResultOpen(true);
    timer.current = setTimeout(() => {
      acting.current = false;
      setBusy(false);
    }, duration());
  }, []);
  function perform(command: CardCommand) {
    if (!battle || acting.current || battle.revision !== command.revision)
      return;
    const next =
      command.kind === 'play'
        ? playCombatCard(battle, command.instanceId, command.revision)
        : command.kind === 'end'
          ? endCardTurn(battle, command.revision)
          : command.kind === 'enemy'
            ? resolveCardEnemyTurn(battle, command.revision)
            : concedeCardBattle(battle, command.revision);
    if (next !== battle) apply(next);
  }
  useEffect(() => {
    if (!battle || battle.phase !== 'enemy' || busy) return;
    const id = setTimeout(() => {
      if (!acting.current) apply(resolveCardEnemyTurn(battle, battle.revision));
    }, duration());
    return () => clearTimeout(id);
  }, [battle, busy, apply]);
  function scenario(winner: 'player' | 'opponent') {
    if (acting.current) return;
    // Explicit visual fixtures only; no economy ports or settlement callbacks exist here.
    let fixture = createCardBattle(
      travelerBattleSnapshot(traveler),
      TRAINING_OPPONENTS[0],
      123,
      crypto.randomUUID(),
    );
    if (winner === 'player') {
      fixture.opponent.hp = 1;
      const attack = fixture.hand.find(
        (item) => combatCard(item.cardId)?.damage,
      )!;
      fixture = playCombatCard(fixture, attack.id, fixture.revision);
    } else {
      fixture.player.hp = 1;
      fixture.player.block = 0;
      fixture = endCardTurn(fixture, fixture.revision);
      fixture = resolveCardEnemyTurn(fixture, fixture.revision);
    }
    apply(fixture);
  }
  const chosen = battle?.hand.find((item) => item.id === selected);
  const card = chosen && combatCard(chosen.cardId);
  const intent = battle && enemyCardIntent(battle);
  const animating = busy && Boolean(battle?.lastEvent);
  const currentCard =
    battle?.lastEvent?.actor === 'player'
      ? COMBAT_CARDS.find((item) => item.name === battle.lastEvent!.label)
      : null;
  return (
    <main className={demo.root}>
      <p className={demo.notice}>
        PREVIEW · DEMONSTRAÇÃO ISOLADA · Sem login, recompensas ou salvamento.
        Recarregar reinicia tudo.
      </p>
      {journeyNavigation && (
        <nav className={demo.notice} aria-label="Retorno à Jornada">
          <Link href="/journey" prefetch={false}>
            Voltar à Jornada
          </Link>
        </nav>
      )}
      <section
        className={styles.page}
        data-card-arena-state={battle?.phase ?? 'lobby'}
        data-arena-demo="memory-only"
        data-battle-revision={battle?.revision ?? 0}
      >
        <header className={styles.pageHeader}>
          <div>
            <h1>Duelo de Cartas</h1>
            <p>Treino fictício para testar no celular.</p>
          </div>
        </header>
        {(!battle || battle.phase === 'finished') && (
          <div className={demo.setup}>
            <label>
              Adversário fictício{' '}
              <select
                value={opponentId}
                onChange={(event) => setOpponentId(event.target.value)}
              >
                {TRAINING_OPPONENTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button className={styles.primary} disabled={busy} onClick={start}>
              Iniciar demonstração
            </button>
          </div>
        )}
        {battle && (
          <>
            <div className={styles.turnBar}>
              <strong>
                Turno {battle.round} ·{' '}
                {battle.phase === 'enemy'
                  ? 'Adversário agindo'
                  : battle.phase === 'finished'
                    ? 'Concluído'
                    : 'Sua vez'}
              </strong>
              <span
                className={styles.energy}
                aria-label={`Energia ${battle.energy} de 3`}
              >
                <b>{battle.energy}</b> / 3 Energia
              </span>
              <span>◈ {battle.player.focus} / 6 Foco</span>
            </div>
            {battle.phase !== 'finished' && (
              <p className={styles.intent}>
                <b>Intenção: {intent!.label}</b>
                <span>
                  {intent!.damage
                    ? `${intent!.damage} de dano antes do Bloqueio`
                    : intent!.block
                      ? `${intent!.block} de Bloqueio`
                      : '+2 de Foco'}
                </span>
              </p>
            )}
            <div
              className={styles.field}
              data-motion={battle.lastEvent?.motion}
              data-outcome={
                battle.phase === 'finished' ? battle.winner : undefined
              }
              aria-label="Campo de batalha"
            >
              <div className={styles.fieldLight} aria-hidden="true" />
              <div
                key={battle.id}
                className={styles.camera}
                data-impact={animating ? battle.lastEvent?.motion : undefined}
              >
                <Fighter
                  fighter={battle.player}
                  traveler={traveler}
                  side="player"
                  battle={battle}
                  animating={animating}
                />
                <span className={styles.versus} aria-hidden="true">
                  VS
                </span>
                <Fighter
                  fighter={battle.opponent}
                  side="opponent"
                  battle={battle}
                  animating={animating}
                />
              </div>
              {animating && battle.lastEvent && (
                <div
                  key={`fx:${battle.lastEvent.revision}`}
                  className={styles.particles}
                  data-motion={battle.lastEvent.motion}
                  aria-hidden="true"
                >
                  {Array.from({ length: 8 }, (_, index) => (
                    <i key={index} />
                  ))}
                  <span />
                </div>
              )}
              {animating && currentCard && (
                <span
                  key={battle.lastEvent!.revision}
                  className={styles.playedCard}
                  aria-hidden="true"
                >
                  <span>{currentCard.glyph}</span>
                  {currentCard.name}
                </span>
              )}
            </div>
            {battle.phase !== 'finished' && (
              <>
                <section
                  className={styles.handSection}
                  aria-labelledby="hand-heading"
                >
                  <div className={styles.handHeading}>
                    <h2 id="hand-heading">
                      Sua mão <small>{battle.hand.length} / 5</small>
                    </h2>
                    <span>Toque em uma carta para ampliar</span>
                  </div>
                  <div className={styles.hand}>
                    {battle.hand.map((item) => {
                      const definition = combatCard(item.cardId)!;
                      const reason = cardPlayError(battle, item.id);
                      return (
                        <button
                          key={item.id}
                          className={styles.actionCard}
                          data-category={definition.category}
                          data-card-id={item.id}
                          data-unavailable={!!reason}
                          aria-label={`Ampliar ${definition.name}, ${definition.cost} de Energia${reason ? `, ${reason}` : ''}`}
                          onClick={() => setSelected(item.id)}
                        >
                          <CardFace card={definition} />
                          <small>{reason ?? 'Ampliar e jogar'}</small>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <div className={styles.turnActions}>
                  <span>
                    Compra: {battle.draw.length} · Descarte:{' '}
                    {battle.discard.length}
                  </span>
                  <button
                    className={styles.primary}
                    disabled={busy || battle.phase !== 'player'}
                    onClick={() =>
                      perform({ kind: 'end', revision: battle.revision })
                    }
                  >
                    Encerrar turno
                  </button>
                </div>
              </>
            )}
          </>
        )}
        <details className={styles.rules}>
          <summary>Cenários de validação visual</summary>
          <p>
            Os cenários abaixo usam apenas combatentes fictícios em memória.
          </p>
          <div className={demo.scenarios}>
            <button disabled={busy} onClick={() => scenario('player')}>
              Ensaiar vitória
            </button>
            <button disabled={busy} onClick={() => scenario('opponent')}>
              Ensaiar derrota
            </button>
          </div>
        </details>
        {card && battle && selected && (
          <CardPreview
            card={card}
            error={cardPlayError(battle, selected)}
            busy={busy}
            onClose={() => setSelected(null)}
            onPlay={() =>
              perform({
                kind: 'play',
                instanceId: selected,
                revision: battle.revision,
              })
            }
          />
        )}
        {resultOpen && battle && (
          <Outcome
            battle={battle}
            close={() => setResultOpen(false)}
            restart={start}
            busy={busy}
          />
        )}
      </section>
    </main>
  );
}
