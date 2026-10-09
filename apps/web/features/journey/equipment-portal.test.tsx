// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { EquipmentComparison } from './components/equipment-comparison';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import { equipmentReward, signedValue } from './data/equipmentCinematic';
import { calculateTotalAttributes } from './data/attributes';
import { travelerBattleSnapshot } from './data/arena';

afterEach(cleanup);
// Test-only swap fixtures: no catalog/runtime items or approvals are created.
const sword = EQUIPMENT_CATALOG.find((i) => i.slot === 'weapon')!;
const weapons = [
  sword,
  {
    ...sword,
    id: 'test-only-strong-sword',
    power: 5,
    stats: { strength: 6, wisdom: 1 },
  },
];
it.each(['empty', 'same', 'upgrade', 'downgrade'] as const)(
  'compares real total power and each attribute for %s',
  (scenario) => {
    const t = createTraveler(
      'Lia',
      DEFAULT_APPEARANCE,
      'lia',
      '2026-10-06T00:00:00Z',
    );
    t.inventory = [...EQUIPMENT_CATALOG, weapons[1]];
    t.equipped = {};
    const ranked = [...weapons].sort(
      (a, b) =>
        equipmentReward(t, a).afterPower - equipmentReward(t, b).afterPower,
    );
    const low = ranked[0],
      high = ranked.at(-1)!;
    const item = scenario === 'downgrade' || scenario === 'same' ? low : high;
    if (scenario !== 'empty')
      t.equipped.weapon = scenario === 'downgrade' ? high.id : low.id;
    const after = { ...t, equipped: { ...t.equipped, weapon: item.id } };
    render(<EquipmentComparison traveler={t} item={item} />);
    const powerCells = within(
      screen.getByRole('row', { name: /Poder total/, hidden: true }),
    ).getAllByRole('cell', { hidden: true });
    const beforePower = travelerBattleSnapshot(t).combatPower;
    const afterPower = travelerBattleSnapshot(after).combatPower;
    expect(powerCells.map((c) => c.textContent)).toEqual([
      String(beforePower),
      String(afterPower),
      signedValue(afterPower - beforePower),
    ]);
    if (scenario === 'upgrade') expect(afterPower).toBeGreaterThan(beforePower);
    if (scenario === 'downgrade') expect(afterPower).toBeLessThan(beforePower);
    if (scenario === 'same') expect(afterPower).toBe(beforePower);
    const beforeStats = calculateTotalAttributes(t).total,
      afterStats = calculateTotalAttributes(after).total;
    for (const [key, label] of Object.entries({
      life: 'Vida',
      strength: 'Força',
      defense: 'Defesa',
      wisdom: 'Sabedoria',
    })) {
      const attribute = key as keyof typeof beforeStats;
      const cells = within(
        screen.getByRole('row', { name: new RegExp(label), hidden: true }),
      ).getAllByRole('cell', { hidden: true });
      expect(cells.map((c) => c.textContent)).toEqual([
        String(beforeStats[attribute]),
        String(afterStats[attribute]),
        signedValue(afterStats[attribute] - beforeStats[attribute]),
      ]);
    }
    expect(screen.getByText('Comparar com o atual')).toBeInTheDocument();
  },
);
