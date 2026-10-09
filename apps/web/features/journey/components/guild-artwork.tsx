'use client';
import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  VISUAL_ASSETS,
  isApprovedVisualAsset,
  type VisualSlot,
} from '../data/audiovisualAssets';
import styles from './guild-experience.module.css';

type GuildDecoration = Extract<
  VisualSlot,
  | 'guildBanner'
  | 'guildMissionParchment'
  | 'guildLeaderTable'
  | 'guildRewardChest'
>;
/** Decorative only: failures restore the underlying CSS without another request. */
export function GuildArtwork({
  slot,
  className,
}: {
  slot: GuildDecoration;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const asset = VISUAL_ASSETS[slot];
  if (failed || !asset || !isApprovedVisualAsset(asset)) return null;
  return (
    <Image
      data-guild-art={slot}
      className={className}
      src={asset.src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      width={
        slot === 'guildLeaderTable'
          ? 1600
          : slot === 'guildMissionParchment'
            ? 768
            : 512
      }
      height={
        slot === 'guildLeaderTable'
          ? 600
          : slot === 'guildMissionParchment'
            ? 1024
            : slot === 'guildBanner'
              ? 768
              : 512
      }
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
export function GuildHall({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const asset = VISUAL_ASSETS.guildHall;
  const enabled = Boolean(!failed && asset && isApprovedVisualAsset(asset));
  return (
    <section
      className={`${className} ${styles.hall}`}
      data-guild-scene={enabled ? 'active' : 'fallback'}
    >
      {enabled && asset && (
        <picture className={styles.hallScene}>
          {asset.mobileSrc && (
            <source media="(max-width: 760px)" srcSet={asset.mobileSrc} />
          )}
          <img
            data-guild-art="guildHall"
            src={asset.src}
            alt=""
            decoding="async"
            fetchPriority="high"
            onError={() => setFailed(true)}
          />
        </picture>
      )}
      {children}
    </section>
  );
}
