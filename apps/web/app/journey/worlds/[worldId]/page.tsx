import { notFound } from 'next/navigation';
import { WORLDS } from '../../../../features/story/catalog';
import { WorldScreen } from '../../../../features/story/world-screen';
export default async function Page({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = await params;
  if (!WORLDS.some(world => world.id === worldId)) notFound();
  return <WorldScreen worldId={worldId} />;
}
