import type { EquipmentSlot } from '../domain/traveler';
import type { ResolvedOverlayLayer } from './equipmentAssets';
import { AVATAR_CANVAS } from './bodyAnchors';
import { APPROVED_ARMOR_COMPOSITION_3 } from './equipmentBodyFitV3';

const { width, height } = AVATAR_CANVAS;
const canvas = (zIndex: number) => ({
  anchor: 'canvas' as const,
  x: 0,
  y: 0,
  width,
  height,
  rotation: 0,
  mirrorX: false,
  anchorX: 0,
  anchorY: 0,
  transformOrigin: '50% 50%',
  zIndex,
});
const common = {
  approvalId: 'RPG-DEV-003-HUMAN-FOUR-COMPOSITIONS',
  gender: 'female' as const,
  avatarSource: APPROVED_ARMOR_COMPOSITION_3.avatarSource,
  avatarSha256: APPROVED_ARMOR_COMPOSITION_3.avatarSha256,
};
const bootsAsset =
  '/assets/equipment/overlays/body-fit-v3/boots_female_long_blue_dark_pair_approved.png';

/** Exact compositions approved by Carlos; no acquisition or economic authority. */
export const APPROVED_EQUIPMENT_003: readonly {
  approvalId: string;
  gender: 'female';
  avatarSource: string;
  avatarSha256: string;
  itemId: string;
  slot: EquipmentSlot;
  assetSha256: string;
  layers: readonly ResolvedOverlayLayer[];
}[] = [
  {
    ...common,
    itemId: 'traveler-helmet-rare',
    slot: 'helmet',
    assetSha256:
      'b06b44ad85dee41b4487bcc1b1c6f853b351b1e276c1e73700eb5090eaba76f0',
    layers: [
      {
        overlayMode: 'full-canvas',
        asset:
          '/assets/equipment/overlays/body-fit-v3/helmet_female_long_blue_dark_approved.png',
        placement: canvas(8),
        canvasComposition: {
          translateXPercent: 24,
          translateYPercent: -0.65,
          scaleX: 0.52,
          scaleY: 0.52,
        },
      },
    ],
  },
  {
    ...common,
    itemId: 'traveler-shield-rare',
    slot: 'shield',
    assetSha256:
      '62523e42ed6b2c7bc807527b6caad0ab71f429824131b1a153e4b4df46f59f55',
    layers: [
      {
        overlayMode: 'cropped',
        asset: '/assets/equipment/overlays/v1/shield_perseverance_rare.png',
        placement: {
          ...canvas(7),
          x: width * 0.64,
          y: height * 0.41,
          width: width * 0.26,
          height: (width * 0.26 * 304) / 216,
          rotation: -7,
          transformOrigin: '50% 44%',
        },
      },
    ],
  },
  {
    ...common,
    itemId: 'traveler-boots',
    slot: 'boots',
    assetSha256:
      'ab733b56f949daad7a88e1255c8591b7a2391b932309792a00aa111df32cc288',
    layers: [
      {
        overlayMode: 'full-canvas',
        asset: bootsAsset,
        placement: canvas(3),
        canvasComposition: {
          translateXPercent: 21.5,
          translateYPercent: 60.2,
          scaleX: 0.4,
          scaleY: 0.4,
          clipPath: 'inset(0 50% 0 0)',
        },
      },
      {
        overlayMode: 'full-canvas',
        asset: bootsAsset,
        placement: canvas(3),
        canvasComposition: {
          translateXPercent: 41,
          translateYPercent: 60.2,
          scaleX: 0.4,
          scaleY: 0.4,
          clipPath: 'inset(0 0 0 50%)',
        },
      },
    ],
  },
  {
    ...common,
    itemId: 'wisdom-amulet',
    slot: 'amulet',
    assetSha256:
      '7b009cfd5efa85d3de565a17a7d532f6ad781e6b0733790330208a74fe56a732',
    layers: [
      {
        overlayMode: 'cropped',
        asset: '/assets/equipment/overlays/v1/medallion_path_rare.png',
        placement: {
          ...canvas(4),
          x: width * 0.49,
          y: height * 0.234,
          width: width * 0.035,
          height: (width * 0.035 * 144) / 88,
        },
        chainPath: 'M475 315 Q495 345 521 368 Q548 345 567 315',
      },
    ],
  },
];
