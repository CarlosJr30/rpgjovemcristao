import { notFound } from 'next/navigation';
import { isArenaPreview } from '../../lib/arena-preview';
import { ArenaDemo } from '../../features/journey/components/arena-demo';
export default function Page() {
  if (!isArenaPreview()) notFound();
  return <ArenaDemo />;
}
