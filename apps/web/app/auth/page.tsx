import { AuthScreen } from '../../features/auth/auth-screen';

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const inviteToken =
    typeof next === 'string'
      ? next.match(/^\/guilda\/convite\/([a-f0-9]{64})$/)?.[1]
      : undefined;
  return <AuthScreen inviteToken={inviteToken} />;
}
