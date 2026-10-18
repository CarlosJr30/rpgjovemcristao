import { MapScreen } from '../../features/journey/screens/map';
import { JourneyPreview } from '../../features/journey/components/journey-preview';
import { isArenaPreview } from '../../lib/arena-preview';
export default function Page() {
  return isArenaPreview() ? <JourneyPreview /> : <MapScreen />;
}
