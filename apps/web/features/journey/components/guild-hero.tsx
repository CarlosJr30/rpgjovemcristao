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
  children,
}: {
  name: string;
  leader: string;
  description: string;
  participation: string;
  available: number;
  pending: number;
  completed: number;
  management?: boolean;
  children?: ReactNode;
}) {
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
        <h1>{name}</h1>
        <p>{description}</p>
        <p className={styles.identity}>
          <span>Líder: {leader}</span>
          <span>{participation}</span>
        </p>
        {children}
      </div>
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
      <small className={styles.scope}>
        Resumo das atividades carregadas. Realizações registradas, sem medir fé
        ou espiritualidade.
      </small>
    </header>
  );
}
