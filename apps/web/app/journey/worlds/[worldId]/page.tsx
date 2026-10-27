import { notFound } from 'next/navigation';
import { WORLDS } from '../../../../features/story/catalog';
import { JourneyReadScreen } from '../../../../features/story/read-only';
export default async function Page({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = await params;
  if (!WORLDS.some((world) => world.id === worldId)) notFound();
  return <JourneyReadScreen worldId={worldId} />;
}
