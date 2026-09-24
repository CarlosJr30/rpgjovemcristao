import { useState } from 'react';
import type { Appearance, AvatarConfig } from '../domain/traveler';
import { getAvatarRuntimeImage, runtimeSelectionFromAppearance } from '../data/avatarAssets';
import styles from '../journey.module.css';
/* Asset URLs are selected at runtime from the central registry. */
/* eslint-disable @next/next/no-img-element */
const skinColors = { claro: '#efc499', medio: '#bd865f', escuro: '#79503c' };
const outfitColors = { musgo: '#718a55', ocre: '#bd8847', azul: '#547e96' };
export function Avatar({
  appearance,
  avatar,
  small = false,
}: {
  appearance: Appearance;
  avatar?: AvatarConfig;
  small?: boolean;
}) {
  const [assetFailed, setAssetFailed] = useState(false);
  // The supplied base art is a complete portrait, not a neutral layer. The
  // editor therefore uses the procedural fallback until independent layers exist.
  const runtimeImage = getAvatarRuntimeImage(runtimeSelectionFromAppearance(avatar?.gender ?? 'male', appearance));
  const skin = skinColors[appearance.skin];
  const outfit = outfitColors[appearance.outfit];
  return (
    <>
      {!assetFailed ? (
      <img
        src={runtimeImage}
        alt="Avatar do Viajante"
        className={small ? styles.avatarSmall : styles.avatar}
        onError={() => setAssetFailed(true)}
      />
    ) : <svg
      viewBox="0 0 48 64"
      className={small ? styles.avatarSmall : styles.avatar}
      role="img"
      aria-label="Avatar do Viajante"
      shapeRendering="crispEdges"
    >
      <ellipse cx="24" cy="60" rx="16" ry="3" fill="#18291c" opacity=".18" />
      <path d="M16 45h7v14h-9v-4h2zM26 45h7v10h2v4h-9z" fill="#493b2b" />
      <path d="M14 26h21v23H12V32h2z" fill={outfit} />
      <path d="M14 27h6v20h-6z" fill="#fff" opacity=".12" />
      <path d="M9 30h6v15H9zM33 30h6v15h-6z" fill={outfit} />
      <path d="M9 41h6v7H9zM33 41h6v7h-6z" fill={skin} />
      <path d="M15 8h18v19H15zM12 14h3v10h-3zM33 14h3v10h-3z" fill={skin} />
      <path d="M17 17h3v3h-3zM28 17h3v3h-3z" fill="#302c27" />
      <path d="M22 23h5v2h-5z" fill="#844e3e" />
      <path d="M14 6h20v7H14zM12 10h5v8h-5zM31 10h5v8h-5z" fill="#3b302a" />
      {appearance.hair === 'longo' && (
        <path d="M11 13h5v19h-5zM32 13h5v19h-5z" fill="#3b302a" />
      )}
      {appearance.hair === 'cacheado' && (
        <path d="M11 8h5V4h6V2h7v3h7v4h3v6h-9v-4h-8v4H11z" fill="#3b302a" />
      )}
      <path d="m17 27 5 8h6l5-8-8 4z" fill="#dbc78c" />
      <path d="M13 42h22v4H13z" fill="#705036" />
      <path d="M23 42h5v4h-5z" fill="#d4bb70" />
      <path d="M34 34h6v12h-6z" fill="#99704b" />
      <path d="M39 31h2v29h-2z" fill="#b79a64" />
      </svg>}
    </>
  );
}
