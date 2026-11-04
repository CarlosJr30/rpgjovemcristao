'use client';
import Link from 'next/link';
import { chestCatalog } from '@rpg/game-engine';
import { useState, useSyncExternalStore } from 'react';
import {
  trainingSnapshot,
  emptyTrainingSnapshot,
  subscribeTraining,
} from '../../../lib/training-qa/store';
import { useTrainingTraveler } from '../../training-qa/context';
import { Shell, RequireTraveler } from '../components/shell';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { EQUIPMENT_CATALOG, SHOP_OFFERS } from '../data/equipmentCatalog';
import { equipmentAssetForItem } from '../data/avatarAssets';
import { TRAVELER_CURRENCY_NAME } from '../data/progression';
import { EquipmentBibleDetails } from '../components/equipment-bible-details';
import { EquipmentStatBonuses } from '../components/equipment-stat-bonuses';
import { buyEquipment } from '../state/use-journey';
import styles from '../journey.module.css';
import shop from './shop.module.css';
import { ShopPurchaseHistory } from '../../qa-shop/purchase-history';
import { purchaseQAShop, resumeQAPurchase } from '../../../lib/qa-shop/client';

export function ShopScreen({
  qa,
}: { qa?: { actor: string; coins: number; production?: boolean } } = {}) {
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState<'all' | 'chests' | 'equipment'>(
    'all',
  );
  const training = useTrainingTraveler();
  const trainingBinding = useSyncExternalStore(
    subscribeTraining,
    trainingSnapshot,
    emptyTrainingSnapshot,
  );
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
          <section className={`${styles.diarySection} ${shop.shop}`}>
            <p className={styles.eyebrow}>
              {training
                ? 'LOJA DE TREINO · SALDO E ITENS QA'
                : qa?.production
                  ? 'LOJA DO VIAJANTE'
                  : qa
                    ? 'LOJA QA · SOMENTE TEST'
                    : 'ECONOMIA DE GAMEPLAY'}
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
            <p role="status" aria-live="polite" className={shop.feedback}>
              {feedback}
            </p>
            {qa && (
              <>
                <p>
                  {training
                    ? 'Somente a carteira e o inventário privados de treino serão alterados.'
                    : qa.production
                      ? 'Compras com suas moedas de jogo, confirmadas pelo servidor. Sem pagamentos em dinheiro real.'
                      : 'Orçamento QA isolado. Preços aprovados somente para TEST; sem pagamentos reais.'}
                </p>
                <button disabled={busy} onClick={() => void resume()}>
                  Consultar compra pendente
                </button>
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
              <section
                aria-label="Confirmar compra"
                className={shop.confirmation}
              >
                <p>Confirmar compra de {confirmation.name}?</p>
                <button
                  className={styles.primaryLink}
                  disabled={busy}
                  onClick={() => void confirm()}
                >
                  Confirmar compra
                </button>
                <button disabled={busy} onClick={() => setConfirmation(null)}>
                  Cancelar
                </button>
              </section>
            )}
            {qa && (
              <div
                className={shop.categories}
                role="group"
                aria-label="Categorias da Loja"
              >
                {(
                  [
                    ['all', 'Todos'],
                    ['chests', 'Baús'],
                    ['equipment', 'Equipamentos'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    aria-pressed={category === id}
                    onClick={() => setCategory(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div className={shop.products} aria-label="Produtos disponíveis">
              {qa && category !== 'equipment' && (
                <article
                  className={`${styles.itemCard} ${shop.product}`}
                  data-rarity="comum"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- arte local existente do baú */}
                  <img
                    className={shop.art}
                    src={chestCatalog.common.image}
                    alt=""
                  />
                  <h2>Baú comum</h2>
                  <p className={shop.rarity}>COMUM · Baú</p>
                  <p>
                    Moedas e possibilidade de equipamento, conforme o conteúdo
                    comum existente.
                  </p>
                  <strong className={shop.price}>
                    ◈ 40 {TRAVELER_CURRENCY_NAME}
                  </strong>
                  <button
                    className={styles.primaryLink}
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
              )}
              {category !== 'chests' &&
                SHOP_OFFERS.map(({ equipment, price, description }) => {
                  const owned = training
                    ? !!trainingBinding?.state.items[equipment.id]
                    : traveler.inventory.some(
                        (item) => item.id === equipment.id,
                      );
                  return (
                    <article
                      className={`${styles.itemCard} ${shop.product}`}
                      key={equipment.id}
                      data-rarity={equipment.rarity}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- ícone local registrado */}
                      <img
                        className={shop.art}
                        src={equipmentAssetForItem(equipment)}
                        alt=""
                      />
                      <h2>{equipment.name}</h2>
                      <p className={shop.rarity}>
                        {equipment.rarity.toUpperCase()} · poder{' '}
                        {equipment.power}
                      </p>
                      <EquipmentStatBonuses stats={equipment.stats} />
                      <details className={shop.details}>
                        <summary>Sobre este equipamento</summary>
                        <p>{description}</p>
                        <EquipmentBibleDetails item={equipment} />
                      </details>
                      <strong className={shop.price}>
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
            {qa && category !== 'equipment' && (
              <section aria-labelledby="activity-chests">
                <h2 id="activity-chests">Baús obtidos por atividades</h2>
                <div className={shop.products}>
                  {(['common', 'epic'] as const).map((id) => (
                    <article
                      className={`${styles.itemCard} ${shop.product}`}
                      key={id}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- arte existente do catálogo */}
                      <img
                        className={shop.art}
                        src={chestCatalog[id].image}
                        alt=""
                      />
                      <h3>{chestCatalog[id].name}</h3>
                      <p className={shop.rarity}>
                        {chestCatalog[id].rarityLabel}
                      </p>
                      <p>Origem: atividade comunitária elegível e validada.</p>
                      <p>
                        {id === 'epic'
                          ? 'Moedas e possibilidade de Elmo do Viajante, conforme o sorteio épico aprovado. Não está à venda.'
                          : 'Moedas e possibilidade de Espada do Caminho, conforme o sorteio comum aprovado. Também disponível para compra acima.'}
                      </p>
                      <Link href="/journey/guild">
                        Consultar atividades da Guilda
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {qa && (
              <section aria-labelledby="other-acquisitions">
                <h2 id="other-acquisitions">
                  Outras origens e vendas indisponíveis
                </h2>
                <p>
                  Este catálogo é informativo. Nenhum item abaixo pode ser
                  comprado nesta Loja.
                </p>
                <div className={shop.products}>
                  {category !== 'chests' &&
                    EQUIPMENT_CATALOG.filter(
                      (item) =>
                        !SHOP_OFFERS.some(
                          (offer) => offer.equipment.id === item.id,
                        ),
                    ).map((item) => (
                      <article
                        className={`${styles.itemCard} ${shop.product}`}
                        key={item.id}
                        data-rarity={item.rarity}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- ícone existente registrado */}
                        <img
                          className={shop.art}
                          src={equipmentAssetForItem(item)}
                          alt=""
                        />
                        <h3>{item.name}</h3>
                        <p className={shop.rarity}>
                          {item.rarity.toUpperCase()} · poder {item.power}
                        </p>
                        <EquipmentStatBonuses stats={item.stats} />
                        <p>
                          {item.slot === 'boots'
                            ? 'Origem: equipamento inicial. Não está à venda.'
                            : item.slot === 'helmet'
                              ? 'Origem: sorteio do baú épico comunitário. Sem preço de venda aprovado.'
                              : 'Origem prevista: progressão da Jornada. Aquisição produtiva e venda ainda indisponíveis.'}
                        </p>
                      </article>
                    ))}
                  {category !== 'equipment' &&
                    (['uncommon', 'rare', 'extraordinary'] as const).map(
                      (id) => (
                        <article
                          className={`${styles.itemCard} ${shop.product}`}
                          key={id}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- arte existente compartilhada pelos baús */}
                          <img
                            className={shop.art}
                            src={chestCatalog[id].image}
                            alt=""
                          />
                          <h3>{chestCatalog[id].name}</h3>
                          <p className={shop.rarity}>
                            {chestCatalog[id].rarityLabel}
                          </p>
                          <p>
                            Venda e aquisição indisponíveis: contrato econômico
                            ainda não homologado.
                          </p>
                          <p>
                            Preço e conteúdo não estão liberados para compra. A
                            arte existente não representa uma oferta.
                          </p>
                        </article>
                      ),
                    )}
                </div>
              </section>
            )}
            {qa && category === 'all' && (
              <section aria-labelledby="existing-cards">
                <h2 id="existing-cards">Cartas da Arena</h2>
                <p>
                  Sete cartas de combate existentes pelo pacote inicial:
                  solicitação e confirmação manuais, uma vez por conta. A
                  coleção e o baralho de sete cartas permanecem em Meu Baralho,
                  com raridades, efeitos e posse próprios.
                </p>
                <p>
                  Venda de cartas indisponível: não há tabela de preços ou
                  contrato de compra aprovado. Nenhuma carta adicional é
                  concedida por esta tela.
                </p>
                <Link href="/journey/arena/deck">
                  Consultar cartas e pacote inicial em Meu Baralho
                </Link>
              </section>
            )}
            <p>
              <Link href={routes.backpack}>Abrir Mochila →</Link>
            </p>
            {qa?.production && (
              <ShopPurchaseHistory
                key={qa.actor}
                actor={qa.actor}
                revision={traveler.coins}
              />
            )}
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
