'use client';
import { useState, type ReactNode } from 'react';
import {
  VISUAL_ASSETS,
  isApprovedVisualAsset,
  type VisualSlot,
} from '../data/audiovisualAssets';
import styles from '../journey.module.css';

/** A delivered-but-broken asset returns to the existing art without a retry loop. */
export function PackArtwork({
  slot,
  fallback,
  enabled = true,
}: {
  slot: VisualSlot;
  fallback?: ReactNode;
  enabled?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const asset = VISUAL_ASSETS[slot];
  if (!enabled || failed || !asset || !isApprovedVisualAsset(asset))
    return fallback ?? null;
  return (
    <picture className={styles.packArtwork}>
      {asset.mobileSrc && (
        <source media="(max-width: 760px)" srcSet={asset.mobileSrc} />
      )}
      <img
        src={asset.src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
