'use client';
import { Shell, RequireTraveler } from '../components/shell';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import styles from '../journey.module.css';
import Link from 'next/link';
import { TRAVELER_CURRENCY_NAME } from '../data/progression';
import { EquipmentBibleDetails } from '../components/equipment-bible-details';
import { EquipmentStatBonuses } from '../components/equipment-stat-bonuses';
export function BackpackScreen() {
  return (
    <Shell back={routes.map} backLabel="Voltar ao mapa">
      <RequireTraveler>
        {(t) => (
          <section className={styles.diarySection}>
            <p className={styles.eyebrow}>INVENTÁRIO GERAL</p>
            <h1>Mochila</h1>
            <p>◈ {t.coins} {TRAVELER_CURRENCY_NAME} · <Link href={routes.shop}>Visitar Loja</Link></p>
            <p className={styles.phaseLead}>
              Tudo que você possui, separado da administração de equipamentos.
            </p>
            <div className={styles.itemShelf}>
              {t.inventory.map((item) => (
                <article className={styles.itemCard} key={item.id}>
                  <h2>{item.name}</h2>
                  <p>
                    {item.slot} · {item.rarity} · poder {item.power}
                  </p>
                  <EquipmentStatBonuses stats={item.stats} />
                  <EquipmentBibleDetails item={item} />
                  {item.isNew && <b>NOVO EQUIPAMENTO</b>}
                </article>
              ))}
            </div>
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
