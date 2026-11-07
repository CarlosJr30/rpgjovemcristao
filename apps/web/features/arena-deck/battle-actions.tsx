'use client';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  arenaCardAvailability,
  arenaCombatConfig,
  describeArenaAction,
  type ArenaProductAction,
  type BattleState,
} from '@rpg/game-engine';
import { arenaCardIllustration } from './card-illustrations';
import { BattleCards } from './editor';
import styles from '../journey/journey.module.css';
import visual from './cards.module.css';

type PresentationStep = 'rise' | 'reveal' | 'effect' | 'return' | 'awaiting';

/** The same product controls are exercised by Arena and the shared Tower mode. */
export function ArenaBattleActions({
  battle,
  busy,
  onAction,
  onSkipAnimation,
}: {
  battle: BattleState;
  busy: boolean;
  onAction: (action: ArenaProductAction) => void | Promise<boolean>;
  onSkipAnimation?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<PresentationStep | null>(null);
  const [commandPending, setCommandPending] = useState(false);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const handDialog = useRef<HTMLDivElement>(null);
  const focusOptionAfterPreview = useRef<string | null>(null);
  const returnFocusPending = useRef(false);
  const commandLock = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const panelId = useId();
  const selectedCard = useMemo(
    () => battle.deck?.cards.find((card) => card.id === selectedId) ?? null,
    [battle.deck?.cards, selectedId],
  );
  const selectedAvailability = selectedCard
    ? arenaCardAvailability(battle, selectedCard.id)
    : null;
  const hasSelectedCard = Boolean(selectedCard);
  const availableCount =
    battle.deck?.cards.filter(
      (card) => arenaCardAvailability(battle, card.id).status === 'available',
    ).length ?? 0;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const focusOption = useCallback(
    (id: string) => {
      document
        .getElementById(`${panelId}-option-${id}`)
        ?.focus({ preventScroll: true });
    },
    [panelId],
  );
  const finishPresentation = useCallback(() => {
    clearTimers();
    setStep(null);
    setSelectedId(null);
    setCommandPending(false);
    commandLock.current = false;
    returnFocusPending.current = true;
    setOpen(false);
  }, [clearTimers]);
  const closePanel = useCallback(() => {
    if (commandLock.current) return;
    returnFocusPending.current = true;
    setOpen(false);
    setSelectedId(null);
    setStep(null);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (!open && !hasSelectedCard) {
      if (returnFocusPending.current) {
        trigger.current?.focus({ preventScroll: true });
        returnFocusPending.current = false;
      }
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (hasSelectedCard) dialog.current?.focus({ preventScroll: true });
    else if (open && focusOptionAfterPreview.current) {
      focusOption(focusOptionAfterPreview.current);
      focusOptionAfterPreview.current = null;
    } else if (open) {
      document.getElementById(panelId)?.focus({ preventScroll: true });
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (commandLock.current) return;
        event.preventDefault();
        if (selectedId) {
          focusOptionAfterPreview.current = selectedId;
          setSelectedId(null);
          setError('');
        } else closePanel();
        return;
      }
      if (event.key !== 'Tab') return;
      const activeDialog = hasSelectedCard
        ? dialog.current
        : handDialog.current;
      const focusable = activeDialog?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), summary, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === activeDialog ||
          document.activeElement === document.getElementById(panelId))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !activeDialog?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, hasSelectedCard, selectedId, panelId, closePanel, focusOption]);

  useEffect(() => {
    if (
      step !== 'awaiting' ||
      !selectedId ||
      (selectedAvailability?.status !== 'used' &&
        battle.status === 'in_progress')
    )
      return;
    const frame = requestAnimationFrame(finishPresentation);
    return () => cancelAnimationFrame(frame);
  }, [
    step,
    selectedId,
    selectedAvailability?.status,
    battle.status,
    finishPresentation,
  ]);

  const selectCard = (id: string) => {
    if (busy || commandLock.current) return;
    setSelectedId(id);
    setError('');
  };

  const confirmCard = async () => {
    if (
      !selectedCard ||
      busy ||
      commandLock.current ||
      selectedAvailability?.status !== 'available'
    )
      return;
    commandLock.current = true;
    setCommandPending(true);
    setError('');
    try {
      const accepted = await onAction(`card:${selectedCard.id}`);
      if (!accepted) {
        commandLock.current = false;
        setCommandPending(false);
        setError(
          'A carta não foi confirmada. Confira o estado da batalha e tente novamente.',
        );
        return;
      }
      const reduced =
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
          false);
      if (reduced) {
        setStep('awaiting');
        onSkipAnimation?.();
        return;
      }
      setStep('rise');
      timers.current = [
        setTimeout(() => setStep('reveal'), 1500),
        setTimeout(() => setStep('effect'), 3500),
        setTimeout(() => setStep('return'), 5500),
        setTimeout(() => setStep('awaiting'), 6500),
      ];
    } catch {
      commandLock.current = false;
      setCommandPending(false);
      setError(
        'A carta não foi confirmada. Confira o estado da batalha antes de tentar novamente.',
      );
    }
  };

  const skipPresentation = () => {
    if (step === 'awaiting' || !commandLock.current) return;
    clearTimers();
    setStep('awaiting');
    onSkipAnimation?.();
  };

  const effect = selectedCard
    ? describeArenaAction(selectedCard.action, battle.player)
    : null;
  const illustration = selectedCard
    ? arenaCardIllustration(selectedCard.id)
    : null;
  const cardKind = selectedCard?.type.toLowerCase() ?? 'tactical';

  if (battle.status !== 'in_progress' && step === null) return null;
  return (
    <>
      <div
        className={`${styles.battleActions} ${visual.actions}`}
        role="group"
        aria-label="Ações da batalha"
        inert={open || hasSelectedCard}
      >
        <button
          disabled={busy || commandPending}
          aria-label="ATACAR"
          onClick={() => void onAction('attack')}
        >
          <span aria-hidden="true">⚔</span>
          <b>ATACAR</b>
          <span>Dano com Força</span>
          <small>Até +{arenaCombatConfig.attackFocus} Foco</small>
        </button>
        <button
          disabled={busy || commandPending}
          aria-label="DEFENDER"
          onClick={() => void onAction('defend')}
        >
          <span aria-hidden="true">◈</span>
          <b>DEFENDER</b>
          <span>Protege o próximo golpe</span>
          <small>Até +{arenaCombatConfig.defendFocus} Foco</small>
        </button>
        <button
          ref={trigger}
          disabled={busy || commandPending}
          aria-label="CARTAS"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">✦</span>
          <b>CARTAS · {availableCount}/7</b>
          <span>Escolha uma carta</span>
          <small>Um uso por carta</small>
        </button>
      </div>
      {open && (
        <div
          ref={handDialog}
          className={visual.cardSelectionLayer}
          role={hasSelectedCard ? undefined : 'dialog'}
          aria-modal={hasSelectedCard ? undefined : true}
          aria-label="Escolha uma carta"
          inert={hasSelectedCard}
          data-selection-active={hasSelectedCard || undefined}
        >
          <BattleCards
            compact
            panelId={panelId}
            battle={battle}
            busy={busy || commandPending}
            onPlay={() => undefined}
            onSelect={selectCard}
            onClose={closePanel}
          />
        </div>
      )}
      {selectedCard && effect && (
        <div
          className={visual.cardDialogBackdrop}
          data-card-phase={step ?? 'selection'}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            ref={dialog}
            className={visual.cardDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${panelId}-dialog-title`}
            aria-describedby={`${panelId}-dialog-effect`}
            tabIndex={-1}
          >
            {step && step !== 'awaiting' ? (
              <>
                <div className={visual.cinematicHeader}>
                  <span aria-hidden="true">✦</span>
                  <p>
                    {step === 'rise'
                      ? 'REVELANDO CARTA'
                      : step === 'reveal'
                        ? 'CARTA EM DESTAQUE'
                        : step === 'effect'
                          ? 'AÇÃO CONFIRMADA'
                          : 'RETORNO AO BARALHO'}
                  </p>
                  <span aria-hidden="true">✦</span>
                </div>
                <article
                  className={`${visual.cinematicCard} ${visual[`cinematic-${cardKind}`]}`}
                  data-card-phase={step}
                >
                  {illustration && (
                    // eslint-disable-next-line @next/next/no-img-element -- imagem local aprovada da carta
                    <img src={illustration.src} alt={illustration.alt} />
                  )}
                  <span className={visual.cinematicFocus}>
                    {selectedAvailability?.focusCost} FOCO
                  </span>
                  <h2 id={`${panelId}-dialog-title`}>{selectedCard.name}</h2>
                  <p>{effect.headline}</p>
                  {step === 'effect' && (
                    <span className={visual.effectGlyph} aria-hidden="true">
                      {selectedCard.type === 'OFFENSIVE'
                        ? '⚔'
                        : selectedCard.type === 'DEFENSIVE'
                          ? '◈'
                          : '✦'}
                    </span>
                  )}
                </article>
                <p
                  id={`${panelId}-dialog-effect`}
                  className={visual.cinematicCaption}
                >
                  {step === 'effect'
                    ? effect.explanation
                    : `${effect.headline} · ${selectedAvailability?.focusCost} Foco`}
                </p>
                {error && <p role="alert">{error}</p>}
                <button
                  className={visual.skipPresentation}
                  type="button"
                  onClick={skipPresentation}
                >
                  Pular animação
                </button>
              </>
            ) : step === 'awaiting' ? (
              <div className={visual.presentationAwaiting} role="status">
                <span aria-hidden="true">✦</span>
                <h2 id={`${panelId}-dialog-title`}>Resultado da carta</h2>
                <p id={`${panelId}-dialog-effect`}>
                  Conferindo o resultado da batalha…
                </p>
              </div>
            ) : (
              <>
                <article className={visual.cardPreview}>
                  {illustration && (
                    // eslint-disable-next-line @next/next/no-img-element -- imagem local aprovada da carta
                    <img src={illustration.src} alt={illustration.alt} />
                  )}
                  <div>
                    <p className={visual.previewRarity}>
                      {selectedCard.rarity}
                    </p>
                    <h2 id={`${panelId}-dialog-title`}>{selectedCard.name}</h2>
                    <p className={visual.previewCost}>
                      {selectedAvailability?.focusCost} FOCO
                    </p>
                    <strong id={`${panelId}-dialog-effect`}>
                      {effect.headline}
                    </strong>
                    <details className={visual.previewDetails}>
                      <summary>Explicação completa</summary>
                      <p>{effect.explanation}</p>
                      <small>
                        {effect.condition} · {effect.duration}
                      </small>
                    </details>
                    {selectedAvailability?.status !== 'available' && (
                      <p role="status">
                        {selectedAvailability?.status === 'used'
                          ? 'Esta carta já foi utilizada nesta batalha.'
                          : 'Carta indisponível nesta rodada.'}
                      </p>
                    )}
                    {error && <p role="alert">{error}</p>}
                  </div>
                </article>
                <div className={visual.dialogActions}>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      commandPending ||
                      selectedAvailability?.status !== 'available'
                    }
                    onClick={() => void confirmCard()}
                  >
                    Usar carta
                  </button>
                  <button
                    type="button"
                    disabled={busy || commandPending}
                    onClick={() => {
                      focusOptionAfterPreview.current = selectedCard.id;
                      setSelectedId(null);
                    }}
                  >
                    Voltar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
