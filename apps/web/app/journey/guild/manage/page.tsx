import { ReleaseGuild } from '../../../../features/release-ebd/guild';
import { ReleaseAccess } from '../../../../features/release-ebd/shell';

export default function Page() {
  return (
    <ReleaseAccess>
      <ReleaseGuild management />
    </ReleaseAccess>
  );
}
