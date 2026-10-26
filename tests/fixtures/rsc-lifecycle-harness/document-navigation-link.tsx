'use client';

import Link from 'next/link';
import { useSyncExternalStore, type ComponentProps } from 'react';
import { flushSync } from 'react-dom';

const listeners = new Set<() => void>();
let leaving = false;
let observing = false;
const snapshot = () => leaving;
// Prefetch changes registration only, never the anchor's SSR markup. A boundary
// hydrating after beforeunload must not register fresh work in the old document.
const serverSnapshot = () => typeof window !== 'undefined' && leaving;
function publish(value: boolean) {
  if (leaving === value) return;
  leaving = value;
  for (const listener of listeners) listener();
}
function beforeUnload() {
  // Detach queued Link prefetch tasks before WebKit cancels the old loads.
  flushSync(() => publish(true));
}
function resume() {
  publish(false);
  stopWhenUnused();
}
function stopWhenUnused() {
  // React may replace/hydrate a boundary during departure. Keep that lifecycle
  // across zero subscribers until the document actually resumes or is discarded.
  if (observing && listeners.size === 0 && !leaving) {
    window.removeEventListener('beforeunload', beforeUnload);
    window.removeEventListener('pageshow', resume);
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
    observing = false;
  }
}
function subscribe(listener: () => void) {
  if (!observing) {
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('pageshow', resume);
    // A canceled browser navigation can leave the same document interactive.
    window.addEventListener('pointerdown', resume, { passive: true });
    window.addEventListener('keydown', resume);
    observing = true;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    stopWhenUnused();
  };
}

/** Experimental contrast only. Failed full-app acceptance; never import in product. */
export default function DocumentNavigationLink({
  prefetch,
  ...props
}: ComponentProps<typeof Link>) {
  const departing = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return <Link {...props} prefetch={departing ? false : prefetch} />;
}
