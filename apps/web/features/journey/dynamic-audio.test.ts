// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  AudioManager,
  routeMusicContext,
  validateAudioPreferences,
} from './audio/audio-manager';
import {
  MUSIC_SLOTS,
  MUSIC_REFERENCES,
  CHEST_RARITY_SOUNDS,
  AUDIO_WORLD_IDS,
} from './audio/audio-catalog';
import { WORLDS } from '../story/catalog';
import type { MusicContext } from './audio/audio-assets';
const managers: AudioManager[] = [];
const asset = (name: string) => ({
  src: `/assets/audio/synthetic-${name}.ogg`,
  license: 'TEST ONLY: FakeMedia; no file or production approval',
});
const media = (src: string) => ({
  src,
  volume: 0,
  loop: false,
  currentTime: 0,
  preload: '' as HTMLAudioElement['preload'],
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
});
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  managers.forEach((m) => m.dispose());
  managers.length = 0;
  vi.useRealTimers();
  vi.restoreAllMocks();
});
function setup(factory = vi.fn(media)) {
  const music = Object.fromEntries(
    [
      'journey',
      'menu',
      'arena',
      'tower',
      'boss',
      'guild',
      'devotional',
      'reward',
    ].map((k) => [k, asset(k)]),
  );
  const m = new AudioManager(
    {
      music,
      effects: { attack: asset('attack'), chest_rare: asset('chest-rare') },
    },
    factory,
  );
  managers.push(m);
  return { m, factory };
}
async function advance() {
  await vi.advanceTimersByTimeAsync(700);
}
test('pending slots contain no playable paths or approval; future worlds match story IDs', () => {
  expect(MUSIC_SLOTS).toHaveLength(20);
  expect(AUDIO_WORLD_IDS).toEqual(WORLDS.map((w) => w.id));
  for (const slot of MUSIC_SLOTS) {
    expect(slot.approval).toBe('pending');
    expect(slot.path).toBeNull();
    expect(slot.rights).toBeNull();
  }
  expect(
    MUSIC_REFERENCES.every((r) => r.approval === 'pending' && r.path === null),
  ).toBe(true);
  expect(new Set(Object.values(CHEST_RARITY_SOUNDS)).size).toBe(5);
});
test('specific route identities preserve tower/boss isolation and do not accept arbitrary worlds', () => {
  expect(routeMusicContext('/journey/arena/tower')).toBe('tower');
  expect(routeMusicContext('/journey/guild/ebd')).toBe('ebd');
  expect(routeMusicContext('/journey/worlds/jesus')).toBe('world:jesus');
  expect(routeMusicContext('/journey/worlds/arbitrary')).toBe('journey');
  expect(routeMusicContext('/journey/phases/o-jardim-e-a-escolha')).toBe(
    'garden',
  );
  expect(
    routeMusicContext('/journey/phases/o-jardim-e-a-escolha', 'reading'),
  ).toBe('devotional');
});
test('master volume composes with independent gains, mute separated, and preferences survive hydration', async () => {
  const { m, factory } = setup();
  m.updatePreferences({
    music: true,
    effects: true,
    masterVolume: 0.5,
    musicVolume: 0.4,
    effectsVolume: 0.6,
  });
  m.unlock();
  await advance();
  expect(factory.mock.results[0].value.volume).toBeCloseTo(0.2);
  m.playEffect('attack', 0.8);
  expect(factory.mock.results[1].value.volume).toBeCloseTo(0.24);
  m.updatePreferences({ effects: false });
  expect(factory.mock.results[1].value.pause).toHaveBeenCalled();
  expect(factory.mock.results[0].value.play).toHaveBeenCalledOnce();
  const second = setup().m;
  second.hydrate();
  expect(second.getSnapshot()).toEqual(m.getSnapshot());
  expect(validateAudioPreferences({ masterVolume: 4 })).toMatchObject({
    masterVolume: 1,
    studyMusic: false,
  });
});
test('study is silent by default and only deliberate opt-in permits quiet contexts', async () => {
  const { m, factory } = setup();
  m.setContext('guild');
  m.updatePreferences({ music: true });
  m.unlock();
  await advance();
  expect(factory).not.toHaveBeenCalled();
  m.updatePreferences({ studyMusic: true });
  await advance();
  expect(factory).toHaveBeenCalledOnce();
  m.updatePreferences({ studyMusic: false });
  expect(factory.mock.results[0].value.pause).toHaveBeenCalled();
});
test('nested video holds resume same position only after last hold; hidden tab remains suspended', async () => {
  const { m, factory } = setup();
  m.updatePreferences({ music: true });
  m.unlock();
  await advance();
  const track = factory.mock.results[0].value;
  track.currentTime = 17;
  const a = m.holdMusic(),
    b = m.holdMusic();
  a();
  m.resume();
  expect(track.play).toHaveBeenCalledOnce();
  m.suspend();
  b();
  expect(track.play).toHaveBeenCalledOnce();
  m.resume();
  await advance();
  expect(track.play).toHaveBeenCalledTimes(2);
  expect(track.currentTime).toBe(17);
});
test('route changes while hidden or held never resume the stale track', async () => {
  const { m, factory } = setup();
  m.updatePreferences({ music: true });
  m.unlock();
  await advance();
  const first = factory.mock.results[0].value;
  m.suspend();
  const release = m.holdMusic();
  m.setContext('boss');
  m.resume();
  expect(factory).toHaveBeenCalledOnce();
  release();
  await advance();
  expect(factory).toHaveBeenCalledTimes(2);
  expect(first.play).toHaveBeenCalledOnce();
  expect(factory.mock.results[1].value.src).toContain('boss');
});
test('late play resolution after video hold, mute or dispose is paused without returning sound', async () => {
  for (const action of ['hold', 'mute', 'dispose'] as const) {
    let resolve = () => {};
    const factory = vi.fn((src: string) => ({
      ...media(src),
      play: vi.fn(
        () =>
          new Promise<void>((r) => {
            resolve = r;
          }),
      ),
    }));
    const { m } = setup(factory);
    m.updatePreferences({ music: true });
    m.unlock();
    if (action === 'hold') m.holdMusic();
    else if (action === 'mute') m.updatePreferences({ muted: true });
    else m.dispose();
    resolve();
    await advance();
    expect(factory.mock.results[0].value.pause).toHaveBeenCalled();
    expect(factory.mock.results[0].value.volume).toBe(0);
  }
});
test('scene leases restore latest route, boss does not select Arena prototype, and gain changes do not restart', async () => {
  const { m, factory } = setup();
  m.updatePreferences({ music: true });
  m.unlock();
  await advance();
  const release = m.scene('tower', 0.7);
  await advance();
  const tower = factory.mock.results[1].value;
  m.setContext('menu');
  await advance();
  expect(tower.play).toHaveBeenCalledOnce();
  release();
  await advance();
  expect(factory.mock.results.at(-1)!.value.src).toContain('menu');
  const boss = m.scene('boss');
  await advance();
  expect(factory.mock.results.at(-1)!.value.src).toContain('boss');
  boss();
});

test('rejection from an old resumed track cannot pause the new context', async () => {
  const { m, factory } = setup();
  m.updatePreferences({ music: true });
  m.unlock();
  await advance();
  let reject: (error: Error) => void = () => {};
  factory.mock.results[0].value.play.mockImplementationOnce(
    () =>
      new Promise<void>((_resolve, fail) => {
        reject = fail;
      }),
  );
  m.suspend();
  m.resume();
  m.setContext('boss');
  await advance();
  const boss = factory.mock.results[1].value;
  reject(
    Object.assign(new Error('old request aborted'), { name: 'AbortError' }),
  );
  await advance();
  expect(boss.pause).not.toHaveBeenCalled();
  expect(boss.volume).toBeGreaterThan(0);
});
test('bounded cache reuses music after revisits, loop respects one-shot, dispose clears resources', async () => {
  const { m, factory } = setup();
  m.updatePreferences({ music: true });
  m.unlock();
  await advance();
  m.setContext('arena');
  await advance();
  m.setContext('journey');
  await advance();
  expect(factory).toHaveBeenCalledTimes(2);
  for (const c of ['tower', 'boss', 'menu', 'reward'] as MusicContext[]) {
    m.setContext(c);
    await advance();
  }
  expect(factory.mock.results.at(-1)!.value.loop).toBe(false);
  expect(factory.mock.results.filter((r) => r.value.src !== '')).toHaveLength(
    4,
  );
  m.dispose();
  expect(vi.getTimerCount()).toBe(0);
  expect(factory.mock.results.every((r) => r.value.src === '')).toBe(true);
});
test('save-data suppresses music and effects on demand without downloads, restoring existing preference when released', async () => {
  const { m, factory } = setup();
  m.setSaveData(true);
  m.updatePreferences({ music: true, effects: true });
  m.unlock();
  m.playEffect('attack');
  expect(factory).not.toHaveBeenCalled();
  m.setSaveData(false);
  await advance();
  expect(factory).toHaveBeenCalledOnce();
  m.setSaveData(true);
  expect(factory.mock.results[0].value.pause).toHaveBeenCalled();
});
test('missing files and factory errors remain silent and same-context UI does not repeatedly fetch', async () => {
  const factory = vi.fn((src: string) => ({
    ...media(src),
    play: vi.fn().mockRejectedValue(new Error('missing')),
  }));
  const { m } = setup(factory);
  m.updatePreferences({ music: true });
  m.unlock();
  await advance();
  m.setContext('journey');
  m.updatePreferences({ musicVolume: 0.3 });
  await advance();
  expect(factory).toHaveBeenCalledOnce();
  const broken = setup(
    vi.fn(() => {
      throw new Error('media unavailable');
    }),
  ).m;
  expect(() => {
    broken.updatePreferences({ music: true, effects: true });
    broken.unlock();
    broken.playEffect('attack');
  }).not.toThrow();
});
