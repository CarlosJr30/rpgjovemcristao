import type { Equipment } from '../domain/traveler';
import { equipmentBibleFor } from '../data/equipmentBible';
import styles from '../journey.module.css';

export function EquipmentBibleDetails({ item }: { item: Equipment }) {
  const metadata = equipmentBibleFor(item);
  if (!metadata) return null;
  return (
    <div className={styles.equipmentBibleDetails}>
      <strong>Inspiração bíblica · {metadata.biblicalReference}</strong>
      <p>{metadata.biblicalTheme}. {metadata.biblicalDescription}</p>
      <small>Classificação: temática · Encontrado em: {metadata.foundAt}</small>
      <a href={metadata.bibleUrl} target="_blank" rel="noopener noreferrer">Abrir na Bíblia ↗</a>
    </div>
  );
}
