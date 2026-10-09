import {
  isApprovedAudioAsset,
  MUSIC_ASSETS,
  SOUND_ASSETS,
  ARENA_PROTOTYPE_EFFECTS,
  type AudioAsset,
  type MusicContext,
  type SoundEffect,
} from './audio-assets';
import { ARENA_MIX, AUDIO_CROSSFADE_MS } from './arena-mix';

export type AudioPreferences = Readonly<{
  music: boolean;
  effects: boolean;
  musicVolume: number;
  effectsVolume: number;
  muted: boolean;
}>;
export const AUDIO_PREFERENCES_KEY = 'rpg-jovem-cristao:audio-preferences:v1';
export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = Object.freeze({
  music: false,
  effects: false,
  musicVolume: 0.45,
  effectsVolume: 0.65,
  muted: false,
});
export function validateAudioPreferences(value: unknown): AudioPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return DEFAULT_AUDIO_PREFERENCES;
  const input = value as Record<string, unknown>;
  const volume = (key: 'musicVolume' | 'effectsVolume') =>
    typeof input[key] === 'number' && Number.isFinite(input[key])
      ? Math.min(1, Math.max(0, input[key]))
      : DEFAULT_AUDIO_PREFERENCES[key];
  return {
    music: input.music === true,
    effects: input.effects === true,
    muted: input.muted === true,
    musicVolume: volume('musicVolume'),
    effectsVolume: volume('effectsVolume'),
  };
}

type AudioCatalog = {
  music: Partial<Record<MusicContext, AudioAsset>>;
  effects: Partial<Record<SoundEffect, AudioAsset>>;
  arenaPrototypeEffects?: Partial<Record<SoundEffect, AudioAsset>>;
};
type Media = Pick<
  HTMLAudioElement,
  'play' | 'pause' | 'volume' | 'loop' | 'currentTime' | 'preload' | 'src'
> & { canPlayType?: (type: string) => CanPlayTypeResult };

/** One manager for the app. At most two music tracks and four reusable effects. */
export class AudioManager {
  private preferences: AudioPreferences = DEFAULT_AUDIO_PREFERENCES;
  private listeners = new Set<() => void>();
  private unlocked = false;
  private suspended = false;
  private hydrated = false;
  private context: MusicContext = 'journey';
  private playingContext: MusicContext | null = null;
  private current: Media | null = null;
  private outgoing: Media | null = null;
  private effects = new Map<SoundEffect, Media>();
  private effectGains = new Map<SoundEffect, number>();
  private fades = new Map<Media, ReturnType<typeof setInterval>>();
  constructor(
    private catalog: AudioCatalog = {
      music: MUSIC_ASSETS,
      effects: SOUND_ASSETS,
      arenaPrototypeEffects: ARENA_PROTOTYPE_EFFECTS,
    },
    private createMedia: (src: string) => Media = (src) => new Audio(src),
  ) {}

  getSnapshot = () => this.preferences;
  getServerSnapshot = () => DEFAULT_AUDIO_PREFERENCES;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
  private async playMedia(
    media: Media,
    asset: AudioAsset,
    active: () => boolean,
  ) {
    if (asset.fallbackSrc && media.canPlayType?.('audio/ogg') === '')
      media.src = asset.fallbackSrc;
    try {
      await media.play();
    } catch (error) {
      if (
        !active() ||
        !asset.fallbackSrc ||
        media.src.endsWith(asset.fallbackSrc) ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          ['NotAllowedError', 'AbortError'].includes(String(error.name)))
      )
        throw error;
      media.src = asset.fallbackSrc;
      await media.play();
    }
  }
  hydrate() {
    if (this.hydrated || typeof window === 'undefined') return;
    this.hydrated = true;
    try {
      const raw = window.localStorage.getItem(AUDIO_PREFERENCES_KEY);
      if (raw && raw.length <= 4096)
        this.preferences = validateAudioPreferences(JSON.parse(raw));
    } catch {
      /* A blocked/corrupt preference never blocks gameplay. */
    }
    this.emit();
  }
  updatePreferences(patch: Partial<AudioPreferences>) {
    this.preferences = validateAudioPreferences({
      ...this.preferences,
      ...patch,
    });
    try {
      window.localStorage.setItem(
        AUDIO_PREFERENCES_KEY,
        JSON.stringify(this.preferences),
      );
    } catch {
      /* Session preference still applies. */
    }
    this.emit();
    this.effects.forEach((media, effect) => {
      media.volume =
        this.preferences.effectsVolume * (this.effectGains.get(effect) ?? 1);
      if (!this.preferences.effects || this.preferences.muted) media.pause();
    });
    if (!this.preferences.music || this.preferences.muted) this.fadeMusicOut();
    else this.startMusic();
  }
  unlock() {
    this.hydrate();
    if (this.unlocked) return;
    this.unlocked = true;
    this.startMusic();
  }
  setContext(context: MusicContext) {
    if (this.context === 'arena' && context !== 'arena') {
      this.effects.forEach((media) => this.stop(media));
      this.effects.clear();
      this.effectGains.clear();
    }
    this.context = context;
    this.startMusic();
  }
  private cancelFade(media: Media) {
    const timer = this.fades.get(media);
    if (timer) clearInterval(timer);
    this.fades.delete(media);
  }
  private fade(
    media: Media,
    target: number,
    duration = AUDIO_CROSSFADE_MS,
    done?: () => void,
  ) {
    this.cancelFade(media);
    const start = media.volume,
      started = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / duration);
      media.volume = Math.max(
        0,
        Math.min(1, start + (target - start) * progress),
      );
      if (progress === 1) {
        this.cancelFade(media);
        done?.();
      }
    }, 32);
    this.fades.set(media, timer);
  }
  private stop(media: Media | null) {
    if (!media) return;
    this.cancelFade(media);
    media.pause();
    media.currentTime = 0;
  }
  private fadeMusicOut() {
    this.stop(this.outgoing);
    this.outgoing = null;
    if (this.current) {
      const media = this.current;
      this.current = null;
      this.playingContext = null;
      this.outgoing = media;
      this.fade(media, 0, AUDIO_CROSSFADE_MS, () => {
        this.stop(media);
        if (this.outgoing === media) this.outgoing = null;
      });
    }
  }
  private startMusic() {
    if (
      !this.unlocked ||
      this.suspended ||
      !this.preferences.music ||
      this.preferences.muted
    )
      return;
    const asset = this.catalog.music[this.context];
    if (!asset || !isApprovedAudioAsset(asset)) {
      this.fadeMusicOut();
      return;
    }
    if (this.current && this.playingContext === this.context) {
      this.fade(this.current, this.musicLevel());
      return;
    }
    this.stop(this.outgoing);
    this.outgoing = this.current;
    if (this.outgoing) {
      const outgoing = this.outgoing;
      this.fade(outgoing, 0, AUDIO_CROSSFADE_MS, () => {
        this.stop(outgoing);
        if (this.outgoing === outgoing) this.outgoing = null;
      });
    }
    const media = this.createMedia(asset.src);
    media.preload = 'none';
    media.loop = true;
    media.volume = 0;
    this.current = media;
    this.playingContext = this.context;
    void this.playMedia(
      media,
      asset,
      () => this.current === media && !this.suspended,
    )
      .then(() => {
        if (this.current === media && !this.suspended)
          this.fade(media, this.musicLevel());
      })
      .catch(() => {
        this.stop(media);
        if (this.current === media) {
          this.current = null;
          this.playingContext = null;
        }
      });
  }
  private musicLevel() {
    return (
      this.preferences.musicVolume *
      (this.context === 'arena' ? ARENA_MIX.music : 1)
    );
  }
  playEffect(effect: SoundEffect, gain = 1) {
    if (
      !this.unlocked ||
      this.suspended ||
      !this.preferences.effects ||
      this.preferences.muted
    )
      return;
    const asset =
      (this.context === 'arena' &&
        this.catalog.arenaPrototypeEffects?.[effect]) ||
      this.catalog.effects[effect];
    if (!asset || !isApprovedAudioAsset(asset)) return;
    let media = this.effects.get(effect);
    if (!media) {
      if (this.effects.size >= 4) {
        const oldest = this.effects.entries().next().value!;
        this.stop(oldest[1]);
        this.effects.delete(oldest[0]);
        this.effectGains.delete(oldest[0]);
      }
      media = this.createMedia(asset.src);
      media.preload = 'none';
      this.effects.set(effect, media);
    }
    const level = Number.isFinite(gain) ? Math.min(1, Math.max(0, gain)) : 0;
    this.effectGains.set(effect, level);
    media.volume = this.preferences.effectsVolume * level;
    media.currentTime = 0;
    void this.playMedia(
      media,
      asset,
      () =>
        this.effects.get(effect) === media &&
        !this.suspended &&
        this.preferences.effects &&
        !this.preferences.muted,
    ).catch(() => undefined);
  }
  suspend() {
    this.suspended = true;
    this.stop(this.outgoing);
    this.outgoing = null;
    if (this.current) {
      this.cancelFade(this.current);
      this.current.pause();
    }
    this.effects.forEach((media) => media.pause());
  }
  resume() {
    if (!this.suspended) {
      this.startMusic();
      return;
    }
    this.suspended = false;
    if (
      this.current &&
      this.unlocked &&
      this.preferences.music &&
      !this.preferences.muted
    ) {
      const media = this.current;
      media.volume = 0;
      const asset = this.catalog.music[this.context];
      void (
        asset && isApprovedAudioAsset(asset)
          ? this.playMedia(
              media,
              asset,
              () => this.current === media && !this.suspended,
            )
          : Promise.reject(new Error('Audio unavailable'))
      )
        .then(() => {
          if (this.current === media && !this.suspended)
            this.fade(media, this.musicLevel());
        })
        .catch(() => undefined);
    }
    this.startMusic();
  }
  dispose() {
    this.stop(this.current);
    this.stop(this.outgoing);
    this.effects.forEach((media) => this.stop(media));
    this.current = this.outgoing = null;
    this.playingContext = null;
    this.effects.clear();
    this.effectGains.clear();
    this.unlocked = false;
  }
}

export const gameAudio = new AudioManager();
export function routeMusicContext(
  pathname: string,
  step?: string,
): MusicContext {
  if (pathname.startsWith('/journey/arena')) return 'arena';
  if (pathname.startsWith('/journey/guild')) return 'guild';
  if (pathname.includes('/phases/')) {
    if (step === 'snake') return 'snake';
    if (step === 'reflection') return 'devotional';
    if (step === 'quiz') return 'quiz';
    return 'exploration';
  }
  return 'journey';
}
