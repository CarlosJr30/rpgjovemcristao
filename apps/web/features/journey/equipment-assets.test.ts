import { describe, expect, it } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE, type Equipment } from './domain/traveler';
import { EQUIPMENT_ASSET_MANIFEST, equippedOverlayLayers, equipmentAnchor, equipmentOverlayForItem } from './data/equipmentAssets';
import { AVATAR_CANVAS, BODY_ANCHORS } from './data/bodyAnchors';

const sword: Equipment = { id: 'traveler-sword-common', name: 'Espada do Caminho', slot: 'weapon', rarity: 'comum', power: 1, stats: { strength: 2 } };

describe('camadas do equipamento', () => {
  it('posiciona a espada na mão por tipo corporal e usa asset local de alta resolução', () => {
    const entry = EQUIPMENT_ASSET_MANIFEST[sword.id];
    expect(entry.status).toBe('ready');
    expect(entry.iconAsset).toMatch(/^\/assets\/equipment\//);
    expect(entry.overlayAsset).toBe(entry.iconAsset);
    for (const bodyType of ['male', 'female'] as const) {
      const [overlay] = equipmentOverlayForItem(sword, bodyType);
      expect(overlay.asset).toBe(entry.overlayAsset);
      const gripX = overlay.placement.x + overlay.placement.width * .28;
      const gripY = overlay.placement.y + overlay.placement.height * .73;
      expect(gripX / AVATAR_CANVAS.width).toBeCloseTo(BODY_ANCHORS[bodyType].rightHand.x, 2);
      expect(gripY / AVATAR_CANVAS.height).toBeCloseTo(BODY_ANCHORS[bodyType].rightHand.y, 2);
      expect(equipmentAnchor(sword, bodyType)).toEqual({ x: overlay.placement.anchorX, y: overlay.placement.anchorY });
    }
  });

  it('mantém as botas separadas, menores e registradas nos dois pés', () => {
    const boots: Equipment = { id: 'traveler-boots', name: 'Botas do Viajante', slot: 'boots', rarity: 'comum', power: 1, stats: { life: 1 } };
    for (const bodyType of ['male', 'female'] as const) {
      const [left, right] = equipmentOverlayForItem(boots, bodyType);
      expect(left.placement.width).toBeLessThanOrEqual(168);
      expect(right.placement.width).toBeLessThanOrEqual(168);
      expect(left.placement.anchorX).toBeLessThan(BODY_ANCHORS[bodyType].leftFoot.x * AVATAR_CANVAS.width);
      expect(right.placement.anchorX).toBeGreaterThan(BODY_ANCHORS[bodyType].rightFoot.x * AVATAR_CANVAS.width);
      expect(left.placement.anchorY).toBeGreaterThan(BODY_ANCHORS[bodyType].leftFoot.y * AVATAR_CANVAS.height);
      expect(right.placement.anchorY).toBeGreaterThan(BODY_ANCHORS[bodyType].rightFoot.y * AVATAR_CANVAS.height);
      expect(left.placement.rotation).toBeLessThan(0);
      expect(right.placement.rotation).toBeGreaterThan(0);
      expect(left.placement.y).toBeGreaterThan(570);
      expect(right.placement.y).toBeGreaterThan(570);
    }
  });

  it('renderiza apenas itens possuídos e equipados, sem vazamento entre Viajantes', () => {
    const first = createTraveler('Luca', DEFAULT_APPEARANCE, 'traveler-luca', '2026-09-24T00:00:00.000Z');
    const second = createTraveler('Bia', DEFAULT_APPEARANCE, 'traveler-bia', '2026-09-24T00:00:00.000Z');
    first.inventory.push(sword);
    first.equipped.weapon = sword.id;
    expect(equippedOverlayLayers(first).some((layer) => layer.slot === 'weapon')).toBe(true);
    expect(equippedOverlayLayers(second).some((layer) => layer.slot === 'weapon')).toBe(false);
    delete first.equipped.weapon;
    expect(equippedOverlayLayers(first).some((layer) => layer.slot === 'weapon')).toBe(false);
  });

  it('troca a camada antiga ao substituir uma arma no mesmo slot', () => {
    const traveler = createTraveler('Luca', DEFAULT_APPEARANCE, 'traveler-luca', '2026-09-24T00:00:00.000Z');
    const rareSword: Equipment = { ...sword, id: 'traveler-sword-rare', name: 'Espada de teste', rarity: 'raro', power: 3 };
    traveler.inventory.push(sword, rareSword);
    traveler.equipped.weapon = sword.id;
    expect(equippedOverlayLayers(traveler).filter((layer) => layer.slot === 'weapon').map((layer) => layer.itemId)).toEqual([sword.id]);
    traveler.equipped.weapon = rareSword.id;
    expect(equippedOverlayLayers(traveler).filter((layer) => layer.slot === 'weapon').map((layer) => layer.itemId)).toEqual([rareSword.id]);
  });
});
