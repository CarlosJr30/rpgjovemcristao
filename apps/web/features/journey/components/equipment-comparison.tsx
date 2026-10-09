import type { Equipment, Traveler } from '../domain/traveler';
import { ATTRIBUTE_LABELS, calculateTotalAttributes } from '../data/attributes';
import { equipmentReward, signedValue } from '../data/equipmentCinematic';
import portal from './equipment-portal.module.css';

export function EquipmentComparison({
  traveler,
  item,
}: {
  traveler: Traveler;
  item: Equipment;
}) {
  const reward = equipmentReward(traveler, item);
  const before = calculateTotalAttributes(traveler).total;
  const after = calculateTotalAttributes({
    ...traveler,
    equipped: { ...traveler.equipped, [item.slot]: item.id },
  }).total;
  return (
    <details className={portal.comparison}>
      <summary>Comparar com o atual</summary>
      <p>
        {reward.previous
          ? `Atual: ${reward.previous.name}`
          : 'Slot atual vazio'}{' '}
        → {item.name}
      </p>
      <table>
        <caption>Atributos totais do Viajante ao equipar</caption>
        <thead>
          <tr>
            <th scope="col">Atributo</th>
            <th scope="col">Atual</th>
            <th scope="col">Novo</th>
            <th scope="col">Diferença</th>
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
        </tbody>
      </table>
      <small>
        Valores com todos os equipamentos atuais. Zero indica que não há
        mudança.
      </small>
    </details>
  );
}
