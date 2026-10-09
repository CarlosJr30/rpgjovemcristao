// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useGuildClock } from './hooks/use-guild-clock';
import { missionIsPlayable } from './data/guildPlayerVisibility';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
test('início/prazo são reavaliados sem reload e timers limpos ao sair', () => {
  vi.useFakeTimers();
  const time = Date.parse('2026-10-05T00:00:00Z');
  vi.setSystemTime(time);
  const mission = {
    status: 'published',
    starts_at: new Date(time + 1000).toISOString(),
    due_at: new Date(time + 2000).toISOString(),
  };
  const { result, unmount } = renderHook(() =>
    useGuildClock([time + 1000, time + 2000]),
  );
  expect(missionIsPlayable(mission, result.current)).toBe(false);
  act(() => vi.advanceTimersByTime(1001));
  expect(missionIsPlayable(mission, result.current)).toBe(true);
  act(() => vi.advanceTimersByTime(1000));
  expect(missionIsPlayable(mission, result.current)).toBe(false);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
