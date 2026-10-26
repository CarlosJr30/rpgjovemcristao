// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  HAIR,
  OUTFITS,
  SKIN,
} from './domain/traveler';
import { resolveAvatarRuntime } from './data/avatarRuntime';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import { equipmentVisualForItem } from './data/equipmentAssets';
import {
  APPROVED_BODY_FIT_V3,
  APPROVED_BODY_FIT_V3_ASSETS,
  APPROVED_ARMOR_COMPOSITION_3,
  APPROVED_SWORD_GRIP_COMPOSITION,
} from './data/equipmentBodyFitV3';
import { AvatarRuntime } from './components/avatar-runtime';
import { calculateTotalAttributes } from './data/attributes';
const armor = EQUIPMENT_CATALOG.find(
  (i) => i.id === APPROVED_BODY_FIT_V3.itemId,
)!;
const make = () => {
  const t = createTraveler(
    'QA sintético',
    DEFAULT_APPEARANCE,
    'qa-body-fit',
    '2026-10-14T12:00:00Z',
  );
  t.avatar.gender = 'female';
  t.inventory = [...EQUIPMENT_CATALOG];
  t.equipped = { armor: armor.id };
  return t;
};
afterEach(cleanup);
it('limits armor to the three exact approved HD appearances without modifying traveler or attributes', () => {
  let visible = 0;
  for (const gender of ['female', 'male'] as const)
    for (const hair of HAIR)
      for (const outfit of OUTFITS)
        for (const skin of SKIN) {
          const t = make();
          t.avatar.gender = gender;
          t.appearance = { hair, outfit, skin };
          const before = JSON.stringify(t),
            attrs = calculateTotalAttributes(t),
            r = resolveAvatarRuntime(t);
          if (r.layers.length) {
            visible++;
            const approved = [
              ...APPROVED_BODY_FIT_V3_ASSETS,
              APPROVED_ARMOR_COMPOSITION_3,
            ].find(
              (a) =>
                a.itemId === armor.id &&
                a.gender === gender &&
                a.avatarSource === r.source,
            )!;
            expect(r.source).toBe(approved.avatarSource);
            expect(r.layers).toHaveLength(1);
            expect(r.layers[0].asset).toBe(approved.asset);
            expect(r.layers[0].placement.zIndex).toBe(2);
          }
          expect(calculateTotalAttributes(t)).toEqual(attrs);
          expect(JSON.stringify(t)).toBe(before);
        }
  expect(visible).toBe(3);
  expect(equipmentVisualForItem(armor, 'female').layers).toEqual([]);
  expect(
    equipmentVisualForItem(
      { ...armor, slot: 'weapon' },
      'female',
      APPROVED_BODY_FIT_V3.avatarSource,
    ).layers,
  ).toEqual([]);
});
it.each(['female', 'male'] as const)(
  'composes only the exact armor and sheathed sword with all six real items: %s',
  (gender) => {
    const t = make();
    t.avatar.gender = gender;
    for (const item of t.inventory) t.equipped[item.slot] = item.id;
    expect(resolveAvatarRuntime(t).layers.map((l) => l.itemId)).toEqual([
      armor.id,
      'traveler-sword-common',
    ]);
    expect(
      resolveAvatarRuntime(t).layers.map((l) => l.placement.zIndex),
    ).toEqual([2, 6]);
  },
);
it.each(APPROVED_BODY_FIT_V3_ASSETS)(
  'binds $targetId to its exact gender, Avatar and existing slot',
  (approved) => {
    const item = EQUIPMENT_CATALOG.find((i) => i.id === approved.itemId)!;
    expect(item).toBeDefined();
    const visual = equipmentVisualForItem(
      item,
      approved.gender,
      approved.avatarSource,
    );
    expect(visual.layers.map((l) => l.asset)).toEqual([approved.asset]);
    expect(visual.layers[0].placement).toMatchObject({
      x: 0,
      y: 0,
      width: 512,
      height: 768,
      rotation: 0,
      mirrorX: false,
    });
    const other = approved.gender === 'male' ? 'female' : 'male';
    expect(
      equipmentVisualForItem(item, other, approved.avatarSource).layers,
    ).toEqual([]);
    expect(
      equipmentVisualForItem(
        item,
        approved.gender,
        approved.avatarSource.replace('_short_', '_long_'),
      ).layers,
    ).toEqual([]);
    expect(equipmentVisualForItem(item, approved.gender).layers).toEqual([]);
    expect(
      equipmentVisualForItem(
        { ...item, slot: 'boots' },
        approved.gender,
        approved.avatarSource,
      ).layers,
    ).toEqual([]);
  },
);
it('removes the scoped layer on HD decode failure and retains safe legacy/procedural fallback', () => {
  const { container } = render(<AvatarRuntime traveler={make()} />);
  expect(container.querySelector('[data-overlay-item]')).toBeInTheDocument();
  fireEvent.error(screen.getByRole('img', { name: 'Avatar do Viajante' }));
  expect(
    container.querySelector('[data-overlay-item]'),
  ).not.toBeInTheDocument();
  fireEvent.error(screen.getByRole('img', { name: 'Avatar do Viajante' }));
  expect(
    container.querySelector('[data-avatar-fallback="procedural"]'),
  ).toBeInTheDocument();
});
it('hides an invalid overlay without changing the HD base or item bonuses', () => {
  const t = make(),
    before = calculateTotalAttributes(t),
    { container } = render(<AvatarRuntime traveler={t} />);
  const overlay = container.querySelector('[data-overlay-item]')!;
  fireEvent.load(overlay);
  expect(
    container.querySelector('[data-overlay-item]'),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Avatar do Viajante' }),
  ).toHaveAttribute('src', APPROVED_BODY_FIT_V3.avatarSource);
  expect(calculateTotalAttributes(t)).toEqual(before);
});

it('renders composition 3 only for owned equipped armor on the exact approved body, retaining bonuses and reload state', () => {
  const t = make();
  t.appearance = { hair: 'longo', outfit: 'azul', skin: 'escuro' };
  // Keep this regression focused on armor; RPG-DEV-003 separately approves
  // four additional items on this body and tests their ownership/identity scope.
  t.equipped = { armor: armor.id };
  const before = JSON.stringify(t),
    attrs = calculateTotalAttributes(t);
  expect(resolveAvatarRuntime(t).layers.map((l) => l.itemId)).toEqual([
    armor.id,
  ]);
  const { container, rerender } = render(<AvatarRuntime traveler={t} />);
  expect(
    screen.getByRole('img', { name: 'Avatar do Viajante' }),
  ).toHaveAttribute('src', APPROVED_ARMOR_COMPOSITION_3.avatarSource);
  expect(container.querySelector('[data-overlay-item]')).toHaveStyle({
    transform: 'translate(-2.5%, 0) scale(1.05, 1)',
    transformOrigin: 'top left',
  });
  rerender(<AvatarRuntime traveler={JSON.parse(before)} />);
  expect(container.querySelectorAll('[data-overlay-item]')).toHaveLength(1);
  expect(calculateTotalAttributes(t)).toEqual(attrs);
  const unequipped = JSON.parse(before);
  delete unequipped.equipped.armor;
  rerender(<AvatarRuntime traveler={unequipped} />);
  expect(container.querySelector('[data-overlay-item]')).toBeNull();
  const unowned = JSON.parse(before);
  unowned.inventory = unowned.inventory.filter(
    (i: { id: string }) => i.id !== armor.id,
  );
  expect(resolveAvatarRuntime(unowned).layers).toEqual([]);
  rerender(<AvatarRuntime traveler={t} />);
  fireEvent.error(screen.getByRole('img', { name: 'Avatar do Viajante' }));
  expect(container.querySelector('[data-overlay-item]')).toBeNull();
  expect(JSON.stringify(t)).toBe(before);
});

it('binds the approved hand grip and original-hand occlusion to an owned equipped sword on the exact body', () => {
  const t = make();
  t.appearance = { hair: 'longo', outfit: 'azul', skin: 'escuro' };
  t.equipped.weapon = 'traveler-sword-common';
  const saved = JSON.stringify(t),
    attrs = calculateTotalAttributes(t);
  const { container, rerender } = render(<AvatarRuntime traveler={t} />);
  expect(resolveAvatarRuntime(t).layers.map((l) => l.itemId)).toEqual([
    armor.id,
    'traveler-sword-common',
  ]);
  const blade = container.querySelector(
    '[data-overlay-item="traveler-sword-common"]',
  );
  expect(blade).toHaveAttribute('src', APPROVED_SWORD_GRIP_COMPOSITION.asset);
  expect(blade).toHaveStyle({
    transform: 'translate(-2.3%, 11.7%) scale(0.65, 0.65)',
    transformOrigin: '25.7% 41.7%',
  });
  const hand = container.querySelector('[data-overlay-occlusion]');
  expect(hand).toHaveAttribute(
    'src',
    APPROVED_SWORD_GRIP_COMPOSITION.avatarSource,
  );
  expect(hand).toHaveStyle({
    clipPath: APPROVED_SWORD_GRIP_COMPOSITION.handClipPath,
  });
  rerender(<AvatarRuntime traveler={JSON.parse(saved)} />);
  expect(container.querySelectorAll('[data-overlay-occlusion]')).toHaveLength(
    1,
  );
  const unequipped = JSON.parse(saved);
  delete unequipped.equipped.weapon;
  rerender(<AvatarRuntime traveler={unequipped} />);
  expect(container.querySelector('[data-overlay-occlusion]')).toBeNull();
  expect(
    container.querySelector('[data-overlay-item="traveler-sword-common"]'),
  ).toBeNull();
  expect(
    container.querySelector('[data-overlay-item="traveler-armor-uncommon"]'),
  ).not.toBeNull();
  const unowned = JSON.parse(saved);
  unowned.inventory = unowned.inventory.filter(
    (i: { id: string }) => i.id !== 'traveler-sword-common',
  );
  expect(resolveAvatarRuntime(unowned).layers.map((l) => l.itemId)).toEqual([
    armor.id,
  ]);
  rerender(<AvatarRuntime traveler={t} />);
  fireEvent.error(
    container.querySelector('[data-overlay-item="traveler-sword-common"]')!,
  );
  expect(container.querySelector('[data-overlay-occlusion]')).toBeNull();
  expect(calculateTotalAttributes(t)).toEqual(attrs);
  expect(JSON.stringify(t)).toBe(saved);
});

it('does not transfer the grip or hand mask to a different body or image fallback', () => {
  const t = make();
  t.appearance = { hair: 'longo', outfit: 'azul', skin: 'escuro' };
  t.equipped.weapon = 'traveler-sword-common';
  const { container } = render(<AvatarRuntime traveler={t} />);
  fireEvent.error(screen.getByRole('img', { name: 'Avatar do Viajante' }));
  expect(container.querySelector('[data-overlay-occlusion]')).toBeNull();
  expect(container.querySelector('[data-overlay-item]')).toBeNull();
  const other = JSON.parse(JSON.stringify(t));
  other.appearance.skin = 'medio';
  expect(resolveAvatarRuntime(other).layers).toEqual([]);
});
