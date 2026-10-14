'use client';
import { memo, useState, type CSSProperties } from 'react';
import type { Traveler, EquipmentSlot } from '../domain/traveler';
import {
  AVATAR_RUNTIME_CANVAS,
  AVATAR_RUNTIME_LAYERS,
  resolveAvatarRuntime,
  type AvatarIdentity,
  type AvatarMode,
} from '../data/avatarRuntime';
import {
  FULL_CANVAS_OVERLAY_SOURCE,
  type ResolvedOverlayLayer,
} from '../data/equipmentAssets';
import styles from '../journey.module.css';
import runtime from './avatar-runtime.module.css';
/* eslint-disable @next/next/no-img-element -- native local PNG preserves exact composition and shared browser cache */
type Props = {
  traveler: AvatarIdentity | Traveler;
  mode?: AvatarMode;
  showEquipment?: boolean;
  priority?: boolean;
  // Isolated DEV review only; resolver refuses this bypass in production.
  reviewPilot?: boolean;
  decorative?: boolean;
  label?: string;
  className?: string;
  highlightedSlot?: EquipmentSlot | null;
  hidingSlot?: EquipmentSlot | null;
};
const skinColors = { claro: '#efc499', medio: '#bd865f', escuro: '#79503c' };
const outfitColors = { musgo: '#718a55', ocre: '#bd8847', azul: '#547e96' };
function ProceduralBody({ traveler, decorative, label }: Props) {
  const skin = skinColors[traveler.appearance.skin] ?? skinColors.claro;
  const outfit = outfitColors[traveler.appearance.outfit] ?? outfitColors.musgo;
  return (
    <svg
      viewBox="0 0 48 72"
      className={`${styles.avatar} ${runtime.body}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      data-avatar-fallback="procedural"
    >
      <g transform="translate(0 4)">
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
        {traveler.appearance.hair === 'longo' && (
          <path d="M11 13h5v19h-5zM32 13h5v19h-5z" fill="#3b302a" />
        )}
        {traveler.appearance.hair === 'cacheado' && (
          <path d="M11 8h5V4h6V2h7v3h7v4h3v6h-9v-4h-8v4H11z" fill="#3b302a" />
        )}
        <path d="m17 27 5 8h6l5-8-8 4z" fill="#dbc78c" />
        <path d="M13 42h22v4H13z" fill="#705036" />
        <path d="M23 42h5v4h-5z" fill="#d4bb70" />
        <path d="M34 34h6v12h-6z" fill="#99704b" />
        <path d="M39 31h2v29h-2z" fill="#b79a64" />
      </g>
    </svg>
  );
}
function EquipmentLayer({
  layer,
  highlightedSlot,
  hidingSlot,
}: {
  layer: ResolvedOverlayLayer & { itemId: string; slot: EquipmentSlot };
  highlightedSlot: Props['highlightedSlot'];
  hidingSlot: Props['hidingSlot'];
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  const { asset, placement, overlayMode, itemId, slot } = layer;
  return (
    <img
      src={asset}
      alt=""
      aria-hidden="true"
      decoding="async"
      data-overlay-slot={slot}
      data-overlay-item={itemId}
      data-overlay-anchor={placement.anchor}
      data-overlay-mode={overlayMode}
      className={`${styles.avatarEquipmentLayer} ${highlightedSlot === slot ? styles.avatarEquipmentArrive : ''} ${hidingSlot === slot ? styles.avatarEquipmentLeaving : ''}`}
      onError={() => setFailed(true)}
      onLoad={(event) => {
        if (
          overlayMode === 'full-canvas' &&
          (event.currentTarget.naturalWidth !==
            FULL_CANVAS_OVERLAY_SOURCE.width ||
            event.currentTarget.naturalHeight !==
              FULL_CANVAS_OVERLAY_SOURCE.height)
        )
          setFailed(true);
      }}
      style={
        overlayMode === 'full-canvas'
          ? {
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: placement.zIndex,
            }
          : {
              left: `${(placement.x / AVATAR_RUNTIME_CANVAS.width) * 100}%`,
              top: `${(placement.y / AVATAR_RUNTIME_CANVAS.height) * 100}%`,
              width: `${(placement.width / AVATAR_RUNTIME_CANVAS.width) * 100}%`,
              height: `${(placement.height / AVATAR_RUNTIME_CANVAS.height) * 100}%`,
              transform: `rotate(${placement.rotation}deg)${placement.mirrorX ? ' scaleX(-1)' : ''}`,
              transformOrigin: placement.transformOrigin,
              zIndex: placement.zIndex,
            }
      }
    />
  );
}
function RuntimeCanvas({
  resolved,
  ...props
}: Props & { resolved: ReturnType<typeof resolveAvatarRuntime> }) {
  const [failure, setFailure] = useState<'none' | 'legacy' | 'procedural'>(
    'none',
  );
  const failed = failure === 'procedural';
  const source = failure === 'legacy' ? resolved.legacySource : resolved.source;
  const sourceSize =
    failure === 'legacy' ? resolved.legacySourceSize : resolved.sourceSize;
  const {
    mode = 'full',
    decorative = false,
    label = 'Avatar do Viajante',
    priority = false,
    className = '',
    highlightedSlot,
    hidingSlot,
  } = props;
  return (
    <div
      className={`${styles.avatarComposite} ${runtime.canvas} ${className}`}
      data-avatar-runtime="hd-v1"
      data-avatar-mode={mode}
      data-avatar-quality={
        failure === 'legacy' ? 'USABLE_BUT_LOW_RES' : resolved.quality
      }
      data-avatar-asset-status={
        failure === 'legacy' ? 'LEGACY' : resolved.assetStatus
      }
      data-avatar-body-type={resolved.gender}
      data-body-type={
        mode === 'thumbnail' || mode === 'card' ? undefined : resolved.gender
      }
      data-avatar-face-id={resolved.faceId}
      data-avatar-hair-id={resolved.legacyHairId}
      aria-hidden={decorative || undefined}
      style={
        { '--avatar-body-layer': AVATAR_RUNTIME_LAYERS.body } as CSSProperties
      }
    >
      {failed ? (
        <ProceduralBody {...props} decorative={decorative} label={label} />
      ) : (
        <img
          src={source}
          width={sourceSize.width}
          height={sourceSize.height}
          alt={decorative ? '' : label}
          aria-hidden={decorative || undefined}
          data-avatar-base="true"
          className={`${styles.avatar} ${runtime.body}`}
          decoding="async"
          loading={
            priority || mode === 'hero' || mode === 'arena' || mode === 'full'
              ? 'eager'
              : 'lazy'
          }
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (
              image.naturalWidth !== sourceSize.width ||
              image.naturalHeight !== sourceSize.height
            )
              setFailure(
                source !== resolved.legacySource ? 'legacy' : 'procedural',
              );
          }}
          onError={() =>
            setFailure(
              source !== resolved.legacySource ? 'legacy' : 'procedural',
            )
          }
        />
      )}
      {!failed &&
        resolved.layers
          .filter(
            (layer) =>
              !layer.requiredAvatarSource ||
              layer.requiredAvatarSource === source,
          )
          .map((layer, index) => (
            <EquipmentLayer
              key={`${layer.itemId}:${layer.asset}:${index}`}
              layer={layer}
              highlightedSlot={highlightedSlot}
              hidingSlot={hidingSlot}
            />
          ))}
    </div>
  );
}
export const AvatarRuntime = memo(function AvatarRuntime(props: Props) {
  const resolved = resolveAvatarRuntime(
    props.traveler,
    props.showEquipment ?? true,
    props.reviewPilot ?? false,
  );
  // Source changes retry after failure; equipment-only changes retain the base node.
  return <RuntimeCanvas key={resolved.source} {...props} resolved={resolved} />;
});
