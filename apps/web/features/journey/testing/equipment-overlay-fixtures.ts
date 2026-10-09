// Definitions for resolver/renderer tests only. No production artwork is supplied.
import type { EquipmentSlot } from '../domain/traveler';
import {
  equipmentIcons,
  EQUIPMENT_COMPOSITION_LAYERS,
  EQUIPMENT_SLOT_ANCHORS,
  type EquipmentDefinition,
} from '../data/equipmentAssets';

export function overlayFixture(
  itemId = 'traveler-sword-common',
  slot: EquipmentSlot = 'weapon',
): EquipmentDefinition {
  const layer = {
    helmet: 'helmet',
    armor: 'armor',
    weapon: 'weapon',
    shield: 'shield',
    boots: 'boots',
    amulet: 'medallion',
  } as const;
  return {
    itemId,
    slot,
    iconAsset: equipmentIcons[slot],
    visualQuality: 'READY',
    // Synthetic test approval, never used by the production asset manifest.
    bodyOverlayApproval: {
      male: 'APPROVED_BY_USER',
      female: 'APPROVED_BY_USER',
    },
    overlayAsset: {
      male: `/assets/equipment/overlays/${itemId}_male.webp`,
      female: `/assets/equipment/overlays/${itemId}_female.webp`,
    },
    visualConfig: {
      base: {
        anchor: EQUIPMENT_SLOT_ANCHORS[slot][0],
        registration: { x: 0.25, y: 0.75 },
        size: { width: 100, height: 200 },
        x: 0,
        y: 0,
        scale: 1,
        rotation: 15,
        zIndex: EQUIPMENT_COMPOSITION_LAYERS[layer[slot]],
      },
      female: { scale: 0.9, x: 2, y: -1 },
    },
  };
}

// Test-only V2 contract: no actual PNG or production approval is created.
export function fullCanvasFixture(
  itemId = 'traveler-sword-common',
  slot: EquipmentSlot = 'weapon',
): EquipmentDefinition {
  const legacy = overlayFixture(itemId, slot);
  return {
    ...legacy,
    overlayMode: 'full-canvas',
    overlayAsset: {
      male: `/assets/equipment/overlays/v2/${itemId}_male.png`,
      female: `/assets/equipment/overlays/v2/${itemId}_female.png`,
    },
    visualConfig: null,
    fullCanvasConfig: {
      sourceSize: { width: 1024, height: 1536 },
      zIndex: legacy.visualConfig!.base.zIndex,
    },
  };
}
