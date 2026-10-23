// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { AudioManager } from './audio/audio-manager';

let manager: AudioManager | undefined;
afterEach(() => {
  manager?.dispose();
  manager = undefined;
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

test('returning to a failed music context silences the previous route instead of leaking its ambience', async () => {
  vi.useFakeTimers();
  const create = vi.fn((src: string) => ({
    src,
    volume: 0,
    loop: false,
    currentTime: 0,
    preload: 'none' as HTMLAudioElement['preload'],
    play: vi.fn(() =>
      src.includes('failed')
        ? Promise.reject(new Error('fixture missing media'))
        : Promise.resolve(),
    ),
    pause: vi.fn(),
  }));
  const asset = (name: string) => ({
    src: `/assets/audio/006-${name}.ogg`,
    license: 'TEST ONLY FakeMedia, no real asset',
  });
  manager = new AudioManager(
    { music: { menu: asset('failed'), garden: asset('garden') }, effects: {} },
    create,
  );
  manager.setContext('menu');
  manager.updatePreferences({ music: true });
  manager.unlock();
  await vi.advanceTimersByTimeAsync(700);
  manager.setContext('garden');
  await vi.advanceTimersByTimeAsync(700);
  const garden = create.mock.results[1].value;
  expect(garden.volume).toBeGreaterThan(0);
  garden.pause.mockClear();
  manager.setContext('menu');
  await vi.advanceTimersByTimeAsync(700);
  expect(garden.pause).toHaveBeenCalled();
  expect(garden.volume).toBe(0);
  // Failed sources remain suppressed; no loop of network/play attempts.
  expect(create).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});
