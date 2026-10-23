'use client';
import { useRef, useState } from 'react';
import { guildMissionRewards, type GuildRewardTier } from '@rpg/game-engine';
import { missionWorkspaceRepository as repository } from '../../lib/supabase/repositories/guild-mission-workspace-repository';
import {
  canParticipate,
  isSpecial,
  missionLabels,
  progressLabels,
  rewardLabel,
  type Mission,
  type Progress,
} from './contracts';
import css from './panel.module.css';

export function MemberMission({
  mission,
  progress,
  travelerId,
  now,
  onAction,
}: {
  mission: Mission;
  progress?: Progress;
  travelerId: string;
  now: number;
  onAction: (operation: () => Promise<unknown>, message: string) => void;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const key = useRef<{ revision: number; note: string; id: string } | null>(
    null,
  );
  const reward = guildMissionRewards[mission.reward_tier as GuildRewardTier];
  const run = (action: 'start' | 'submit') => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    const revision = progress?.submission_revision ?? 0;
    if (
      !key.current ||
      key.current.revision !== revision ||
      key.current.note !== note
    )
      key.current = { revision, note, id: crypto.randomUUID() };
    const requestId = key.current.id;
    onAction(
      async () => {
        try {
          await repository.act(
            travelerId,
            mission.id,
            action,
            note,
            requestId,
            revision,
          );
          if (action === 'submit') setNote('');
        } finally {
          pending.current = false;
          setBusy(false);
        }
      },
      action === 'start'
        ? 'Atividade iniciada.'
        : 'Conclusão enviada para aprovação.',
    );
  };
  return (
    <article className={css.card} data-special={isSpecial(mission)}>
      <p className={css.meta}>
        {isSpecial(mission) ? 'Desafio especial' : 'Missão'} ·{' '}
        {missionLabels[mission.status] ?? mission.status}
      </p>
      <h3>{mission.title}</h3>
      <p>{mission.description}</p>
      <details>
        <summary>Instruções e comprovação</summary>
        <p>Objetivo: {mission.objective ?? mission.description}</p>
        <p>{mission.instructions ?? 'Siga as orientações da liderança.'}</p>
        <p>
          Comprovação:{' '}
          {mission.evidence_criterion ?? 'Registro objetivo da atividade.'}
        </p>
        {mission.bible_reference && (
          <p>Referência informada pelo líder: {mission.bible_reference}</p>
        )}
      </details>
      <p className={css.meta}>
        Início:{' '}
        {mission.starts_at
          ? new Date(mission.starts_at).toLocaleString('pt-BR')
          : 'disponível após publicação'}
        <br />
        Prazo:{' '}
        {mission.due_at
          ? new Date(mission.due_at).toLocaleString('pt-BR')
          : 'sem prazo definido'}
      </p>
      {reward && (
        <p aria-label="Recompensa">
          +{reward.xp} XP · +{reward.coins} Moedas do Viajante · +1{' '}
          {reward.chestLabel}
        </p>
      )}
      <strong className={css.badge}>
        {progressLabels[progress?.status ?? 'available'] ?? progress?.status}
      </strong>
      <p className={css.meta}>{rewardLabel(progress)}</p>
      {progress?.review_note && (
        <p className={css.notice}>
          Orientação do líder: {progress.review_note}
        </p>
      )}
      {!canParticipate(mission, now) &&
        !['approved', 'completed', 'pending_approval'].includes(
          progress?.status ?? '',
        ) && <p>Atividade fora do período disponível ou encerrada.</p>}
      {canParticipate(mission, now) &&
        (!progress ||
          ['available', 'rejected', 'changes_requested'].includes(
            progress.status,
          )) && (
          <button disabled={busy} onClick={() => run('start')}>
            {progress ? 'Iniciar nova tentativa' : 'Iniciar Missão'}
          </button>
        )}
      {canParticipate(mission, now) && progress?.status === 'started' && (
        <div className={css.form}>
          <label>
            Comprovação da conclusão
            <textarea
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Registre somente informação objetiva da atividade, sem dados pessoais ou Diário privado."
            />
          </label>
          <p className={css.meta}>
            Texto de até 500 caracteres, visível à liderança autorizada. Não
            envie arquivos ou links pessoais.
          </p>
          <button disabled={busy || !note.trim()} onClick={() => run('submit')}>
            Enviar conclusão
          </button>
        </div>
      )}
      {progress?.status === 'approved' && !progress.reward_claimed_at && (
        <p className={css.notice}>
          Aprovação registrada. Recompensa pendente de integração; nenhum saldo
          foi alterado por esta aprovação.
        </p>
      )}
    </article>
  );
}
