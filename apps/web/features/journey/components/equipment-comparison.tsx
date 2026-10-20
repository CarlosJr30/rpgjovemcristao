import type { Equipment, Traveler } from '../domain/traveler';
import { ATTRIBUTE_LABELS, calculateTotalAttributes } from '../data/attributes';
import { equipmentReward, signedValue } from '../data/equipmentCinematic';
import portal from './equipment-portal.module.css';
import numbers from './equipment-comparison.module.css';
import {
  arenaNumber,
  arenaOffensiveTerm,
  calculateMaxHp,
  normalizeBattleStat,
} from '@rpg/game-engine';
import { travelerBattleSnapshot } from '../data/arena';

export function EquipmentComparison({
  traveler,
  item,
  expanded = false,
}: {
  traveler: Traveler;
  item: Equipment;
  expanded?: boolean;
}) {
  if (
    !traveler.inventory.some(
      (owned) => owned.id === item.id && owned.slot === item.slot,
    )
  )
    return <p>Comparação indisponível: item ausente deste inventário.</p>;
  const reward = equipmentReward(traveler, item);
  const before = calculateTotalAttributes(traveler).total;
  const after = calculateTotalAttributes({
    ...traveler,
    equipped: { ...traveler.equipped, [item.slot]: item.id },
  }).total;
  const oldSnapshot = travelerBattleSnapshot(traveler);
  const newSnapshot = travelerBattleSnapshot({
    ...traveler,
    equipped: { ...traveler.equipped, [item.slot]: item.id },
  });
  const metrics = [
    [
      'Vida máxima na Arena (HP)',
      calculateMaxHp(oldSnapshot.attributes),
      calculateMaxHp(newSnapshot.attributes),
    ],
    [
      'Parcela ofensiva antes da Defesa',
      arenaOffensiveTerm(oldSnapshot),
      arenaOffensiveTerm(newSnapshot),
    ],
    [
      'Defesa usada pelo motor',
      normalizeBattleStat(before.defense),
      normalizeBattleStat(after.defense),
    ],
  ] as const;
  return (
    <details className={portal.comparison} open={expanded || undefined}>
      <summary>Comparar com o atual</summary>
      <p>
        {reward.previous
          ? `Atual: ${reward.previous.name}`
          : 'Slot atual vazio'}{' '}
        → {item.name}
      </p>
      <table className={numbers.metrics}>
        <caption>Atributos totais do Viajante ao equipar</caption>
        <thead>
          <tr>
            <th scope="col">Atributo</th>
            <th scope="col">Atual</th>
            <th scope="col">Novo</th>
            <th scope="col">
              <abbr title="Diferença">Dif.</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr data-comparison-power>
            <th scope="row">Poder total</th>
            <td>{reward.beforePower}</td>
            <td>{reward.afterPower}</td>
            <td>{signedValue(reward.powerDelta)}</td>
          </tr>
          {Object.entries(ATTRIBUTE_LABELS).map(([key, label]) => {
            const attribute = key as keyof typeof before;
            return (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{before[attribute]}</td>
                <td>{after[attribute]}</td>
                <td>{signedValue(reward.delta[attribute])}</td>
              </tr>
            );
          })}
          {metrics.map(([label, current, next]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{arenaNumber(current)}</td>
              <td>{arenaNumber(next)}</td>
              <td>
                {next - current > 0 ? '+' : ''}
                {arenaNumber(next - current)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <small>
        Valores com todos os equipamentos atuais. Zero indica que não há
        mudança. Parcela ofensiva e Poder total não são dano final. Defesa do
        alvo, guarda, efeitos condicionais, esquiva e arredondamentos alteram o
        resultado.
      </small>
    </details>
  );
}
