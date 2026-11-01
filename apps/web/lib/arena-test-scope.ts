/** Visibility flag only. Proxy and page also require the Preview server context. */
export function isArenaTestAvailable() {
  return (
    process.env.NEXT_PUBLIC_ARENA_TEST_PRACTICE === '1' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL ===
      'https://wkdvdzfkbwvhyjmamrsg.supabase.co'
  );
}
export function isArenaTestServerEnabled() {
  return process.env.VERCEL_ENV === 'preview' && isArenaTestAvailable();
}
export function isArenaTestPath(path: string) {
  return [
    '/journey/arena',
    '/journey/arena/deck',
    '/journey/arena/tower',
  ].includes(path);
}
