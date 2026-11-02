import { isArenaTestAvailable } from './release-scope';
export { isArenaTestAvailable, isArenaTestPath } from './release-scope';
/** Visibility flag only. Proxy and page also require the Preview server context. */
export function isArenaTestServerEnabled() {
  return process.env.VERCEL_ENV === 'preview' && isArenaTestAvailable();
}
