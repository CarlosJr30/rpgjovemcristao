'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { gameAudio, routeMusicContext } from '../audio/audio-manager';
import type { MusicContext } from '../audio/audio-assets';

let pendingSuspend: ReturnType<typeof setTimeout> | undefined;
let consumers = 0;

export function useGameAudio(pathname: string, step?: string) {
  const preferences = useSyncExternalStore(
    gameAudio.subscribe,
    gameAudio.getSnapshot,
    gameAudio.getServerSnapshot,
  );
  useEffect(() => {
    consumers++;
    if (pendingSuspend) clearTimeout(pendingSuspend);
    pendingSuspend = undefined;
    gameAudio.hydrate();
    const gesture = (event: Event) => {
      if (event.isTrusted) gameAudio.unlock();
    };
    const visibility = () => {
      if (document.hidden) gameAudio.suspend();
      else gameAudio.resume();
    };
    const connection = (
      navigator as Navigator & {
        connection?: EventTarget & { saveData?: boolean };
      }
    ).connection;
    const dataSaver = () =>
      gameAudio.setSaveData(connection?.saveData === true);
    dataSaver();
    visibility();
    connection?.addEventListener('change', dataSaver);
    document.addEventListener('pointerdown', gesture, { passive: true });
    document.addEventListener('keydown', gesture);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('pointerdown', gesture);
      document.removeEventListener('keydown', gesture);
      document.removeEventListener('visibilitychange', visibility);
      connection?.removeEventListener('change', dataSaver);
      consumers--;
      if (consumers === 0)
        pendingSuspend = setTimeout(() => {
          pendingSuspend = undefined;
          if (consumers === 0) gameAudio.suspend();
        }, 0);
    };
  }, []);
  useEffect(() => {
    gameAudio.setContext(routeMusicContext(pathname, step));
  }, [pathname, step]);
  return preferences;
}

export function useAudioScene(context: MusicContext | null, gain = 1) {
  useEffect(
    () => (context ? gameAudio.scene(context, gain) : undefined),
    [context, gain],
  );
}
export function useMusicHold(active: boolean) {
  useEffect(() => (active ? gameAudio.holdMusic() : undefined), [active]);
}
