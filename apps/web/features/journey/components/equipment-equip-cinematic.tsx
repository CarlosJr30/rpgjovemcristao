'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ATTRIBUTE_KEYS } from '../domain/traveler';
import { ATTRIBUTE_LABELS } from '../data/attributes';
import { equipmentAssetForItem } from '../data/avatarAssets';
import {
  EQUIPMENT_SLOT_LABELS,
  RARITY_PRESENTATION,
  signedValue,
} from '../data/equipmentCinematic';
import type { CinematicSession } from '../hooks/use-equipment-cinematic';
import styles from './equipment-cinematic.module.css';

export function EquipmentEquipCinematic({
  session,
  onSkip,
}: {
  session: CinematicSession | null;
  onSkip: () => void;
}) {
  const skipRef = useRef(onSkip);
  useEffect(() => {
    skipRef.current = onSkip;
  }, [onSkip]);
  const button = useRef<HTMLButtonElement>(null);
  const visibleId = session && session.stage !== 'DONE' ? session.id : null;
  useEffect(() => {
    if (visibleId === null) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    button.current?.focus({ preventScroll: true });
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        skipRef.current();
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        button.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('keydown', keyboard);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [visibleId]);
  if (!session || session.stage === 'DONE') return null;
  const { reward, geometry: g, stage, reducedMotion } = session;
  const config = RARITY_PRESENTATION[reward.item.rarity];
  const confirming = stage === 'EQUIP_CONFIRM';
  const revealing =
    stage === 'REWARD_REVEAL' || (reducedMotion && stage !== 'PREPARE');
  const flight = stage === 'FLY_TO_TARGET' && !reducedMotion;
  const variables = {
    '--accent': config.color,
    '--glow': config.glow,
    '--reveal-scale': config.scale,
    '--impact-strength': config.impactStrength,
    '--stage-duration': `${config.timings[stage]}ms`,
    '--stats-delay': `${Math.max(0, config.timings.REWARD_REVEAL - 350)}ms`,
    '--center-x': `${g.centerX}px`,
    '--center-y': `${g.centerY}px`,
    '--icon-size': `${g.size}px`,
    '--source-dx': `${g.sourceDx}px`,
    '--source-dy': `${g.sourceDy}px`,
    '--flight-dx': `${g.dx}px`,
    '--flight-dy': `${g.dy}px`,
    '--flight-mid-dx': `${g.midDx}px`,
    '--flight-mid-dy': `${g.midDy}px`,
    '--flight-duration': `${config.timings.FLY_TO_TARGET}ms`,
    '--target-x': `${g.targetX}px`,
    '--target-y': `${g.targetY}px`,
  } as CSSProperties;
  return createPortal(
    <div
      className={styles.scene}
      data-equipment-cinematic
      data-stage={stage}
      data-rarity={reward.item.rarity}
      data-reduced-motion={reducedMotion}
      data-confirming={confirming}
      style={variables}
      onClick={onSkip}
    >
      <div className={styles.backdrop} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Equipar ${reward.item.name}`}
        aria-describedby={`equipment-reward-${session.id}`}
        className={styles.dialog}
      >
        {!confirming && (
          <>
            {!reducedMotion && (
              <div className={styles.light} aria-hidden="true">
                <span className={styles.halo} />
                {config.particleCount > 0 && <span className={styles.ring} />}
                {Array.from({ length: config.particleCount }, (_, index) => (
                  <i
                    key={index}
                    className={styles.particle}
                    style={
                      {
                        '--angle': `${(360 * index) / config.particleCount}deg`,
                        '--distance': `${65 + (index % 3) * 17}px`,
                        '--delay': `${index * 12}ms`,
                      } as CSSProperties
                    }
                  />
                ))}
                {config.particleCount >= 8 && <span className={styles.rays} />}
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- temporary UI clone, never body art */}
            <img
              key={stage}
              className={styles.icon}
              src={equipmentAssetForItem(reward.item)}
              alt=""
              aria-hidden="true"
              data-cinematic-icon
              data-equipment-flight={flight ? '' : undefined}
              data-flight-slot={flight ? reward.item.slot : undefined}
            />
            <div
              id={`equipment-reward-${session.id}`}
              className={styles.reward}
              data-visible={revealing}
            >
              <p className={styles.eyebrow}>NOVO EQUIPAMENTO</p>
              <h2>{reward.item.name}</h2>
              <p className={styles.rarity}>
                {config.label}{' '}
                <span>· {EQUIPMENT_SLOT_LABELS[reward.item.slot]}</span>
              </p>
              <div className={styles.bonuses} aria-label="Bônus do item">
                {ATTRIBUTE_KEYS.filter((key) => reward.item.stats[key]).map(
                  (key) => (
                    <span key={key}>
                      {signedValue(reward.item.stats[key]!)}{' '}
                      {ATTRIBUTE_LABELS[key]}
                    </span>
                  ),
                )}
                {!ATTRIBUTE_KEYS.some((key) => reward.item.stats[key]) && (
                  <span>Sem bônus de atributos</span>
                )}
              </div>
              <p className={styles.power} data-power-delta={reward.powerDelta}>
                {signedValue(reward.powerDelta)} PODER{' '}
                <small>
                  {reward.beforePower} → {reward.afterPower}
                </small>
              </p>
              {reward.previous && (
                <div className={styles.comparison}>
                  <p>Substitui {reward.previous.name}</p>
                  <p>
                    Variação:{' '}
                    {ATTRIBUTE_KEYS.filter((key) => reward.delta[key])
                      .map(
                        (key) =>
                          `${signedValue(reward.delta[key])} ${ATTRIBUTE_LABELS[key]}`,
                      )
                      .join(' · ') || 'sem alteração de atributos'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
        <button
          ref={button}
          type="button"
          className={styles.skip}
          onClick={(event) => {
            event.stopPropagation();
            onSkip();
          }}
        >
          Concluir · Escape ou toque
        </button>
      </div>
      {confirming && !reducedMotion && (
        <span
          data-equipment-impact
          data-impact-slot={reward.item.slot}
          className={styles.impact}
          style={{ left: g.targetX - 16, top: g.targetY - 16 }}
          aria-hidden="true"
        />
      )}
    </div>,
    document.body,
  );
}
