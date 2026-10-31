'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '../../lib/supabase/auth-context';
import { Shell } from '../journey/components/shell';
import { isReleasedPath } from '../../lib/release-scope';
import css from './release.module.css';
import { EarlyAccessNotice } from '../early-access/notice';
export function ReleaseShell({
  children,
  back,
  backLabel,
}: {
  children: ReactNode;
  back?: string;
  backLabel?: string;
}) {
  return (
    <Shell
      navigationMode="released"
      className={css.page}
      back={back ? (isReleasedPath(back) ? back : '/journey') : undefined}
      backLabel={backLabel ?? 'Voltar'}
    >
      <EarlyAccessNotice />
      {children}
    </Shell>
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
