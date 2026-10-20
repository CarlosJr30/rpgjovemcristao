// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  AUDIO_PREFERENCES_KEY,
  AudioManager,
  DEFAULT_AUDIO_PREFERENCES,
  routeMusicContext,
  validateAudioPreferences,
} from './audio/audio-manager';

const asset = (name: string) => ({
  src: `/assets/audio/${name}.ogg`,
  license: 'Synthetic test fixture; not a runtime asset',
});
const makeMedia = (src: string) => ({
  src,
  volume: 0,
  loop: false,
  currentTime: 0,
  preload: '' as HTMLAudioElement['preload'],
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
});
const managers: AudioManager[] = [];
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  managers.forEach((manager) => manager.dispose());
  managers.length = 0;
  vi.useRealTimers();
});
function setup() {
  const factory = vi.fn(makeMedia);
  const manager = new AudioManager(
    {
      music: {
        journey: asset('journey'),
        arena: asset('arena'),
        guild: asset('guild'),
      },
      effects: { ui: asset('ui'), reward: asset('reward') },
    },
    factory,
  );
  managers.push(manager);
  return { manager, factory };
}

test('saída da Arena invalida fallback de SFX cujo play ainda está pendente', async () => {
  let reject: (error: Error) => void = () => undefined;
  const factory = vi.fn((src: string) => ({
    ...makeMedia(src),
    play: vi.fn(
      () =>
        new Promise<void>((_, fail) => {
          reject = fail;
        }),
    ),
  }));
  const manager = new AudioManager(
    {
      music: {},
      effects: {
        attack: { ...asset('attack'), fallbackSrc: '/assets/audio/attack.mp3' },
      },
    },
    factory,
  );
  managers.push(manager);
  manager.setContext('arena');
  manager.updatePreferences({ effects: true });
  manager.unlock();
  manager.playEffect('attack');
  const media = factory.mock.results[0].value;
  manager.setContext('journey');
  reject(new DOMException('Unsupported', 'NotSupportedError'));
  await vi.advanceTimersByTimeAsync(0);
  expect(media.pause).toHaveBeenCalled();
  expect(media.play).toHaveBeenCalledOnce();
  expect(media.src).toBe('/assets/audio/attack.ogg');
});

test('mix Arena é relativo ao slider, crossfade preserva outros contextos e saída interrompe SFX', async () => {
  const { manager, factory } = setup();
  manager.updatePreferences({ music: true, effects: true, studyMusic: true });
  manager.unlock();
  await vi.advanceTimersByTimeAsync(700);
  expect(factory.mock.results[0].value.volume).toBeCloseTo(0.45);
  manager.setContext('arena');
  await vi.advanceTimersByTimeAsync(700);
  expect(factory.mock.results[0].value.pause).toHaveBeenCalled();
  expect(factory.mock.results[1].value.volume).toBeCloseTo(0.315);
  manager.playEffect('reward', 0.8);
  const effect = factory.mock.results[2].value;
  expect(effect.volume).toBeCloseTo(0.52);
  manager.updatePreferences({ effectsVolume: 0.5 });
  expect(effect.volume).toBeCloseTo(0.4);
  manager.setContext('guild');
  expect(effect.pause).toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(700);
  expect(factory.mock.results[3].value.volume).toBeCloseTo(0.45);
});

test('ganho inválido é silencioso, mute e pool sobrevivem a stress de efeitos', async () => {
  const factory = vi.fn(makeMedia);
  const effects = Object.fromEntries(
    [
      'attack',
      'defense',
      'focus',
      'dodge',
      'player_hit',
      'victory',
      'defeat',
    ].map((name) => [name, asset(name)]),
  );
  const manager = new AudioManager({ music: {}, effects }, factory);
  managers.push(manager);
  manager.updatePreferences({ effects: true });
  manager.unlock();
  for (let index = 0; index < 40; index++) {
    for (const effect of [
      'attack',
      'defense',
      'focus',
      'dodge',
      'player_hit',
      'victory',
      'defeat',
    ] as const)
      manager.playEffect(effect, 0.8);
  }
  const alive = factory.mock.results.filter(
    (result) => result.value.pause.mock.calls.length === 0,
  );
  expect(alive).toHaveLength(4);
  manager.playEffect('defeat', NaN);
  expect(factory.mock.results.at(-1)!.value.volume).toBe(0);
  manager.updatePreferences({ muted: true });
  expect(
    alive.every((result) => result.value.pause.mock.calls.length > 0),
  ).toBe(true);
  manager.dispose();
  await vi.advanceTimersByTimeAsync(0);
  expect(vi.getTimerCount()).toBe(0);
});

test('resume sem suspensão preserva música/volume; suspensão verdadeira retoma', async () => {
  const { manager, factory } = setup();
  manager.updatePreferences({ music: true });
  manager.unlock();
  await vi.advanceTimersByTimeAsync(700);
  const media = factory.mock.results[0].value;
  manager.resume();
  expect(media.volume).toBeCloseTo(0.45);
  expect(media.play).toHaveBeenCalledOnce();
  manager.suspend();
  manager.resume();
  await vi.advanceTimersByTimeAsync(700);
  expect(media.play).toHaveBeenCalledTimes(2);
  expect(media.volume).toBeCloseTo(0.45);
});

test('fallback MP3 validado trata OGG incompatível e erro síncrono sem crash', async () => {
  const factory = vi.fn((src: string) => ({
    ...makeMedia(src),
    play: vi
      .fn()
      .mockImplementationOnce(() => {
        throw new DOMException('Unsupported', 'NotSupportedError');
      })
      .mockResolvedValue(undefined),
  }));
  const manager = new AudioManager(
    {
      music: {
        journey: {
          ...asset('journey'),
          fallbackSrc: '/assets/audio/journey.mp3',
        },
      },
      effects: {},
    },
    factory,
  );
  managers.push(manager);
  manager.updatePreferences({ music: true });
  expect(() => manager.unlock()).not.toThrow();
  await vi.advanceTimersByTimeAsync(700);
  expect(factory.mock.results[0].value.src).toBe('/assets/audio/journey.mp3');
  expect(factory.mock.results[0].value.volume).toBeCloseTo(0.45);
});

test('não tenta fallback após bloqueio autoplay, mute ou saída', async () => {
  const factory = vi.fn((src: string) => ({
    ...makeMedia(src),
    play: vi
      .fn()
      .mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
  }));
  const manager = new AudioManager(
    {
      music: {
        journey: {
          ...asset('journey'),
          fallbackSrc: '/assets/audio/journey.mp3',
        },
      },
      effects: {},
    },
    factory,
  );
  managers.push(manager);
  manager.updatePreferences({ music: true });
  manager.unlock();
  await vi.advanceTimersByTimeAsync(0);
  expect(factory.mock.results[0].value.play).toHaveBeenCalledOnce();
  const delayed = vi.fn((src: string) => ({
    ...makeMedia(src),
    play: vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('missing')), 10),
          ),
      ),
  }));
  const other = new AudioManager(
    {
      music: {
        journey: {
          ...asset('journey'),
          fallbackSrc: '/assets/audio/journey.mp3',
        },
      },
      effects: {},
    },
    delayed,
  );
  managers.push(other);
  other.updatePreferences({ music: true });
  other.unlock();
  other.dispose();
  await vi.advanceTimersByTimeAsync(20);
  expect(delayed.mock.results[0].value.play).toHaveBeenCalledOnce();
});

test('não reproduz antes do gesto e nunca cria mídia para catálogo vazio', async () => {
  const { manager, factory } = setup();
  manager.updatePreferences({ music: true, effects: true });
  manager.setContext('arena');
  manager.playEffect('ui');
  expect(factory).not.toHaveBeenCalled();
  manager.unlock();
  await vi.advanceTimersByTimeAsync(0);
  expect(factory).toHaveBeenCalledTimes(1);
  const empty = new AudioManager({ music: {}, effects: {} }, factory);
  managers.push(empty);
  empty.updatePreferences({ music: true, effects: true });
  empty.unlock();
  empty.playEffect('ui');
  expect(factory).toHaveBeenCalledTimes(1);
});

test('crossfade aumenta entrante, reduz anterior e pausa após o fade', async () => {
  const { manager, factory } = setup();
  manager.updatePreferences({ music: true });
  manager.unlock();
  await vi.advanceTimersByTimeAsync(0);
  vi.advanceTimersByTime(700);
  const first = factory.mock.results[0].value;
  expect(first.volume).toBeCloseTo(0.45);
  manager.setContext('arena');
  await vi.advanceTimersByTimeAsync(0);
  const second = factory.mock.results[1].value;
  vi.advanceTimersByTime(320);
  expect(first.volume).toBeGreaterThan(0);
  expect(first.volume).toBeLessThan(0.45);
  expect(second.volume).toBeGreaterThan(0);
  expect(second.volume).toBeLessThan(0.45);
  vi.advanceTimersByTime(380);
  expect(first.pause).toHaveBeenCalledOnce();
  expect(second.volume).toBeCloseTo(0.315);
  manager.setContext('arena');
  manager.unlock();
  expect(factory).toHaveBeenCalledTimes(2);
  manager.updatePreferences({ muted: true });
  vi.advanceTimersByTime(700);
  expect(second.pause).toHaveBeenCalledOnce();
});

test('preferências sobrevivem reload e dados inválidos são limitados', () => {
  const { manager } = setup();
  manager.updatePreferences({
    music: true,
    effects: true,
    musicVolume: 0.24,
    effectsVolume: 0.81,
    muted: true,
  });
  const reloaded = new AudioManager();
  managers.push(reloaded);
  reloaded.hydrate();
  expect(reloaded.getSnapshot()).toEqual(manager.getSnapshot());
  expect(
    validateAudioPreferences({
      music: 'yes',
      musicVolume: Infinity,
      effectsVolume: -3,
    }),
  ).toEqual({ ...DEFAULT_AUDIO_PREFERENCES, effectsVolume: 0 });
  localStorage.setItem(AUDIO_PREFERENCES_KEY, 'corrupt');
  const corrupted = new AudioManager();
  managers.push(corrupted);
  corrupted.hydrate();
  expect(corrupted.getSnapshot()).toEqual(DEFAULT_AUDIO_PREFERENCES);
});

test('efeitos reutilizam elementos, volume e mute; dispose limpa fades', async () => {
  const { manager, factory } = setup();
  manager.updatePreferences({ effects: true, effectsVolume: 0.32 });
  manager.unlock();
  manager.playEffect('reward');
  manager.playEffect('reward');
  expect(factory).toHaveBeenCalledTimes(1);
  expect(factory.mock.results[0].value.play).toHaveBeenCalledTimes(2);
  expect(factory.mock.results[0].value.volume).toBe(0.32);
  manager.updatePreferences({ muted: true });
  manager.playEffect('ui');
  expect(factory).toHaveBeenCalledTimes(1);
  manager.updatePreferences({ muted: false, music: true });
  await vi.advanceTimersByTimeAsync(0);
  manager.dispose();
  vi.advanceTimersByTime(0);
  expect(vi.getTimerCount()).toBe(0);
});

test('rechamada rápida mantém limite de duas músicas e rejeição é silenciosa', async () => {
  const { manager, factory } = setup();
  manager.updatePreferences({ music: true });
  manager.unlock();
  await vi.advanceTimersByTimeAsync(0);
  manager.setContext('arena');
  await vi.advanceTimersByTimeAsync(0);
  manager.setContext('guild');
  await vi.advanceTimersByTimeAsync(0);
  expect(factory.mock.results[0].value.pause).toHaveBeenCalled();
  vi.advanceTimersByTime(0);
  expect(vi.getTimerCount()).toBeLessThanOrEqual(2);
  manager.dispose();
  const blockedFactory = vi.fn((src: string) => ({
    ...makeMedia(src),
    play: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
  }));
  const blocked = new AudioManager(
    { music: { journey: asset('journey') }, effects: {} },
    blockedFactory,
  );
  managers.push(blocked);
  blocked.updatePreferences({ music: true });
  blocked.unlock();
  await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(0);
  expect(blockedFactory.mock.results[0].value.pause).toHaveBeenCalled();
  vi.advanceTimersByTime(0);
  expect(vi.getTimerCount()).toBe(0);
});

test('contextos seguem área e etapa atuais; URLs externas não são carregadas', () => {
  expect(routeMusicContext('/')).toBe('menu');
  expect(routeMusicContext('/journey/arena')).toBe('arena');
  expect(routeMusicContext('/journey/guild/manage')).toBe('guild');
  for (const [step, context] of [
    ['snake', 'snake'],
    ['quiz', 'quiz'],
    ['reflection', 'devotional'],
    ['explore', 'exploration'],
  ])
    expect(routeMusicContext('/journey/phases/garden', step)).toBe(context);
  const factory = vi.fn(makeMedia);
  const manager = new AudioManager(
    {
      music: {
        journey: { src: 'https://example.com/a.mp3', license: 'unknown' },
      },
      effects: {},
    },
    factory,
  );
  managers.push(manager);
  manager.updatePreferences({ music: true });
  manager.unlock();
  expect(factory).not.toHaveBeenCalled();
});
