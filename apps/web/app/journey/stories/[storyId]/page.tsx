import { notFound, redirect } from 'next/navigation';
import { findStory } from '../../../../features/story/catalog';
import { JourneyReadScreen } from '../../../../features/story/read-only';
export default async function Page({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  if (!findStory(storyId)) notFound();
  if (storyId === 'creation') redirect('/journey/stories/creation/explore');
  return <JourneyReadScreen storyId={storyId} />;
}
