import type { AttributeValues, EquipmentStats } from '../domain/traveler';
import { formatAttributeBonuses, formatAttributeDelta } from '../data/attributes';
import styles from '../journey.module.css';

export function EquipmentStatBonuses({ stats, delta }: { stats: EquipmentStats; delta?: AttributeValues }) {
  const bonuses = formatAttributeBonuses(stats);
  const comparison = delta ? formatAttributeDelta(delta) : [];
  return <div className={styles.equipmentStatBonuses}>
    <strong>{bonuses.join(' · ') || 'Sem bônus de atributo'}</strong>
    {comparison.length > 0 && <small>Comparado ao equipado: {comparison.join(' · ')}</small>}
  </div>;
}
