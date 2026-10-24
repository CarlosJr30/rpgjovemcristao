'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/supabase/auth-context';
import { useJourney, resumeJourney } from '../journey/state/use-journey';
import { listTravelersForCurrentSession } from '../../lib/supabase/online-sync';
import { AvatarRuntime } from '../journey/components/avatar-runtime';
import { ReleaseShell } from './shell';
import css from './release.module.css';
export function ReleaseHome() {
  const auth = useAuth(),
    state = useJourney(),
    router = useRouter();
  const [error, setError] = useState('');
  const saved =
    state.status === 'logged-out' ? listTravelersForCurrentSession() : [];
  useEffect(() => {
    if (
      auth.status === 'signedIn' &&
      state.status !== 'loading' &&
      state.status !== 'ready' &&
      saved.length === 0
    )
      router.replace('/journey/create');
  }, [auth.status, state.status, saved.length, router]);
  return (
    <ReleaseShell>
      {auth.status === 'loading' || state.status === 'loading' ? (
        <p role="status">Preparando seu acesso…</p>
      ) : auth.status !== 'signedIn' ? (
        <section className={css.card}>
          <h1>Aprenda e caminhe com sua Guilda</h1>
          <p>
            Crie seu avatar, participe da sua comunidade e acompanhe aulas e
            atividades da Escola Bíblica Dominical.
          </p>
          <Link href="/auth">Entrar ou criar conta</Link>
        </section>
      ) : state.status === 'ready' ? (
        <>
          <section className={css.card}>
            <h1>Bem-vindo, {state.traveler.name}</h1>
            <p>Continue com sua Guilda e a Escola Bíblica.</p>
          </section>
          <div className={css.grid}>
            <section className={css.card}>
              <h2>Minha Guilda</h2>
              <p>Participe por convite ou crie sua comunidade.</p>
              <Link href="/journey/guild">Acessar Guilda</Link>
            </section>
            <section className={css.card}>
              <h2>Escola Bíblica Dominical</h2>
              <p>Aulas, atividades, agenda e presença.</p>
              <Link href="/journey/guild/ebd">Acessar EBD</Link>
            </section>
            <section className={css.card}>
              <h2>Meu avatar</h2>
              <AvatarRuntime traveler={state.traveler} mode="card" />
              <Link href="/journey/hero">Ver avatar</Link>
            </section>
          </div>
        </>
      ) : (
        <section className={css.card}>
          <h1>Escolha seu Viajante</h1>
          {saved.map((t) => (
            <article key={t.id}>
              <AvatarRuntime traveler={t} mode="card" />
              <h2>{t.name}</h2>
              <button
                onClick={async () => {
                  if (await resumeJourney(t.id))
                    router.replace('/journey/guild');
                  else setError('Não foi possível selecionar o Viajante.');
                }}
              >
                Entrar com este Viajante
              </button>
            </article>
          ))}
          {error && <p role="alert">{error}</p>}
          <Link href="/journey/create">Criar novo Viajante</Link>
        </section>
      )}
    </ReleaseShell>
  );
}
export function ReleaseAvatar() {
  const state = useJourney();
  return (
    <ReleaseShell>
      {state.status === 'ready' ? (
        <section className={css.card}>
          <h1>{state.traveler.name}</h1>
          <div className={css.avatar}>
            <AvatarRuntime traveler={state.traveler} />
          </div>
          <Link href="/journey/create">Criar outro Viajante</Link>
        </section>
      ) : (
        <Link href="/journey">Escolher Viajante</Link>
      )}
    </ReleaseShell>
  );
}
