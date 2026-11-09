import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { ARENA_CONTENT_040_CARDS } from '../../../game-engine/src/arena-content-040';
import { EQUIPMENT_CATALOG } from '../../../../apps/web/features/journey/data/equipmentCatalog';

const cards = JSON.parse(
  readFileSync('packages/database/deployments/content040/catalog.json', 'utf8'),
);
const equipment = JSON.parse(
  readFileSync(
    'packages/database/deployments/content040/equipment.json',
    'utf8',
  ),
);

it('freezes only the 33 approved cards as non-starter definitions with acquisition closed', () => {
  expect(cards).toHaveLength(33);
  expect(new Set(cards.map((card: { id: string }) => card.id)).size).toBe(33);
  expect(cards.map((card: { id: string }) => card.id).sort()).toEqual(
    ARENA_CONTENT_040_CARDS.map((card) => card.id).sort(),
  );
  for (const card of cards) {
    const source = ARENA_CONTENT_040_CARDS.find(
      (entry) => entry.id === card.id,
    )!;
    expect(card).toMatchObject({
      action: source.action,
      name: source.name,
      minimumLevel: source.minimumLevel,
      focusCost: source.focusCost,
      usesPerBattle: 1,
      catalogVersion: 'arena-cards-2026-11-09.1-content-040a',
      balanceVersion: 'arena-content-040a-2026-11-09.1',
      homologation: {
        status: 'approved',
        approvalReference: 'CONTENT-040A:OWNER:2026-11-09',
      },
      acquisition: {
        status: 'pending-server-contract',
        authorizedSources: [],
        approvalReference: null,
      },
      art: { approved: true, reference: source.artPath },
    });
  }
});

it('freezes the 34 approved equipment definitions and their exact art mappings', () => {
  const approved = EQUIPMENT_CATALOG.filter((item) => item.catalogArt);
  expect(equipment).toHaveLength(34);
  expect(new Set(equipment.map((item: { id: string }) => item.id)).size).toBe(
    34,
  );
  expect(equipment.map((item: { id: string }) => item.id).sort()).toEqual(
    approved.map((item) => item.id).sort(),
  );
  for (const item of equipment) {
    const source = approved.find((entry) => entry.id === item.id)!;
    expect(item).toMatchObject({
      ...source,
      catalogArt: `/assets/equipment/catalog/${item.id}.webp`,
    });
  }
});

it('keeps activation separate from ownership, starter grants and economic sources in both environments', () => {
  for (const file of [
    '20261109000100_content_040_test.sql',
    '20261109000101_content_040_production.sql',
  ]) {
    const sql = readFileSync(
      `packages/database/deployments/content040/${file}`,
      'utf8',
    );
    expect(sql).toContain('starter_count<>7');
    expect(sql).toContain('starter_hash IS DISTINCT FROM');
    expect(sql).toContain(
      'INSERT INTO economy_private.card_catalog(version,id,definition,approval_ref,starter)',
    );
    expect(sql).toContain("'CONTENT-040A:OWNER:2026-11-09',false");
    expect(sql).toContain('Verified acquisition receipt required');
    expect(sql).toContain('card_receipt_id IS NULL');
    expect(sql).toContain('traveler_level<required_level');
    expect(sql).not.toMatch(
      /INSERT\s+INTO\s+public\.(inventory|chest_operations|wallets)/i,
    );
    expect(sql).not.toMatch(
      /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\./i,
    );
    expect(sql).not.toMatch(/GRANT\s+EXECUTE/i);
  }
  for (const file of [
    'recovery_empty_test.sql',
    'recovery_empty_production.sql',
  ]) {
    const sql = readFileSync(
      `packages/database/deployments/content040/${file}`,
      'utf8',
    );
    expect(sql).toContain('recovery requires empty ownership and receipts');
    expect(sql).toContain('public.inventory');
    expect(sql).toContain('public.equipped_items');
    expect(sql).toContain('public.chest_operations');
    expect(sql).toContain('NOT starter');
  }
});
