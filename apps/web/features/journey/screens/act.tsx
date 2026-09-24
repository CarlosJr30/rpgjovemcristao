'use client';
import Link from 'next/link';
import { Shell, RequireTraveler } from '../components/shell';
import { Landscape } from '../components/landscape';
import { CAMPAIGN, GARDEN, JOURNEY_ROUTES as routes } from '../data/campaign';
import styles from '../journey.module.css';
export function ActScreen() {
  const act = CAMPAIGN[0];
  return (
    <Shell back={routes.map}>
      <RequireTraveler>
        {(traveler) => (
          <section className={styles.actSection}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>
                ATO {act.numeral} — O PRIMEIRO HORIZONTE
              </p>
              <h1>{act.title}</h1>
              <p>Todo caminho tem um começo. Encontre o seu.</p>
            </div>
            <Link href={routes.garden} className={styles.phaseCard}>
              <div className={styles.phaseArt}>
                <Landscape className={styles.landscape} />
                <span>01.1</span>
              </div>
              <div className={styles.phaseCopy}>
                <p className={styles.eyebrow}>
                  FASE {GARDEN.order}{' '}
                  <span className={styles.availableLabel}>Disponível</span>
                </p>
                <h2>{GARDEN.title}</h2>
                <p className={styles.reference}>{GARDEN.biblicalReference}</p>
                <p>{GARDEN.subtitle}</p>
                <span className={styles.textLink}>Conhecer a fase →</span>
              </div>
            </Link>
            <Link href={routes.guild} className={styles.textLink}>
              Desafios da Guilda →
            </Link>
            <div className={styles.futurePhase}>
              <span aria-hidden="true">◇ · · · ◇</span>
              <div>
                <h2>Fase 1.2</h2>
                <p>
                  {!traveler.progress.gardenCompleted
                    ? 'Conclua O Jardim e a Escolha.'
                    : traveler.progress.nextPhaseUnlocked
                      ? 'Novo caminho liberado pela validação da Célula.'
                      : traveler.progress.guildChallengeStatus === 'awaiting-validation'
                        ? 'Aguardando aprovação do líder.'
                        : 'Aguardando Desafio da Célula.'}
                </p>
              </div>
              <span>{traveler.progress.nextPhaseUnlocked ? 'Disponível' : '🔒 Bloqueado'}</span>
            </div>
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
