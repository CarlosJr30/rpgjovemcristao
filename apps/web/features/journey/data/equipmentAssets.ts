import type { Equipment, EquipmentSlot, Traveler } from '../domain/traveler';
import { bodyAnchorPoint, type BodyAnchor, type BodyType } from './bodyAnchors';

export type { BodyType } from './bodyAnchors';
export type OverlayPlacement = {
  x: number; y: number; width: number; height: number;
  rotation: number; zIndex: number; anchorX: number; anchorY: number;
  clipPath?: string;
  maskImage?: string;
};
export type OverlayCalibration = {
  anchor: BodyAnchor;
  // The image registration point is a fraction of the full source image.
  // For a sword it marks the leather grip, rather than the icon center.
  registration: { x: number; y: number };
  offset: { x: number; y: number };
  size: { width: number; height: number };
  scale: number;
  rotation: number;
  zIndex: number;
  clipPath?: string;
  maskImage?: string;
};
export type OverlayLayer = { asset: string; male: OverlayCalibration; female: OverlayCalibration };
export type EquipmentAssetEntry = {
  iconAsset: string;
  overlayAsset: string | null;
  maleOverlay: readonly OverlayLayer[];
  femaleOverlay: readonly OverlayLayer[];
  status: 'ready' | 'missing' | 'needs-review';
  visualQuality: 'READY' | 'NEEDS_POSITION_ADJUSTMENT' | 'NEEDS_HIGHER_RESOLUTION' | 'NEEDS_NEW_OVERLAY';
};

const icons: Record<EquipmentSlot, string> = {
  helmet: '/assets/equipment/helmet/traveler_helmet_rare_icon.png',
  armor: '/assets/equipment/armor/traveler_armor_rare_icon.png',
  weapon: '/assets/equipment/weapon/traveler_sword_rare_icon.png',
  shield: '/assets/equipment/shield/traveler_shield_rare_icon.png',
  boots: '/assets/equipment/boots/traveler_boots_common_icon.png',
  amulet: '/assets/equipment/amulet/amulet_of_the_path_icon.png',
};
export const equipmentIcons = icons;

const layer = (asset: string, male: OverlayCalibration, female: OverlayCalibration = male): OverlayLayer => ({ asset, male, female });
const sword = layer(icons.weapon,
  { anchor: 'rightHand', registration: { x: .28, y: .73 }, offset: { x: 0, y: -2 }, size: { width: 178, height: 178 }, scale: .96, rotation: 0, zIndex: 7 },
  { anchor: 'rightHand', registration: { x: .28, y: .73 }, offset: { x: 1, y: -1 }, size: { width: 178, height: 178 }, scale: .94, rotation: 0, zIndex: 7 });
const shield = layer(icons.shield,
  { anchor: 'leftHand', registration: { x: .52, y: .50 }, offset: { x: 0, y: -5 }, size: { width: 151, height: 151 }, scale: .96, rotation: -7, zIndex: 8 },
  { anchor: 'leftHand', registration: { x: .52, y: .50 }, offset: { x: 0, y: -4 }, size: { width: 151, height: 151 }, scale: .94, rotation: -7, zIndex: 8 });
const medallion = layer(icons.amulet,
  { anchor: 'neck', registration: { x: .50, y: .34 }, offset: { x: 0, y: 0 }, size: { width: 57, height: 57 }, scale: .84, rotation: 0, zIndex: 6 },
  { anchor: 'neck', registration: { x: .50, y: .34 }, offset: { x: 0, y: 0 }, size: { width: 57, height: 57 }, scale: .82, rotation: 0, zIndex: 6 });
const helmet = layer(icons.helmet,
  { anchor: 'head', registration: { x: .50, y: .50 }, offset: { x: 0, y: 0 }, size: { width: 175, height: 175 }, scale: .94, rotation: 0, zIndex: 9, maskImage: 'radial-gradient(ellipse 32% 27% at 50% 54%, transparent 85%, black 100%)' },
  { anchor: 'head', registration: { x: .50, y: .50 }, offset: { x: 0, y: 0 }, size: { width: 177, height: 177 }, scale: .94, rotation: 0, zIndex: 9, maskImage: 'radial-gradient(ellipse 32% 27% at 50% 54%, transparent 85%, black 100%)' });
const armor = layer(icons.armor,
  { anchor: 'chest', registration: { x: .50, y: .47 }, offset: { x: 0, y: 0 }, size: { width: 296, height: 296 }, scale: .95, rotation: 0, zIndex: 5 },
  { anchor: 'chest', registration: { x: .50, y: .47 }, offset: { x: 0, y: 0 }, size: { width: 296, height: 296 }, scale: .94, rotation: 0, zIndex: 5 });
const leftBoot = layer(icons.boots,
  { anchor: 'leftFoot', registration: { x: .25, y: .88 }, offset: { x: -18, y: 28 }, size: { width: 200, height: 200 }, scale: .84, rotation: -2, zIndex: 6, clipPath: 'inset(0 50% 0 0)', maskImage: 'linear-gradient(to bottom, transparent 0 34%, black 45%)' },
  { anchor: 'leftFoot', registration: { x: .25, y: .88 }, offset: { x: -5, y: 31 }, size: { width: 200, height: 200 }, scale: .82, rotation: -1.5, zIndex: 6, clipPath: 'inset(0 50% 0 0)', maskImage: 'linear-gradient(to bottom, transparent 0 34%, black 45%)' });
const rightBoot = layer(icons.boots,
  { anchor: 'rightFoot', registration: { x: .75, y: .88 }, offset: { x: 12, y: 28 }, size: { width: 200, height: 200 }, scale: .84, rotation: 2, zIndex: 6, clipPath: 'inset(0 0 0 50%)', maskImage: 'linear-gradient(to bottom, transparent 0 34%, black 45%)' },
  { anchor: 'rightFoot', registration: { x: .75, y: .88 }, offset: { x: 14, y: 31 }, size: { width: 200, height: 200 }, scale: .82, rotation: 1.5, zIndex: 6, clipPath: 'inset(0 0 0 50%)', maskImage: 'linear-gradient(to bottom, transparent 0 34%, black 45%)' });

export function resolveOverlayPlacement(bodyType: BodyType, calibration: OverlayCalibration): OverlayPlacement {
  const anchor = bodyAnchorPoint(bodyType, calibration.anchor);
  const anchorX = anchor.x + calibration.offset.x;
  const anchorY = anchor.y + calibration.offset.y;
  const width = calibration.size.width * calibration.scale;
  const height = calibration.size.height * calibration.scale;
  return {
    x: anchorX - calibration.registration.x * width,
    y: anchorY - calibration.registration.y * height,
    width, height, anchorX, anchorY,
    rotation: calibration.rotation, zIndex: calibration.zIndex,
    clipPath: calibration.clipPath, maskImage: calibration.maskImage,
  };
}

const entry = (slot: EquipmentSlot, overlays: readonly OverlayLayer[], visualQuality: EquipmentAssetEntry['visualQuality']): EquipmentAssetEntry => ({
  iconAsset: icons[slot], overlayAsset: overlays[0]?.asset ?? null,
  maleOverlay: overlays, femaleOverlay: overlays, status: 'ready', visualQuality,
});

export const EQUIPMENT_ASSET_MANIFEST: Readonly<Record<string, EquipmentAssetEntry>> = {
  'traveler-sword-common': entry('weapon', [sword], 'NEEDS_NEW_OVERLAY'),
  'traveler-sword-rare': entry('weapon', [sword], 'READY'),
  'traveler-shield-rare': entry('shield', [shield], 'NEEDS_NEW_OVERLAY'),
  'wisdom-amulet': entry('amulet', [medallion], 'NEEDS_NEW_OVERLAY'),
  'traveler-helmet-rare': entry('helmet', [helmet], 'NEEDS_NEW_OVERLAY'),
  'traveler-armor-uncommon': entry('armor', [armor], 'NEEDS_NEW_OVERLAY'),
  'traveler-armor-rare': entry('armor', [armor], 'NEEDS_NEW_OVERLAY'),
  'traveler-boots': entry('boots', [leftBoot, rightBoot], 'NEEDS_NEW_OVERLAY'),
};

export function equipmentAssetForItem(item: Pick<Equipment, 'id' | 'slot'>): string {
  return EQUIPMENT_ASSET_MANIFEST[item.id]?.iconAsset ?? icons[item.slot];
}
export function equipmentOverlayForItem(item: Pick<Equipment, 'id' | 'slot'>, bodyType: BodyType): readonly { asset: string; placement: OverlayPlacement }[] {
  const manifest = EQUIPMENT_ASSET_MANIFEST[item.id];
  if (!manifest || manifest.status !== 'ready' || !manifest.overlayAsset) return [];
  return (bodyType === 'female' ? manifest.femaleOverlay : manifest.maleOverlay).map((piece) => ({ asset: piece.asset, placement: resolveOverlayPlacement(bodyType, piece[bodyType]) }));
}
export function equippedOverlayLayers(traveler: Traveler) {
  const bodyType = traveler.avatar.gender;
  const slots: EquipmentSlot[] = ['boots', 'armor', 'amulet', 'weapon', 'shield', 'helmet'];
  return slots.flatMap((slot) => {
    const item = traveler.inventory.find((owned) => owned.id === traveler.equipped[slot] && owned.slot === slot);
    return item ? equipmentOverlayForItem(item, bodyType).map((piece) => ({ ...piece, itemId: item.id, slot })) : [];
  });
}
export function equipmentAnchor(item: Pick<Equipment, 'id' | 'slot'>, bodyType: BodyType): { x: number; y: number } {
  const piece = equipmentOverlayForItem(item, bodyType)[0];
  if (piece) return { x: piece.placement.anchorX, y: piece.placement.anchorY };
  const fallback: Record<EquipmentSlot, BodyAnchor> = {
    helmet: 'head', armor: 'chest', weapon: 'rightHand', shield: 'leftHand', boots: 'leftFoot', amulet: 'neck',
  };
  return bodyAnchorPoint(bodyType, fallback[item.slot]);
}
