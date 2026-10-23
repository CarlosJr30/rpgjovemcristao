import {
  arenaAttributeRules,
  arenaDamageRule,
  arenaNumber,
  arenaOffensiveTerm,
  battleBalanceConfig,
  calculateMaxHp,
  describeArenaEffect,
  normalizeBattleStat,
  type BattleFighterState,
  type BattleParticipantSnapshot,
  arenaConfirmedLog,
  type BattleState,
} from '@rpg/game-engine';
import type { Equipment } from '../domain/traveler';
import { equipmentSnapshot } from '../data/arena';
import { ATTRIBUTE_LABELS } from '../data/attributes';
import styles from '../journey.module.css';
import numbers from './arena-rule-details.module.css';

export function ArenaRuleSummary({
  snapshot,
}: {
  snapshot: BattleParticipantSnapshot;
}) {
  return (
    <details className={numbers.rules}>
      <summary>Como meus atributos atuam na Arena</summary>
      <p>
        Vida máxima: {calculateMaxHp(snapshot.attributes)} HP. Parcela ofensiva
        atual: {arenaNumber(arenaOffensiveTerm(snapshot))}, antes da Defesa do
        alvo; não é dano final.
      </p>
      <dl>
        {Object.entries(arenaAttributeRules()).map(([key, text]) => (
          <div key={key}>
            <dt>
              {ATTRIBUTE_LABELS[key as keyof typeof ATTRIBUTE_LABELS]}:{' '}
              {arenaNumber(
                normalizeBattleStat(
                  snapshot.attributes[key as keyof typeof snapshot.attributes],
                ),
              )}
            </dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <p>{arenaDamageRule()}</p>
    </details>
  );
}
export function ArenaEffectDetails({
  fighter,
}: {
  fighter: BattleFighterState;
}) {
  const effects = fighter.snapshot.equipment.flatMap((item) =>
    item.effectIds.map((id) => ({ item, id })),
  );
  return (
    <section className={numbers.effects} aria-label="Efeitos dos equipamentos">
      <h3>EFEITOS DOS EQUIPAMENTOS</h3>
      <p>
        Reforços automáticos e passivos. Especiais do jogador exigem cartas
        válidas.
      </p>
      {effects.map(({ item, id }) => {
        const d = describeArenaEffect(id, fighter);
        return (
          <details key={`${item.id}:${id}`}>
            <summary>
              {item.name} · {d.headline}
            </summary>
            <p>{d.explanation}</p>
            <p>Condição: {d.condition}</p>
            <p>Duração: {d.duration}</p>
            <p>
              {d.usesRemaining === null
                ? 'Passivo sem consumo.'
                : `Usos do reforço restantes: ${d.usesRemaining}. Cooldown restante: ${d.cooldownRemaining} rodadas.`}
            </p>
          </details>
        );
      })}
      {effects.length === 0 && <p>Nenhum efeito de equipamento equipado.</p>}
    </section>
  );
}
export function EquipmentArenaDetails({ item }: { item: Equipment }) {
  const effects = equipmentSnapshot(item).effectIds;
  const attrRules = arenaAttributeRules();
  return (
    <details className={numbers.equipment}>
      <summary>{item.name} — Valores e efeitos na Arena</summary>
      <p>
        {item.name} · {item.rarity}. Bônus aplicados somente enquanto equipado.
      </p>
      {Object.entries(item.stats).map(([key, value]) => (
        <p key={key}>
          +{arenaNumber(value!)}{' '}
          {ATTRIBUTE_LABELS[key as keyof typeof ATTRIBUTE_LABELS]}.{' '}
          {attrRules[key as keyof typeof attrRules]}
        </p>
      ))}
      <p>
        Poder do item: {item.power}. Contribuição à parcela ofensiva:{' '}
        {arenaNumber(
          normalizeBattleStat(item.power) *
            battleBalanceConfig.equipmentPowerDamageMultiplier,
        )}
        , antes da Defesa e dos multiplicadores; não é dano final fixo. O poder
        de todos os itens equipados entra nessa soma.
      </p>
      {effects.map((id) => {
        const d = describeArenaEffect(id);
        return (
          <div key={id}>
            <strong>{d.headline}</strong>
            <p>{d.explanation}</p>
            <p>Condição: {d.condition}</p>
            <p>Duração: {d.duration}</p>
          </div>
        );
      })}
      {effects.length === 0 && (
        <p>
          Sem efeito especial registrado para este item; somente atributos e
          poder.
        </p>
      )}
    </details>
  );
}
export function ArenaRecentHistory({ battle }: { battle: BattleState }) {
  return (
    <details className={styles.battleLog} open>
      <summary>Histórico recente da batalha</summary>
      <ol>
        {battle.log.slice(-8).map((entry, i) => (
          <li key={`${entry.round}:${i}`}>
            <b>{entry.round ? `R${entry.round}` : 'INÍCIO'}</b>{' '}
            {arenaConfirmedLog(battle, entry)}
          </li>
        ))}
      </ol>
    </details>
  );
}
