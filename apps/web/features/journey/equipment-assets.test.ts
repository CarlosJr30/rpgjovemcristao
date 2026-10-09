import { describe, expect, it } from 'vitest';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Equipment,
} from './domain/traveler';
import {
  EQUIPMENT_ASSET_MANIFEST,
  EQUIPMENT_COMPOSITION_LAYERS,
  equipmentIcons,
  equipmentAssetForItem,
  equipmentOverlayForItem,
  equipmentVisualForItem,
  equippedOverlayLayers,
  resolveEquipmentDefinition,
  resolveEquipmentVisual,
  resolveOverlayPlacement,
} from './data/equipmentAssets';
import {
  AVATAR_CANVAS,
  BODY_ANCHORS,
  bodyAnchorPoint,
  type BodyAnchor,
} from './data/bodyAnchors';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import { calculateTotalAttributes } from './data/attributes';
import {
  overlayFixture,
  fullCanvasFixture,
} from './testing/equipment-overlay-fixtures';

const sword = EQUIPMENT_CATALOG.find(
  (item) => item.id === 'traveler-sword-common',
)!;
const makeTraveler = () =>
  createTraveler(
    'Luca',
    DEFAULT_APPEARANCE,
    'traveler-luca',
    '2026-10-01T00:00:00.000Z',
  );

describe('equipment visual contract', () => {
  it.each([
    '/assets/equipment/armor/unlisted-ui.png',
    '/assets/equipment/overlays/../armor/unlisted-ui.png',
    '/assets/equipment/overlays/v2/%2e%2e/ui.png',
    '/assets/equipment/overlays/v2/body.png?alias=icon',
    '/assets/equipment/overlays/v2/body.png#icon',
  ])('rejects non-body namespaces and ambiguous paths: %s', (asset) => {
    expect(
      resolveEquipmentVisual(
        { ...fullCanvasFixture(), overlayAsset: asset },
        'female',
      ).layers,
    ).toEqual([]);
  });
  it('resolves canonical equipment and UI icons without copying stats', () => {
    for (const item of EQUIPMENT_CATALOG) {
      const definition = resolveEquipmentDefinition(item.id)!;
      expect(definition.equipment).toBe(item);
      expect(definition.slot).toBe(item.slot);
      expect(equipmentAssetForItem(item)).toBe(definition.iconAsset);
      expect(definition.iconAsset).toMatch(
        /^\/assets\/equipment\/.+_icon\.png$/,
      );
    }
    expect(resolveEquipmentDefinition('unknown')).toBeUndefined();
    expect(equipmentAssetForItem({ id: 'unknown', slot: 'armor' })).toBe(
      equipmentIcons.armor,
    );
  });

  it('preserves V1 for UI/archive while rejected art stays off both bodies', () => {
    for (const [id, entry] of Object.entries(EQUIPMENT_ASSET_MANIFEST)) {
      expect(entry.visualQuality).toBe('NEEDS_NEW_OVERLAY');
      expect(entry.overlayMode).toBe('cropped');
      expect(entry.iconAssetHighQuality).toEqual(entry.overlayAsset);
      expect(entry.bodyOverlayApproval).toBeUndefined();
      for (const body of ['male', 'female'] as const) {
        expect(equipmentOverlayForItem({ id, slot: entry.slot }, body)).toEqual(
          [],
        );
        expect(
          equipmentVisualForItem({ id, slot: entry.slot }, body)
            .visualOverlayUnavailable,
        ).toBe(true);
      }
    }
  });

  it('requires human approval for the selected body even when quality says READY', () => {
    for (const fixture of [overlayFixture(), fullCanvasFixture()]) {
      expect(
        resolveEquipmentVisual(
          { ...fixture, bodyOverlayApproval: undefined },
          'female',
        ).layers,
      ).toEqual([]);
      const femaleOnly = {
        ...fixture,
        bodyOverlayApproval: { female: 'APPROVED_BY_USER' as const },
      };
      expect(resolveEquipmentVisual(femaleOnly, 'female').layers).toHaveLength(
        1,
      );
      expect(resolveEquipmentVisual(femaleOnly, 'male').layers).toEqual([]);
    }
  });

  it('uses full-canvas logical geometry, ignores anchor calibration and supports combined boots', () => {
    const fixture = fullCanvasFixture('traveler-boots', 'boots');
    const before = JSON.stringify(fixture);
    for (const body of ['male', 'female'] as const) {
      const visual = resolveEquipmentVisual(fixture, body);
      expect(visual.layers).toHaveLength(1);
      expect(visual.layers[0].overlayMode).toBe('full-canvas');
      expect(visual.layers[0].asset).toContain(`_${body}.png`);
      expect(visual.layers[0].placement).toMatchObject({
        anchor: 'canvas',
        x: 0,
        y: 0,
        width: 512,
        height: 768,
        rotation: 0,
        mirrorX: false,
      });
    }
    const withLegacyCalibration = {
      ...fixture,
      visualConfig: overlayFixture().visualConfig,
    };
    expect(resolveEquipmentVisual(withLegacyCalibration, 'female')).toEqual(
      resolveEquipmentVisual(fixture, 'female'),
    );
    expect(JSON.stringify(fixture)).toBe(before);
  });

  it('fails safely for invalid full-canvas contracts and unavailable body art', () => {
    const fixture = fullCanvasFixture();
    for (const definition of [
      { ...fixture, fullCanvasConfig: undefined },
      {
        ...fixture,
        fullCanvasConfig: {
          sourceSize: { width: 1024, height: 1024 },
          zIndex: 6,
        },
      },
      {
        ...fixture,
        fullCanvasConfig: {
          sourceSize: { width: 512, height: 768 },
          zIndex: 6,
        },
      },
      {
        ...fixture,
        fullCanvasConfig: {
          sourceSize: { width: 1024, height: 1536 },
          zIndex: NaN,
        },
      },
      {
        ...fixture,
        overlayAsset: { male: '/assets/equipment/overlays/v2/test_male.png' },
      },
      { ...fixture, overlayAsset: fixture.iconAsset },
      { ...fixture, overlayAsset: '/assets/equipment/overlays/v2/test.webp' },
      {
        ...fixture,
        additionalOverlays: [
          {
            overlayMode: 'full-canvas' as const,
            overlayAsset: null,
            visualConfig: null,
          },
        ],
      },
    ]) {
      const visual = resolveEquipmentVisual(definition, 'female');
      expect(visual.layers).toEqual([]);
      expect(visual.visualQuality).toBe('NEEDS_NEW_OVERLAY');
      expect(visual.iconAsset).toBe(fixture.iconAsset);
    }
  });

  it('uses safe fallback for unknown items and mismatched slots', () => {
    for (const item of [
      { id: 'unknown', slot: 'weapon' },
      { id: sword.id, slot: 'armor' },
    ] as const) {
      const visual = equipmentVisualForItem(item, 'female');
      expect(visual.layers).toEqual([]);
      expect(visual.iconAsset).toBe(equipmentIcons[item.slot]);
      expect(visual.visualQuality).toBe('NEEDS_NEW_OVERLAY');
    }
  });

  it('rejects explicit icon assignments, missing sources/config and unapproved art', () => {
    const fixture = overlayFixture();
    for (const definition of [
      { ...fixture, overlayAsset: fixture.iconAsset },
      { ...fixture, overlayAsset: equipmentIcons.armor },
      { ...fixture, overlayAsset: '/assets/equipment/new/item_icon.png' },
      { ...fixture, overlayAsset: null },
      { ...fixture, visualConfig: null },
      { ...fixture, visualQuality: 'NEEDS_NEW_OVERLAY' as const },
      { ...fixture, visualQuality: 'NEEDS_POSITION_ADJUSTMENT' as const },
      { ...fixture, overlayAsset: 'https://example.invalid/body.webp' },
    ]) {
      expect(resolveEquipmentVisual(definition, 'male').layers).toEqual([]);
      expect(
        resolveEquipmentVisual(definition, 'male').visualOverlayUnavailable,
      ).toBe(true);
    }
  });

  it('selects body art and merges only gender overrides into shared config', () => {
    const fixture = overlayFixture();
    const before = JSON.stringify(fixture);
    const male = resolveEquipmentVisual(fixture, 'male');
    const female = resolveEquipmentVisual(fixture, 'female');
    expect(male.visualQuality).toBe('READY');
    expect(male.visualOverlayUnavailable).toBe(false);
    expect(male.layers[0].asset).toContain('_male.webp');
    expect(female.layers[0].asset).toContain('_female.webp');
    expect(male.layers[0].placement.width).toBe(100);
    expect(female.layers[0].placement.width).toBe(90);
    expect(female.layers[0].placement.anchorX).toBeCloseTo(
      bodyAnchorPoint('female', 'rightHand').x + 2,
    );
    expect(female.layers[0].placement.rotation).toBe(15);
    expect(JSON.stringify(fixture)).toBe(before);
    expect(
      resolveEquipmentVisual(
        {
          ...fixture,
          overlayAsset: { male: '/assets/equipment/overlays/male.webp' },
        },
        'female',
      ).layers,
    ).toEqual([]);
  });

  it('anchors the registration/rotation point at every semantic anchor for both bodies', () => {
    for (const body of ['male', 'female'] as const) {
      for (const anchor of Object.keys(BODY_ANCHORS[body]) as BodyAnchor[]) {
        const placement = resolveOverlayPlacement(body, {
          ...overlayFixture().visualConfig!.base,
          anchor,
          x: 3,
          y: -2,
        });
        expect(placement.x + placement.width * 0.25).toBeCloseTo(
          BODY_ANCHORS[body][anchor].x * AVATAR_CANVAS.width + 3,
        );
        expect(placement.y + placement.height * 0.75).toBeCloseTo(
          BODY_ANCHORS[body][anchor].y * AVATAR_CANVAS.height - 2,
        );
        expect(placement.transformOrigin).toBe('25% 75%');
      }
    }
  });

  it('supports independent boot assets at each foot and suppresses an incomplete pair', () => {
    const fixture = overlayFixture('traveler-boots', 'boots');
    fixture.additionalOverlays = [
      {
        overlayAsset: '/assets/equipment/overlays/right_boot.webp',
        visualConfig: {
          base: {
            ...fixture.visualConfig!.base,
            anchor: 'rightFoot',
            rotation: -15,
          },
        },
      },
    ];
    const layers = resolveEquipmentVisual(fixture, 'female').layers;
    expect(layers.map((layer) => layer.placement.anchor)).toEqual([
      'leftFoot',
      'rightFoot',
    ]);
    expect(layers[0].asset).not.toBe(layers[1].asset);
    expect(layers[1].placement.rotation).toBe(-15);
    fixture.additionalOverlays = [{ overlayAsset: null, visualConfig: null }];
    expect(resolveEquipmentVisual(fixture, 'female').layers).toEqual([]);
  });

  it('rejects invalid calibration instead of producing a distorted layer', () => {
    const fixture = overlayFixture();
    for (const change of [
      { scale: 0 },
      { x: NaN },
      { size: { width: -1, height: 200 } },
      { registration: { x: 2, y: 0.5 } },
    ]) {
      expect(
        resolveEquipmentVisual(
          {
            ...fixture,
            visualConfig: {
              base: { ...fixture.visualConfig!.base, ...change },
            },
          },
          'female',
        ).layers,
      ).toEqual([]);
    }
  });

  it('renders only the owned item in its equipped slot, switches and removes it', () => {
    const first = makeTraveler();
    const second = makeTraveler();
    const rare: Equipment = { ...sword, id: 'traveler-sword-rare' };
    const resolve = (id: string) => overlayFixture(id);
    first.inventory.push(sword, rare);
    first.equipped.weapon = sword.id;
    expect(
      equippedOverlayLayers(first, resolve).map((layer) => layer.itemId),
    ).toEqual([sword.id]);
    // An item in an equipped slot without corresponding ownership is not rendered.
    second.equipped.weapon = sword.id;
    expect(equippedOverlayLayers(second, resolve)).toEqual([]);
    first.equipped.weapon = rare.id;
    expect(
      equippedOverlayLayers(first, resolve).map((layer) => layer.itemId),
    ).toEqual([rare.id]);
    first.equipped.armor = rare.id;
    expect(
      equippedOverlayLayers(first, resolve).every(
        (layer) => layer.slot === 'weapon',
      ),
    ).toBe(true);
    delete first.equipped.weapon;
    expect(equippedOverlayLayers(first, resolve)).toEqual([]);
  });

  it('orders dedicated layers centrally, with back below body and medallion above armor', () => {
    const traveler = makeTraveler();
    traveler.inventory = [...EQUIPMENT_CATALOG];
    traveler.equipped = Object.fromEntries(
      EQUIPMENT_CATALOG.map((item) => [item.slot, item.id]),
    );
    const layers = equippedOverlayLayers(traveler, (id) => {
      const item = traveler.inventory.find((owned) => owned.id === id)!;
      return overlayFixture(id, item.slot);
    });
    expect(layers.map((layer) => layer.slot)).toEqual([
      'armor',
      'boots',
      'amulet',
      'weapon',
      'shield',
      'helmet',
    ]);
    expect(EQUIPMENT_COMPOSITION_LAYERS.back).toBeLessThan(
      EQUIPMENT_COMPOSITION_LAYERS.body,
    );
    expect(EQUIPMENT_COMPOSITION_LAYERS.medallion).toBeGreaterThan(
      EQUIPMENT_COMPOSITION_LAYERS.armor,
    );
    expect(
      layers.find((layer) => layer.slot === 'amulet')!.placement.anchor,
    ).toBe('chest');
  });

  it('visual resolution leaves all attributes, bonuses, inventory and equipment untouched', () => {
    const traveler = makeTraveler();
    traveler.inventory = [...EQUIPMENT_CATALOG];
    traveler.equipped = Object.fromEntries(
      EQUIPMENT_CATALOG.map((item) => [item.slot, item.id]),
    );
    const snapshot = JSON.stringify(traveler);
    const attributes = calculateTotalAttributes(traveler);
    expect(attributes.equipment).toEqual({
      life: 3,
      strength: 2,
      defense: 4,
      wisdom: 2,
    });
    expect(equippedOverlayLayers(traveler)).toHaveLength(0);
    for (const item of traveler.inventory)
      equipmentVisualForItem(item, 'female');
    expect(calculateTotalAttributes(traveler)).toEqual(attributes);
    expect(JSON.stringify(traveler)).toBe(snapshot);
  });
});
