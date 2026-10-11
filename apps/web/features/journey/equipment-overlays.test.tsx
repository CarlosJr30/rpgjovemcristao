// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { EquipmentDefinition } from './data/equipmentAssets';
import { equipmentIcons } from './data/equipmentAssets';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Traveler,
} from './domain/traveler';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import {
  overlayFixture,
  fullCanvasFixture,
} from './testing/equipment-overlay-fixtures';
import { calculateTotalAttributes } from './data/attributes';
import { RARITY_PRESENTATION } from './data/equipmentCinematic';

const mocks = vi.hoisted(() => ({
  traveler: null as Traveler | null,
  definitions: {} as Record<string, EquipmentDefinition>,
  equipItem: vi.fn(),
  unequipSlot: vi.fn(),
}));
vi.mock('./components/shell', () => ({
  Shell: ({ children }: { children: ReactNode }) => <>{children}</>,
  RequireTraveler: ({
    children,
  }: {
    children: (traveler: Traveler) => ReactNode;
  }) => children(mocks.traveler!),
}));
vi.mock('./state/use-journey', () => ({
  equipItem: mocks.equipItem,
  unequipSlot: mocks.unequipSlot,
}));
vi.mock('./data/equipmentAssets', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./data/equipmentAssets')>();
  // Inject approved test definitions into the real resolver without modifying the production manifest.
  return {
    ...actual,
    equippedOverlayLayers: (traveler: Traveler) =>
      actual.equippedOverlayLayers(
        traveler,
        (id) => mocks.definitions[id] ?? actual.resolveEquipmentDefinition(id),
      ),
    equipmentVisualForItem: (
      item: { id: string; slot: string },
      body: 'male' | 'female',
    ) => {
      const definition = mocks.definitions[item.id];
      return definition && definition.slot === item.slot
        ? actual.resolveEquipmentVisual(definition, body)
        : actual.equipmentVisualForItem(
            item as Parameters<typeof actual.equipmentVisualForItem>[0],
            body,
          );
    },
  };
});
import { EquippedAvatar } from './components/equipped-avatar';
import { EquipmentScreen } from './screens/equipment';

function stubMedia(reducedMotion = false) {
  vi.stubGlobal('matchMedia', (query: string) =>
    Object.assign(new EventTarget(), {
      media: query,
      matches: query.includes('prefers-reduced-motion') && reducedMotion,
      onchange: null,
    }),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.definitions = {};
  mocks.traveler = createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    'lia',
    '2026-10-01T00:00:00Z',
  );
  mocks.traveler.inventory = [...EQUIPMENT_CATALOG];
  mocks.equipItem.mockImplementation((item) => {
    mocks.traveler = {
      ...mocks.traveler!,
      equipped: { ...mocks.traveler!.equipped, [item.slot]: item.id },
    };
    return true;
  });
  mocks.unequipSlot.mockImplementation((slot) => {
    const equipped = { ...mocks.traveler!.equipped };
    delete equipped[slot as keyof typeof equipped];
    mocks.traveler = { ...mocks.traveler!, equipped };
  });
  stubMedia();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0),
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      return DOMRect.fromRect(
        this.hasAttribute('data-body-type')
          ? { x: 300, y: 100, width: 240, height: 360 }
          : { x: 10, y: 10, width: 80, height: 80 },
      );
    },
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Avatar overlays and equipment feedback', () => {
  it.each([
    [512, 768],
    [1024, 1535],
  ])(
    'hides decoded full-canvas %ix%i art without changing HD base or mechanical stats',
    (width, height) => {
      const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
      mocks.definitions[sword.id] = fullCanvasFixture(sword.id);
      mocks.traveler!.equipped = { weapon: sword.id };
      const before = calculateTotalAttributes(mocks.traveler!);
      const { container } = render(
        <EquippedAvatar traveler={mocks.traveler!} />,
      );
      const base = screen.getByRole('img', { name: 'Avatar do Viajante' });
      const layer = container.querySelector('[data-overlay-slot]')!;
      Object.defineProperties(layer, {
        naturalWidth: { value: width },
        naturalHeight: { value: height },
      });
      fireEvent.load(layer);
      expect(container.querySelector('[data-overlay-slot]')).toBeNull();
      expect(screen.getByRole('img', { name: 'Avatar do Viajante' })).toBe(
        base,
      );
      expect(base).toHaveAttribute('src', expect.stringContaining('/hd/'));
      expect(calculateTotalAttributes(mocks.traveler!)).toEqual(before);
      expect(mocks.traveler!.equipped.weapon).toBe(sword.id);
    },
  );
  it('keeps valid native full-canvas art after decoding, and hides it on a subsequent load error', () => {
    const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
    mocks.definitions[sword.id] = fullCanvasFixture(sword.id);
    mocks.traveler!.equipped = { weapon: sword.id };
    const { container } = render(<EquippedAvatar traveler={mocks.traveler!} />);
    const layer = container.querySelector('[data-overlay-slot]')!;
    Object.defineProperties(layer, {
      naturalWidth: { value: 1024 },
      naturalHeight: { value: 1536 },
    });
    fireEvent.load(layer);
    expect(container.querySelector('[data-overlay-slot]')).toBe(layer);
    fireEvent.error(layer);
    expect(container.querySelector('[data-overlay-slot]')).toBeNull();
    expect(container.querySelector('[data-avatar-base]')).not.toBeNull();
  });
  it.each(['helmet', 'armor', 'weapon', 'shield', 'boots', 'amulet'] as const)(
    '%s flies its UI icon once even without body art, then reports the safe fallback',
    (slot) => {
      const labels = {
        helmet: 'Elmo',
        armor: 'Armadura',
        weapon: 'Arma',
        shield: 'Escudo',
        boots: 'Botas',
        amulet: 'Medalhão',
      };
      const item = EQUIPMENT_CATALOG.find((entry) => entry.slot === slot)!;
      mocks.traveler!.equipped = {};
      const { container } = render(<EquipmentScreen />);
      fireEvent.click(screen.getByRole('button', { name: labels[slot] }));
      const rects = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
      rects.mockClear();
      fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
      expect(document.querySelectorAll('[data-cinematic-icon]')).toHaveLength(
        1,
      );
      expect(document.querySelector('[data-cinematic-icon]')).toHaveAttribute(
        'src',
        equipmentIcons[slot],
      );
      expect(container.querySelector('[data-overlay-slot]')).toBeNull();
      expect(screen.getByRole('button', { name: 'Equipar' })).toBeDisabled();
      expect(rects).toHaveBeenCalledTimes(2);
      act(() =>
        vi.advanceTimersByTime(
          RARITY_PRESENTATION[item.rarity].duration -
            RARITY_PRESENTATION[item.rarity].timings.EQUIP_CONFIRM -
            1,
        ),
      );
      expect(mocks.equipItem).not.toHaveBeenCalled();
      expect(rects).toHaveBeenCalledTimes(3);
      act(() => vi.advanceTimersByTime(1));
      expect(mocks.equipItem).toHaveBeenCalledExactlyOnceWith(item);
      expect(document.querySelector('[data-cinematic-icon]')).toBeNull();
      expect(document.querySelector('[data-equipment-impact]')).not.toBeNull();
      act(() =>
        vi.advanceTimersByTime(
          RARITY_PRESENTATION[item.rarity].timings.EQUIP_CONFIRM,
        ),
      );
      expect(document.querySelector('[data-equipment-impact]')).toBeNull();
      expect(container.querySelector('[data-overlay-slot]')).toBeNull();
      expect(screen.getByRole('status')).toHaveTextContent(
        'Camada corporal pendente',
      );
    },
  );

  it('reduced motion reveals approved full-canvas with no icon flight or impact', () => {
    stubMedia(true);
    const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
    mocks.definitions[sword.id] = fullCanvasFixture(sword.id);
    const { container } = render(<EquipmentScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    act(() => vi.advanceTimersByTime(560));
    expect(mocks.equipItem).toHaveBeenCalledExactlyOnceWith(sword);
    expect(document.querySelector('[data-cinematic-icon]')).toBeNull();
    expect(document.querySelector('[data-equipment-impact]')).toBeNull();
    expect(
      container.querySelector('[data-overlay-mode="full-canvas"]'),
    ).toHaveStyle({ inset: '0', width: '100%', height: '100%' });
  });

  it('fades out the previous full-canvas during a swap and preserves the base through reveal', () => {
    const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
    const rare = {
      ...sword,
      id: 'traveler-sword-rare',
      name: 'Espada alternativa',
    };
    mocks.traveler!.inventory.push(rare);
    mocks.traveler!.equipped.weapon = sword.id;
    mocks.definitions[sword.id] = fullCanvasFixture(sword.id);
    mocks.definitions[rare.id] = fullCanvasFixture(rare.id);
    const { container } = render(<EquipmentScreen />);
    const base = screen.getByRole('img', { name: 'Avatar do Viajante' });
    const oldLayer = container.querySelector<HTMLImageElement>(
      '[data-overlay-item="traveler-sword-common"]',
    )!;
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    expect(oldLayer.className).toContain('avatarEquipmentLeaving');
    expect(oldLayer.style.transform).toBe('');
    expect(oldLayer.style.inset).toBe('0px');
    expect(container.querySelectorAll('[data-overlay-slot]')).toHaveLength(1);
    act(() => vi.advanceTimersByTime(RARITY_PRESENTATION.comum.duration));
    expect(
      container.querySelector('[data-overlay-item="traveler-sword-common"]'),
    ).toBeNull();
    expect(container.querySelectorAll('[data-overlay-slot]')).toHaveLength(1);
    const newLayer = container.querySelector<HTMLImageElement>(
      '[data-overlay-item="traveler-sword-rare"]',
    )!;
    expect(newLayer.style.transform).toBe('');
    expect(newLayer.style.inset).toBe('0px');
    expect(newLayer.className).toContain('avatarEquipmentArrive');
    expect(screen.getByRole('img', { name: 'Avatar do Viajante' })).toBe(base);
    act(() => vi.advanceTimersByTime(600));
    expect(newLayer.className).not.toContain('avatarEquipmentArrive');
  });

  it('cleans up a flight and pending equip on unmount', () => {
    const { unmount } = render(<EquipmentScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    expect(document.querySelector('[data-cinematic-icon]')).not.toBeNull();
    unmount();
    act(() => vi.advanceTimersByTime(1000));
    expect(document.querySelector('[data-cinematic-icon]')).toBeNull();
    expect(mocks.equipItem).not.toHaveBeenCalled();
  });

  it('reduced motion swaps with a short fade-out and no flight', () => {
    stubMedia(true);
    const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
    const rare = { ...sword, id: 'traveler-sword-rare' };
    mocks.traveler!.inventory.push(rare);
    mocks.traveler!.equipped.weapon = sword.id;
    mocks.definitions[sword.id] = fullCanvasFixture(sword.id);
    mocks.definitions[rare.id] = fullCanvasFixture(rare.id);
    const { container } = render(<EquipmentScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    expect(
      container.querySelector('[data-overlay-item="traveler-sword-common"]')!
        .className,
    ).toContain('avatarEquipmentLeaving');
    expect(document.querySelector('[data-equipment-flight]')).toBeNull();
    expect(mocks.equipItem).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(560));
    expect(
      container.querySelector('[data-overlay-item="traveler-sword-common"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-overlay-item="traveler-sword-rare"]'),
    ).toHaveStyle({ inset: '0', width: '100%', height: '100%' });
  });

  it('clears the transient effect and reports failure when the item can no longer be equipped', () => {
    mocks.equipItem.mockReturnValue(false);
    render(<EquipmentScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    act(() => vi.advanceTimersByTime(RARITY_PRESENTATION.comum.duration));
    expect(document.querySelector('[data-cinematic-icon]')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Equipamento não encontrado',
    );
    expect(screen.getByRole('button', { name: 'Equipar' })).not.toBeDisabled();
  });
  it.each(['male', 'female'] as const)(
    'omits unavailable art on the %s body while keeping the base image',
    (body) => {
      for (const item of EQUIPMENT_CATALOG)
        mocks.definitions[item.id] = {
          ...overlayFixture(item.id, item.slot),
          visualQuality: 'NEEDS_NEW_OVERLAY',
        };
      mocks.traveler!.avatar.gender = body;
      mocks.traveler!.equipped = Object.fromEntries(
        EQUIPMENT_CATALOG.map((item) => [item.slot, item.id]),
      );
      const { container } = render(
        <EquippedAvatar traveler={mocks.traveler!} />,
      );
      expect(container.querySelectorAll('[data-overlay-slot]')).toHaveLength(0);
      expect(
        screen.getByRole('img', { name: 'Avatar do Viajante' }),
      ).toHaveAttribute('src', expect.stringContaining(`/hd/${body}/`));
    },
  );

  it('renders approved art, swaps and unequips only the affected layer without replacing the base node', () => {
    const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
    const second = { ...sword, id: 'traveler-sword-rare' };
    mocks.definitions[sword.id] = overlayFixture(sword.id);
    mocks.definitions[second.id] = overlayFixture(second.id);
    const initial = {
      ...mocks.traveler!,
      inventory: [...mocks.traveler!.inventory, second],
      equipped: { weapon: sword.id },
    };
    const { container, rerender } = render(
      <EquippedAvatar traveler={initial} />,
    );
    const base = screen.getByRole('img', { name: 'Avatar do Viajante' });
    const layer = container.querySelector('[data-overlay-slot="weapon"]')!;
    expect(layer).toHaveAttribute(
      'src',
      '/assets/equipment/overlays/traveler-sword-common_male.webp',
    );
    expect(layer).toHaveAttribute('data-overlay-anchor', 'rightHand');
    expect(layer).toHaveStyle({
      transformOrigin: '25% 75%',
      transform: 'rotate(15deg)',
    });
    rerender(
      <EquippedAvatar
        traveler={{ ...initial, equipped: { weapon: second.id } }}
      />,
    );
    expect(
      container.querySelectorAll('[data-overlay-slot="weapon"]'),
    ).toHaveLength(1);
    expect(
      container.querySelector('[data-overlay-item="traveler-sword-common"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-overlay-item="traveler-sword-rare"]'),
    ).not.toBeNull();
    expect(screen.getByRole('img', { name: 'Avatar do Viajante' })).toBe(base);
    rerender(<EquippedAvatar traveler={{ ...initial, equipped: {} }} />);
    expect(container.querySelector('[data-overlay-slot]')).toBeNull();
    expect(screen.getByRole('img', { name: 'Avatar do Viajante' })).toBe(base);
  });

  it('reduced motion shows a brief reward for missing armor and keeps its icon only in UI', () => {
    stubMedia(true);
    const pendingArmor = EQUIPMENT_CATALOG.find(
      (item) => item.slot === 'armor',
    )!;
    mocks.definitions[pendingArmor.id] = {
      ...overlayFixture(pendingArmor.id, pendingArmor.slot),
      visualQuality: 'NEEDS_NEW_OVERLAY',
    };
    const { container } = render(<EquipmentScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Armadura' }));
    const armor = EQUIPMENT_CATALOG.find((item) => item.slot === 'armor')!;
    const before = calculateTotalAttributes(mocks.traveler!);
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    act(() => vi.advanceTimersByTime(560));
    expect(mocks.equipItem).toHaveBeenCalledWith(armor);
    expect(container.querySelector('[data-cinematic-icon]')).toBeNull();
    expect(container.querySelector('[data-overlay-slot="armor"]')).toBeNull();
    expect(container.querySelector('article img')).toHaveAttribute(
      'src',
      expect.stringContaining('armor_rare_icon.png'),
    );
    expect(
      container.querySelector('[data-visual-quality="NEEDS_NEW_OVERLAY"]'),
    ).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Camada corporal pendente',
    );
    expect(screen.getByRole('status')).not.toHaveTextContent('Agora aparece');
    expect(calculateTotalAttributes(mocks.traveler!).equipment.defense).toBe(
      before.equipment.defense + 1,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Desequipar' }));
    act(() => vi.advanceTimersByTime(180));
    expect(mocks.unequipSlot).toHaveBeenCalledWith('armor');
    expect(calculateTotalAttributes(mocks.traveler!)).toEqual(before);
  });

  it('flies only the icon then reveals full-canvas art in place at 100%', () => {
    const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
    mocks.definitions[sword.id] = fullCanvasFixture(sword.id);
    const { container } = render(<EquipmentScreen />);
    const base = screen.getByRole('img', { name: 'Avatar do Viajante' });
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    const flight = document.querySelector('[data-cinematic-icon]')!;
    expect(flight).toHaveAttribute('src', equipmentIcons.weapon);
    expect(mocks.equipItem).not.toHaveBeenCalled();
    expect(container.querySelector('[data-overlay-slot]')).toBeNull();
    act(() => vi.advanceTimersByTime(RARITY_PRESENTATION.comum.duration));
    expect(mocks.equipItem).toHaveBeenCalledWith(sword);
    expect(container.querySelector('[data-cinematic-icon]')).toBeNull();
    const layer = container.querySelector<HTMLImageElement>(
      '[data-overlay-slot="weapon"]',
    )!;
    expect(layer).toHaveAttribute('data-overlay-mode', 'full-canvas');
    expect(layer).toHaveStyle({
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: '6',
    });
    expect(layer.style.left).toBe('');
    expect(layer.style.top).toBe('');
    expect(layer.style.transform).toBe('');
    expect(layer.style.transformOrigin).toBe('');
    expect(layer.className).toContain('avatarEquipmentArrive');
    expect(screen.getByRole('img', { name: 'Avatar do Viajante' })).toBe(base);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Agora aparece no Avatar',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Desequipar' }));
    act(() => vi.advanceTimersByTime(180));
    expect(container.querySelector('[data-overlay-slot]')).toBeNull();
    expect(screen.getByRole('img', { name: 'Avatar do Viajante' })).toBe(base);
  });

  it('flies a temporary UI icon for legacy art too, then resolves the body layer independently', () => {
    const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
    mocks.definitions[sword.id] = overlayFixture(sword.id);
    const { container } = render(<EquipmentScreen />);
    const base = screen.getByRole('img', { name: 'Avatar do Viajante' });
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    const flight = document.querySelector('[data-cinematic-icon]')!;
    expect(flight).toHaveAttribute('src', equipmentIcons.weapon);
    expect(flight.closest('[data-body-type]')).toBeNull();
    expect(mocks.equipItem).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(RARITY_PRESENTATION.comum.duration));
    expect(mocks.equipItem).toHaveBeenCalledWith(sword);
    expect(container.querySelector('[data-cinematic-icon]')).toBeNull();
    expect(
      container.querySelector('[data-overlay-slot="weapon"]'),
    ).toHaveAttribute(
      'src',
      '/assets/equipment/overlays/traveler-sword-common_male.webp',
    );
    expect(screen.getByRole('img', { name: 'Avatar do Viajante' })).toBe(base);
  });
});
