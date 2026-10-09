import type { Appearance, AvatarConfig, Traveler } from '../domain/traveler';
import { DEFAULT_AVATAR } from '../domain/traveler';
import {
  getAvatarRuntimeImage,
  runtimeSelectionFromAppearance,
} from './avatarAssets';
import { AVATAR_CANVAS } from './bodyAnchors';
import { selectAvatarHDAsset } from './avatarHDPack';
import {
  EQUIPMENT_COMPOSITION_LAYERS,
  FULL_CANVAS_OVERLAY_SOURCE,
  equippedOverlayLayers,
} from './equipmentAssets';

export type AvatarIdentity = { appearance: Appearance; avatar?: AvatarConfig };
export type AvatarMode = 'thumbnail' | 'card' | 'full' | 'hero' | 'arena';
export type AvatarAssetQuality =
  'READY_HD' | 'USABLE_BUT_LOW_RES' | 'NEEDS_HD_REPLACEMENT' | 'LEGACY_ONLY';
export const AVATAR_RUNTIME_CANVAS = AVATAR_CANVAS;
export const AVATAR_HD_TARGET = FULL_CANVAS_OVERLAY_SOURCE;
// Physical dimensions audited against all 54 native runtime files. This metadata
// is separate from the logical canvas; future HD sources change only the resolver.
export const AVATAR_CURRENT_SOURCE_SIZE = { width: 512, height: 768 } as const;
// Body/face/clothing/hair are indivisible; reuse the existing equipment planes.
export const AVATAR_RUNTIME_LAYERS = EQUIPMENT_COMPOSITION_LAYERS;
export const AVATAR_FACE_IDS = [1, 2, 3] as const;
export const AVATAR_LEGACY_HAIR_IDS = [1, 2, 3] as const;
const HEAD_REGION = { x: 150 / 512, y: 0, width: 212 / 512, height: 205 / 768 };
export function resolveAvatarIdentity(
  subject: AvatarIdentity,
  reviewPilot = false,
) {
  const avatar = subject.avatar ?? DEFAULT_AVATAR;
  const gender = avatar.gender === 'female' ? 'female' : 'male';
  const legacySource = getAvatarRuntimeImage(
    runtimeSelectionFromAppearance(gender, subject.appearance),
  );
  const hd = selectAvatarHDAsset(legacySource, undefined, reviewPilot);
  const source = hd?.source ?? legacySource;
  const { width, height } = hd ?? AVATAR_CURRENT_SOURCE_SIZE;
  return {
    gender,
    faceId: avatar.face,
    legacyHairId: avatar.hair,
    independentFaceSupported: false,
    source,
    legacySource,
    legacySourceSize: AVATAR_CURRENT_SOURCE_SIZE,
    assetStatus: hd?.status ?? 'LEGACY',
    sourceSize: { width, height },
    quality: (hd &&
    hd.status !== 'VALIDATED' &&
    hd.status !== 'HUMAN_VISUAL_APPROVED'
      ? 'NEEDS_HD_REPLACEMENT'
      : width >= AVATAR_HD_TARGET.width && height >= AVATAR_HD_TARGET.height
        ? 'READY_HD'
        : 'USABLE_BUT_LOW_RES') as AvatarAssetQuality,
    portrait: {
      x: Math.round(HEAD_REGION.x * width),
      y: Math.round(HEAD_REGION.y * height),
      width: Math.round(HEAD_REGION.width * width),
      height: Math.round(HEAD_REGION.height * height),
    },
  };
}
export function resolveAvatarRuntime(
  subject: AvatarIdentity | Traveler,
  showEquipment = true,
  reviewPilot = false,
) {
  const identity = resolveAvatarIdentity(subject, reviewPilot);
  const layers =
    showEquipment && 'inventory' in subject && 'equipped' in subject
      ? equippedOverlayLayers({
          ...subject,
          avatar: {
            ...(subject.avatar ?? DEFAULT_AVATAR),
            gender: identity.gender,
          },
        } as Traveler)
      : [];
  return { ...identity, layers };
}
