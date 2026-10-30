import { MemberInvitation } from '../../../features/guild-ebd/member-invitation';
export const dynamic = 'force-dynamic';
export const metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default function Page() {
  return <MemberInvitation />;
}
