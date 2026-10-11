'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@rpg/ui';
import { resumeJourney, useJourney } from '../state/use-journey';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { Shell } from '../components/shell';
import { Landscape } from '../components/landscape';
import { AvatarRuntime } from '../components/avatar-runtime';
import { ResponsivePanel } from '../components/responsive-panel';
import {
  JourneySpotlight,
  AdventurePortals,
} from '../components/journey-spotlight';
import styles from '../journey.module.css';
import { TRAVELER_CURRENCY_NAME, nextUnlock } from '../data/progression';
import { useAuth } from '../../../lib/supabase/auth-context';
import {
  getCurrentRemoteActiveTravelerId,
  listTravelersForCurrentSession,
} from '../../../lib/supabase/online-sync';

export function Home() {
  const state = useJourney();
  const auth = useAuth();
  const router = useRouter();
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const savedTravelers =
    state.status === 'logged-out' ? listTravelersForCurrentSession() : [];
  useEffect(() => {
    if (
      auth.status === 'signedIn' &&
      state.status !== 'loading' &&
      state.status !== 'ready' &&
      savedTravelers.length === 0
    )
      router.replace(routes.create);
  }, [auth.status, router, savedTravelers.length, state.status]);
  if (state.status === 'logged-out') {
    const preferredTravelerId = getCurrentRemoteActiveTravelerId();
    return (
      <Shell>
        <section className={styles.entryScreen} aria-labelledby="entry-title">
          <p className={styles.eyebrow}>RPG JOVEM CRISTÃO</p>
          <h1 id="entry-title">Escolha seu Viajante</h1>
          <div className={styles.savedTravelerCard}>
            <p className={styles.eyebrow}>SEUS VIAJANTES</p>
            {savedTravelers.map((traveler) => (
              <article key={traveler.id} className={styles.savedTravelerOption}>
                <AvatarRuntime
                  traveler={traveler}
                  mode="card"
                  decorative
                  className={styles.avatar}
                />
                <h2>{traveler.name}</h2>
                <p>
                  Viajante · Nível {traveler.level}
                  {traveler.id === preferredTravelerId ? ' · Ativo' : ''}
                </p>
                <Button
                  className={styles.primary}
                  disabled={selectingId !== null}
                  onClick={async () => {
                    setSelectionError(null);
                    setSelectingId(traveler.id);
                    const resumed = await resumeJourney(traveler.id);
                    if (resumed) router.replace(routes.map);
                    else
                      setSelectionError(
                        'Não foi possível selecionar este Viajante.',
                      );
                    setSelectingId(null);
                  }}
                >
                  {selectingId === traveler.id ? 'Selecionando…' : 'Entrar'}
                </Button>
              </article>
            ))}
          </div>
          {selectionError && (
            <p role="alert" className={styles.error}>
              {selectionError}
            </p>
          )}
          <Link className={styles.primaryLink} href={routes.create}>
            + Criar novo Viajante
          </Link>
          {(auth.status === 'signedOut' || auth.status === 'local') && (
            <Link href="/auth">Entrar ou criar conta para sincronizar</Link>
          )}
        </section>
      </Shell>
    );
  }
  if (state.status === 'ready')
    return (
      <Shell>
        <section
          className={styles.adventureHome}
          aria-labelledby="home-title"
          data-mobile-screen="home"
        >
          <header className={styles.adventureWelcome}>
            <div>
              <p className={styles.eyebrow}>SEU CAMINHO CONTINUA</p>
              <h1 id="home-title">
                Bem-vindo à jornada, {state.traveler.name}.
              </h1>
            </div>
            <AvatarRuntime
              traveler={state.traveler}
              mode="thumbnail"
              decorative
              className={styles.avatarSmall}
            />
          </header>
          <JourneySpotlight traveler={state.traveler} />
          <ResponsivePanel title="Meu progresso e outros caminhos">
            <div className={styles.adventureProgress}>
              <span>Nível {state.traveler.level}</span>
              <span>{state.traveler.xp} XP</span>
              <span>
                ◈ {state.traveler.coins} {TRAVELER_CURRENCY_NAME}
              </span>
              <span>
                {nextUnlock(state.traveler.level)?.label ??
                  'Marcos de nível alcançados'}
              </span>
            </div>
            <AdventurePortals />
            <Button
              className={styles.primary}
              onClick={() => router.push(routes.map)}
            >
              Iniciar Jornada <span aria-hidden="true">↗</span>
            </Button>
          </ResponsivePanel>
        </section>
      </Shell>
    );
  return (
    <Shell>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span /> A AVENTURA ESTÁ APENAS COMEÇANDO
          </p>
          <h1
            id="home-title"
            className={styles.homeTitle}
            aria-label="RPG Jovem Cristão"
          >
            RPG
            <br />
            Jovem Cristão
            <span className={styles.titleStar} aria-hidden="true">
              ✦
            </span>
          </h1>
          <p className={styles.heroLead}>
            Grandes histórias.
            <br />
            <em>Uma jornada sua.</em>
          </p>
          <p className={styles.description}>
            Atravesse histórias que marcaram gerações.
            <br className={styles.desktopBreak} /> Descubra caminhos, encontre
            significado
            <br className={styles.desktopBreak} /> e dê o seu primeiro passo.
          </p>
          <Button
            className={styles.primary}
            disabled={state.status === 'loading'}
            onClick={() => {
              if (auth.status === 'signedOut') router.push('/auth');
              else router.push(routes.create);
            }}
          >
            {auth.status === 'signedOut'
              ? 'Entrar ou continuar localmente'
              : 'Criar Viajante'}{' '}
            <span aria-hidden="true">↗</span>
          </Button>
          <p className={styles.micro}>
            Comece como Viajante. Descubra quem você se torna.
          </p>
          <div className={styles.heroTraits}>
            <span>◇ EXPLORAÇÃO</span>
            <span>✧ DESCOBERTA</span>
            <span>⌁ HISTÓRIA</span>
          </div>
        </div>
        <div className={styles.heroArt}>
          <Landscape className={styles.landscape} />
          <div className={styles.artFrame} />
          <span className={styles.artCoordinate}>I · ONDE TUDO COMEÇA</span>
          <div className={styles.artCaption}>
            <span>O PRIMEIRO HORIZONTE</span>
            <strong>As Origens</strong>
            <span>
              Gênesis 2–3 <i aria-hidden="true">↗</i>
            </span>
          </div>
          <span className={styles.compass} aria-hidden="true">
            ✥
          </span>
        </div>
      </section>
      <div className={styles.homeBottom}>
        <span>01 / 08 ATOS</span>
        <p>
          Você não escolhe quem será no começo.
          <br />
          <strong>Sua jornada constrói quem você se torna.</strong>
        </p>
        <span aria-hidden="true">↓</span>
      </div>
    </Shell>
  );
}
