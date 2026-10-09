// Planning metadata only. No path here grants runtime approval or enables art.
import type { BodyType } from './bodyAnchors';
import type { EquipmentSlot } from '../domain/traveler';

const families: readonly [string, EquipmentSlot, string, boolean][] = [
  ['traveler-armor-uncommon', 'armor', 'armor_traveler_uncommon', true],
  ['traveler-helmet-rare', 'helmet', 'helmet_traveler_rare', true],
  ['traveler-boots', 'boots', 'boots_traveler_common', true],
  ['traveler-sword-common', 'weapon', 'sword_path_common', true],
  ['traveler-shield-rare', 'shield', 'shield_perseverance_rare', true],
  ['wisdom-amulet', 'amulet', 'medallion_path_rare', true],
  ['traveler-armor-rare', 'armor', 'armor_traveler_rare', false],
  ['traveler-sword-rare', 'weapon', 'sword_path_rare', false],
];
export const BODY_FIT_LANDMARK_REQUIREMENTS: Record<
  EquipmentSlot,
  readonly string[]
> = {
  helmet: [
    'head center/top/width',
    'hairline',
    'short/long/curly hair occlusion',
    'face remains visible',
  ],
  armor: ['shoulders', 'chest', 'waist', 'hips', 'face/hands/legs exclusion'],
  boots: [
    'left/right ankles',
    'foot widths',
    'HD alpha ≥128 foot baseline unchanged',
    'no pixels outside canvas',
  ],
  weapon: [
    'right hand/grip contact',
    'blade angle/length',
    'body distance',
    'hand/arm depth and occlusion',
  ],
  shield: ['left hand/grip', 'forearm angle', 'body distance', 'occlusion'],
  amulet: ['chest center', 'neckline', 'size relative to torso', 'occlusion'],
};
export const BODY_FIT_V2_TARGETS = families.flatMap(
  ([itemId, slot, family, equipable]) =>
    (['female', 'male'] as const).map((gender: BodyType) => ({
      filename: `${family}_${gender}_v2.png`,
      itemId,
      slot,
      gender,
      equipable,
      status: 'NEEDS_NEW_OVERLAY' as const,
      priority: !equipable
        ? 'P3'
        : ['armor', 'helmet', 'boots', 'weapon'].includes(slot)
          ? gender === 'female'
            ? 'P0'
            : 'P1'
          : 'P2',
      referenceAvatar: `${gender}_short_moss_medium`,
      expectedLandmarks: BODY_FIT_LANDMARK_REQUIREMENTS[slot],
      reason:
        'No dedicated V2 body asset or human approval; V1 body fitting rejected.',
    })),
);
