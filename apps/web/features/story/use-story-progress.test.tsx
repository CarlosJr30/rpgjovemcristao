// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  auth: { status: 'signedIn', user: { id: 'account-a' } },
  list: vi.fn(),
}));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => mocks.auth,
}));
vi.mock('../../lib/supabase/repositories/story-repository', () => ({
  storyRepository: { list: mocks.list },
}));
import { useStoryProgress } from './use-story-progress';
beforeEach(() => {
  mocks.auth = { status: 'signedIn', user: { id: 'account-a' } };
  mocks.list.mockReset();
});
test('account or traveler switch immediately hides old data and ignores late responses', async () => {
  let resolveFirst: (value: unknown[]) => void = () => {};
  mocks.list
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    )
    .mockResolvedValueOnce([]);
  const { result, rerender } = renderHook(({ id }) => useStoryProgress(id), {
    initialProps: { id: 'traveler-a' },
  });
  mocks.auth = { status: 'signedIn', user: { id: 'account-b' } };
  rerender({ id: 'traveler-b' });
  expect(result.current.records).toEqual([]);
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    resolveFirst([{ traveler_id: 'traveler-a', story_id: 'creation' }]);
  });
  expect(result.current.records).toEqual([]);
});
test('same-account refresh reloads remote state and failures stay visible', async () => {
  mocks.list
    .mockResolvedValueOnce([])
    .mockRejectedValueOnce(new Error('synthetic failure'));
  const { result } = renderHook(() => useStoryProgress('traveler-a'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.refresh());
  await waitFor(() =>
    expect(result.current.error).toContain('Não foi possível'),
  );
  expect(result.current.records).toEqual([]);
});
