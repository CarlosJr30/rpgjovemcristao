'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { gameAudio, routeMusicContext } from '../audio/audio-manager';

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
    gameAudio.resume();
    const gesture = (event: Event) => {
      if (event.isTrusted) gameAudio.unlock();
    };
    const visibility = () => {
      if (document.hidden) gameAudio.suspend();
      else gameAudio.resume();
    };
    document.addEventListener('pointerdown', gesture, { passive: true });
    document.addEventListener('keydown', gesture);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('pointerdown', gesture);
      document.removeEventListener('keydown', gesture);
      document.removeEventListener('visibilitychange', visibility);
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
