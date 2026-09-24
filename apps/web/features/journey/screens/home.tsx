'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@rpg/ui';
import { resumeJourney, useJourney } from '../state/use-journey';
import { journeyRepository } from '../persistence/journey-storage';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { Shell } from '../components/shell';
import { Landscape } from '../components/landscape';
import { Avatar } from '../components/avatar';
import styles from '../journey.module.css';
import { MAX_LEVEL, TRAVELER_CURRENCY_NAME, nextUnlock, xpForLevel } from '../data/progression';

export function Home() {
  const state = useJourney();
  const router = useRouter();
  if (state.status === 'logged-out') {
    const savedTravelers = journeyRepository.listSaved();
    return (
      <Shell>
        <section className={styles.entryScreen} aria-labelledby="entry-title">
          <p className={styles.eyebrow}>RPG JOVEM CRISTÃO</p>
          <h1 id="entry-title">Escolha como deseja continuar sua jornada.</h1>
          <div className={styles.savedTravelerCard}>
            <p className={styles.eyebrow}>SEUS VIAJANTES</p>
            {savedTravelers.map((traveler) => <article key={traveler.id} className={styles.savedTravelerOption}>
              <Avatar appearance={traveler.appearance} avatar={traveler.avatar} />
              <h2>{traveler.name}</h2>
              <p>Viajante · Nível {traveler.level}</p>
              <Button className={styles.primary} onClick={() => { if (resumeJourney(traveler.id)) router.replace(routes.map); }}>Entrar</Button>
            </article>)}
          </div>
          <Link className={styles.primaryLink} href={routes.create}>+ Criar novo Viajante</Link>
        </section>
      </Shell>
    );
  }
  return (
    <Shell>
      <section className={styles.hero} aria-labelledby="home-title">
        {state.status === 'ready' && (
          <div className={styles.heroCharacter}>
            <p className={styles.eyebrow}>
              SEU HERÓI · NÍVEL {state.traveler.level}
            </p>
            <Avatar appearance={state.traveler.appearance} avatar={state.traveler.avatar} />
            <h2>{state.traveler.name}</h2>
            <div className={styles.xpBar}>
              <span
                style={{
                  width: String(state.traveler.level >= MAX_LEVEL ? 100 : Math.min(100, (state.traveler.xp - xpForLevel(state.traveler.level)) / (xpForLevel(state.traveler.level + 1) - xpForLevel(state.traveler.level)) * 100)) + '%',
                }}
              />
            </div>
            <p>
              {state.traveler.xp} / {state.traveler.level < MAX_LEVEL ? xpForLevel(state.traveler.level + 1) : 'MÁX.'} XP · ◈ {state.traveler.coins} {TRAVELER_CURRENCY_NAME}
            </p>
            <p>{nextUnlock(state.traveler.level) ? `Próximo desbloqueio: nível ${nextUnlock(state.traveler.level)?.level} · ${nextUnlock(state.traveler.level)?.label}` : 'Todos os marcos de nível alcançados'}</p>
            <div className={styles.equipment}>
              <span>⚔ arma</span>
              <span>🛡 escudo</span>
              <span>✦ amuleto</span>
              <span>◈ mochila</span>
            </div>
          </div>
        )}
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
              if (state.status === 'ready') router.push(routes.map);
              else router.push(routes.create);
            }}
          >
            {state.status === 'ready' ? 'Iniciar Jornada' : 'Criar Viajante'} <span aria-hidden="true">↗</span>
          </Button>
          <p className={styles.micro}>
            {state.status === 'ready'
              ? `Seu caminho espera por você, ${state.traveler.name}.`
              : 'Comece como Viajante. Descubra quem você se torna.'}
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
