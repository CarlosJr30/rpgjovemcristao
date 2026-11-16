'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '../lib/supabase/auth-context';
import { TrainingQAProvider } from '../features/training-qa/provider';
import { AuthScreen } from '../features/auth/auth-screen';
import { safeEntryReturn } from '../lib/supabase/auth-return';
import { signOut } from '../lib/supabase/auth';

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
      pathname === '/privacy' ||
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
      pathname === '/privacy' ||
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
  if (auth.status === 'restricted') {
    if (pathname === '/auth/recover' || pathname === '/privacy')
      return children;
    return (
      <main>
        <h1>Lançamento inicial exclusivo para maiores de 18 anos</h1>
        <p>
          Não foi possível comprovar sua elegibilidade etária. O acesso ao jogo
          permanece bloqueado. Sua conta e seu progresso foram preservados.
        </p>
        <p>
          Informar uma data de nascimento não equivale à verificação de idade. A
          revisão pelo responsável ainda precisa estar disponível.
        </p>
        <button type="button" onClick={() => void signOut()}>
          Sair da conta
        </button>
        <Link href="/privacy">Privacidade e atendimento</Link>
      </main>
    );
  }
  return children;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TrainingQAProvider>
        <AuthGate>{children}</AuthGate>
      </TrainingQAProvider>
    </AuthProvider>
  );
}
