import { notFound } from 'next/navigation';
import { ArenaTestScreen } from '../../../features/arena-test/screen';
import { isArenaTestServerEnabled } from '../../../lib/arena-test-scope';
export const dynamic = 'force-dynamic';

export default function Page() {
  if (!isArenaTestServerEnabled()) notFound();
  return <ArenaTestScreen mode="arena" />;
}
