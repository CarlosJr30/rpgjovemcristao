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
it('limits armor to the two exact approved HD appearances without modifying traveler or attributes', () => {
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
            const approved = APPROVED_BODY_FIT_V3_ASSETS.find(
              (a) => a.itemId === armor.id && a.gender === gender,
            )!;
            expect(r.source).toBe(approved.avatarSource);
            expect(r.layers).toHaveLength(1);
            expect(r.layers[0].asset).toBe(approved.asset);
            expect(r.layers[0].placement.zIndex).toBe(2);
          }
          expect(calculateTotalAttributes(t)).toEqual(attrs);
          expect(JSON.stringify(t)).toBe(before);
        }
  expect(visible).toBe(2);
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
