'use client';
import Link from 'next/link';
import { Shell, RequireTraveler } from '../components/shell';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { EQUIPMENT_CATALOG, RARITIES } from '../data/equipmentCatalog';
import { EquipmentBibleDetails } from '../components/equipment-bible-details';
import styles from '../journey.module.css';

export function CollectionScreen() {
  return <Shell back={routes.map} backLabel="Voltar à Jornada">
    <RequireTraveler>{(traveler) => {
      const found = new Set(traveler.inventory.map((item) => item.id));
      return <section className={styles.diarySection}>
        <p className={styles.eyebrow}>DESCOBERTAS DO VIAJANTE</p>
        <h1>Coleção</h1>
        <p>Equipamentos descobertos: <strong>{EQUIPMENT_CATALOG.filter((item) => found.has(item.id)).length}/{EQUIPMENT_CATALOG.length}</strong></p>
        <p>Segredos do Jardim: <strong>{traveler.progress.gardenSecrets.length}/1</strong></p>
        <p>Conquistas: em preparação.</p>
        {RARITIES.map((rarity) => {
          const items = EQUIPMENT_CATALOG.filter((item) => item.rarity === rarity);
          return <section key={rarity}>
            <h2>{rarity.toUpperCase()} · {items.filter((item) => found.has(item.id)).length}/{items.length}</h2>
            <div className={styles.itemShelf}>{items.map((item) => <article className={styles.itemCard} key={item.id}>
              <h3>{found.has(item.id) ? item.name : '???'}</h3>
              {found.has(item.id) ? <EquipmentBibleDetails item={item} /> : <p>Ainda não descoberto.</p>}
            </article>)}</div>
          </section>;
        })}
        <Link href={routes.shop}>Visitar a Loja →</Link>
      </section>;
    }}</RequireTraveler>
  </Shell>;
}
