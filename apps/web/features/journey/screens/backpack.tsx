'use client';
import { useCallback, useState } from 'react';
import { Shell, RequireTraveler } from '../components/shell';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import styles from '../journey.module.css';
import Link from 'next/link';
import { TRAVELER_CURRENCY_NAME } from '../data/progression';
import { EquipmentBibleDetails } from '../components/equipment-bible-details';
import { EquipmentStatBonuses } from '../components/equipment-stat-bonuses';
import { ChestPanel } from '../components/chest-panel';
import { useAuth } from '../../../lib/supabase/auth-context';
import { equipmentAssetForItem } from '../data/avatarAssets';
export function BackpackScreen() {
  const auth = useAuth();
  const [tab, setTab] = useState<'items' | 'equipment' | 'chests'>('equipment');
  const [chestCount, setChestCount] = useState(0);
  const updateChestCount = useCallback(
    (count: number) => setChestCount(count),
    [],
  );
  return (
    <Shell back={routes.map} backLabel="Voltar ao mapa">
      <RequireTraveler>
        {(t) => (
          <section className={styles.diarySection}>
            <p className={styles.eyebrow}>INVENTÁRIO GERAL</p>
            <h1>Mochila</h1>
            <p>
              ◈ {t.coins} {TRAVELER_CURRENCY_NAME} ·{' '}
              <Link href={routes.shop}>Visitar Loja</Link>
            </p>
            <p className={styles.phaseLead}>
              Tudo que você possui, separado da administração de equipamentos.
            </p>
            <div
              className={styles.backpackTabs}
              role="tablist"
              aria-label="Categorias da Mochila"
            >
              <button
                role="tab"
                aria-selected={tab === 'items'}
                onClick={() => setTab('items')}
              >
                Itens
              </button>
              <button
                role="tab"
                aria-selected={tab === 'equipment'}
                onClick={() => setTab('equipment')}
              >
                Equipamentos
              </button>
              <button
                role="tab"
                aria-selected={tab === 'chests'}
                onClick={() => setTab('chests')}
              >
                Baús{chestCount > 0 ? ` (${chestCount})` : ''}
              </button>
            </div>
            {tab === 'items' && (
              <div className={styles.chestEmpty}>
                <b>Nenhum consumível guardado.</b>
                <span>Itens de uso futuro aparecerão aqui.</span>
              </div>
            )}
            {tab === 'equipment' && (
              <div className={styles.itemShelf}>
                {t.inventory.map((item) => (
                  <article
                    className={styles.itemCard}
                    key={item.id}
                    data-rarity={item.rarity}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- registered local item icon */}
                    <img
                      src={equipmentAssetForItem(item)}
                      alt=""
                      width="88"
                      height="88"
                      className={styles.equipmentItemIcon}
                      loading="lazy"
                    />
                    <h2>{item.name}</h2>
                    <p>
                      {item.slot} · {item.rarity} · poder {item.power}
                    </p>
                    <EquipmentStatBonuses stats={item.stats} />
                    <EquipmentBibleDetails item={item} />
                    {item.isNew && <b>NOVO EQUIPAMENTO</b>}
                    {(item.quantity ?? 1) > 1 && (
                      <b>Quantidade: {item.quantity}</b>
                    )}
                  </article>
                ))}
              </div>
            )}
            {tab === 'chests' && (
              <ChestPanel
                traveler={t}
                online={auth.status === 'signedIn'}
                onCountChange={updateChestCount}
                onViewEquipment={() => setTab('equipment')}
              />
            )}
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
