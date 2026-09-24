'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Shell, RequireTraveler } from '../components/shell';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { SHOP_OFFERS } from '../data/equipmentCatalog';
import { equipmentAssetForItem } from '../data/avatarAssets';
import { TRAVELER_CURRENCY_NAME } from '../data/progression';
import { EquipmentBibleDetails } from '../components/equipment-bible-details';
import { EquipmentStatBonuses } from '../components/equipment-stat-bonuses';
import { buyEquipment } from '../state/use-journey';
import styles from '../journey.module.css';

export function ShopScreen() {
  const [feedback, setFeedback] = useState('');
  const buy = (id: string, name: string) => {
    const result = buyEquipment(id);
    setFeedback(result === 'purchased' ? `${name} comprado. Item enviado para a Mochila.`
      : result === 'insufficient' ? 'Moedas insuficientes.'
      : result === 'owned' ? 'Você já possui este equipamento.'
      : result === 'save-failed' ? 'Compra não salva. Seu saldo foi preservado.'
      : 'Oferta indisponível.');
  };
  return <Shell back={routes.map} backLabel="Voltar à Jornada">
    <RequireTraveler>{(traveler) => <section className={styles.diarySection}>
      <p className={styles.eyebrow}>ECONOMIA DE GAMEPLAY</p>
      <h1>Loja do Viajante</h1>
      <p>◈ Saldo: <strong>{traveler.coins} {TRAVELER_CURRENCY_NAME}</strong></p>
      <p>Os melhores equipamentos continuam ligados à exploração e aos desafios.</p>
      <p role="status" aria-live="polite">{feedback}</p>
      <div className={styles.itemShelf}>
        {SHOP_OFFERS.map(({ equipment, price, description }) => {
          const owned = traveler.inventory.some((item) => item.id === equipment.id);
          return <article className={styles.itemCard} key={equipment.id}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ícone local registrado */}
            <img className={styles.equipmentItemIcon} src={equipmentAssetForItem(equipment)} alt="" />
            <h2>{equipment.name}</h2>
            <p>{equipment.rarity.toUpperCase()} · {equipment.slot} · poder {equipment.power}</p>
            <EquipmentStatBonuses stats={equipment.stats} />
            <p>{description}</p>
            <EquipmentBibleDetails item={equipment} />
            <strong>◈ {price} {TRAVELER_CURRENCY_NAME}</strong>
            <button className={styles.primaryLink} disabled={owned} onClick={() => buy(equipment.id, equipment.name)}>
              {owned ? 'Adquirido' : traveler.coins < price ? 'Moedas insuficientes' : 'Comprar'}
            </button>
          </article>;
        })}
      </div>
      <p><Link href={routes.backpack}>Abrir Mochila →</Link></p>
    </section>}</RequireTraveler>
  </Shell>;
}
