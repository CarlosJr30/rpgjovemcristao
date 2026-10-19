import { notFound } from 'next/navigation';
import { findStory } from '../../../../features/story/catalog';
import { StoryScreen } from '../../../../features/story/story-screen';
export default async function Page({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  if (!findStory(storyId)) notFound();
  return <StoryScreen storyId={storyId} />;
}
