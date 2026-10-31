'use client';
import { useState, type ReactNode } from 'react';
import { guildMissionRewards, type GuildRewardTier } from '@rpg/game-engine';
import type { GuildMemberSummary } from '../../lib/supabase/database.types';
import {
  emptyMission,
  validateMission,
  type MissionFormData,
} from './contracts';
import css from './panel.module.css';
export function MissionEditor({
  initial,
  special = false,
  members,
  busy,
  onSave,
  onCancel,
  cellMode = false,
  children,
}: {
  initial?: MissionFormData;
  special?: boolean;
  members: GuildMemberSummary[];
  busy: boolean;
  onSave: (value: MissionFormData) => Promise<void>;
  onCancel: () => void;
  cellMode?: boolean;
  children?: ReactNode;
}) {
  const [value, setValue] = useState(initial ?? emptyMission(special));
  const [error, setError] = useState('');
  const set = <K extends keyof MissionFormData>(
    key: K,
    next: MissionFormData[K],
  ) => setValue((current) => ({ ...current, [key]: next }));
  const reward = guildMissionRewards[value.rewardTier];
  return (
    <section className={css.card}>
      <h2>
        {cellMode ? (
          initial ? (
            'Editar rascunho da comunidade'
          ) : (
            'Novo encontro ou atividade'
          )
        ) : (
          <>
            {initial
              ? 'Editar rascunho'
              : special
                ? 'Novo desafio especial'
                : 'Nova missão'}
          </>
        )}
      </h2>
      <form
        className={css.form}
        onSubmit={async (event) => {
          event.preventDefault();
          const message = validateMission(value);
          setError(message ?? '');
          if (message) return;
          try {
            await onSave(value);
          } catch {
            setError(
              'Não foi possível salvar. Seus campos foram preservados. Atualize os dados e tente novamente.',
            );
          }
        }}
      >
        <label>
          Título
          <input
            required
            minLength={2}
            maxLength={100}
            value={value.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </label>
        <label>
          Descrição
          <textarea
            required
            maxLength={1000}
            value={value.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>
        <label>
          Objetivo
          <textarea
            required
            maxLength={500}
            value={value.objective}
            onChange={(e) => set('objective', e.target.value)}
          />
        </label>
        <label>
          Referência bíblica (opcional)
          <input
            maxLength={100}
            value={value.bibleReference}
            onChange={(e) => set('bibleReference', e.target.value)}
          />
        </label>
        <div className={css.grid}>
          <label>
            Início
            <input
              type="datetime-local"
              value={value.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
            />
          </label>
          <label>
            Prazo
            <input
              type="datetime-local"
              value={value.dueAt}
              onChange={(e) => set('dueAt', e.target.value)}
            />
          </label>
        </div>
        <label>
          Instruções para conclusão
          <textarea
            required
            maxLength={1000}
            value={value.instructions}
            onChange={(e) => set('instructions', e.target.value)}
          />
        </label>
        <label>
          Critério de comprovação
          <textarea
            required
            maxLength={300}
            value={value.evidenceCriterion}
            onChange={(e) => set('evidenceCriterion', e.target.value)}
          />
        </label>
        <p className={css.meta}>
          {cellMode ? (
            'A participação será declarada sem texto pessoal, foto ou localização. Informe critérios objetivos para validação humana.'
          ) : (
            <>
              Peça somente um registro objetivo da atividade. Evite dados
              pessoais, relatos sensíveis e conteúdos do Diário privado. Esta
              versão recebe texto, sem anexos.
            </>
          )}
        </p>
        {!cellMode && (
          <>
            <label>
              Tipo
              <select
                value={value.kind}
                onChange={(e) =>
                  set('kind', e.target.value as MissionFormData['kind'])
                }
              >
                <option value="mission">Missão</option>
                <option value="special">Desafio especial</option>
              </select>
            </label>
            <label>
              Recompensa prevista
              <select
                value={value.rewardTier}
                onChange={(e) =>
                  set('rewardTier', e.target.value as GuildRewardTier)
                }
              >
                {Object.entries(guildMissionRewards).map(([tier, r]) => (
                  <option key={tier} value={tier}>
                    {r.xp} XP · {r.coins} moedas · {r.chestLabel}
                  </option>
                ))}
              </select>
            </label>
            <p className={css.notice}>
              {reward.xp} XP · {reward.coins} moedas · {reward.chestLabel}. A
              concessão ficará pendente após a aprovação até a integração
              econômica estar disponível.
            </p>
          </>
        )}
        {children}
        <label>
          Público-alvo
          <select
            value={value.audience}
            onChange={(e) =>
              setValue((current) => ({
                ...current,
                audience: e.target.value as MissionFormData['audience'],
                targetIds: [],
              }))
            }
          >
            <option value="all">Todos os membros ativos</option>
            <option value="selected">Membros selecionados</option>
          </select>
        </label>
        {value.audience === 'selected' && (
          <fieldset>
            <legend>Membros elegíveis</legend>
            {members
              .filter((m) => m.member_status === 'active')
              .map((m) => (
                <label key={m.traveler_id} className={css.check}>
                  <input
                    type="checkbox"
                    checked={value.targetIds.includes(m.traveler_id)}
                    onChange={(e) =>
                      set(
                        'targetIds',
                        e.target.checked
                          ? [...value.targetIds, m.traveler_id]
                          : value.targetIds.filter(
                              (id) => id !== m.traveler_id,
                            ),
                      )
                    }
                  />
                  {m.traveler_name}
                </label>
              ))}
          </fieldset>
        )}
        {error && (
          <p className={`${css.notice} ${css.error}`} role="alert">
            {error}
          </p>
        )}
        <div className={css.actions}>
          <button disabled={busy} type="submit">
            Salvar rascunho
          </button>
          <button disabled={busy} type="button" onClick={onCancel}>
            {cellMode ? 'Cancelar edição' : 'Voltar às missões'}
          </button>
        </div>
      </form>
    </section>
  );
}
