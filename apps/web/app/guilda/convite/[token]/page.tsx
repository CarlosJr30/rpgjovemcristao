import { notFound, redirect } from 'next/navigation';
import { MEMBER_INVITE_PATH } from '../../../../lib/ebd-classes/invites-contracts';
import { INVITE_TOKEN } from '../../../../lib/guild-invites/contracts';

export const dynamic = 'force-dynamic';
export const metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!INVITE_TOKEN.test(token)) notFound();
  redirect(`${MEMBER_INVITE_PATH}#${token}`);
}
