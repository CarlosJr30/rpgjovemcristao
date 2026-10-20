// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { gameAudio } from './audio/audio-manager';
import { useGameAudio } from './hooks/use-game-audio';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test('troca de Shell preserva reprodução; saída definitiva suspende e limpa', () => {
  vi.useFakeTimers();
  const suspend = vi.spyOn(gameAudio, 'suspend');
  const context = vi.spyOn(gameAudio, 'setContext');
  const first = renderHook(() => useGameAudio('/journey'));
  first.unmount();
  const next = renderHook(({ route, step }) => useGameAudio(route, step), {
    initialProps: { route: '/journey/arena', step: '' },
  });
  act(() => vi.runOnlyPendingTimers());
  expect(suspend).not.toHaveBeenCalled();
  for (const [route, step, expected] of [
    ['/journey/guild', '', 'guild'],
    ['/journey/phases/garden', '', 'exploration'],
    ['/journey/phases/garden', 'snake', 'snake'],
    ['/journey/phases/garden', 'reflection', 'devotional'],
    ['/journey/phases/garden', 'quiz', 'quiz'],
    ['/', '', 'menu'],
  ]) {
    next.rerender({ route, step });
    expect(context).toHaveBeenLastCalledWith(expected);
  }
  next.unmount();
  act(() => vi.runOnlyPendingTimers());
  expect(suspend).toHaveBeenCalledOnce();
  document.dispatchEvent(new Event('visibilitychange'));
  expect(suspend).toHaveBeenCalledOnce();
});

test('browser connection changes apply data saving and listener is removed on exit', () => {
  const connection = Object.assign(new EventTarget(), { saveData: true });
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: connection,
  });
  const save = vi.spyOn(gameAudio, 'setSaveData');
  const view = renderHook(() => useGameAudio('/journey'));
  expect(save).toHaveBeenLastCalledWith(true);
  act(() => {
    connection.saveData = false;
    connection.dispatchEvent(new Event('change'));
  });
  expect(save).toHaveBeenLastCalledWith(false);
  view.unmount();
  save.mockClear();
  connection.dispatchEvent(new Event('change'));
  expect(save).not.toHaveBeenCalled();
  Reflect.deleteProperty(navigator, 'connection');
});
