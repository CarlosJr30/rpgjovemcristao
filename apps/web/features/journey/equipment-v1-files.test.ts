import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  EQUIPMENT_ASSET_MANIFEST,
  resolveEquipmentDefinition,
  resolveEquipmentVisual,
} from './data/equipmentAssets';

const sources = {
  armor_traveler_uncommon_female: [392, 432],
  armor_traveler_uncommon_male: [416, 440],
  armor_traveler_rare_female: [392, 432],
  armor_traveler_rare_male: [416, 440],
  sword_path_common: [96, 480],
  sword_path_rare: [96, 480],
  helmet_traveler_rare_female: [288, 348],
  helmet_traveler_rare_male: [284, 340],
  boots_traveler_common_left_female: [176, 328],
  boots_traveler_common_right_female: [232, 328],
  boots_traveler_common_left_male: [216, 332],
  boots_traveler_common_right_male: [256, 332],
  shield_perseverance_rare: [216, 304],
  medallion_path_rare: [88, 144],
} as const;

function png(url: string) {
  const data = readFileSync(`apps/web/public${url}`);
  expect(data.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  const width = data.readUInt32BE(16),
    height = data.readUInt32BE(20);
  expect(data[24]).toBe(8);
  expect(data[25]).toBe(6);
  expect(data[28]).toBe(0);
  const chunks: Buffer[] = [];
  for (let offset = 8; offset < data.length;) {
    const length = data.readUInt32BE(offset),
      type = data.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT')
      chunks.push(data.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)),
    stride = width * 4;
  expect(raw.length).toBe(height * (stride + 1));
  let previous = Buffer.alloc(stride),
    transparent = 0,
    solid = 0;
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1),
      filter = raw[start],
      row = Buffer.alloc(stride);
    expect(filter).toBeLessThanOrEqual(4);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? row[x - 4] : 0,
        b = previous[x],
        c = x >= 4 ? previous[x - 4] : 0;
      const p = a + b - c,
        pa = Math.abs(p - a),
        pb = Math.abs(p - b),
        pc = Math.abs(p - c);
      const predictor =
        filter === 1
          ? a
          : filter === 2
            ? b
            : filter === 3
              ? Math.floor((a + b) / 2)
              : filter === 4
                ? pa <= pb && pa <= pc
                  ? a
                  : pb <= pc
                    ? b
                    : c
                : 0;
      row[x] = (raw[start + 1 + x] + predictor) & 255;
    }
    for (let x = 3; x < stride; x += 4) {
      if (row[x] === 0) transparent++;
      if (row[x] >= 240) solid++;
    }
    previous = row;
  }
  expect(transparent).toBeGreaterThan(width * height * 0.1);
  expect(solid).toBeGreaterThan(0);
  return { width, height };
}

describe('physical V1 overlay package', () => {
  it.each(Object.entries(sources))(
    '%s has required dimensions and real alpha',
    (name, dimensions) => {
      const source = png(`/assets/equipment/overlays/v1/${name}.png`);
      expect([source.width, source.height]).toEqual(dimensions);
    },
  );
  it.each(['female', 'male'] as const)(
    '%s preserves archived sources without rendering rejected art',
    (body) => {
      const files = new Set<string>();
      for (const id of Object.keys(EQUIPMENT_ASSET_MANIFEST)) {
        const definition = resolveEquipmentDefinition(id)!;
        expect(definition.visualQuality).toBe(
          ['traveler-armor-uncommon', 'traveler-sword-common'].includes(id)
            ? 'READY'
            : 'NEEDS_NEW_OVERLAY',
        );
        expect(resolveEquipmentVisual(definition, body).layers).toEqual([]);
        for (const piece of [
          definition,
          ...(definition.additionalOverlays ?? []),
        ]) {
          const source = [
            'traveler-armor-uncommon',
            'traveler-sword-common',
          ].includes(id)
            ? definition.iconAssetHighQuality!
            : piece.overlayAsset!;
          const asset = typeof source === 'string' ? source : source[body]!;
          files.add(asset);
          const name = asset
            .split('/')
            .pop()!
            .replace('.png', '') as keyof typeof sources;
          expect(sources[name]).toBeDefined();
        }
      }
      expect(files.size).toBe(9);
    },
  );
});
