// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateCombatPower } from '@rpg/game-engine';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Equipment,
} from './domain/traveler';
import { EQUIPMENT_CATALOG } from './data/equipmentCatalog';
import {
  CINEMATIC_STAGES,
  RARITY_PRESENTATION,
  cinematicGeometry,
  equipmentReward,
} from './data/equipmentCinematic';
import { useEquipmentCinematic } from './hooks/use-equipment-cinematic';
import { EquipmentEquipCinematic } from './components/equipment-equip-cinematic';
const sword = EQUIPMENT_CATALOG.find((item) => item.slot === 'weapon')!;
function reward(item: Equipment = sword) {
  const traveler = createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    'lia',
    '2026-10-02T00:00:00Z',
  );
  traveler.equipped = {};
  traveler.inventory = [sword, item];
  return equipmentReward(traveler, item);
}
const geometry = cinematicGeometry(null, null, 'female', 'weapon', {
  width: 390,
  height: 844,
});
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe('Cinematic equipment presentation', () => {
  it.each([
    ['comum', 1550, 1650],
    ['incomum', 1750, 1850],
    ['raro', 1950, 2050],
    ['épico', 2150, 2250],
    ['lendário', 2350, 2450],
  ] as const)(
    '%s completes every stage in its range and commits exactly once',
    (rarity, min, max) => {
      const config = RARITY_PRESENTATION[rarity];
      expect(config.duration).toBeGreaterThanOrEqual(min);
      expect(config.duration).toBeLessThanOrEqual(max);
      const confirm = vi.fn(() => true),
        captureTarget = vi.fn(() => geometry),
        onStage = vi.fn();
      const { result } = renderHook(useEquipmentCinematic);
      act(() => {
        result.current.start({
          reward: reward({ ...sword, rarity }),
          geometry,
          reducedMotion: false,
          confirm,
          captureTarget,
          onStage,
        });
      });
      for (const stage of CINEMATIC_STAGES.slice(0, -1)) {
        expect(result.current.session?.stage).toBe(stage);
        act(() =>
          vi.advanceTimersByTime(
            config.timings[stage as keyof typeof config.timings],
          ),
        );
      }
      expect(result.current.session?.stage).toBe('DONE');
      expect(result.current.busy).toBe(false);
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(captureTarget).toHaveBeenCalledTimes(1);
      expect(onStage.mock.calls.flat()).toEqual(CINEMATIC_STAGES);
      act(() => result.current.skip());
      expect(confirm).toHaveBeenCalledTimes(1);
      act(() => vi.advanceTimersByTime(600));
      expect(result.current.session).toBeNull();
    },
  );
  it('derives real combat power from attributes, item power and existing effects', () => {
    const result = reward();
    const baseline = calculateCombatPower({
      level: 1,
      attributes: { life: 1, strength: 1, defense: 1, wisdom: 1 },
      equipment: [],
    });
    const equipped = calculateCombatPower({
      level: 1,
      attributes: { life: 1, strength: 3, defense: 1, wisdom: 1 },
      equipment: [
        { id: sword.id, name: sword.name, power: 1, effectIds: ['path-sword'] },
      ],
    });
    expect(result.beforePower).toBe(baseline);
    expect(result.afterPower).toBe(equipped);
    expect(result.powerDelta).toBe(36);
    expect(result.delta.strength).toBe(2);
  });
  it('shows negative and zero swap deltas rather than summing the new item', () => {
    const traveler = createTraveler(
      'Lia',
      DEFAULT_APPEARANCE,
      'lia',
      '2026-10-02T00:00:00Z',
    );
    const previous = {
      ...sword,
      id: 'owned-old',
      power: 5,
      stats: { strength: 6 },
    };
    const replacement = {
      ...sword,
      id: 'owned-new',
      power: 1,
      stats: { strength: 2 },
    };
    traveler.inventory = [previous, replacement];
    traveler.equipped = { weapon: previous.id };
    const result = equipmentReward(traveler, replacement);
    expect(result.previous).toBe(previous);
    expect(result.delta.strength).toBe(-4);
    expect(result.powerDelta).toBe(-72);
    expect(equipmentReward(traveler, previous).powerDelta).toBe(0);
  });
  it('uses labeled rarity and signed stats; Escape and touch conclude and restore focus', () => {
    const old = document.createElement('button');
    document.body.append(old);
    old.focus();
    const onSkip = vi.fn();
    const result = reward({ ...sword, rarity: 'lendário' });
    const { rerender } = render(
      <EquipmentEquipCinematic
        session={{
          id: 1,
          stage: 'REWARD_REVEAL',
          reward: result,
          geometry,
          reducedMotion: false,
        }}
        onSkip={onSkip}
      />,
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('Extraordinário');
    expect(screen.getByRole('dialog')).toHaveTextContent('+2 Força');
    expect(screen.getByRole('dialog')).toHaveTextContent('+36 PODER');
    expect(screen.getByRole('button', { name: /Concluir/ })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onSkip).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onSkip).toHaveBeenCalledTimes(2);
    rerender(<EquipmentEquipCinematic session={null} onSkip={onSkip} />);
    expect(old).toHaveFocus();
    old.remove();
  });
  it.each([
    'PREPARE',
    'FOCUS',
    'REWARD_REVEAL',
    'FLY_TO_TARGET',
    'EQUIP_CONFIRM',
  ] as const)(
    'skips from %s once, clears timers and allows another session',
    (stage) => {
      const confirm = vi.fn(() => true);
      const { result } = renderHook(useEquipmentCinematic);
      act(() => {
        result.current.start({
          reward: reward(),
          geometry,
          reducedMotion: false,
          captureTarget: () => geometry,
          confirm,
        });
      });
      for (const earlier of CINEMATIC_STAGES.slice(
        0,
        CINEMATIC_STAGES.indexOf(stage),
      ))
        act(() =>
          vi.advanceTimersByTime(
            RARITY_PRESENTATION.comum.timings[
              earlier as keyof typeof RARITY_PRESENTATION.comum.timings
            ],
          ),
        );
      act(() => {
        result.current.skip();
        result.current.skip();
      });
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(result.current.busy).toBe(false);
      const another = { ...geometry, centerX: 720 };
      act(() => {
        result.current.start({
          reward: reward(),
          geometry: another,
          reducedMotion: false,
          captureTarget: () => another,
          confirm,
        });
      });
      expect(result.current.session?.geometry.centerX).toBe(720);
      act(() =>
        vi.advanceTimersByTime(RARITY_PRESENTATION.comum.duration + 600),
      );
      expect(confirm).toHaveBeenCalledTimes(2);
      expect(result.current.session).toBeNull();
    },
  );
  it('reduced motion retains the reward without target capture or flight effects', () => {
    const confirm = vi.fn(() => true),
      captureTarget = vi.fn(() => geometry);
    const { result } = renderHook(useEquipmentCinematic);
    act(() => {
      result.current.start({
        reward: reward(),
        geometry,
        reducedMotion: true,
        captureTarget,
        confirm,
      });
    });
    act(() => vi.advanceTimersByTime(120));
    expect(result.current.session?.stage).toBe('REWARD_REVEAL');
    render(
      <EquipmentEquipCinematic
        session={result.current.session}
        onSkip={() => result.current.skip()}
      />,
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(sword.name);
    expect(document.querySelector('[data-equipment-flight]')).toBeNull();
    expect(document.querySelector('[data-equipment-impact]')).toBeNull();
    act(() => vi.advanceTimersByTime(440));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(captureTarget).not.toHaveBeenCalled();
  });
  it('cancels on unmount and clears failed confirmations without a false DONE', () => {
    const confirm = vi.fn(() => false);
    const first = renderHook(useEquipmentCinematic);
    act(() => {
      first.result.current.start({
        reward: reward(),
        geometry,
        reducedMotion: false,
        captureTarget: () => geometry,
        confirm,
      });
    });
    first.unmount();
    act(() => vi.advanceTimersByTime(2000));
    expect(confirm).not.toHaveBeenCalled();
    const second = renderHook(useEquipmentCinematic);
    act(() => {
      second.result.current.start({
        reward: reward(),
        geometry,
        reducedMotion: false,
        captureTarget: () => geometry,
        confirm,
      });
    });
    act(() => vi.advanceTimersByTime(2000));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(second.result.current.session).toBeNull();
    expect(second.result.current.busy).toBe(false);
  });
  it.each([390, 412, 768, 1440, 1920])(
    'keeps source and semantic endpoints within %s viewport',
    (width) => {
      const g = cinematicGeometry(
        { x: -500, y: 2000, width: 80, height: 80 },
        { x: -100, y: -500, width: 240, height: 360 },
        'female',
        'boots',
        { width, height: 844 },
      );
      expect(g.centerX).toBe(width / 2);
      expect(g.targetX).toBeGreaterThanOrEqual(20);
      expect(g.targetY).toBeGreaterThanOrEqual(20);
      expect(g.centerX + g.sourceDx).toBeGreaterThanOrEqual(20);
      expect(g.centerY + g.sourceDy).toBeLessThanOrEqual(824);
      expect(g.centerY + g.midDy).toBeGreaterThanOrEqual(20);
    },
  );
});
