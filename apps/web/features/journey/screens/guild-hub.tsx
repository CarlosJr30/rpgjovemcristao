'use client';

import { useState } from 'react';
import { Shell, RequireTraveler } from '../components/shell';
import { GUILD_CHALLENGE, JOURNEY_ROUTES as routes } from '../data/campaign';
import { PHASE_GUILD_REWARD, specialChallengeRewardTables } from '../data/guildRewards';
import {
  claimPhaseGuildReward,
  claimSpecialChallengeReward,
  joinGuild,
  updateGuildChallenge,
  updateSpecialChallenge,
} from '../state/use-journey';
import type { GuildChallengeStatus, SpecialChallengeRewardTier } from '../domain/traveler';
import styles from '../journey.module.css';
import { GuildContentBoard } from '../components/guild-content-board';

const statusLabels: Record<GuildChallengeStatus, string> = {
  locked: 'BLOQUEADO',
  available: 'DISPONÍVEL',
  'in-progress': 'EM ANDAMENTO',
  submitted: 'PRONTO PARA ENVIO',
  'awaiting-validation': 'AGUARDANDO VALIDAÇÃO',
  'revision-requested': 'AJUSTE SOLICITADO',
  approved: 'APROVADO',
  'reward-available': 'RECOMPENSA DISPONÍVEL',
  completed: 'CONCLUÍDO',
};
const tierLabels: Record<SpecialChallengeRewardTier, string> = {
  great: 'Grande', epic: 'Épica', extraordinary: 'Extraordinária',
};

export function GuildHub() {
  const [tab, setTab] = useState<'phase' | 'special' | 'pending' | 'completed'>('phase');
  const [leaderView, setLeaderView] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  return (
    <Shell back={routes.map} backLabel="Voltar ao mapa">
      <RequireTraveler>
        {(traveler) => {
          const progress = traveler.progress;
          const status = progress.guildChallengeStatus;
          const visibleSpecials = progress.specialChallenges.filter((challenge) => {
            if (tab === 'pending') return challenge.status === 'awaiting-validation';
            if (tab === 'completed') return challenge.status === 'completed';
            return true;
          });
          return (
            <section className={styles.guildHub}>
              <header className={styles.guildHeroBanner}>
                <p className={styles.eyebrow}>GUILDA · DESAFIOS</p>
                <h1>Desafios da Célula</h1>
                <p>Atividades realizadas são validadas objetivamente. Nenhuma aprovação mede fé ou espiritualidade.</p>
                <button className={styles.textLink} onClick={() => setLeaderView((value) => !value)}>
                  {leaderView ? 'Ver como jogador' : 'Painel do líder · simulação local'}
                </button>
              </header>

              {!progress.guildId && (
                <section className={styles.guildJoinCard}>
                  <h2>Entre em uma Célula/Guilda para continuar</h2>
                  <p>Seu progresso da fase está preservado. A próxima fase permanecerá bloqueada até você entrar em uma Guilda e concluir o desafio final.</p>
                  <div>
                    <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Código de convite" />
                    <button onClick={() => joinGuild(inviteCode)}>Entrar com código</button>
                  </div>
                </section>
              )}
              <GuildContentBoard traveler={traveler} leaderView={leaderView} />

              <nav className={styles.guildTabs} aria-label="Seções de desafios">
                <button onClick={() => setTab('phase')} aria-pressed={tab === 'phase'}>Desafios de fase</button>
                <button onClick={() => setTab('special')} aria-pressed={tab === 'special'}>Desafios anteriores</button>
                <button onClick={() => setTab('pending')} aria-pressed={tab === 'pending'}>Aguardando validação</button>
                <button onClick={() => setTab('completed')} aria-pressed={tab === 'completed'}>Concluídos</button>
              </nav>

              {tab === 'phase' && (
                <section className={styles.guildChallengePanel}>
                  <div>
                    <span className={styles.guildStatus}>{statusLabels[status]}</span>
                    <p className={styles.eyebrow}>FASE 1.1 · O JARDIM E A ESCOLHA</p>
                    <h2>{GUILD_CHALLENGE.title}</h2>
                    <p>Escolha uma responsabilidade concreta que precisa ser realizada e leve essa tarefa até o fim.</p>
                  </div>
                  {!progress.gardenCompleted && <p className={styles.guildWarning}>Conclua primeiro o conteúdo da Fase 1.1.</p>}
                  {progress.gardenCompleted && !progress.guildId && <p className={styles.guildWarning}>Entre em uma Guilda para receber e enviar este desafio.</p>}
                  {!leaderView && status === 'available' && <button className={styles.primaryLink} onClick={() => updateGuildChallenge('accept')}>Iniciar atividade →</button>}
                  {!leaderView && ['in-progress', 'revision-requested'].includes(status) && <button className={styles.primaryLink} onClick={() => status === 'revision-requested' ? updateGuildChallenge('accept') : updateGuildChallenge('complete')}>{status === 'revision-requested' ? 'Realizar ajuste →' : 'Concluir atividade →'}</button>}
                  {!leaderView && status === 'submitted' && <button className={styles.primaryLink} onClick={() => updateGuildChallenge('submit')}>Enviar para meu líder →</button>}
                  {status === 'awaiting-validation' && <p className={styles.guildNotice}>Atividade enviada. A próxima fase continua bloqueada enquanto aguarda validação.</p>}
                  {status === 'revision-requested' && <p className={styles.guildWarning}>O líder solicitou um ajuste. Você pode realizar novamente e reenviar.</p>}
                  {leaderView && status === 'awaiting-validation' && (
                    <div className={styles.leaderDecision}>
                      <button onClick={() => updateGuildChallenge('approve')}>Aprovar realização</button>
                      <button onClick={() => updateGuildChallenge('return')}>Solicitar ajuste</button>
                    </div>
                  )}
                  {status === 'reward-available' && (
                    <div className={styles.guildEpicReward}>
                      <strong>DESAFIO APROVADO!</strong>
                      <span aria-hidden="true">▣</span>
                      <h3>{PHASE_GUILD_REWARD.chestLabel}</h3>
                      <p>+{PHASE_GUILD_REWARD.xp} XP · ◈ {PHASE_GUILD_REWARD.coins} moedas</p>
                      <button onClick={claimPhaseGuildReward}>Abrir Baú</button>
                    </div>
                  )}
                  {status === 'completed' && <p className={styles.guildSuccess}>✓ Desafio concluído e recompensa processada. Próxima fase desbloqueada.</p>}
                </section>
              )}

              {tab !== 'phase' && (
                <section className={styles.guildSpecialGrid}>
                  {tab === 'special' && <p>Desafios criados anteriormente para este Viajante continuam acessíveis. Novos desafios são publicados no painel acima.</p>}
                  {visibleSpecials.map((challenge) => {
                    const reward = specialChallengeRewardTables[challenge.rewardTier];
                    return (
                      <article key={challenge.id} className={styles.guildSpecialCard}>
                        <span>{tierLabels[challenge.rewardTier]} · {challenge.status}</span>
                        <h2>{challenge.title}</h2>
                        <p>{challenge.description}</p>
                        <small>{reward.chestLabel} · +{reward.xp} XP · ◈ {reward.coins}</small>
                        {!leaderView && ['available', 'revision-requested'].includes(challenge.status) && <button onClick={() => updateSpecialChallenge(challenge.id, 'accept')}>Aceitar desafio</button>}
                        {!leaderView && challenge.status === 'in-progress' && <button onClick={() => updateSpecialChallenge(challenge.id, 'submit')}>Concluir e enviar</button>}
                        {leaderView && challenge.status === 'awaiting-validation' && <div className={styles.leaderDecision}><button onClick={() => updateSpecialChallenge(challenge.id, 'approve')}>Aprovar</button><button onClick={() => updateSpecialChallenge(challenge.id, 'return')}>Solicitar ajuste</button></div>}
                        {!leaderView && challenge.status === 'reward-available' && <button onClick={() => claimSpecialChallengeReward(challenge.id)}>Abrir {reward.chestLabel}</button>}
                        {challenge.status === 'completed' && <b>✓ Recompensa recebida</b>}
                      </article>
                    );
                  })}
                  {!visibleSpecials.length && <p>Nenhum desafio nesta seção.</p>}
                </section>
              )}
            </section>
          );
        }}
      </RequireTraveler>
    </Shell>
  );
}
