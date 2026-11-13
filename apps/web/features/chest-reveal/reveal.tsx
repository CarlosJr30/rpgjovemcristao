'use client';
import { useEffect, useEffectEvent, useReducer, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { describeArenaAction, describeCatalogCard } from '@rpg/game-engine';
import { DuplicateActions } from './duplicate-actions';
import { chestCatalog } from '../journey/data/chests';
import { equipmentAssetForItem } from '../journey/data/equipmentAssets';
import { EQUIPMENT_SLOT_LABELS } from '../journey/data/equipmentCinematic';
import { EquipmentArenaDetails } from '../journey/components/arena-rule-details';
import { EquipmentComparison } from '../journey/components/equipment-comparison';
import { EquipmentStatBonuses } from '../journey/components/equipment-stat-bonuses';
import { EquipmentBibleDetails } from '../journey/components/equipment-bible-details';
import type { Traveler } from '../journey/domain/traveler';
import { gameAudio } from '../journey/audio/audio-manager';
import { SOUND_ASSETS } from '../journey/audio/audio-assets';
import { CHEST_RARITY_SOUNDS } from '../journey/audio/audio-catalog';
import { REVEAL_TIMING, revealTransition, type RevealState } from './machine';
import {
  prizeName,
  rarityLabel,
  type RevealPrize,
  type RevealReceipt,
  type RevealRarity,
} from './receipt';
import type { VisualCursor } from './visual-store';
import css from './reveal.module.css';

function revealSound(rarity: RevealRarity) {
  const effect = CHEST_RARITY_SOUNDS[rarity];
  // Production-approved catalog only; no Arena prototype fallback here.
  if (SOUND_ASSETS[effect])
    gameAudio.playEffect(effect, rarity === 'comum' ? 0.45 : 0.7);
}
function initialState(cursor: VisualCursor): RevealState {
  return {
    phase: cursor.summary
      ? 'summary'
      : cursor.seen > cursor.index
        ? 'details'
        : 'ready',
    index: cursor.index,
    seen: cursor.seen,
    revision: 0,
  };
}
export function ChestReveal({
  receipt,
  traveler,
  cursor,
  onProgress,
  onClose,
  onViewEquipment,
  presentationLabel = 'Seu tesouro',
  cinematic = false,
}: {
  receipt: RevealReceipt;
  traveler: Traveler;
  cursor: VisualCursor;
  onProgress: (cursor: VisualCursor) => void;
  onClose: () => void;
  onViewEquipment: () => void;
  presentationLabel?: string;
  cinematic?: boolean;
}) {
  const [state, dispatch] = useReducer(revealTransition, cursor, (c) => {
    const state = initialState(c);
    return cinematic && state.phase === 'ready'
      ? { ...state, phase: 'opening' as const }
      : state;
  });
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  const [staticMode, setStaticMode] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [warning, setWarning] = useState('');
  const panel = useRef<HTMLElement>(null);
  const closeEvent = useEffectEvent(onClose);
  const progressEvent = useEffectEvent(onProgress);
  const prize = receipt.entries[state.index];
  const still = reduced || staticMode;
  const animated = ['opening', 'rising', 'holding', 'flipping'].includes(
    state.phase,
  );
  const event = (type: 'start' | 'skip' | 'next' | 'tick') => {
    if (type === 'next')
      panel.current
        ?.querySelector<HTMLButtonElement>('button')
        ?.focus({ preventScroll: true });
    dispatch({
      type,
      revision: state.revision,
      count: receipt.entries.length,
      static: still,
      cinematic,
    });
  };
  useEffect(() => {
    panel.current?.parentElement?.scrollTo?.({ top: 0, behavior: 'instant' });
  }, [state.index]);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media?.matches ?? false);
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current
      ?.querySelector<HTMLButtonElement>('button')
      ?.focus({ preventScroll: true });
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeEvent();
      }
      if (e.key !== 'Tab') return;
      const targets = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], summary',
        ) ?? [],
      );
      const first = targets[0],
        last = targets.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus({ preventScroll: true });
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', keyboard);
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (!animated) return;
    if (still) {
      dispatch({
        type: 'skip',
        cinematic,
        revision: state.revision,
        count: receipt.entries.length,
      });
      return;
    }
    const duration =
      (cinematic
        ? { opening: 1500, rising: 2000, holding: 2000, flipping: 1000 }
        : REVEAL_TIMING)[state.phase as keyof typeof REVEAL_TIMING] / speed;
    const timer = window.setTimeout(
      () =>
        dispatch({
          type: 'tick',
          cinematic,
          revision: state.revision,
          count: receipt.entries.length,
        }),
      duration,
    );
    return () => window.clearTimeout(timer);
  }, [
    animated,
    state.phase,
    state.revision,
    speed,
    still,
    cinematic,
    receipt.entries.length,
  ]);
  useEffect(() => {
    let live = true;
    try {
      progressEvent({
        receiptId: receipt.id,
        operationKey: receipt.operationKey,
        index: state.index,
        seen: state.seen,
        summary: state.phase === 'summary',
      });
    } catch (e) {
      queueMicrotask(() => {
        if (live)
          setWarning(
            e instanceof Error
              ? e.message
              : 'Apresentação não salva. Consulte o histórico.',
          );
      });
    }
    return () => {
      live = false;
    };
  }, [receipt.id, receipt.operationKey, state.index, state.seen, state.phase]);
  useEffect(() => {
    // Mount/reload in details is silent. Sound follows an explicit reveal.
    if (state.phase === 'details' && state.revision > 0)
      revealSound(prize.rarity);
  }, [state.phase, state.revision, prize.rarity]);
  if (typeof document === 'undefined') return null;
  const src =
    prize.kind === 'equipment'
      ? equipmentAssetForItem(prize.item)
      : prize.kind === 'coins'
        ? '/assets/items/coin_pouch.png'
        : prize.art;
  return createPortal(
    <div
      className={css.backdrop}
      data-cinematic={cinematic || undefined}
      data-rarity={prize.rarity}
      data-phase={state.phase}
      data-static={still || undefined}
      style={{ '--pace': `${1 / speed}` } as React.CSSProperties}
    >
      <section
        ref={panel}
        className={css.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chest-reveal-title"
      >
        <header className={css.header}>
          <div>
            <p className={css.eyebrow}>TESOUROS DA JORNADA</p>
            <h2 id="chest-reveal-title">
              {chestCatalog[receipt.chestType].name}
            </h2>
          </div>
          <button
            className={css.close}
            onClick={onClose}
            aria-label="Fechar apresentação e retomar depois"
          >
            ×
          </button>
        </header>
        <p className={css.confirmed}>{presentationLabel}</p>
        <p role="status" aria-live="polite">
          {state.phase === 'summary'
            ? 'Todos os prêmios apresentados.'
            : state.phase === 'details'
              ? `Prêmio ${state.index + 1} de ${receipt.entries.length}: ${prizeName(prize)}. ${rarityLabel(prize.rarity)}.`
              : `Prêmio ${state.index + 1} de ${receipt.entries.length} · ${state.phase === 'ready' ? 'Pronto para revelar' : state.phase === 'holding' ? 'No centro — preparando os detalhes' : 'Revelando'}`}
        </p>
        {warning && <p role="alert">{warning}</p>}
        {state.phase !== 'summary' ? (
          <>
            <div
              className={css.stage}
              aria-hidden="true"
              onClick={() => {
                if (animated) setSpeed(3);
              }}
            >
              <div className={css.halo} />
              <div className={css.particles}>
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} style={{ '--n': i } as React.CSSProperties} />
                ))}
              </div>
              <div className={css.chest}>
                {/* eslint-disable-next-line @next/next/no-img-element -- existing registered local chest, clipped lid shares the same asset */}
                <img
                  src={chestCatalog[receipt.chestType].image}
                  alt=""
                  width="168"
                  height="168"
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- same registered raster, no generated art */}
                <img
                  className={css.lid}
                  src={chestCatalog[receipt.chestType].image}
                  alt=""
                  width="168"
                  height="168"
                />
              </div>
              <div
                className={`${css.prize} ${prize.kind === 'card' ? css.card : css.item}`}
              >
                <div className={css.back}>
                  <span>R</span>
                  <small>JOVEM CRISTÃO</small>
                </div>
                <div className={css.front}>
                  {src ? (
                    <Image
                      src={src}
                      alt=""
                      width={152}
                      height={152}
                      unoptimized
                    />
                  ) : (
                    <span className={css.noArt}>Arte ainda não homologada</span>
                  )}
                  <b>
                    {prize.kind === 'card' ? prize.card.name : prizeName(prize)}
                  </b>
                  <small>{rarityLabel(prize.rarity)}</small>
                </div>
              </div>
            </div>
            {state.phase === 'ready' && (
              <div className={css.controls}>
                <button
                  onClick={() => {
                    gameAudio.unlock();
                    event('start');
                  }}
                >
                  Revelar prêmio
                </button>
                <button
                  onClick={() => {
                    setStaticMode(true);
                    event('skip');
                  }}
                >
                  Apresentação estática
                </button>
              </div>
            )}
            {animated && (
              <div className={css.controls}>
                <button onClick={() => setSpeed(3)}>Acelerar</button>
                <button onClick={() => event('skip')}>Pular animação</button>
                <span>Toque na cena para acelerar.</span>
              </div>
            )}
            {state.phase === 'details' && (
              <article className={css.details}>
                <p className={css.eyebrow}>
                  PRÊMIO {state.index + 1} DE {receipt.entries.length} ·{' '}
                  {rarityLabel(prize.rarity)}
                </p>
                <h3>{prizeName(prize)}</h3>
                <PrizeDetails prize={prize} traveler={traveler} />
                {receipt.repeated && (
                  <DuplicateActions
                    actor={receipt.travelerId}
                    itemId={receipt.repeated.itemId}
                  />
                )}
                <button className={css.next} onClick={() => event('next')}>
                  {state.index + 1 === receipt.entries.length
                    ? 'Ver resumo'
                    : 'Próximo prêmio'}
                </button>
              </article>
            )}
          </>
        ) : (
          <div className={css.summary}>
            <p className={css.eyebrow}>ABERTURA CONCLUÍDA</p>
            <h3>Você recebeu</h3>
            <ol>
              {receipt.entries.map((p, i) => (
                <li key={i}>
                  {cinematic && (
                    <Image
                      src={
                        p.kind === 'equipment'
                          ? equipmentAssetForItem(p.item)
                          : p.kind === 'coins'
                            ? '/assets/items/coin_pouch.png'
                            : p.art || '/assets/items/coin_pouch.png'
                      }
                      alt=""
                      width={120}
                      height={120}
                      unoptimized
                    />
                  )}
                  <b>{prizeName(p)}</b>
                  <span>
                    {p.kind === 'coins'
                      ? 'Moedas'
                      : `${rarityLabel(p.rarity)} · ${p.kind === 'equipment' ? 'Equipamento +1' : 'Carta +1'}`}
                  </span>
                </li>
              ))}
            </ol>
            {receipt.repeated && (
              <DuplicateActions
                actor={receipt.travelerId}
                itemId={receipt.repeated.itemId}
              />
            )}

            <div className={css.controls}>
              <button onClick={onClose}>
                {cinematic ? 'Continuar' : 'Concluir'}
              </button>
              <button onClick={onViewEquipment}>Ver na Mochila</button>
            </div>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
function PrizeDetails({
  prize,
  traveler,
}: {
  prize: RevealPrize;
  traveler: Traveler;
}) {
  if (prize.kind === 'coins')
    return (
      <p>
        + {prize.amount} Moedas do Viajante, conforme o registro desta abertura.
        Este valor é o prêmio, não o saldo total.
      </p>
    );
  if (prize.kind === 'card') {
    const d =
      describeCatalogCard(prize.card.id) ??
      describeArenaAction(prize.card.action);
    return (
      <>
        <p>
          Carta ·{' '}
          {
            {
              OFFENSIVE: 'Ofensiva',
              DEFENSIVE: 'Defensiva',
              TACTICAL: 'Tática',
            }[prize.card.type]
          }
        </p>
        <strong>{d.headline}</strong>
        <p>{d.explanation}</p>
        <p>
          Custo: {d.focusCost} Foco · Nível mínimo: {d.minimumLevel}
        </p>
        <p>Duração: {d.duration}</p>
      </>
    );
  }
  const item = prize.item;
  const owned = traveler.inventory.find(
    (e) => e.id === item.id && e.slot === item.slot,
  );
  return (
    <>
      <p>Equipamento · {EQUIPMENT_SLOT_LABELS[item.slot]} · +1</p>
      <EquipmentStatBonuses stats={item.stats} />
      <EquipmentArenaDetails item={item} />
      {owned ? (
        <EquipmentComparison traveler={traveler} item={owned} expanded />
      ) : (
        <p>
          Comparação pendente: aguarde a sincronização deste item na Mochila.
        </p>
      )}
      <EquipmentBibleDetails item={item} />
      <p>Guardado na Mochila. Não foi equipado automaticamente.</p>
    </>
  );
}
