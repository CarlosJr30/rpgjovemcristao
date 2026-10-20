'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { ArenaProductAction, BattleState } from '@rpg/game-engine';
import { BattleCards } from './editor';
import styles from '../journey/journey.module.css';

/** The same product controls are exercised by the isolated browser harness. */
export function ArenaBattleActions({
  battle,
  busy,
  onAction,
}: {
  battle: BattleState;
  busy: boolean;
  onAction: (action: ArenaProductAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  if (battle.status !== 'in_progress') return null;
  return (
    <>
      <div
        className={styles.battleActions}
        role="group"
        aria-label="Ações da batalha"
      >
        <button
          disabled={busy}
          aria-label="ATACAR"
          onClick={() => onAction('attack')}
        >
          <b>ATACAR</b>
          <span>Dano com Força</span>
          <small>+1 Foco</small>
        </button>
        <button
          disabled={busy}
          aria-label="DEFENDER"
          onClick={() => onAction('defend')}
        >
          <b>DEFENDER</b>
          <span>Protege o próximo golpe</span>
          <small>+1 Foco</small>
        </button>
        <button
          ref={trigger}
          disabled={busy}
          aria-label="CARTAS"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          <b>CARTAS</b>
          <span>Seu baralho de sete</span>
          <small>Um uso por carta</small>
        </button>
      </div>
      {open && (
        <BattleCards
          panelId={panelId}
          battle={battle}
          busy={busy}
          onPlay={(id) => onAction(`card:${id}`)}
        />
      )}
    </>
  );
}
