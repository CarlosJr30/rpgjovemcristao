import Link from 'next/link';
import type { Traveler } from '../domain/traveler';
import { GARDEN, JOURNEY_ROUTES as routes } from '../data/campaign';
import {
  PHASE_STEPS,
  resolveGardenStep,
  type GardenStep,
} from '../data/phaseProgress';
import { JourneyIcon } from './journey-icon';
import styles from '../journey.module.css';
import { PackArtwork } from './pack-artwork';

const stepLabels: Record<GardenStep, string> = {
  opening: 'Entre no Jardim',
  explore: 'Explore e reúna os fragmentos',
  reading: 'Leia Gênesis 2–3',
  comprehension: 'Registre sua leitura',
  context: 'Conheça o contexto da história',
  reflection: 'Continue o Devocional',
  mission: 'Realize a missão do Jardim',
  snake: 'Fuga da Serpente',
  quiz: 'Complete o Quiz Bíblico',
  reward: 'Receba a recompensa da fase',
  diary: 'Registre sua descoberta',
  done: 'Caminho registrado',
};
export function JourneySpotlight({ traveler }: { traveler: Traveler }) {
  const step = resolveGardenStep(traveler.progress);
  const finished = traveler.progress.gardenCompleted;
  const gate = finished && !traveler.progress.nextPhaseUnlocked;
  const index = finished ? PHASE_STEPS.length - 1 : PHASE_STEPS.indexOf(step);
  return (
    <section className={styles.journeySpotlight} aria-label="Sua jornada atual">
      <div className={styles.spotlightCopy}>
        <p className={styles.eyebrow}>ATO I · AS ORIGENS</p>
        <h2>{GARDEN.title}</h2>
        <p className={styles.spotlightReference}>
          {GARDEN.biblicalReference} · Fase {GARDEN.order}
        </p>
        <p className={styles.spotlightObjective}>
          <JourneyIcon name={gate ? 'guild' : 'garden'} />
          <span>
            <small>SEU PRÓXIMO PASSO</small>
            <strong>{gate ? 'Desafio da Célula' : stepLabels[step]}</strong>
          </span>
        </p>
        <div className={styles.spotlightProgress}>
          <progress
            value={index}
            max={PHASE_STEPS.length - 1}
            aria-label="Progresso das etapas da fase"
          />
          <span>
            {finished
              ? 'Fase concluída'
              : `Etapa ${index + 1} de ${PHASE_STEPS.length}`}
          </span>
        </div>
        <Link
          className={styles.primaryLink}
          href={gate ? routes.guild : routes.garden}
        >
          {gate
            ? 'Continuar na Guilda'
            : finished
              ? 'Revisitar o Jardim'
              : 'Continuar jornada'}{' '}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      <span className={styles.spotlightSeal} aria-hidden="true">
        I<span>AS ORIGENS</span>
      </span>
    </section>
  );
}

export function AdventurePortals() {
  return (
    <nav className={styles.adventurePortals} aria-label="Explore seu mundo">
      {(
        [
          [
            'arena',
            'Arena',
            'Prepare sua estratégia e entre no campo de treino.',
          ],
          ['guild', 'Guilda', 'Encontre sua célula e caminhe em comunidade.'],
          [
            'equipment',
            'Equipamentos',
            'Prepare seu Herói para o próximo desafio.',
          ],
          ['diary', 'Diário', 'Guarde as descobertas da sua jornada.'],
        ] as const
      ).map(([id, name, description]) => (
        <Link
          key={id}
          href={routes[id]}
          className={styles.adventurePortal}
          data-area={id}
        >
          <PackArtwork
            slot={
              id === 'arena'
                ? 'arenaBackground'
                : id === 'guild'
                  ? 'guildPortal'
                  : id === 'equipment'
                    ? 'equipmentPortal'
                    : 'diaryPortal'
            }
          />
          <span className={styles.portalEmblem}>
            <JourneyIcon name={id} />
          </span>
          <h2>{name}</h2>
          <p>{description}</p>
          <span className={styles.portalArrow} aria-hidden="true">
            ↗
          </span>
        </Link>
      ))}
    </nav>
  );
}
