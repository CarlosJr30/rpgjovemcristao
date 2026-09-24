import styles from '../journey.module.css';
/* Equipment thumbnails use the local runtime asset registry. */
/* eslint-disable @next/next/no-img-element */
import type { Equipment } from '../domain/traveler';
import { equipmentAssetForItem } from '../data/avatarAssets';

export function EquipmentStatus({ equipped, item }: { equipped: boolean; item?: Equipment }) {
  const icon = equipped && item ? equipmentAssetForItem(item) : undefined;
  return (
    <>
      {icon && <img className={styles.equipmentSlotThumbnail} src={icon} alt="" />}
      <span className={equipped ? styles.equipmentStatusEquipped : styles.equipmentStatusEmpty}>
        {equipped ? '✓ Equipado' : 'Vazio'}
      </span>
    </>
  );
}

export function equipmentStateClass(equipped: boolean): string {
  return equipped ? styles.equipmentEquipped : styles.equipmentEmpty;
}
