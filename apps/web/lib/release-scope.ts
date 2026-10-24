/** Fixed release boundary. A full launch requires an explicitly reviewed change. */
export const RELEASE_PROFILE = 'guild-ebd-001' as const;
export const GAMEPLAY_ENABLED = false;
const paths = new Set([
  '/',
  '/auth',
  '/auth/recover',
  '/journey',
  '/journey/create',
  '/journey/hero',
  '/journey/guild',
  '/journey/guild/manage',
  '/journey/guild/ebd',
  '/api/guild-invites',
]);
export function isReleasedPath(path: string): boolean {
  return paths.has(path) || /^\/guilda\/convite\/[a-f0-9]{64}$/.test(path);
}
export function unavailableResponse(): Response {
  return Response.json(
    { error: 'Este recurso ainda não está disponível neste lançamento.' },
    { status: 403, headers: { 'Cache-Control': 'no-store' } },
  );
}
