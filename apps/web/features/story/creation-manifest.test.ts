import { describe, expect, test } from 'vitest';
import source from './creation-content-v1.json';
import { parseCreationManifest } from './creation-days';

describe('published creation manifest validation', () => {
  test.each([
    ['numeric', 17],
    ['null', null],
    ['empty', ''],
    ['whitespace', '   '],
  ])('rejects a %s quiz identifier', (_caseName, id) => {
    const manifest = structuredClone(source);
    manifest.quiz[0].id = id as string;
    expect(() => parseCreationManifest(manifest)).toThrow();
  });

  test('rejects duplicate quiz identifiers', () => {
    const manifest = structuredClone(source);
    manifest.quiz[1].id = manifest.quiz[0].id;
    expect(() => parseCreationManifest(manifest)).toThrow(/únicos/i);
  });

  test('uses stable marker identifiers and rejects duplicates across days', () => {
    const markerIds = source.days.flatMap((day) =>
      day.markers.map((marker) => marker.id),
    );
    expect(markerIds).toEqual([
      'creation-day-1-marker-1',
      'creation-day-2-marker-1',
      'creation-day-3-marker-1',
      'creation-day-3-marker-2',
      'creation-day-3-marker-3',
      'creation-day-4-marker-1',
      'creation-day-5-marker-1',
      'creation-day-6-marker-1',
      'creation-day-7-marker-1',
    ]);
    expect(new Set(markerIds).size).toBe(markerIds.length);

    const duplicate = structuredClone(source);
    duplicate.days[1].markers[0].id = duplicate.days[0].markers[0].id;
    expect(() => parseCreationManifest(duplicate)).toThrow(/únicos no manifesto/i);
  });

  test('rejects incomplete revisions and incompatible day identifiers', () => {
    const incomplete = structuredClone(source);
    incomplete.days.pop();
    expect(() => parseCreationManifest(incomplete)).toThrow(/sete dias/i);

    const incompatible = structuredClone(source);
    incompatible.days[0].id = 'creation-day-2';
    expect(() => parseCreationManifest(incompatible)).toThrow(/dias são inválidos/i);
  });

  test('accepts the versioned artifact used by the local demonstration', () => {
    expect(parseCreationManifest(source)).toMatchObject({
      revision: 1,
      days: { length: 7 },
      quiz: { length: 5 },
    });
  });
});
