'use client';
import { useState, type FormEvent } from 'react';
import type { Traveler } from '../domain/traveler';
import { guildContentRepository, GUILD_REWARDS, type GuildContent, type GuildContentKind, type GuildContentTier } from '../data/guildContent';
import { journeyRepository } from '../persistence/journey-storage';
import { approveGuildActivity, claimGuildActivity, publishGuildContent, submitGuildActivity } from '../state/use-journey';
import styles from '../journey.module.css';

export function GuildContentBoard({ traveler, leaderView }: { traveler: Traveler; leaderView: boolean }) {
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
  const [audience, setAudience] = useState<'individual' | 'collective'>('individual');
  const [collectiveTarget, setCollectiveTarget] = useState(10);
  const [tier, setTier] = useState<GuildContentTier>('normal');
  const [feedback, setFeedback] = useState('');
  const [revision, setRevision] = useState(0);
  void revision;
  const guildId = traveler.progress.guildId;
  if (!guildId) return null;
  const activities = guildContentRepository.list(guildId);
  const members = journeyRepository.listSaved().filter((member) => member.progress.guildId === guildId);

  const publish = (event: FormEvent) => {
    event.preventDefault();
    if (kind === 'lesson' && !bibleUrl) { setFeedback('A lição precisa de um link bíblico.'); return; }
    const saved = publishGuildContent({
      kind, title: title.trim(), description: description.trim(), biblicalReference: biblicalReference.trim(),
      bibleUrl: bibleUrl.trim(), objective: kind === 'lesson' ? '' : objective.trim(), date,
      theme: kind === 'lesson' ? theme.trim() : '', questions: kind === 'lesson' ? questions.trim() : '',
      groupActivity: kind === 'lesson' ? groupActivity.trim() : '', practicalMission: kind === 'lesson' ? practicalMission.trim() : '', difficulty, audience,
      collectiveTarget: audience === 'collective' && kind !== 'lesson' ? collectiveTarget : null, tier,
    });
    setFeedback(saved ? `${kind === 'lesson' ? 'Lição' : kind === 'mission' ? 'Missão' : 'Desafio'} publicado na Guilda.` : 'Não foi possível salvar. Confira os campos e o link bíblico.');
    if (saved) {
      setTitle(''); setDescription(''); setBiblicalReference(''); setBibleUrl(''); setObjective('');
      setDate(''); setTheme(''); setQuestions(''); setGroupActivity(''); setPracticalMission('');
      setRevision((value) => value + 1);
    }
  };
  const act = (action: () => boolean, success: string) => {
    setFeedback(action() ? success : 'Não foi possível atualizar esta atividade.');
    setRevision((value) => value + 1);
  };

  return <section className={styles.guildChallengePanel} aria-labelledby="guild-content-title">
    <p className={styles.eyebrow}>ESTA SEMANA NA GUILDA · SIMULAÇÃO LOCAL</p>
    <h2 id="guild-content-title">Lições, missões e desafios</h2>
    <p>O conteúdo publicado fica disponível aos Viajantes desta Guilda neste navegador. A validação confirma apenas a realização da atividade.</p>
    <p role="status" aria-live="polite">{feedback}</p>
    {leaderView && <div>
      <nav className={styles.guildTabs} aria-label="Criar conteúdo da Guilda">
        <button onClick={() => setKind('challenge')} aria-pressed={kind === 'challenge'}>+ Criar Desafio</button>
        <button onClick={() => setKind('lesson')} aria-pressed={kind === 'lesson'}>+ Criar Lição</button>
        <button onClick={() => setKind('mission')} aria-pressed={kind === 'mission'}>+ Criar Missão</button>
      </nav>
      <form className={styles.guildCreateChallenge} onSubmit={publish}>
        <h3>{kind === 'challenge' ? 'Novo desafio' : kind === 'lesson' ? 'Nova lição da célula' : 'Nova missão'}</h3>
        <label>Título<input required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Descrição / contexto<textarea required maxLength={600} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Passagem bíblica<input required maxLength={80} value={biblicalReference} onChange={(event) => setBiblicalReference(event.target.value)} /></label>
        <label>Link bíblico (bible.com)<input type="url" required={kind === 'lesson'} value={bibleUrl} onChange={(event) => setBibleUrl(event.target.value)} placeholder="https://www.bible.com/..." /></label>
        {kind === 'lesson' ? <>
          <label>Tema<input required maxLength={80} value={theme} onChange={(event) => setTheme(event.target.value)} /></label>
          <label>Perguntas para conversa<textarea required maxLength={500} value={questions} onChange={(event) => setQuestions(event.target.value)} /></label>
          <label>Atividade em grupo<textarea maxLength={300} value={groupActivity} onChange={(event) => setGroupActivity(event.target.value)} /></label>
          <label>Missão prática<textarea maxLength={300} value={practicalMission} onChange={(event) => setPracticalMission(event.target.value)} /></label>
        </> : <>
          <label>Objetivo<input required maxLength={240} value={objective} onChange={(event) => setObjective(event.target.value)} /></label>
          <label>Dificuldade<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as 'normal' | 'dificil')}><option value="normal">Normal</option><option value="dificil">Difícil</option></select></label>
          <label>Formato<select value={audience} onChange={(event) => setAudience(event.target.value as 'individual' | 'collective')}><option value="individual">Individual</option><option value="collective">Coletivo</option></select></label>
          {audience === 'collective' && <label>Meta coletiva<input type="number" min={2} max={1000} value={collectiveTarget} onChange={(event) => setCollectiveTarget(Number(event.target.value))} /></label>}
          <label>Tier da recompensa<select value={tier} onChange={(event) => setTier(event.target.value as GuildContentTier)}><option value="normal">Normal</option><option value="great">Grande</option><option value="epic">Épica</option><option value="extraordinary">Extraordinária</option></select></label>
          <p>Recompensa calculada: +{GUILD_REWARDS[tier].xp} XP · +{GUILD_REWARDS[tier].coins} moedas.</p>
        </>}
        <label>Data / prazo<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <button type="submit">Publicar na Guilda</button>
      </form>
    </div>}
    <div className={styles.guildSpecialGrid}>
      {activities.map((item: GuildContent) => {
        const status = traveler.progress.guildActivities[item.id];
        const approvals = members.filter((member) => ['approved', 'claimed'].includes(member.progress.guildActivities[item.id] ?? '')).length;
        const pending = members.filter((member) => member.progress.guildActivities[item.id] === 'submitted');
        return <article className={styles.guildSpecialCard} key={item.id}>
          <span>{item.kind === 'lesson' ? 'LIÇÃO' : item.kind === 'mission' ? 'MISSÃO' : 'DESAFIO'} · {item.audience === 'collective' ? 'COLETIVO' : 'INDIVIDUAL'}</span>
          <h3>{item.title}</h3><p>{item.description}</p>
          <p>Referência bíblica: {item.biblicalReference}</p>
          {item.bibleUrl && <a href={item.bibleUrl} target="_blank" rel="noopener noreferrer">Abrir na Bíblia ↗</a>}
          {item.objective && <p>Objetivo: {item.objective}</p>}
          {item.theme && <p>Tema: {item.theme}</p>}
          {item.questions && <p>Perguntas: {item.questions}</p>}
          {item.groupActivity && <p>Atividade em grupo: {item.groupActivity}</p>}
          {item.practicalMission && <p>Missão prática: {item.practicalMission}</p>}
          {item.date && <p>Data / prazo: {item.date}</p>}
          {item.kind !== 'lesson' && <>
            <p>Recompensa: +{GUILD_REWARDS[item.tier].xp} XP · +{GUILD_REWARDS[item.tier].coins} moedas</p>
            {item.collectiveTarget && <p>Objetivo da Guilda: {approvals}/{item.collectiveTarget} <progress max={item.collectiveTarget} value={approvals} aria-label={`Progresso coletivo de ${item.title}`} /></p>}
            {!leaderView && !status && <button onClick={() => act(() => submitGuildActivity(item.id), 'Atividade enviada para validação.')}>Concluir e enviar</button>}
            {!leaderView && status === 'submitted' && <p>Aguardando aprovação objetiva.</p>}
            {!leaderView && status === 'approved' && <button onClick={() => act(() => claimGuildActivity(item.id), 'Recompensa recebida.')}>Receber recompensa</button>}
            {!leaderView && status === 'claimed' && <b>✓ Recompensa recebida</b>}
            {leaderView && pending.map((member) => <div key={member.id} className={styles.leaderDecision}>
              <span>{member.name} · aguardando aprovação</span>
              <button onClick={() => act(() => approveGuildActivity(member.id, item.id), 'Atividade aprovada.')}>Aprovar realização</button>
            </div>)}
          </>}
        </article>;
      })}
      {!activities.length && <p>Esta Guilda ainda não publicou lições, missões ou desafios.</p>}
    </div>
  </section>;
}
