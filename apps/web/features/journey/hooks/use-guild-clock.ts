'use client';
import { useEffect, useState } from 'react';

/** Reevaluate at schedule boundaries and on return from a background tab. */
export function useGuildClock(boundaries: readonly number[]) {
  const [now, setNow] = useState(Date.now);
  const next = Math.min(
    ...boundaries.filter((time) => time > now),
    now + 60_000,
  );
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setTimeout(update, Math.max(1, next - Date.now() + 1));
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [next]);
  return now;
}
