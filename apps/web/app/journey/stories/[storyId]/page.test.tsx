import { expect, test, vi } from 'vitest';
import Page from './page';

const routeMocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string): never => {
    throw new Error(`REDIRECT:${href}`);
  }),
  notFound: vi.fn((): never => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => routeMocks);
vi.mock('../../../../features/story/catalog', () => ({
  findStory: (storyId: string) =>
    storyId === 'creation' || storyId === 'other' ? { id: storyId } : null,
}));
vi.mock('../../../../features/story/read-only', () => ({
  JourneyReadScreen: ({ storyId }: { storyId: string }) => (
    <div data-story-id={storyId} />
  ),
}));

test('routes the Creation selection straight to the playable exploration', async () => {
  await expect(Page({ params: Promise.resolve({ storyId: 'creation' }) })).rejects.toThrow(
    'REDIRECT:/journey/stories/creation/explore',
  );
  expect(routeMocks.redirect).toHaveBeenCalledWith(
    '/journey/stories/creation/explore',
  );
});

test('keeps other stories on their existing reading route', async () => {
  const element = await Page({ params: Promise.resolve({ storyId: 'other' }) });
  expect(element.props.storyId).toBe('other');
  expect(routeMocks.redirect).not.toHaveBeenCalled();
});
