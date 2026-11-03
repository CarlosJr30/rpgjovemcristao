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
import { purchaseQAShop, resumeQAPurchase } from '../../../lib/qa-shop/client';

export function ShopScreen({
  qa,
}: { qa?: { actor: string; coins: number } } = {}) {
  const [feedback, setFeedback] = useState('');
  const [confirmation, setConfirmation] = useState<{
    kind: 'chest' | 'equipment';
    id: string;
    name: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const resume = async () => {
    if (!qa || busy) return;
    setBusy(true);
    try {
      await resumeQAPurchase(qa.actor);
      setFeedback('Compra anterior confirmada; saldo atualizado.');
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Consulta não confirmada.');
    } finally {
      setBusy(false);
    }
  };
  const confirm = async () => {
    if (!qa || !confirmation || busy) return;
    setBusy(true);
    try {
      await purchaseQAShop(qa.actor, confirmation.kind, confirmation.id);
      setFeedback('Compra confirmada no servidor. Consulte a Mochila.');
      setConfirmation(null);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Compra não confirmada.');
    } finally {
      setBusy(false);
    }
  };
  const buy = (id: string, name: string) => {
    const result = buyEquipment(id);
    setFeedback(
      result === 'purchased'
        ? `${name} comprado. Item enviado para a Mochila.`
        : result === 'insufficient'
          ? 'Moedas insuficientes.'
          : result === 'owned'
            ? 'Você já possui este equipamento.'
            : result === 'save-failed'
              ? 'Compra não salva. Seu saldo foi preservado.'
              : 'Oferta indisponível.',
    );
  };
  return (
    <Shell
      navigationMode={qa ? 'released' : 'journey'}
      back={qa ? '/journey' : routes.map}
      backLabel="Voltar à Jornada"
    >
      <RequireTraveler>
        {(traveler) => (
          <section className={styles.diarySection}>
            <p className={styles.eyebrow}>
              {qa ? 'LOJA QA · SOMENTE TEST' : 'ECONOMIA DE GAMEPLAY'}
            </p>
            <h1>Loja do Viajante</h1>
            <p>
              ◈ Saldo:{' '}
              <strong>
                {traveler.coins} {TRAVELER_CURRENCY_NAME}
              </strong>
            </p>
            <p>
              Os melhores equipamentos continuam ligados à exploração e aos
              desafios.
            </p>
            <p role="status" aria-live="polite">
              {feedback}
            </p>
            {qa && (
              <>
                <p>
                  Orçamento QA isolado. Preços aprovados somente para TEST; sem
                  pagamentos reais.
                </p>
                <button disabled={busy} onClick={() => void resume()}>
                  Consultar compra pendente
                </button>
                <article className={styles.itemCard}>
                  <h2>Baú comum</h2>
                  <p>40 moedas · conteúdo comum já aprovado.</p>
                  <button
                    disabled={busy || traveler.coins < 40}
                    onClick={() =>
                      setConfirmation({
                        kind: 'chest',
                        id: 'common',
                        name: 'Baú comum',
                      })
                    }
                  >
                    Comprar baú comum
                  </button>
                </article>
                <p>
                  Cartas: compras indisponíveis.{' '}
                  <Link href="/journey/arena/deck">
                    Meu Baralho e pacote inicial existente
                  </Link>
                </p>
                <Link href="/journey/equipment">
                  Usar equipamentos adquiridos
                </Link>
              </>
            )}
            {confirmation && (
              <section aria-label="Confirmar compra">
                <p>Confirmar compra de {confirmation.name}?</p>
                <button disabled={busy} onClick={() => void confirm()}>
                  Confirmar compra
                </button>
                <button disabled={busy} onClick={() => setConfirmation(null)}>
                  Cancelar
                </button>
              </section>
            )}
            <div className={styles.itemShelf}>
              {SHOP_OFFERS.map(({ equipment, price, description }) => {
                const owned = traveler.inventory.some(
                  (item) => item.id === equipment.id,
                );
                return (
                  <article
                    className={styles.itemCard}
                    key={equipment.id}
                    data-rarity={equipment.rarity}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- ícone local registrado */}
                    <img
                      className={styles.equipmentItemIcon}
                      src={equipmentAssetForItem(equipment)}
                      alt=""
                    />
                    <h2>{equipment.name}</h2>
                    <p>
                      {equipment.rarity.toUpperCase()} · {equipment.slot} ·
                      poder {equipment.power}
                    </p>
                    <EquipmentStatBonuses stats={equipment.stats} />
                    <p>{description}</p>
                    <EquipmentBibleDetails item={equipment} />
                    <strong>
                      ◈ {price} {TRAVELER_CURRENCY_NAME}
                    </strong>
                    <button
                      className={styles.primaryLink}
                      disabled={
                        owned || busy || (!!qa && traveler.coins < price)
                      }
                      onClick={() =>
                        qa
                          ? setConfirmation({
                              kind: 'equipment',
                              id: equipment.id,
                              name: equipment.name,
                            })
                          : buy(equipment.id, equipment.name)
                      }
                    >
                      {owned
                        ? 'Adquirido'
                        : traveler.coins < price
                          ? 'Moedas insuficientes'
                          : 'Comprar'}
                    </button>
                  </article>
                );
              })}
            </div>
            <p>
              <Link href={routes.backpack}>Abrir Mochila →</Link>
            </p>
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
