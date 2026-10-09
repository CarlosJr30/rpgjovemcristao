'use client';

import { useState } from 'react';
import { Shell, RequireTraveler } from '../components/shell';
import { GUILD_CHALLENGE, JOURNEY_ROUTES as routes } from '../data/campaign';
import {
  PHASE_GUILD_REWARD,
  specialChallengeRewardTables,
} from '../data/guildRewards';
import {
  claimPhaseGuildReward,
  claimSpecialChallengeReward,
  createTestGuild,
  joinGuild,
  updateGuildChallenge,
  updateSpecialChallenge,
  useJourney,
} from '../state/use-journey';
import type {
  GuildChallengeStatus,
  SpecialChallengeRewardTier,
} from '../domain/traveler';
import styles from '../journey.module.css';
import { GuildContentBoard } from '../components/guild-content-board';
import { localGuildRepository } from '../data/localGuilds';
import { useAuth } from '../../../lib/supabase/auth-context';
import { OnlineGuildHub } from '../components/online-guild-hub';
import {
  playerSpecialSection,
  playerPhaseSection,
} from '../data/guildPlayerVisibility';
import { useGuildClock } from '../hooks/use-guild-clock';
import { GuildHero } from '../components/guild-hero';
import { guildContentRepository } from '../data/guildContent';
import {
  localContentDeadline,
  playerContentSection,
} from '../data/guildPlayerVisibility';
import { journeyRepository } from '../persistence/journey-storage';
import { guildStatusLabel } from '../data/guildPresentation';
import { GuildHall } from '../components/guild-artwork';

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
  great: 'Grande',
  epic: 'Épica',
  extraordinary: 'Extraordinária',
};

export function GuildHub() {
  const auth = useAuth();
  const journey = useJourney();
  const now = useGuildClock(
    journey.status === 'ready'
      ? [
          ...journey.traveler.progress.specialChallenges.flatMap((challenge) =>
            challenge.expiresAt ? [Date.parse(challenge.expiresAt)] : [],
          ),
          ...(journey.traveler.progress.guildId
            ? guildContentRepository
                .list(journey.traveler.progress.guildId)
                .map((item) => localContentDeadline(item.date))
            : []),
        ]
      : [],
  );
  const [tab, setTab] = useState<'phase' | 'special' | 'pending' | 'completed'>(
    'phase',
  );
  const [leaderView, setLeaderView] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [guildFeedback, setGuildFeedback] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  return (
    <Shell back={routes.map} backLabel="Voltar ao mapa">
      <RequireTraveler>
        {(traveler) => {
          if (auth.status === 'signedIn')
            return <OnlineGuildHub traveler={traveler} />;
          const progress = traveler.progress;
          const status = progress.guildChallengeStatus;
          const phaseSection = playerPhaseSection(status);
          const localGuild = progress.guildId
            ? localGuildRepository.findById(progress.guildId)
            : null;
          const isLocalLeader = localGuild?.leaderId === traveler.id;
          const sections = [
            phaseSection,
            ...progress.specialChallenges.map((item) =>
              playerSpecialSection(item, now),
            ),
            ...(progress.guildId
              ? guildContentRepository
                  .list(progress.guildId)
                  .map((item) =>
                    playerContentSection(
                      item,
                      progress.guildActivities[item.id],
                      now,
                    ),
                  )
              : []),
          ];
          const leader =
            localGuild?.leaderId === traveler.id
              ? traveler.name
              : journeyRepository
                  .listSaved()
                  .find((member) => member.id === localGuild?.leaderId)?.name;
          const visibleSpecials = progress.specialChallenges.filter(
            (challenge) => {
              const section = playerSpecialSection(challenge, now);
              if (tab === 'pending') return section === 'pending';
              if (tab === 'completed') return section === 'history';
              return leaderView || section === 'available';
            },
          );
          return (
            <GuildHall className={styles.guildHub}>
              <GuildHero
                name={localGuild?.name ?? 'Salão da Guilda'}
                leader={leader ?? 'Liderança não informada'}
                description="Um lugar de encontro, missões e cooperação entre Viajantes."
                participation={
                  progress.guildId
                    ? `${isLocalLeader ? 'Líder' : 'Membro'} · comunidade local`
                    : 'Você ainda não participa de uma Guilda'
                }
                available={
                  sections.filter((section) => section === 'available').length
                }
                pending={
                  sections.filter((section) => section === 'pending').length
                }
                completed={
                  sections.filter((section) => section === 'history').length
                }
              >
                {progress.guildId && (
                  <button
                    className={styles.textLink}
                    onClick={() => setLeaderView((value) => !value)}
                  >
                    {leaderView
                      ? 'Ver como jogador'
                      : 'Painel do líder · simulação local'}
                  </button>
                )}
              </GuildHero>

              {!progress.guildId && (
                <section className={styles.guildJoinCard}>
                  <h2>Entre em uma Célula/Guilda para continuar</h2>
                  <p>
                    Seu progresso da fase está preservado. A próxima fase
                    permanecerá bloqueada até você entrar em uma Guilda e
                    concluir o desafio final.
                  </p>
                  <p className={styles.guildWarning}>
                    Para avançar, participe de uma Guilda/Célula e receba a
                    aprovação objetiva do líder.
                  </p>
                  <div>
                    <input
                      aria-label="Código da Guilda"
                      value={inviteCode}
                      onChange={(event) => setInviteCode(event.target.value)}
                      placeholder="Código de convite"
                    />
                    <button
                      onClick={() => {
                        if (!inviteCode.trim()) {
                          setGuildFeedback('Informe um código de Guilda.');
                          return;
                        }
                        setGuildFeedback(
                          joinGuild(inviteCode)
                            ? 'Entrada concluída na Guilda local.'
                            : 'Código inválido ou inexistente neste ambiente local.',
                        );
                      }}
                    >
                      Entrar com código
                    </button>
                  </div>
                  <button
                    className={styles.primaryLink}
                    onClick={() => {
                      const code = createTestGuild();
                      if (!code) {
                        setGuildFeedback(
                          'Não foi possível criar a Guilda de teste.',
                        );
                        return;
                      }
                      setCreatedCode(code);
                      setGuildFeedback(
                        'Guilda de teste criada. Você é o líder local.',
                      );
                      setLeaderView(true);
                    }}
                  >
                    Criar Guilda de teste
                  </button>
                  <details>
                    <summary>Entender como funciona</summary>
                    <p>
                      Entre por um código local conhecido ou crie uma Guilda de
                      teste. Conclua e envie o desafio; depois, aprove a
                      realização no Modo Líder. A próxima fase só abre após o
                      resgate da recompensa aprovada.
                    </p>
                    <p>
                      Ambiente local de desenvolvimento: nenhuma Guilda online é
                      criada.
                    </p>
                  </details>
                  {createdCode && (
                    <p className={styles.guildSuccess}>
                      Código local: <strong>{createdCode}</strong>
                    </p>
                  )}
                  <p role="status">{guildFeedback}</p>
                </section>
              )}
              {progress.guildId && (
                <section className={styles.guildLocalIdentity}>
                  <b>{localGuild?.name ?? 'Guilda local'}</b>
                  <span>
                    {isLocalLeader ? 'Líder local' : 'Membro local'} · ambiente
                    de desenvolvimento
                  </span>
                  {localGuild?.code && <code>{localGuild.code}</code>}
                </section>
              )}
              <GuildContentBoard traveler={traveler} leaderView={leaderView} />

              <nav className={styles.guildTabs} aria-label="Seções de desafios">
                <button
                  onClick={() => setTab('phase')}
                  aria-pressed={tab === 'phase'}
                >
                  Desafios de fase
                </button>
                <button
                  onClick={() => setTab('special')}
                  aria-pressed={tab === 'special'}
                >
                  Desafios anteriores
                </button>
                <button
                  onClick={() => setTab('pending')}
                  aria-pressed={tab === 'pending'}
                >
                  Aguardando validação
                </button>
                <button
                  onClick={() => setTab('completed')}
                  aria-pressed={tab === 'completed'}
                >
                  Histórico de desafios
                </button>
              </nav>

              {((tab === 'phase' &&
                (leaderView || phaseSection === 'available')) ||
                (tab === 'completed' && phaseSection === 'history') ||
                (tab === 'pending' && phaseSection === 'pending')) && (
                <section className={styles.guildChallengePanel}>
                  <div>
                    <span className={styles.guildStatus}>
                      {statusLabels[status]}
                    </span>
                    <p className={styles.eyebrow}>
                      FASE 1.1 · O JARDIM E A ESCOLHA
                    </p>
                    <h2>{GUILD_CHALLENGE.title}</h2>
                    <p>
                      Escolha uma responsabilidade concreta que precisa ser
                      realizada e leve essa tarefa até o fim.
                    </p>
                  </div>
                  {!progress.gardenCompleted && (
                    <p className={styles.guildWarning}>
                      Conclua primeiro o conteúdo da Fase 1.1.
                    </p>
                  )}
                  {progress.gardenCompleted && !progress.guildId && (
                    <p className={styles.guildWarning}>
                      Entre em uma Guilda para receber e enviar este desafio.
                    </p>
                  )}
                  {!leaderView && status === 'available' && (
                    <button
                      className={styles.primaryLink}
                      onClick={() => updateGuildChallenge('accept')}
                    >
                      Iniciar atividade →
                    </button>
                  )}
                  {!leaderView &&
                    ['in-progress', 'revision-requested'].includes(status) && (
                      <button
                        className={styles.primaryLink}
                        onClick={() =>
                          status === 'revision-requested'
                            ? updateGuildChallenge('accept')
                            : updateGuildChallenge('complete')
                        }
                      >
                        {status === 'revision-requested'
                          ? 'Realizar ajuste →'
                          : 'Concluir atividade →'}
                      </button>
                    )}
                  {!leaderView && status === 'submitted' && (
                    <button
                      className={styles.primaryLink}
                      onClick={() => updateGuildChallenge('submit')}
                    >
                      Enviar para meu líder →
                    </button>
                  )}
                  {status === 'awaiting-validation' && (
                    <p className={styles.guildNotice}>
                      Atividade enviada. A próxima fase continua bloqueada
                      enquanto aguarda validação.
                    </p>
                  )}
                  {status === 'revision-requested' && (
                    <p className={styles.guildWarning}>
                      O líder solicitou um ajuste. Você pode realizar novamente
                      e reenviar.
                    </p>
                  )}
                  {leaderView && status === 'awaiting-validation' && (
                    <div className={styles.leaderDecision}>
                      <button onClick={() => updateGuildChallenge('approve')}>
                        Aprovar realização
                      </button>
                      <button onClick={() => updateGuildChallenge('return')}>
                        Solicitar ajuste
                      </button>
                    </div>
                  )}
                  {status === 'reward-available' && (
                    <div className={styles.guildEpicReward}>
                      <strong>DESAFIO APROVADO!</strong>
                      <span aria-hidden="true">▣</span>
                      <h3>{PHASE_GUILD_REWARD.chestLabel}</h3>
                      <p>
                        +{PHASE_GUILD_REWARD.xp} XP · ◈{' '}
                        {PHASE_GUILD_REWARD.coins} moedas
                      </p>
                      <button onClick={claimPhaseGuildReward}>
                        Receber recompensa
                      </button>
                    </div>
                  )}
                  {status === 'completed' && (
                    <p className={styles.guildSuccess}>
                      ✓ Desafio concluído e recompensa processada. Próxima fase
                      desbloqueada.
                    </p>
                  )}
                </section>
              )}
              {tab === 'phase' &&
                !leaderView &&
                phaseSection !== 'available' && (
                  <div className={styles.guildEmpty}>
                    <span aria-hidden="true">✦</span>
                    <h2>Tudo concluído por enquanto.</h2>
                    <p>
                      {status === 'locked'
                        ? 'Conclua a fase para receber o próximo desafio da célula.'
                        : status === 'awaiting-validation'
                          ? 'Seu envio está na área Aguardando validação.'
                          : 'Seu desafio concluído está no Histórico de desafios.'}
                    </p>
                  </div>
                )}

              {tab !== 'phase' && (
                <section className={styles.guildSpecialGrid}>
                  {tab === 'special' && (
                    <p>
                      Desafios criados anteriormente para este Viajante
                      continuam acessíveis. Novos desafios são publicados no
                      painel acima.
                    </p>
                  )}
                  {visibleSpecials.map((challenge) => {
                    const reward =
                      specialChallengeRewardTables[challenge.rewardTier];
                    return (
                      <article
                        key={challenge.id}
                        className={styles.guildSpecialCard}
                      >
                        <span>
                          {tierLabels[challenge.rewardTier]} ·{' '}
                          {guildStatusLabel(challenge.status)}
                        </span>
                        <h2>{challenge.title}</h2>
                        <p>{challenge.description}</p>
                        <small>
                          {reward.chestLabel} · +{reward.xp} XP · ◈{' '}
                          {reward.coins}
                        </small>
                        {!leaderView &&
                          ['available', 'revision-requested'].includes(
                            challenge.status,
                          ) && (
                            <button
                              onClick={() =>
                                updateSpecialChallenge(challenge.id, 'accept')
                              }
                            >
                              Aceitar desafio
                            </button>
                          )}
                        {!leaderView && challenge.status === 'in-progress' && (
                          <button
                            onClick={() =>
                              updateSpecialChallenge(challenge.id, 'submit')
                            }
                          >
                            Concluir e enviar
                          </button>
                        )}
                        {leaderView &&
                          challenge.status === 'awaiting-validation' && (
                            <div className={styles.leaderDecision}>
                              <button
                                onClick={() =>
                                  updateSpecialChallenge(
                                    challenge.id,
                                    'approve',
                                  )
                                }
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() =>
                                  updateSpecialChallenge(challenge.id, 'return')
                                }
                              >
                                Solicitar ajuste
                              </button>
                            </div>
                          )}
                        {!leaderView &&
                          challenge.status === 'reward-available' && (
                            <button
                              onClick={() =>
                                claimSpecialChallengeReward(challenge.id)
                              }
                            >
                              Receber {reward.chestLabel}
                            </button>
                          )}
                        {challenge.status === 'completed' && (
                          <b>✓ Recompensa recebida</b>
                        )}
                      </article>
                    );
                  })}
                  {!visibleSpecials.length && (
                    <p>Nenhum desafio nesta seção.</p>
                  )}
                </section>
              )}
            </GuildHall>
          );
        }}
      </RequireTraveler>
    </Shell>
  );
}
