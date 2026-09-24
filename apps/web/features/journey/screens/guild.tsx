'use client';
import Link from 'next/link';
import { Shell, RequireTraveler } from '../components/shell';
import { GUILD_CHALLENGE, JOURNEY_ROUTES as routes } from '../data/campaign';
import { updateGuildChallenge } from '../state/use-journey';
import styles from '../journey.module.css';
const labels = {
  locked: 'BLOQUEADO',
  available: 'DISPONÍVEL',
  'in-progress': 'EM ANDAMENTO',
  submitted: 'PRONTO PARA ENVIO',
  'awaiting-validation': 'AGUARDANDO APROVAÇÃO',
  'revision-requested': 'AJUSTE SOLICITADO',
  approved: 'APROVADO',
  'reward-available': 'RECOMPENSA DISPONÍVEL',
  completed: 'CONCLUÍDO',
} as const;
export function GuildScreen() {
  return (
    <Shell back={routes.map} backLabel="Voltar ao mapa">
      <RequireTraveler>
        {(traveler) => {
          const status = traveler.progress.guildChallengeStatus;
          const requirements = [
            {
              label: 'XP mínimo: 200',
              done: traveler.xp >= GUILD_CHALLENGE.xpRequired,
            },
            {
              label: 'Fase 1.1 concluída',
              done: traveler.progress.gardenCompleted,
            },
            {
              label: 'Desafio aprovado pela Guilda',
              done: status === 'approved',
            },
          ];
          return (
            <section className={styles.phasePresentation}>
              <div className={styles.phaseBanner}>
                <span className={styles.bannerLabel}>GUILDA · PROGRESSÃO</span>
              </div>
              <div className={styles.phaseDetails}>
                <p className={styles.eyebrow}>
                  SIMULAÇÃO LOCAL DE JOGADOR E LÍDER
                </p>
                <h1>Desafios da Guilda</h1>
                <p className={styles.phaseLead}>
                  Evoluir é uma conquista da jornada, não um prêmio automático
                  por terminar uma fase.
                </p>
                <div className={styles.guildCard}>
                  <span className={styles.guildStatus}>{labels[status]}</span>
                  <h2>{GUILD_CHALLENGE.title}</h2>
                  <p>{GUILD_CHALLENGE.description}</p>
                  <p className={styles.micro}>{GUILD_CHALLENGE.objective}</p>
                  {status === 'available' && (
                    <button
                      className={styles.primaryLink}
                      onClick={() => updateGuildChallenge('accept')}
                    >
                      Aceitar desafio →
                    </button>
                  )}
                  {status === 'in-progress' && (
                    <button
                      className={styles.primaryLink}
                      onClick={() => updateGuildChallenge('complete')}
                    >
                      Marcar como realizado →
                    </button>
                  )}
                  {status === 'awaiting-validation' && (
                    <p className={styles.guildNotice}>
                      O líder precisa confirmar a realização objetiva.
                    </p>
                  )}
                  {status === 'approved' && (
                    <p className={styles.guildNotice}>
                      A Guilda aprovou este desafio.
                    </p>
                  )}
                </div>
                <h2>Requisitos para o próximo nível</h2>
                <ul className={styles.requirementList}>
                  {requirements.map((item) => (
                    <li
                      key={item.label}
                      className={item.done ? styles.requirementDone : ''}
                    >
                      <span aria-hidden="true">{item.done ? '✓' : '○'}</span>
                      {item.label}
                    </li>
                  ))}
                </ul>
                {traveler.xp >= GUILD_CHALLENGE.xpRequired &&
                  status !== 'approved' && (
                    <p className={styles.guildWarning}>
                      Você possui XP suficiente, mas ainda precisa concluir os
                      requisitos da sua jornada.
                    </p>
                  )}
                {status === 'awaiting-validation' && (
                  <div className={styles.leaderPanel}>
                    <p className={styles.eyebrow}>VISÃO DO LÍDER · SIMULAÇÃO</p>
                    <p>Solicitação de {traveler.name}</p>
                    <button
                      className={styles.primaryLink}
                      onClick={() => updateGuildChallenge('approve')}
                    >
                      Aprovar realização
                    </button>
                    <button
                      className={styles.textLink}
                      onClick={() => updateGuildChallenge('return')}
                    >
                      Devolver para realização novamente
                    </button>
                  </div>
                )}
                {status === 'approved' && traveler.level < 2 && (
                  <p className={styles.guildWarning}>
                    Desafio aprovado. O nível ainda depende de XP e da conclusão
                    da fase obrigatória.
                  </p>
                )}
                <Link href={routes.map} className={styles.textLink}>
                  Voltar ao mapa
                </Link>
              </div>
            </section>
          );
        }}
      </RequireTraveler>
    </Shell>
  );
}
