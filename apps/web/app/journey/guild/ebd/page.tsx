import { EbdScreen } from '../../../../features/guild-ebd/screen';
import { ReleaseAccess } from '../../../../features/release-ebd/shell';
export default function Page() {
  return (
    <ReleaseAccess>
      <EbdScreen />
    </ReleaseAccess>
  );
}
