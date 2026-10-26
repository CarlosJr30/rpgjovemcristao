// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AvatarRuntime } from './components/avatar-runtime';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  HAIR,
  OUTFITS,
  SKIN,
} from './domain/traveler';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import { APPROVED_EQUIPMENT_003 } from './data/equipmentBodyFit003';
import { resolveAvatarRuntime } from './data/avatarRuntime';
import { equipmentVisualForItem } from './data/equipmentAssets';
import { calculateTotalAttributes } from './data/attributes';

afterEach(cleanup);
const make = () => {
  const t = createTraveler(
    'Fixture privada',
    DEFAULT_APPEARANCE,
    'local-approved-003',
    '2026-10-24T12:00:00.000Z',
  );
  t.avatar.gender = 'female';
  t.appearance = { hair: 'longo', outfit: 'azul', skin: 'escuro' };
  t.inventory = [...EQUIPMENT_CATALOG];
  t.equipped = {};
  for (const entry of APPROVED_EQUIPMENT_003)
    t.equipped[entry.slot] = entry.itemId;
  return t;
};

it.each(APPROVED_EQUIPMENT_003)(
  'binds $itemId only to the approved body and actual existing slot',
  (entry) => {
    const item = EQUIPMENT_CATALOG.find((i) => i.id === entry.itemId)!;
    expect(item).toBeDefined();
    let visible = 0;
    for (const gender of ['female', 'male'] as const)
      for (const hair of HAIR)
        for (const outfit of OUTFITS)
          for (const skin of SKIN) {
            const t = make();
            t.avatar.gender = gender;
            t.appearance = { hair, outfit, skin };
            const identity = resolveAvatarRuntime(t, false);
            const visual = equipmentVisualForItem(
              item,
              gender,
              identity.source,
            );
            if (visual.layers.length) {
              visible++;
              expect(identity.source).toBe(entry.avatarSource);
              expect(visual.layers).toHaveLength(entry.layers.length);
              expect(
                visual.layers.every(
                  (l) => l.requiredAvatarSource === entry.avatarSource,
                ),
              ).toBe(true);
            }
          }
    expect(visible).toBe(1);
    expect(equipmentVisualForItem(item, 'female').layers).toEqual([]);
    expect(
      equipmentVisualForItem(
        { ...item, slot: 'weapon' },
        'female',
        entry.avatarSource,
      ).layers,
    ).toEqual([]);
  },
);

it('renders the exact split boots and chain without changing ownership, balances or attributes', () => {
  const t = make(),
    before = JSON.stringify(t),
    stats = calculateTotalAttributes(t);
  const { container } = render(<AvatarRuntime traveler={t} />);
  expect(container.querySelectorAll('[data-overlay-item]')).toHaveLength(5);
  const boots = container.querySelectorAll(
    '[data-overlay-item="traveler-boots"]',
  );
  expect(boots[0]).toHaveStyle({
    clipPath: 'inset(0 50% 0 0)',
    transform: 'translate(21.5%, 60.2%) scale(0.4, 0.4)',
  });
  expect(boots[1]).toHaveStyle({
    clipPath: 'inset(0 0 0 50%)',
    transform: 'translate(41%, 60.2%) scale(0.4, 0.4)',
  });
  expect(
    container.querySelector('[data-overlay-chain="wisdom-amulet"] path'),
  ).toHaveAttribute('d', APPROVED_EQUIPMENT_003[3].layers[0].chainPath);
  expect(JSON.stringify(t)).toBe(before);
  expect(calculateTotalAttributes(t)).toEqual(stats);
  expect(resolveAvatarRuntime(JSON.parse(before)).layers).toEqual(
    resolveAvatarRuntime(t).layers,
  );
});

it('does not render an unowned equipped item or transfer the approval to image fallback', () => {
  const t = make();
  t.inventory = t.inventory.filter((i) => i.id !== 'traveler-helmet-rare');
  const { container } = render(<AvatarRuntime traveler={t} />);
  expect(
    container.querySelector('[data-overlay-item="traveler-helmet-rare"]'),
  ).toBeNull();
  fireEvent.error(screen.getByRole('img', { name: 'Avatar do Viajante' }));
  expect(container.querySelector('[data-overlay-item]')).toBeNull();
  expect(container.querySelector('[data-overlay-chain]')).toBeNull();
});
