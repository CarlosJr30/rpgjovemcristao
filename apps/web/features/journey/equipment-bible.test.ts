import { describe, expect, test } from 'vitest';
import { EQUIPMENT_BIBLE, SLOT_INSPIRATION, equipmentBibleFor } from './data/equipmentBible';
import { PATH_AMULET } from './domain/traveler';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';

describe('equipamentos e inspiração bíblica', () => {
  test('todo item disponível tem referência temática, origem e link externo válido', () => {
    for (const item of EQUIPMENT_CATALOG) {
      const metadata = equipmentBibleFor(item);
      expect(metadata).toBeDefined();
      expect(metadata?.biblicalClassification).toBe('thematic');
      expect(metadata?.foundAt.length).toBeGreaterThan(0);
      expect(metadata?.biblicalDescription).toMatch(/fictíci/);
      expect(new URL(metadata!.bibleUrl).host).toBe('www.bible.com');
      expect(metadata?.biblicalReference).toBe(SLOT_INSPIRATION[item.slot].biblicalReference);
    }
    expect(Object.keys(EQUIPMENT_BIBLE)).toHaveLength(EQUIPMENT_CATALOG.length);
  });

  test('medalhão conserva o ID antigo para saves existentes e não afirma existir no texto', () => {
    expect(PATH_AMULET.id).toBe('wisdom-amulet');
    expect(PATH_AMULET.name).toBe('Medalhão do Caminho');
    expect(equipmentBibleFor(PATH_AMULET)?.biblicalDescription).toContain('não menciona um medalhão');
  });
});
