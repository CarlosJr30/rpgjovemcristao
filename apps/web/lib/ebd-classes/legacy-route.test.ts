import { expect, test, vi } from 'vitest';
const nav = vi.hoisted(() => ({
  redirect: vi.fn((destination: string) => {
    throw new Error(destination);
  }),
  notFound: vi.fn(() => {
    throw new Error('not-found');
  }),
}));
vi.mock('next/navigation', () => nav);
import Page from '../../app/guilda/convite/[token]/page';
test('old valid URL redirects to the clean common flow with its token only in the fragment', async () => {
  const token = 'a'.repeat(64);
  await expect(Page({ params: Promise.resolve({ token }) })).rejects.toThrow(
    '/guilda/participar#' + token,
  );
  expect(nav.redirect).toHaveBeenLastCalledWith('/guilda/participar#' + token);
});
test('malformed old URL never becomes an invitation destination', async () => {
  await expect(
    Page({ params: Promise.resolve({ token: 'invalid' }) }),
  ).rejects.toThrow('not-found');
});
