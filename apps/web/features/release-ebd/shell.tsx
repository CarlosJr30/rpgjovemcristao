'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import {
  signOutAccount,
  useJourney,
  switchTraveler,
} from '../journey/state/use-journey';
import { isReleasedPath } from '../../lib/release-scope';
import css from './release.module.css';
export function ReleaseShell({
  children,
  back,
  backLabel,
}: {
  children: ReactNode;
  back?: string;
  backLabel?: string;
}) {
  const auth = useAuth(),
    state = useJourney(),
    router = useRouter();
  return (
    <div className={css.page}>
      <header className={css.header}>
        <Link href="/">RPG Jovem Cristão</Link>
        <span>Guilda e Escola Bíblica</span>
        <nav className={css.nav} aria-label="Navegação principal">
          <Link href="/journey">Início</Link>
          <Link href="/journey/hero">Meu avatar</Link>
          <Link href="/journey/guild">Guilda</Link>
          <Link href="/journey/guild/ebd">EBD</Link>
        </nav>
        {auth.status === 'signedIn' ? (
          <div className={css.actions}>
            {state.status === 'ready' && <span>{state.traveler.name}</span>}
            <button
              onClick={() => {
                switchTraveler();
                router.push('/journey');
              }}
            >
              Trocar Viajante
            </button>
            <button
              onClick={async () => {
                if (await signOutAccount()) router.replace('/auth');
              }}
            >
              Sair da conta
            </button>
          </div>
        ) : (
          <Link href="/auth">Entrar ou criar conta</Link>
        )}
      </header>
      <main className={css.main}>
        {back && (
          <Link href={isReleasedPath(back) ? back : '/journey'}>
            ← {backLabel ?? 'Voltar'}
          </Link>
        )}
        {children}
      </main>
    </div>
  );
}
export function ReleaseAccess({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.status === 'loading')
    return (
      <ReleaseShell>
        <p role="status">Verificando sua conta…</p>
      </ReleaseShell>
    );
  if (auth.status !== 'signedIn')
    return (
      <ReleaseShell>
        <section className={css.card}>
          <h1>Entre para continuar</h1>
          <p>
            Sua conta mantém o acesso ao avatar, à Guilda e à Escola Bíblica.
          </p>
          <Link href="/auth">Entrar ou criar conta</Link>
        </section>
      </ReleaseShell>
    );
  return children;
}
