'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/supabase/auth-context';
import { useJourney, resumeJourney } from '../journey/state/use-journey';
import { listTravelersForCurrentSession } from '../../lib/supabase/online-sync';
import { AvatarRuntime } from '../journey/components/avatar-runtime';
import { Landscape } from '../journey/components/landscape';
import original from '../journey/journey.module.css';
import { ReleasedSanctuary } from './sanctuary';
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
        <section className={original.hero} aria-labelledby="home-title">
          <div className={original.heroCopy}>
            <p className={original.eyebrow}>
              <span /> A AVENTURA ESTÁ APENAS COMEÇANDO
            </p>
            <h1
              id="home-title"
              className={original.homeTitle}
              aria-label="RPG Jovem Cristão"
            >
              RPG
              <br />
              Jovem Cristão
              <span className={original.titleStar} aria-hidden="true">
                ✦
              </span>
            </h1>
            <p className={original.heroLead}>
              Grandes histórias.
              <br />
              <em>Uma jornada sua.</em>
            </p>
            <p className={original.description}>
              Crie seu Viajante, encontre sua Guilda e acompanhe a Escola
              Bíblica Dominical.
            </p>
            <Link className={css.entryAction} href="/auth">
              Entrar ou criar conta <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={original.heroArt}>
            <Landscape className={original.landscape} />
            <div className={original.artFrame} />
          </div>
        </section>
      ) : state.status === 'ready' ? (
        <>
          <header className={css.welcome}>
            <p className={original.eyebrow}>SEU CAMINHO CONTINUA</p>
            <h1>Bem-vindo, {state.traveler.name}</h1>
          </header>
          <ReleasedSanctuary traveler={state.traveler} home />
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
        <ReleasedSanctuary traveler={state.traveler} />
      ) : (
        <Link href="/journey">Escolher Viajante</Link>
      )}
    </ReleaseShell>
  );
}
