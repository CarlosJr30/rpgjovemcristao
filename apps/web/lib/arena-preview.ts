/** Server-owned deployment decision; no URL, cookie or browser state can enable it. */
export function isArenaPreview() {
  return (
    process.env.VERCEL_ENV === 'preview' ||
    (process.env.VERCEL_ENV !== 'production' &&
      process.env.RPG_ARENA_DEMO === '1')
  );
}
