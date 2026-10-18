import { CardArenaScreen } from '../../../features/journey/screens/card-arena';
import { ArenaDemo } from '../../../features/journey/components/arena-demo';
import { isArenaPreview } from '../../../lib/arena-preview';

export default function Page() {
  return isArenaPreview() ? (
    <ArenaDemo journeyNavigation />
  ) : (
    <CardArenaScreen />
  );
}
