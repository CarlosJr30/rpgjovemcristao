import { isReleasedPath } from '../release-scope';
// Internal navigation only, never authorization to join a guild.
export function safeEntryReturn(
  value: string | null,
  origin: string,
): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  try {
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      !(
        (url.pathname.startsWith('/journey') && isReleasedPath(url.pathname)) ||
        /^\/guilda\/convite\/[a-f0-9]{64}$/.test(url.pathname)
      )
    )
      return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function entryReturn(fallback: string): string {
  return (
    safeEntryReturn(
      new URLSearchParams(window.location.search).get('next'),
      window.location.origin,
    ) ?? fallback
  );
}

export function registrationDestination(): string {
  const next = entryReturn('');
  return next
    ? `/journey/create?next=${encodeURIComponent(next)}`
    : '/journey/create';
}

export function authCallbackPath(): string {
  const next = entryReturn('');
  return next ? `/auth?next=${encodeURIComponent(next)}` : '/auth';
}
