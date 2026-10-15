import type { Equipment, EquipmentSlot, Traveler } from '../domain/traveler';
import { EQUIPMENT_CATALOG } from './equipmentCatalog';
import { APPROVED_BODY_FIT_V3_ASSETS } from './equipmentBodyFitV3';
import {
  AVATAR_CANVAS,
  bodyAnchorPoint,
  type BodyAnchor,
  type BodyType,
} from './bodyAnchors';

export type { BodyType } from './bodyAnchors';
export type VisualQuality =
  | 'READY'
  | 'NEEDS_POSITION_ADJUSTMENT'
  | 'NEEDS_HIGHER_RESOLUTION'
  | 'NEEDS_NEW_OVERLAY';

// The base sprite includes clothes, arms, head and hair. Dedicated art may add
// independent planes when it supports occlusion; no new equipment slots are enabled.
export const EQUIPMENT_COMPOSITION_LAYERS = {
  background: -1,
  back: 0,
  body: 1,
  armor: 2,
  boots: 3,
  medallion: 4,
  hands: 5,
  weapon: 6,
  shield: 7,
  helmet: 8,
  frontDetails: 9,
  effects: 10,
} as const;
export const EQUIPMENT_SLOT_ANCHORS: Readonly<
  Record<EquipmentSlot, readonly BodyAnchor[]>
> = {
  helmet: ['head'],
  armor: ['torso'],
  weapon: ['rightHand'],
  shield: ['leftHand'],
  boots: ['leftFoot', 'rightFoot'],
  amulet: ['chest'],
};

export type OverlayCalibration = {
  anchor: BodyAnchor;
  // Fraction of the source image that touches the anchor (e.g. sword grip).
  registration: { x: number; y: number };
  size: { width: number; height: number };
  x: number;
  y: number;
  scale: number;
  rotation: number;
  mirrorX?: boolean;
  zIndex: number;
};
export type OverlayVisualConfig = {
  base: OverlayCalibration;
  male?: Partial<OverlayCalibration>;
  female?: Partial<OverlayCalibration>;
};
export type OverlayAssetSource = string | Partial<Record<BodyType, string>>;
export type OverlayMode = 'cropped' | 'full-canvas';
export const FULL_CANVAS_OVERLAY_SOURCE = {
  width: 1024,
  height: 1536,
} as const;
export type FullCanvasOverlayConfig = {
  sourceSize: { width: number; height: number };
  zIndex: number;
};
export type EquipmentOverlayDefinition = {
  // Omitted mode retains the legacy anchor contract.
  overlayMode?: OverlayMode;
  overlayAsset: OverlayAssetSource | null;
  visualConfig: OverlayVisualConfig | null;
  fullCanvasConfig?: FullCanvasOverlayConfig;
};
export type EquipmentAssetEntry = EquipmentOverlayDefinition & {
  slot: EquipmentSlot;
  iconAsset: string;
  visualQuality: VisualQuality;
  // Record only after the user approves the actual composition for this body.
  bodyOverlayApproval?: Partial<Record<BodyType, 'APPROVED_BY_USER'>>;
  // Approval for one exact HD identity never applies to other variants or legacy fallback.
  bodyOverlayScope?: Partial<Record<BodyType, string>>;
  iconAssetHighQuality?: OverlayAssetSource;
  // Boots may supply an independent right-foot layer; hands can be separate too.
  additionalOverlays?: readonly EquipmentOverlayDefinition[];
};
export type EquipmentDefinition = EquipmentAssetEntry & {
  itemId: string;
  equipment?: Equipment;
};
export type OverlayPlacement = {
  anchor: BodyAnchor | 'canvas';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  mirrorX: boolean;
  zIndex: number;
  anchorX: number;
  anchorY: number;
  transformOrigin: string;
};
export type ResolvedOverlayLayer = {
  overlayMode: OverlayMode;
  asset: string;
  placement: OverlayPlacement;
  requiredAvatarSource?: string;
};
export type ResolvedEquipmentVisual = {
  iconAsset: string;
  visualQuality: VisualQuality;
  visualOverlayUnavailable: boolean;
  layers: readonly ResolvedOverlayLayer[];
};

export const equipmentIcons: Readonly<Record<EquipmentSlot, string>> = {
  helmet: '/assets/equipment/helmet/traveler_helmet_rare_icon.png',
  armor: '/assets/equipment/armor/traveler_armor_rare_icon.png',
  weapon: '/assets/equipment/weapon/traveler_sword_rare_icon.png',
  shield: '/assets/equipment/shield/traveler_shield_rare_icon.png',
  boots: '/assets/equipment/boots/traveler_boots_common_icon.png',
  amulet: '/assets/equipment/amulet/amulet_of_the_path_icon.png',
};
const missingOverlay = (slot: EquipmentSlot): EquipmentAssetEntry => ({
  slot,
  iconAsset: equipmentIcons[slot],
  overlayAsset: null,
  visualConfig: null,
  visualQuality: 'NEEDS_NEW_OVERLAY',
});

const v1 = (file: string) => `/assets/equipment/overlays/v1/${file}.png`;
const bodies = (family: string): OverlayAssetSource => ({
  female: v1(`${family}_female`),
  male: v1(`${family}_male`),
});
const calibration = (
  anchor: BodyAnchor,
  width: number,
  height: number,
  rx: number,
  ry: number,
  zIndex: number,
): OverlayCalibration => ({
  anchor,
  size: { width, height },
  registration: { x: rx, y: ry },
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  zIndex,
});
const archivedOverlay = (
  slot: EquipmentSlot,
  overlayAsset: OverlayAssetSource,
  visualConfig: OverlayVisualConfig,
): EquipmentAssetEntry => ({
  slot,
  iconAsset: equipmentIcons[slot],
  iconAssetHighQuality: overlayAsset,
  overlayMode: 'cropped',
  overlayAsset,
  visualConfig,
  // TASK-0034: user rejected body fit. Preserve V1 art/calibration for UI/archive.
  visualQuality: 'NEEDS_NEW_OVERLAY',
});
const armorConfig: OverlayVisualConfig = {
  base: calibration(
    'torso',
    196,
    216,
    0.499755,
    0.582593,
    EQUIPMENT_COMPOSITION_LAYERS.armor,
  ),
  male: {
    size: { width: 208, height: 220 },
    registration: { x: 0.509615, y: 0.572 },
  },
};
const swordConfig: OverlayVisualConfig = {
  // Final PNG grip is around y=339; alpha padding invalidates the original 85% brief.
  base: {
    ...calibration(
      'rightHand',
      48,
      240,
      0.5,
      0.705,
      EQUIPMENT_COMPOSITION_LAYERS.weapon,
    ),
    rotation: 28,
    scale: 1.15,
  },
};
function approvedBodyFit(itemId: string, zIndex: number) {
  const entries = APPROVED_BODY_FIT_V3_ASSETS.filter(
    (a) => a.itemId === itemId,
  );
  return {
    overlayMode: 'full-canvas' as const,
    overlayAsset: Object.fromEntries(entries.map((a) => [a.gender, a.asset])),
    visualConfig: null,
    fullCanvasConfig: { sourceSize: FULL_CANVAS_OVERLAY_SOURCE, zIndex },
    visualQuality: 'READY' as const,
    bodyOverlayApproval: Object.fromEntries(
      entries.map((a) => [a.gender, 'APPROVED_BY_USER' as const]),
    ),
    bodyOverlayScope: Object.fromEntries(
      entries.map((a) => [a.gender, a.avatarSource]),
    ),
  };
}
// Original UI icons are preserved; anatomy and dedicated PNGs remain centralized.
export const EQUIPMENT_ASSET_MANIFEST: Readonly<
  Record<string, EquipmentAssetEntry>
> = {
  'traveler-sword-common': {
    ...archivedOverlay('weapon', v1('sword_path_common'), swordConfig),
    ...approvedBodyFit(
      'traveler-sword-common',
      EQUIPMENT_COMPOSITION_LAYERS.weapon,
    ),
  },
  'traveler-sword-rare': archivedOverlay(
    'weapon',
    v1('sword_path_rare'),
    swordConfig,
  ),
  'traveler-shield-rare': archivedOverlay(
    'shield',
    v1('shield_perseverance_rare'),
    {
      base: {
        ...calibration(
          'leftHand',
          108,
          152,
          0.7,
          0.48,
          EQUIPMENT_COMPOSITION_LAYERS.shield,
        ),
        rotation: -8,
      },
    },
  ),
  'wisdom-amulet': archivedOverlay('amulet', v1('medallion_path_rare'), {
    base: calibration(
      'chest',
      22,
      36,
      0.5,
      0.6,
      EQUIPMENT_COMPOSITION_LAYERS.medallion,
    ),
  }),
  'traveler-helmet-rare': archivedOverlay(
    'helmet',
    bodies('helmet_traveler_rare'),
    {
      base: calibration(
        'head',
        142,
        170,
        0.5,
        0.555,
        EQUIPMENT_COMPOSITION_LAYERS.helmet,
      ),
      female: {
        size: { width: 144, height: 174 },
        registration: { x: 0.499667, y: 0.63 },
      },
    },
  ),
  'traveler-armor-uncommon': {
    ...archivedOverlay('armor', bodies('armor_traveler_uncommon'), {
      ...armorConfig,
      base: { ...armorConfig.base, scale: 1.25 },
      male: { ...armorConfig.male, scale: 1.15 },
    }),
    ...approvedBodyFit(
      'traveler-armor-uncommon',
      EQUIPMENT_COMPOSITION_LAYERS.armor,
    ),
  },
  'traveler-armor-rare': archivedOverlay(
    'armor',
    bodies('armor_traveler_rare'),
    {
      ...armorConfig,
      base: { ...armorConfig.base, scale: 1.15 },
      male: { ...armorConfig.male, scale: 1.1 },
    },
  ),
  'traveler-boots': {
    ...archivedOverlay('boots', bodies('boots_traveler_common_left'), {
      base: {
        ...calibration(
          'leftFoot',
          108,
          166,
          0.5,
          0.58,
          EQUIPMENT_COMPOSITION_LAYERS.boots,
        ),
        mirrorX: true,
        x: -15,
        y: -14,
        scale: 1.1,
      },
      female: {
        size: { width: 100, height: (328 * 100) / 176 },
        registration: { x: 0.5, y: 0.633 },
        x: -14,
        y: 0,
        scale: 1,
      },
    }),
    additionalOverlays: [
      {
        overlayAsset: bodies('boots_traveler_common_right'),
        visualConfig: {
          base: {
            ...calibration(
              'rightFoot',
              128,
              166,
              0.5,
              0.78,
              EQUIPMENT_COMPOSITION_LAYERS.boots,
            ),
            scale: 1.1,
            x: 17,
            y: 6,
          },
          female: {
            size: { width: 116, height: 164 },
            registration: { x: 0.5, y: 0.74 },
            x: 15,
            y: 0,
            scale: 1,
            mirrorX: true,
          },
        },
      },
    ],
  },
};

export function resolveEquipmentDefinition(
  itemId: string,
): EquipmentDefinition | undefined {
  const equipment = EQUIPMENT_CATALOG.find((item) => item.id === itemId);
  const assets =
    EQUIPMENT_ASSET_MANIFEST[itemId] ??
    (equipment ? missingOverlay(equipment.slot) : undefined);
  return assets ? { ...assets, itemId, equipment } : undefined;
}

export function resolveOverlayPlacement(
  bodyType: BodyType,
  config: OverlayCalibration,
): OverlayPlacement {
  const anchor = bodyAnchorPoint(bodyType, config.anchor);
  const anchorX = anchor.x + config.x;
  const anchorY = anchor.y + config.y;
  const width = config.size.width * config.scale;
  const height = config.size.height * config.scale;
  return {
    anchor: config.anchor,
    x: anchorX - config.registration.x * width,
    y: anchorY - config.registration.y * height,
    width,
    height,
    anchorX,
    anchorY,
    rotation: config.rotation,
    mirrorX: config.mirrorX ?? false,
    zIndex: config.zIndex,
    // Rotation around the registration point preserves contact with the hand.
    transformOrigin: `${config.registration.x * 100}% ${config.registration.y * 100}%`,
  };
}

function validCalibration(config: OverlayCalibration): boolean {
  const numbers = [
    config.x,
    config.y,
    config.scale,
    config.rotation,
    config.zIndex,
    config.registration.x,
    config.registration.y,
    config.size.width,
    config.size.height,
  ];
  return (
    numbers.every(Number.isFinite) &&
    config.scale > 0 &&
    config.size.width > 0 &&
    config.size.height > 0 &&
    config.registration.x >= 0 &&
    config.registration.x <= 1 &&
    config.registration.y >= 0 &&
    config.registration.y <= 1 &&
    (config.mirrorX === undefined || typeof config.mirrorX === 'boolean')
  );
}

export function resolveEquipmentVisual(
  definition: EquipmentDefinition,
  bodyType: BodyType,
  avatarSource?: string,
): ResolvedEquipmentVisual {
  const unavailable = (): ResolvedEquipmentVisual => ({
    iconAsset: definition.iconAsset,
    layers: [],
    visualOverlayUnavailable: true,
    visualQuality:
      definition.visualQuality === 'READY'
        ? 'NEEDS_NEW_OVERLAY'
        : definition.visualQuality,
  });
  if (
    definition.visualQuality !== 'READY' ||
    definition.bodyOverlayApproval?.[bodyType] !== 'APPROVED_BY_USER' ||
    !definition.overlayAsset ||
    (definition.bodyOverlayScope &&
      (!definition.bodyOverlayScope[bodyType] ||
        definition.bodyOverlayScope[bodyType] !== avatarSource))
  )
    return unavailable();
  const layers: ResolvedOverlayLayer[] = [];
  for (const piece of [definition, ...(definition.additionalOverlays ?? [])]) {
    const asset =
      typeof piece.overlayAsset === 'string'
        ? piece.overlayAsset
        : piece.overlayAsset?.[bodyType];
    // Reject even an explicit mistaken icon assignment; never infer body art from UI art.
    if (
      !asset ||
      asset === definition.iconAsset ||
      Object.values(equipmentIcons).includes(asset) ||
      /_icon\.(png|webp|svg)$/i.test(asset) ||
      /[?#]/.test(asset) ||
      // Dedicated overlay namespace only; reject traversal, aliases and UI art.
      !/^\/assets\/equipment\/overlays\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|webp|svg)$/.test(
        asset,
      )
    )
      return unavailable();
    if (piece.overlayMode === 'full-canvas') {
      const config = piece.fullCanvasConfig;
      if (
        !asset.endsWith('.png') ||
        !config ||
        config.sourceSize?.width !== FULL_CANVAS_OVERLAY_SOURCE.width ||
        config.sourceSize?.height !== FULL_CANVAS_OVERLAY_SOURCE.height ||
        !Number.isFinite(config.zIndex)
      )
        return unavailable();
      // Logical geometry only; renderer uses inset/100%, never anchor calibration.
      layers.push({
        asset,
        overlayMode: 'full-canvas',
        placement: {
          anchor: 'canvas',
          x: 0,
          y: 0,
          width: AVATAR_CANVAS.width,
          height: AVATAR_CANVAS.height,
          anchorX: 0,
          anchorY: 0,
          rotation: 0,
          mirrorX: false,
          transformOrigin: '50% 50%',
          zIndex: config.zIndex,
        },
      });
      continue;
    }
    if (
      (piece.overlayMode !== undefined && piece.overlayMode !== 'cropped') ||
      !piece.visualConfig
    )
      return unavailable();
    const config = {
      ...piece.visualConfig.base,
      ...piece.visualConfig[bodyType],
    };
    if (!validCalibration(config)) return unavailable();
    layers.push({
      asset,
      overlayMode: 'cropped',
      placement: resolveOverlayPlacement(bodyType, config),
    });
  }
  return {
    iconAsset: definition.iconAsset,
    layers: layers.sort((a, b) => a.placement.zIndex - b.placement.zIndex),
    visualQuality: 'READY',
    visualOverlayUnavailable: false,
  };
}

export function equipmentAssetForItem(
  item: Pick<Equipment, 'id' | 'slot'>,
): string {
  const definition = resolveEquipmentDefinition(item.id);
  return definition?.slot === item.slot
    ? definition.iconAsset
    : equipmentIcons[item.slot];
}
export function equipmentVisualForItem(
  item: Pick<Equipment, 'id' | 'slot'>,
  bodyType: BodyType,
  avatarSource?: string,
): ResolvedEquipmentVisual {
  const definition = resolveEquipmentDefinition(item.id);
  return definition?.slot === item.slot
    ? resolveEquipmentVisual(definition, bodyType, avatarSource)
    : {
        iconAsset: equipmentIcons[item.slot],
        layers: [],
        visualQuality: 'NEEDS_NEW_OVERLAY',
        visualOverlayUnavailable: true,
      };
}
export function equipmentOverlayForItem(
  item: Pick<Equipment, 'id' | 'slot'>,
  bodyType: BodyType,
  avatarSource?: string,
): readonly ResolvedOverlayLayer[] {
  return equipmentVisualForItem(item, bodyType, avatarSource).layers;
}
export function equippedOverlayLayers(
  traveler: Traveler,
  resolveDefinition = resolveEquipmentDefinition,
  avatarSource?: string,
) {
  return Object.entries(traveler.equipped)
    .flatMap(([slot, itemId]) => {
      const item = traveler.inventory.find(
        (owned) => owned.id === itemId && owned.slot === slot,
      );
      const definition = item ? resolveDefinition(item.id) : undefined;
      return item && definition?.slot === slot
        ? resolveEquipmentVisual(
            definition,
            traveler.avatar.gender,
            avatarSource,
          ).layers.map((piece) => ({
            ...piece,
            requiredAvatarSource:
              definition.bodyOverlayScope?.[traveler.avatar.gender],
            itemId: item.id,
            slot: item.slot,
          }))
        : [];
    })
    .sort((a, b) => a.placement.zIndex - b.placement.zIndex);
}
