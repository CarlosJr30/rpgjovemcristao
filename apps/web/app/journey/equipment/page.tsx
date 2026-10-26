import { EquipmentScreen } from '../../../features/journey/screens/equipment';
import { ReleaseAccess } from '../../../features/release-ebd/shell';
export default function Page() {
  return (
    <ReleaseAccess>
      <EquipmentScreen serverConfirmedOnly />
    </ReleaseAccess>
  );
}
