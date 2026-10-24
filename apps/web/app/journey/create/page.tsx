import { CreateScreen } from '../../../features/journey/screens/create';
import { ReleaseAccess } from '../../../features/release-ebd/shell';
export default function Page() {
  return (
    <ReleaseAccess>
      <CreateScreen />
    </ReleaseAccess>
  );
}
