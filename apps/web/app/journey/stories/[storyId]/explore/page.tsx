import { notFound } from 'next/navigation';
import { CreationExplorerScreen } from '../../../../../features/story/creation-explorer';

export default async function ExploreStoryPage({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  if (storyId !== 'creation') notFound();
  return <CreationExplorerScreen />;
}
