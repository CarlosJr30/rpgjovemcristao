// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  HAIR,
  SKIN,
  OUTFITS,
  type Traveler,
} from './domain/traveler';
import { AvatarRuntime } from './components/avatar-runtime';
import { Avatar } from './components/avatar';
import {
  resolveAvatarIdentity,
  resolveAvatarRuntime,
  AVATAR_RUNTIME_CANVAS,
  AVATAR_HD_TARGET,
} from './data/avatarRuntime';
import { getGameplayAvatarPortrait } from './data/gameplayAvatarPortrait';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import { fullCanvasFixture } from './testing/equipment-overlay-fixtures';
import * as equipmentAssets from './data/equipmentAssets';
import { FighterPortrait } from './components/arena-stage';
import { EquippedAvatar } from './components/equipped-avatar';

const make = () =>
  createTraveler(
    'Viajante antigo',
    DEFAULT_APPEARANCE,
    '47-fixture',
    '2026-10-06T12:00:00Z',
  );
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('central identity, compatibility and actual resolution', () => {
  it('resolves all 54 current combinations without changing identity or save', () => {
    const urls = new Set<string>();
    for (const gender of ['male', 'female'] as const)
      for (const hair of HAIR)
        for (const outfit of OUTFITS)
          for (const skin of SKIN) {
            const traveler = make();
            traveler.avatar.gender = gender;
            traveler.appearance = { hair, outfit, skin };
            const before = JSON.stringify(traveler),
              resolved = resolveAvatarRuntime(traveler);
            urls.add(resolved.source);
            expect(resolved.source).toContain(`/hd/${gender}/`);
            expect(resolved.sourceSize).toEqual({ width: 1024, height: 1536 });
            expect(resolved.quality).toBe('READY_HD');
            expect(JSON.stringify(traveler)).toBe(before);
            expect(getGameplayAvatarPortrait(traveler)).toEqual({
              imageUrl: resolved.source,
              source: resolved.portrait,
              fallback: {
                imageUrl: resolved.legacySource,
                source: { x: 150, y: 0, width: 212, height: 205 },
              },
            });
          }
    expect(urls.size).toBe(54);
    expect(AVATAR_RUNTIME_CANVAS).toEqual({ width: 512, height: 768 });
    expect(AVATAR_HD_TARGET).toEqual({ width: 1024, height: 1536 });
  });
  it('keeps legacy face/hair IDs and does not overlay incompatible face crops', () => {
    for (const gender of ['male', 'female'] as const)
      for (const face of [1, 2, 3])
        for (const hair of [1, 2, 3]) {
          const traveler = make();
          traveler.avatar = { ...traveler.avatar, gender, face, hair };
          const result = resolveAvatarIdentity(traveler);
          expect(result.faceId).toBe(face);
          expect(result.legacyHairId).toBe(hair);
          expect(result.independentFaceSupported).toBe(false);
          expect(result.source).toContain(
            `/${gender}_short_moss_medium_hd.png`,
          );
        }
    expect(
      resolveAvatarIdentity({ appearance: DEFAULT_APPEARANCE }).gender,
    ).toBe('male');
  });
  it('uses a safe local fallback URL for invalid selection', () => {
    const subject = {
      appearance: {
        ...DEFAULT_APPEARANCE,
        hair: '../../remote',
      } as unknown as Traveler['appearance'],
    };
    expect(resolveAvatarIdentity(subject).source).toBe(
      '/assets/avatar/hd/male/male_short_moss_light_hd.png',
    );
  });
  it('renders an old in-memory caller without avatar config without writing a migration', () => {
    const { avatar: omitted, ...old } = make();
    expect(omitted.gender).toBe('male');
    const before = JSON.stringify(old);
    render(<AvatarRuntime traveler={old} />);
    expect(
      screen.getByRole('img', { name: 'Avatar do Viajante' }),
    ).toHaveAttribute('src', expect.stringContaining('/hd/male/'));
    expect(JSON.stringify(old)).toBe(before);
  });
});
describe('renderer and recovery', () => {
  it.each(['thumbnail', 'card', 'full', 'hero', 'arena'] as const)(
    'supports %s through the same identity',
    (mode) => {
      const traveler = make(),
        { container } = render(
          <AvatarRuntime traveler={traveler} mode={mode} />,
        );
      expect(container.querySelector('[data-avatar-runtime]')).toHaveAttribute(
        'data-avatar-mode',
        mode,
      );
      expect(
        screen.getByRole('img', { name: 'Avatar do Viajante' }),
      ).toHaveAttribute('src', resolveAvatarIdentity(traveler).source);
    },
  );
  it('preserves standalone old editor callers and recovers after source failure/change', () => {
    const { container, rerender } = render(
      <Avatar appearance={DEFAULT_APPEARANCE} />,
    );
    fireEvent.error(screen.getByRole('img', { name: 'Avatar do Viajante' }));
    fireEvent.error(screen.getByRole('img', { name: 'Avatar do Viajante' }));
    expect(container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      '0 0 48 72',
    );
    expect(
      screen.getByRole('img', { name: 'Avatar do Viajante' }),
    ).toHaveAttribute('data-avatar-fallback', 'procedural');
    rerender(<Avatar appearance={{ ...DEFAULT_APPEARANCE, hair: 'longo' }} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(
      screen.getByRole('img', { name: 'Avatar do Viajante' }),
    ).toHaveAttribute('src', expect.stringContaining('_long_'));
  });
  it('decorative avatars do not duplicate accessible text', () => {
    render(<AvatarRuntime traveler={make()} decorative />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
  it.each(['male', 'female'] as const)(
    'honors READY/body approval and full-canvas geometry for %s',
    (gender) => {
      const traveler = make();
      traveler.avatar.gender = gender;
      const item = EQUIPMENT_CATALOG.find((i) => i.slot === 'weapon')!;
      traveler.inventory.push(item);
      traveler.equipped = { weapon: item.id };
      const definition = fullCanvasFixture(item.id, item.slot);
      const original = equipmentAssets.equippedOverlayLayers;
      vi.spyOn(equipmentAssets, 'equippedOverlayLayers').mockImplementation(
        (t) => original(t, () => definition),
      );
      const { container, rerender } = render(
        <AvatarRuntime traveler={traveler} />,
      );
      const image = screen.getByRole('img', { name: 'Avatar do Viajante' });
      const overlay = container.querySelector('[data-overlay-slot]')!;
      expect(overlay).toHaveAttribute('data-overlay-mode', 'full-canvas');
      expect(overlay).toHaveStyle({
        width: '100%',
        height: '100%',
        inset: '0',
        zIndex: '6',
      });
      expect((overlay as HTMLElement).style.transform).toBe('');
      fireEvent.error(overlay);
      expect(container.querySelector('[data-overlay-slot]')).toBeNull();
      expect(screen.getByRole('img', { name: 'Avatar do Viajante' })).toBe(
        image,
      );
      rerender(<AvatarRuntime traveler={traveler} showEquipment={false} />);
      expect(container.querySelector('[data-overlay-slot]')).toBeNull();
      const next = {
        ...traveler,
        appearance: { ...traveler.appearance, hair: 'longo' as const },
      };
      rerender(<AvatarRuntime traveler={next} />);
      expect(container.querySelector('[data-overlay-slot]')).not.toBeNull();
      fireEvent.error(screen.getByRole('img', { name: 'Avatar do Viajante' }));
      fireEvent.error(screen.getByRole('img', { name: 'Avatar do Viajante' }));
      expect(container.querySelector('[data-avatar-fallback]')).not.toBeNull();
      expect(container.querySelector('[data-overlay-slot]')).toBeNull();
      expect(next.equipped.weapon).toBe(item.id);
      vi.restoreAllMocks();
    },
  );
  it('pending production equipment stays mechanically equipped without body art', () => {
    const traveler = make(),
      item = EQUIPMENT_CATALOG.find((i) => i.slot === 'shield')!;
    traveler.inventory.push(item);
    traveler.equipped = { shield: item.id };
    expect(resolveAvatarRuntime(traveler).layers).toHaveLength(0);
    expect(traveler.equipped.shield).toBe(item.id);
  });
  it('Arena and equipment adapter use the central runtime without swapping base', () => {
    const traveler = make();
    traveler.avatar.gender = 'female';
    const { container, rerender } = render(
      <FighterPortrait
        traveler={traveler}
        name={traveler.name}
        side="player"
      />,
    );
    expect(container.querySelector('[data-avatar-runtime]')).toHaveAttribute(
      'data-avatar-mode',
      'arena',
    );
    const source = container.querySelector('img')!.getAttribute('src');
    rerender(<EquippedAvatar traveler={traveler} />);
    expect(container.querySelector('[data-avatar-runtime]')).toHaveAttribute(
      'data-avatar-mode',
      'full',
    );
    expect(container.querySelector('img')).toHaveAttribute('src', source!);
  });
});
