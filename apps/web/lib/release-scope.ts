/** Fixed release boundary. A full launch requires an explicitly reviewed change. */
export const RELEASE_PROFILE = 'minigame-demo-008c' as const;
export const GAMEPLAY_ENABLED = false;
const paths = new Set([
  '/',
  '/auth',
  '/auth/recover',
  '/journey',
  '/journey/create',
  '/journey/hero',
  '/journey/backpack',
  '/journey/collection',
  '/journey/diary',
  '/journey/minigames/fuga-da-serpente',
  '/journey/phases/o-jardim-e-a-escolha',
  '/journey/worlds',
  '/journey/worlds/origins',
  '/journey/worlds/patriarchs',
  '/journey/worlds/liberation',
  '/journey/worlds/promised-land',
  '/journey/worlds/kings',
  '/journey/worlds/return',
  '/journey/worlds/jesus',
  '/journey/worlds/church',
  '/journey/worlds/new-creation',
  '/journey/stories/creation',
  '/journey/stories/garden-choice',
  '/journey/stories/cain-abel',
  '/journey/stories/noah-ark',
  '/journey/stories/babel',
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
