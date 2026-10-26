import type { ReactNode } from 'react';
import styles from './guild-experience.module.css';
import { GuildArtwork } from './guild-artwork';

export function GuildHero({
  name,
  leader,
  description,
  participation,
  available,
  pending,
  completed,
  management = false,
  headingLevel = 1,
  children,
}: {
  name: string;
  leader: string;
  description: string;
  participation: string;
  available?: number;
  pending?: number;
  completed?: number;
  management?: boolean;
  headingLevel?: 1 | 2;
  children?: ReactNode;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h1';
  return (
    <header className={styles.hero}>
      {management && (
        <GuildArtwork slot="guildLeaderTable" className={styles.leaderScene} />
      )}
      <GuildArtwork slot="guildBanner" className={styles.banner} />
      <div className={styles.emblem} aria-hidden="true">
        {name.trim().slice(0, 1).toUpperCase() || 'G'}
      </div>
      <div>
        <p className={styles.eyebrow}>
          {management ? 'PAINEL DO LÍDER' : 'GUILDA · JUNTOS NA JORNADA'}
        </p>
        <Heading>{name}</Heading>
        <p>{description}</p>
        <p className={styles.identity}>
          <span>Líder: {leader}</span>
          <span>{participation}</span>
        </p>
        {children}
      </div>
      {available !== undefined &&
        pending !== undefined &&
        completed !== undefined && (
          <dl
            className={styles.metrics}
            aria-label="Resumo das atividades carregadas"
          >
            <div>
              <dt>{management ? 'MISSÕES ATIVAS' : 'DISPONÍVEIS'}</dt>
              <dd>{available}</dd>
            </div>
            <div>
              <dt>AGUARDANDO APROVAÇÃO</dt>
              <dd>{pending}</dd>
            </div>
            <div>
              <dt>CONCLUÍDAS</dt>
              <dd>{completed}</dd>
            </div>
          </dl>
        )}
      {available !== undefined &&
        pending !== undefined &&
        completed !== undefined && (
          <small className={styles.scope}>
            Resumo das atividades carregadas. Realizações registradas, sem medir
            fé ou espiritualidade.
          </small>
        )}
    </header>
  );
}
