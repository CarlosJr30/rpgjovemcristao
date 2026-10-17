'use client';
import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { CardBattle, CardFighter, CombatCard } from '@rpg/game-engine';
import type { Traveler } from '../domain/traveler';
import { AvatarRuntime } from './avatar-runtime';
import { PackArtwork } from './pack-artwork';
import { trainingPortraitSlot } from '../data/audiovisualAssets';
import styles from './card-arena.module.css';

const categoryLabel = {
  attack: 'Ataque',
  defense: 'Defesa',
  faith: 'Fé · atitude',
  tactic: 'Tática',
  special: 'Especial',
};
export function TrainingArt({ id, name }: { id: string; name: string }) {
  const slot = trainingPortraitSlot(id);
  const fallback = (
    <span role="img" aria-label={`Retrato de ${name} indisponível`}>
      {name.slice(0, 1)}
    </span>
  );
  return (
    <div className={styles.trainingArt} data-card-training-art>
      {slot ? <PackArtwork slot={slot} fallback={fallback} /> : fallback}
    </div>
  );
}

export function Fighter({
  fighter,
  traveler,
  side,
  battle,
  animating,
}: {
  fighter: CardFighter;
  traveler?: Traveler;
  side: 'player' | 'opponent';
  battle: CardBattle;
  animating: boolean;
}) {
  const event = battle.lastEvent,
    actor = animating && event?.actor === side;
  const received = animating && event && event.actor !== side;
  const motion = actor
    ? event.motion
    : received && event.countered
      ? 'counter'
      : received && event.damage
        ? 'hit'
        : received && event.blocked
          ? 'block'
          : 'idle';
  const outcome =
    battle.phase === 'finished'
      ? battle.winner === side
        ? 'victory'
        : 'defeat'
      : undefined;
  return (
    <article className={styles.fighter} data-side={side} data-outcome={outcome}>
      <header>
        <small>
          {side === 'player' ? 'SEU VIAJANTE' : 'TREINADOR FICTÍCIO'} · NV.{' '}
          {fighter.snapshot.level}
        </small>
        <h2>{fighter.snapshot.name}</h2>
        <label>
          {fighter.hp} / {fighter.maxHp} Vida
          <progress
            aria-label={`Vida de ${fighter.snapshot.name}`}
            max={fighter.maxHp}
            value={fighter.hp}
          />
        </label>
        <p className={styles.fighterNumbers}>
          <span>◇ {fighter.block} Bloqueio</span>
          <span>◈ {fighter.focus} Foco</span>
        </p>
      </header>
      <div className={styles.arrival}>
        <div className={styles.idle}>
          <div
            key={`${battle.id}:${event?.revision ?? 0}`}
            className={styles.actor}
            data-motion={motion}
          >
            {traveler ? (
              <div className={styles.fixedIdentity}>
                <AvatarRuntime
                  traveler={traveler}
                  mode="arena"
                  decorative
                  showEquipment={false}
                />
              </div>
            ) : (
              <TrainingArt
                id={fighter.snapshot.id}
                name={fighter.snapshot.name}
              />
            )}
            {actor && (
              <span
                className={styles.aura}
                aria-hidden="true"
                data-kind={event.motion}
              />
            )}
            {received && Boolean(event.damage || event.blocked) && (
              <span className={styles.floatingValue} aria-hidden="true">
                {event.damage ? `−${event.damage}` : `◇ ${event.blocked}`}
              </span>
            )}
            {actor && event.healed > 0 && (
              <span className={styles.healingValue} aria-hidden="true">
                +{event.healed}
              </span>
            )}
          </div>
        </div>
      </div>
      <span className={styles.groundShadow} aria-hidden="true" />
    </article>
  );
}

export function CardFace({ card }: { card: CombatCard }) {
  return (
    <>
      <span className={styles.cardTop}>
        <b aria-label={`${card.cost} de Energia`}>{card.cost}</b>
        <small>{categoryLabel[card.category]}</small>
      </span>
      <span className={styles.cardGlyph} aria-hidden="true">
        {card.glyph}
      </span>
      <strong>{card.name}</strong>
      <span className={styles.cardNumbers}>
        {card.damage
          ? `⚔ ${card.damage} + Força`
          : card.block
            ? `◇ ${card.block} Bloqueio`
            : card.heal
              ? `+${card.heal} Vida`
              : card.focus
                ? `+${card.focus} Foco`
                : 'Compra 1 · prepara'}
        {card.focusCost > 0 && ` · ◈ ${card.focusCost}`}
      </span>
    </>
  );
}

export function CardPreview({
  card,
  error,
  busy,
  onPlay,
  onClose,
}: {
  card: CombatCard;
  error: string | null;
  busy: boolean;
  onPlay: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  function keys(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
    if (event.key === 'Tab') {
      const buttons = [
        ...dialog.current!.querySelectorAll<HTMLButtonElement>(
          'button:not(:disabled)',
        ),
      ];
      const first = buttons[0],
        last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
  return (
    <div
      className={styles.veil}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-preview-title"
        className={styles.preview}
        onKeyDown={keys}
      >
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Fechar carta"
        >
          ×
        </button>
        <div className={styles.enlarged} data-category={card.category}>
          <CardFace card={card} />
        </div>
        <h2 id="card-preview-title">{card.name}</h2>
        <p>{card.description}</p>
        <p>
          Custo: {card.cost} Energia
          {card.focusCost ? ` e ${card.focusCost} Foco` : ''}. Após jogar, esta
          cópia vai ao descarte temporário.
        </p>
        {error && (
          <p role="status" className={styles.error}>
            {error}
          </p>
        )}
        <button
          className={styles.primary}
          onClick={onPlay}
          disabled={!!error || busy}
        >
          Jogar carta
        </button>
        <button onClick={onClose}>Voltar à mão</button>
      </div>
    </div>
  );
}
