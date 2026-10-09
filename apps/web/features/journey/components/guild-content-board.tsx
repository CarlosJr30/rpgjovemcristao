'use client';
import { useState, type FormEvent } from 'react';
import type { Traveler } from '../domain/traveler';
import {
  guildContentRepository,
  type GuildContent,
  type GuildContentKind,
  type GuildContentTier,
} from '../data/guildContent';
import { journeyRepository } from '../persistence/journey-storage';
import {
  approveGuildActivity,
  claimGuildActivity,
  publishGuildContent,
  requestGuildActivityRevision,
  submitGuildActivity,
  updateGuildContent,
} from '../state/use-journey';
import { GuildRewardDetails, GuildRewardPreview } from './guild-reward-summary';
import styles from '../journey.module.css';
import {
  localContentDeadline,
  playerContentSection,
  type PlayerGuildSection,
} from '../data/guildPlayerVisibility';
import { useGuildClock } from '../hooks/use-guild-clock';
import { gameAudio } from '../audio/audio-manager';
import { guildStatusLabel } from '../data/guildPresentation';
import hall from './guild-experience.module.css';
import { GuildArtwork } from './guild-artwork';

export function GuildContentBoard({
  traveler,
  leaderView,
}: {
  traveler: Traveler;
  leaderView: boolean;
}) {
  const [kind, setKind] = useState<GuildContentKind>('challenge');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [biblicalReference, setBiblicalReference] = useState('');
  const [bibleUrl, setBibleUrl] = useState('');
  const [objective, setObjective] = useState('');
  const [date, setDate] = useState('');
  const [theme, setTheme] = useState('');
  const [questions, setQuestions] = useState('');
  const [groupActivity, setGroupActivity] = useState('');
  const [practicalMission, setPracticalMission] = useState('');
  const [difficulty, setDifficulty] = useState<'normal' | 'dificil'>('normal');
  const [audience, setAudience] = useState<'individual' | 'collective'>(
    'individual',
  );
  const [collectiveTarget, setCollectiveTarget] = useState(10);
  const [tier, setTier] = useState<GuildContentTier>('normal');
  const [feedback, setFeedback] = useState('');
  const [approvedTier, setApprovedTier] = useState<GuildContentTier | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [playerSection, setPlayerSection] =
    useState<PlayerGuildSection>('available');
  void revision;
  const guildId = traveler.progress.guildId;
  const activities = guildId ? guildContentRepository.list(guildId) : [];
  const now = useGuildClock(
    activities.map((item) => localContentDeadline(item.date)),
  );
  if (!guildId) return null;
  const visibleActivities = activities.filter(
    (item) =>
      leaderView ||
      playerContentSection(
        item,
        traveler.progress.guildActivities[item.id],
        now,
      ) === playerSection,
  );
  const members = journeyRepository
    .listSaved()
    .filter((member) => member.progress.guildId === guildId);
  const pendingApprovals = activities.flatMap((item) =>
    members
      .filter(
        (member) => member.progress.guildActivities[item.id] === 'submitted',
      )
      .map((member) => ({
        item,
        member,
        submittedAt: member.progress.guildActivitySubmittedAt[item.id],
      })),
  );

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setBiblicalReference('');
    setBibleUrl('');
    setObjective('');
    setDate('');
    setTheme('');
    setQuestions('');
    setGroupActivity('');
    setPracticalMission('');
    setEditingId(null);
  };
  const publish = (event: FormEvent) => {
    event.preventDefault();
    if (kind === 'lesson' && !bibleUrl) {
      setFeedback('A lição precisa de um link bíblico.');
      return;
    }
    const payload = {
      kind,
      title: title.trim(),
      description: description.trim(),
      biblicalReference: biblicalReference.trim(),
      bibleUrl: bibleUrl.trim(),
      objective: kind === 'lesson' ? '' : objective.trim(),
      date,
      theme: kind === 'lesson' ? theme.trim() : '',
      questions: kind === 'lesson' ? questions.trim() : '',
      groupActivity: kind === 'lesson' ? groupActivity.trim() : '',
      practicalMission: kind === 'lesson' ? practicalMission.trim() : '',
      difficulty,
      audience,
      collectiveTarget:
        audience === 'collective' && kind !== 'lesson'
          ? collectiveTarget
          : null,
      tier,
    };
    const original = editingId
      ? activities.find((item) => item.id === editingId)
      : null;
    const saved = original
      ? updateGuildContent({ ...original, ...payload })
      : publishGuildContent(payload);
    setFeedback(
      saved
        ? `${kind === 'lesson' ? 'Lição' : kind === 'mission' ? 'Missão' : 'Desafio'} ${original ? 'atualizado' : 'publicado'} na Guilda.`
        : 'Não foi possível salvar. Confira os campos e o link bíblico.',
    );
    if (saved) {
      clearForm();
      setRevision((value) => value + 1);
    }
  };
  const act = (
    action: () => boolean,
    success: string,
    approvalTier?: GuildContentTier,
  ) => {
    const applied = action();
    if (applied)
      gameAudio.playEffect(
        success === 'Recompensa recebida.' ? 'reward' : 'guildApproval',
      );
    setFeedback(
      applied ? success : 'Não foi possível atualizar esta atividade.',
    );
    setRevision((value) => value + 1);
    setApprovedTier(applied && approvalTier ? approvalTier : null);
  };
  const edit = (item: GuildContent) => {
    setEditingId(item.id);
    setKind(item.kind);
    setTitle(item.title);
    setDescription(item.description);
    setBiblicalReference(item.biblicalReference);
    setBibleUrl(item.bibleUrl);
    setObjective(item.objective);
    setDate(item.date);
    setTheme(item.theme);
    setQuestions(item.questions);
    setGroupActivity(item.groupActivity);
    setPracticalMission(item.practicalMission);
    setDifficulty(item.difficulty);
    setAudience(item.audience);
    setCollectiveTarget(item.collectiveTarget ?? 10);
    setTier(item.tier);
    setFeedback(`Editando: ${item.title}`);
  };
  const setContentStatus = (
    item: GuildContent,
    status: GuildContent['status'],
  ) =>
    act(
      () => updateGuildContent({ ...item, status }),
      status === 'active'
        ? 'Conteúdo reativado.'
        : status === 'closed'
          ? 'Conteúdo encerrado.'
          : 'Conteúdo arquivado.',
    );

  return (
    <section
      className={styles.guildChallengePanel}
      aria-labelledby="guild-content-title"
    >
      <p className={styles.eyebrow}>ESTA SEMANA NA GUILDA · SIMULAÇÃO LOCAL</p>
      <h2 id="guild-content-title">Lições, missões e desafios</h2>
      <p>
        O conteúdo publicado fica disponível aos Viajantes desta Guilda neste
        navegador. A validação confirma apenas a realização da atividade.
      </p>
      <p role="status" aria-live="polite">
        {feedback}
      </p>
      {approvedTier && (
        <div className={hall.attention}>
          <strong>ATIVIDADE APROVADA</strong>
          <p>Recompensa processada para o Viajante:</p>
          <GuildRewardDetails tier={approvedTier} showChest />
        </div>
      )}
      {leaderView && (
        <div className={styles.guildLeaderWorkspace}>
          <header className={styles.guildLeaderHeader}>
            <GuildArtwork
              slot="guildLeaderTable"
              className={hall.localLeaderScene}
            />
            <span>MODO LÍDER</span>
            <h2>PAINEL DO LÍDER</h2>
            <p>
              Ambiente local de teste. Estas ações afetam somente Viajantes
              salvos neste navegador.
            </p>
          </header>
          <section
            id="guild-pending-approvals"
            className={styles.guildApprovals}
          >
            <h3>APROVAÇÕES PENDENTES</h3>
            {pendingApprovals.map(({ item, member, submittedAt }) => (
              <article key={`${item.id}-${member.id}`}>
                <div>
                  <b>{member.name}</b>
                  <span>{item.title}</span>
                  <small>
                    Enviado em{' '}
                    {submittedAt
                      ? new Date(submittedAt).toLocaleDateString('pt-BR')
                      : 'data não registrada'}
                  </small>
                </div>
                <span className={hall.status}>ENVIADA PARA APROVAÇÃO</span>
                {item.kind !== 'lesson' && (
                  <GuildRewardDetails tier={item.tier} />
                )}
                <div className={styles.leaderDecision}>
                  <button
                    onClick={() =>
                      act(
                        () => approveGuildActivity(member.id, item.id),
                        'Atividade aprovada.',
                        item.tier,
                      )
                    }
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() =>
                      act(
                        () => requestGuildActivityRevision(member.id, item.id),
                        'Revisão solicitada.',
                      )
                    }
                  >
                    Solicitar revisão
                  </button>
                </div>
              </article>
            ))}
            {!pendingApprovals.length && (
              <p>Nenhuma atividade aguarda validação.</p>
            )}
          </section>
          <nav
            className={styles.guildTabs}
            aria-label="Ações do Painel do Líder"
          >
            <button
              onClick={() => setKind('challenge')}
              aria-pressed={kind === 'challenge'}
            >
              + Criar Desafio
            </button>
            <button
              onClick={() => setKind('lesson')}
              aria-pressed={kind === 'lesson'}
            >
              + Criar Lição
            </button>
            <button
              onClick={() => setKind('mission')}
              aria-pressed={kind === 'mission'}
            >
              + Criar Missão
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('guild-pending-approvals')
                  ?.scrollIntoView()
              }
            >
              Aprovações
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('guild-active-content')
                  ?.scrollIntoView()
              }
            >
              Conteúdo ativo
            </button>
          </nav>
          <form className={styles.guildCreateChallenge} onSubmit={publish}>
            <h3>
              {editingId
                ? 'Editar conteúdo'
                : kind === 'challenge'
                  ? 'Novo desafio'
                  : kind === 'lesson'
                    ? 'Nova lição'
                    : 'Nova missão'}
            </h3>
            <label>
              Título
              <input
                required
                maxLength={80}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Descrição / contexto
              <textarea
                required
                maxLength={600}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <label>
              Passagem bíblica {kind === 'mission' && '(opcional)'}
              <input
                required={kind !== 'mission'}
                maxLength={80}
                value={biblicalReference}
                onChange={(event) => setBiblicalReference(event.target.value)}
              />
            </label>
            <label>
              Link bíblico (bible.com)
              <input
                type="url"
                required={kind === 'lesson'}
                value={bibleUrl}
                onChange={(event) => setBibleUrl(event.target.value)}
                placeholder="https://www.bible.com/..."
              />
            </label>
            {kind === 'lesson' ? (
              <>
                <label>
                  Tema
                  <input
                    required
                    maxLength={80}
                    value={theme}
                    onChange={(event) => setTheme(event.target.value)}
                  />
                </label>
                <label>
                  Perguntas para conversa
                  <textarea
                    required
                    maxLength={500}
                    value={questions}
                    onChange={(event) => setQuestions(event.target.value)}
                  />
                </label>
                <label>
                  Atividade em grupo
                  <textarea
                    maxLength={300}
                    value={groupActivity}
                    onChange={(event) => setGroupActivity(event.target.value)}
                  />
                </label>
                <label>
                  Missão prática
                  <textarea
                    maxLength={300}
                    value={practicalMission}
                    onChange={(event) =>
                      setPracticalMission(event.target.value)
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Objetivo
                  <input
                    required
                    maxLength={240}
                    value={objective}
                    onChange={(event) => setObjective(event.target.value)}
                  />
                </label>
                <label>
                  Dificuldade
                  <select
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(event.target.value as 'normal' | 'dificil')
                    }
                  >
                    <option value="normal">Normal</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </label>
                <label>
                  Formato
                  <select
                    value={audience}
                    onChange={(event) =>
                      setAudience(
                        event.target.value as 'individual' | 'collective',
                      )
                    }
                  >
                    <option value="individual">Individual</option>
                    <option value="collective">Coletivo</option>
                  </select>
                </label>
                {audience === 'collective' && (
                  <label>
                    Meta coletiva
                    <input
                      type="number"
                      min={2}
                      max={1000}
                      value={collectiveTarget}
                      onChange={(event) =>
                        setCollectiveTarget(Number(event.target.value))
                      }
                    />
                  </label>
                )}
                <label>
                  Tier da recompensa
                  <select
                    value={tier}
                    onChange={(event) =>
                      setTier(event.target.value as GuildContentTier)
                    }
                  >
                    <option value="normal">Normal</option>
                    <option value="great">Grande</option>
                    <option value="epic">Épica</option>
                    <option value="extraordinary">Extraordinária</option>
                  </select>
                </label>
                <GuildRewardPreview tier={tier} />
              </>
            )}
            <label>
              Data / prazo
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <button type="submit">
              {editingId ? 'Salvar alterações' : 'Publicar na Guilda'}
            </button>
            {editingId && (
              <button type="button" onClick={clearForm}>
                Cancelar edição
              </button>
            )}
          </form>
        </div>
      )}
      {!leaderView && (
        <nav
          className={styles.guildTabs}
          aria-label="Minhas atividades da Guilda"
        >
          <button
            aria-pressed={playerSection === 'available'}
            onClick={() => setPlayerSection('available')}
          >
            Disponíveis
          </button>
          <button
            aria-pressed={playerSection === 'pending'}
            onClick={() => setPlayerSection('pending')}
          >
            Aguardando aprovação
          </button>
          <button
            aria-pressed={playerSection === 'history'}
            onClick={() => setPlayerSection('history')}
          >
            Concluídas
          </button>
        </nav>
      )}
      <div id="guild-active-content" className={styles.guildSpecialGrid}>
        {visibleActivities.map((item) => {
          const status = traveler.progress.guildActivities[item.id];
          const approvals = members.filter((member) =>
            ['approved', 'claimed'].includes(
              member.progress.guildActivities[item.id] ?? '',
            ),
          ).length;
          const pending = members.filter(
            (member) =>
              member.progress.guildActivities[item.id] === 'submitted',
          );
          return (
            <article
              className={styles.guildSpecialCard}
              key={item.id}
              data-special={
                item.kind !== 'lesson' &&
                ['epic', 'extraordinary'].includes(item.tier)
              }
            >
              <GuildArtwork
                slot="guildMissionParchment"
                className={hall.parchment}
              />
              <span>
                {item.kind === 'lesson'
                  ? 'LIÇÃO'
                  : item.kind === 'mission'
                    ? 'MISSÃO'
                    : 'DESAFIO'}{' '}
                · {item.audience === 'collective' ? 'COLETIVO' : 'INDIVIDUAL'} ·{' '}
                {item.status === 'active'
                  ? 'ATIVA'
                  : guildStatusLabel(item.status)}
              </span>
              <h3>{item.title}</h3>
              <p className={hall.excerpt}>{item.description}</p>
              <span className={hall.status}>
                {status === 'claimed' ||
                status === 'submitted' ||
                status === 'approved'
                  ? guildStatusLabel(status)
                  : item.status === 'active' &&
                      localContentDeadline(item.date) <= now
                    ? 'EXPIRADA'
                    : guildStatusLabel(status ?? item.status)}
              </span>
              <details>
                <summary>
                  {item.kind === 'lesson' ? 'Ver lição' : 'Ver missão'}
                </summary>
                <p>{item.description}</p>
                {item.biblicalReference && (
                  <p>Referência bíblica: {item.biblicalReference}</p>
                )}
                {item.bibleUrl && (
                  <a
                    href={item.bibleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir na Bíblia ↗
                  </a>
                )}
                {item.objective && <p>Objetivo: {item.objective}</p>}
                {item.theme && <p>Tema: {item.theme}</p>}
                {item.questions && <p>Perguntas: {item.questions}</p>}
                {item.groupActivity && (
                  <p>Atividade em grupo: {item.groupActivity}</p>
                )}
                {item.practicalMission && (
                  <p>Missão prática: {item.practicalMission}</p>
                )}
              </details>
              {item.date && <p>Data / prazo: {item.date}</p>}
              {item.kind !== 'lesson' && (
                <>
                  <GuildRewardDetails
                    tier={item.tier}
                    showChest={
                      ['epic', 'extraordinary'].includes(item.tier) ||
                      status === 'approved' ||
                      status === 'claimed'
                    }
                  />
                  {item.collectiveTarget && (
                    <p>
                      Objetivo da Guilda: {approvals}/{item.collectiveTarget}{' '}
                      <progress
                        max={item.collectiveTarget}
                        value={approvals}
                        aria-label={`Progresso coletivo de ${item.title}`}
                      />
                    </p>
                  )}
                  {!leaderView &&
                    item.status === 'active' &&
                    (!status || status === 'revision-requested') && (
                      <button
                        onClick={() =>
                          act(
                            () => submitGuildActivity(item.id),
                            'Atividade enviada para validação.',
                          )
                        }
                      >
                        {status === 'revision-requested'
                          ? 'Reenviar após revisão'
                          : 'Concluir e enviar'}
                      </button>
                    )}
                  {!leaderView && status === 'submitted' && (
                    <p>Aguardando aprovação objetiva.</p>
                  )}
                  {!leaderView && status === 'revision-requested' && (
                    <p>
                      O líder solicitou revisão. Ajuste a realização e reenvie.
                    </p>
                  )}
                  {!leaderView && status === 'approved' && (
                    <button
                      onClick={() =>
                        act(
                          () => claimGuildActivity(item.id),
                          'Recompensa recebida.',
                        )
                      }
                    >
                      Receber recompensa
                    </button>
                  )}
                  {!leaderView && status === 'claimed' && (
                    <b>✓ Recompensa recebida</b>
                  )}
                </>
              )}
              {leaderView && (
                <div className={styles.guildContentActions}>
                  <button onClick={() => edit(item)}>Editar</button>
                  {item.status === 'active' ? (
                    <button onClick={() => setContentStatus(item, 'closed')}>
                      Encerrar
                    </button>
                  ) : (
                    <button onClick={() => setContentStatus(item, 'active')}>
                      Reativar
                    </button>
                  )}
                  <button onClick={() => setContentStatus(item, 'archived')}>
                    Arquivar
                  </button>
                </div>
              )}
              {leaderView &&
                pending.map((member) => (
                  <div key={member.id} className={styles.leaderDecision}>
                    <span>{member.name} · aguardando aprovação</span>
                    <button
                      onClick={() =>
                        act(
                          () => approveGuildActivity(member.id, item.id),
                          'Atividade aprovada.',
                          item.tier,
                        )
                      }
                    >
                      Aprovar realização
                    </button>
                    <button
                      onClick={() =>
                        act(
                          () =>
                            requestGuildActivityRevision(member.id, item.id),
                          'Revisão solicitada.',
                        )
                      }
                    >
                      Solicitar revisão
                    </button>
                  </div>
                ))}
            </article>
          );
        })}
        {!visibleActivities.length &&
          (leaderView ? (
            <p>Esta Guilda ainda não publicou lições, missões ou desafios.</p>
          ) : (
            <div className={styles.guildEmpty}>
              <span aria-hidden="true">✦</span>
              <h3>
                {playerSection === 'available'
                  ? 'Tudo concluído por enquanto.'
                  : playerSection === 'history'
                    ? 'Sua história será guardada aqui.'
                    : 'Tudo em dia com sua célula.'}
              </h3>
              <p>
                {playerSection === 'available'
                  ? 'Novas missões da sua célula aparecerão aqui.'
                  : playerSection === 'history'
                    ? 'As atividades concluídas continuam acessíveis neste espaço.'
                    : 'Envios e recompensas a receber aparecerão aqui.'}
              </p>
            </div>
          ))}
      </div>
    </section>
  );
}
