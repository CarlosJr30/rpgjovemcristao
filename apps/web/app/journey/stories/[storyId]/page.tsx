import { notFound } from 'next/navigation';
import { findStory } from '../../../../features/story/catalog';
import { JourneyReadScreen } from '../../../../features/story/read-only';
export default async function Page({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  if (!findStory(storyId)) notFound();
  return <JourneyReadScreen storyId={storyId} />;
}
