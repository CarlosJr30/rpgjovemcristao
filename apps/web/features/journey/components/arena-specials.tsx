'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  arenaSpecials,
  arenaCombatConfig,
  arenaFocus,
  specialAvailability,
  specialCost,
  type ArenaAction,
  type BattleFighterState,
} from '@rpg/game-engine';
import styles from '../journey.module.css';
import { ARENA_FEEDBACK } from '../data/arenaPresentation';

export function ArenaFocusMeter({ fighter }: { fighter: BattleFighterState }) {
  const points = arenaFocus(fighter);
  const meter = useRef<HTMLDivElement>(null);
  const previous = useRef(points);
  useEffect(() => {
    const change =
      points > previous.current
        ? 'gain'
        : points < previous.current
          ? 'spend'
          : undefined;
    previous.current = points;
    const node = meter.current;
    if (!node || !change) return;
    node.dataset.change = change;
    const timer = setTimeout(
      () => {
        delete node.dataset.change;
      },
      change === 'gain' ? ARENA_FEEDBACK.focusPulse : ARENA_FEEDBACK.focusSpend,
    );
    return () => {
      clearTimeout(timer);
      delete node.dataset.change;
    };
  }, [points]);
  return (
    <div
      ref={meter}
      style={
        {
          '--focus-pulse-duration': `${ARENA_FEEDBACK.focusPulse}ms`,
          '--focus-spend-duration': `${ARENA_FEEDBACK.focusSpend}ms`,
        } as CSSProperties
      }
      className={styles.arenaFocus}
      role="meter"
      aria-label={`Foco de ${fighter.snapshot.name}`}
      aria-valuemin={0}
      aria-valuemax={arenaCombatConfig.maximumFocus}
      aria-valuenow={points}
    >
      <span>
        FOCO {points}/{arenaCombatConfig.maximumFocus}
      </span>
      <b aria-hidden="true">
        {Array.from({ length: arenaCombatConfig.maximumFocus }, (_, index) => (
          <i key={index} data-filled={index < points}>
            ●
          </i>
        ))}
      </b>
      {points === arenaCombatConfig.maximumFocus && <small>FOCO CHEIO</small>}
    </div>
  );
}

export function ArenaSpecialPanel({
  fighter,
  busy,
  onSelect,
  onClose,
}: {
  fighter: BattleFighterState;
  busy: boolean;
  onSelect: (action: ArenaAction) => void;
  onClose: () => void;
}) {
  const [hint, setHint] = useState(
    'Escolha o momento certo para usar seu Foco.',
  );
  return (
    <section
      id="arena-specials"
      className={styles.arenaSpecials}
      aria-label="Golpes especiais"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
          document.getElementById('arena-special-trigger')?.focus();
        }
      }}
    >
      <header>
        <h3>GOLPES ESPECIAIS</h3>
        <button onClick={onClose} aria-label="Fechar especiais">
          Fechar
        </button>
      </header>
      <div>
        {arenaSpecials
          .slice(0, arenaCombatConfig.maximumSpecialSlots)
          .map((special) => {
            const state = specialAvailability(fighter, special.id);
            const unavailable = state !== 'available';
            const reason =
              state === 'locked'
                ? `Desbloqueia no nível ${special.minimumLevel}`
                : state === 'unequipped'
                  ? 'Fora do seu loadout'
                  : state === 'focus'
                    ? 'FOCO INSUFICIENTE'
                    : 'Disponível';
            return (
              <button
                key={special.id}
                disabled={busy}
                aria-disabled={unavailable}
                data-available={!unavailable}
                onClick={() => {
                  if (unavailable) {
                    setHint(reason);
                    return;
                  }
                  setHint('');
                  onSelect(`special:${special.id}`);
                  onClose();
                }}
              >
                <span aria-hidden="true">
                  {state === 'locked' ? '🔒' : special.visual.icon}
                </span>
                <b>{special.name}</b>
                <small>
                  {specialCost(fighter.snapshot, special)} Foco ·{' '}
                  {special.type === 'OFFENSIVE'
                    ? 'Ofensivo'
                    : special.type === 'DEFENSIVE'
                      ? 'Defensivo'
                      : 'Tático'}
                </small>
                <span>{special.description}</span>
                <strong>{reason}</strong>
              </button>
            );
          })}
      </div>
      <p role="status" aria-live="polite">
        {hint}
      </p>
    </section>
  );
}
