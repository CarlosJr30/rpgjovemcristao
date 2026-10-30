'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../lib/supabase/auth-context';
import { AuthScreen } from '../features/auth/auth-screen';
import { safeEntryReturn } from '../lib/supabase/auth-return';

function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (
      auth.status !== 'signedOut' ||
      pathname === '/' ||
      pathname === '/auth' ||
      pathname === '/auth/recover' ||
      pathname === '/guilda/lideranca/convite' ||
      pathname === '/guilda/participar' ||
      /^\/guilda\/convite\/[a-f0-9]{64}$/.test(pathname)
    )
      return;
    const next = safeEntryReturn(
      `${pathname}${window.location.search}`,
      window.location.origin,
    );
    router.replace(next ? `/auth?next=${encodeURIComponent(next)}` : '/auth');
  }, [auth.status, pathname, router]);
  if (auth.status === 'loading') {
    return (
      <main aria-busy="true" aria-live="polite">
        <p>Preparando sua jornada…</p>
      </main>
    );
  }
  if (auth.status === 'signedOut') {
    if (
      pathname === '/' ||
      pathname === '/auth' ||
      pathname === '/auth/recover' ||
      pathname === '/guilda/lideranca/convite' ||
      pathname === '/guilda/participar' ||
      /^\/guilda\/convite\/[a-f0-9]{64}$/.test(pathname)
    )
      return children;
    const inviteToken = pathname.match(
      /^\/guilda\/convite\/([a-f0-9]{64})$/,
    )?.[1];
    return <AuthScreen inviteToken={inviteToken} />;
  }
  return children;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
