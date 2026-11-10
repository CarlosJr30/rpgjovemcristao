'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { chestCatalog } from '@rpg/game-engine';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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
import {
  getCurrentOnlineUserId,
  reloadOnlineTraveler,
} from '../../../lib/supabase/online-sync';
import { requestChestOpening } from '../../chest-reveal/opening';
import {
  readVisual,
  bindReceipt,
  saveCursor,
  type VisualCursor,
} from '../../chest-reveal/visual-store';
import { chestRepository } from '../../../lib/supabase/repositories/chest-repository';
import type { RevealReceipt } from '../../chest-reveal/receipt';
const ChestReveal = dynamic(
  () => import('../../chest-reveal/reveal').then((m) => m.ChestReveal),
  { ssr: false },
);
import { purchaseQAShop, resumeQAPurchase } from '../../../lib/qa-shop/client';

export function ShopScreen({
  qa,
}: {
  qa?: {
    actor: string;
    coins: number;
    production?: boolean;
    enabled?: boolean;
    balanceVerified?: boolean;
    reason?: string;
    initializationEligible?: boolean;
    initialize?: () => Promise<void>;
  };
} = {}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState<'all' | 'chests' | 'equipment'>(
    'all',
  );
  const training = useTrainingTraveler();
  const operationsAllowed =
    !qa || (qa.enabled !== false && qa.balanceVerified !== false);
  const availabilityMessage =
    !qa || operationsAllowed
      ? ''
      : qa.reason === 'legacy-reconciliation-required'
        ? qa.initializationEligible
          ? 'Seu estado inicial está preservado. Ative a economia para usar as operações disponíveis.'
          : 'Operações aguardam reconciliação do histórico. Seus itens e saldos estão preservados.'
        : qa.reason === 'loading'
          ? 'Consultando as operações disponíveis…'
          : 'Operações indisponíveis neste momento. Seus itens e saldos estão preservados.';
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
  const [pendingOpen, setPendingOpen] = useState<string | null>(() => {
    const owner = getCurrentOnlineUserId();
    if (!owner || !qa) return null;
    try {
      const intent = readVisual(owner, qa.actor).intent;
      return intent?.type === 'common' ? intent.operationId : null;
    } catch {
      return null;
    }
  });
  const [reveal, setReveal] = useState<{
    receipt: RevealReceipt;
    cursor: VisualCursor;
    owner: string;
  } | null>(null);
  const mounted = useRef(true);
  const running = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const openPurchased = async (operation: string) => {
    if (!qa || !operationsAllowed) return;
    const owner = getCurrentOnlineUserId();
    if (!owner) throw Error('Entre novamente para abrir seu baú.');
    setPendingOpen(operation);
    setFeedback('Preparando seu baú…');
    const receipt = await requestChestOpening(
      owner,
      qa.actor,
      'common',
      false,
      true,
      !qa.production,
      operation,
    );
    if (!mounted.current) return;
    const cursor = bindReceipt(owner, qa.actor, receipt);
    setReveal({ receipt, cursor, owner });
    setPendingOpen(null);
    setFeedback('');
    if (!(await reloadOnlineTraveler(qa.actor)) && mounted.current)
      setFeedback('Recompensa confirmada. Atualização do saldo pendente.');
  };
  const retryOpen = async () => {
    if (!operationsAllowed || !pendingOpen || running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await openPurchased(pendingOpen);
    } catch {
      if (mounted.current)
        setFeedback(
          'Seu baú está guardado. Tente abrir novamente, sem nova cobrança.',
        );
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const recover = async () => {
    if (!operationsAllowed || !qa || running.current || pendingOpen) return;
    running.current = true;
    setBusy(true);
    try {
      const chests = await chestRepository.list(qa.actor);
      if (!mounted.current) return;
      if (
        !chests.some(
          (c) =>
            c.chest_type === 'common' &&
            c.quantity > 0 &&
            Array.isArray(c.sources) &&
            c.sources.some(
              (source) =>
                typeof source === 'string' && source.startsWith('shop001c:'),
            ),
        )
      )
        throw Error('Nenhum baú comprado disponível neste modo.');
      await openPurchased(crypto.randomUUID());
    } catch (e) {
      if (mounted.current)
        setFeedback(
          e instanceof Error ? e.message : 'Seu baú permanece guardado.',
        );
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const resume = async () => {
    if (!operationsAllowed || !qa || running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const receipt = await resumeQAPurchase(qa.actor);
      if (!mounted.current) return;
      if (receipt.kind === 'chest')
        await openPurchased(receipt.openingOperationId);
      else setFeedback('Item na Mochila.');
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Consulta não confirmada.');
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const confirm = async () => {
    if (
      !operationsAllowed ||
      !qa ||
      !confirmation ||
      running.current ||
      pendingOpen
    )
      return;
    running.current = true;
    setBusy(true);
    try {
      const receipt = await purchaseQAShop(
        qa.actor,
        confirmation.kind,
        confirmation.id,
      );
      if (!mounted.current) return;
      setConfirmation(null);
      if (receipt.kind === 'chest')
        await openPurchased(receipt.openingOperationId);
      else setFeedback('Item na Mochila.');
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Compra não confirmada.');
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
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
            <header className={shop.marketHero}>
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
              <div className={shop.heroFooter}>
                <p className={shop.wallet}>
                  <span aria-hidden="true">◈</span>
                  <span>Saldo</span>
                  <strong>
                    {traveler.coins} {TRAVELER_CURRENCY_NAME}
                  </strong>
                </p>
                <Link className={shop.backpackLink} href={routes.backpack}>
                  Mochila <span aria-hidden="true">→</span>
                </Link>
              </div>
            </header>
            <p role="status" aria-live="polite" className={shop.feedback}>
              {feedback || availabilityMessage}
            </p>
            {qa?.initializationEligible &&
              qa.initialize &&
              !operationsAllowed && (
                <button
                  className={styles.primaryLink}
                  disabled={busy}
                  onClick={async () => {
                    if (running.current) return;
                    running.current = true;
                    setBusy(true);
                    try {
                      await qa.initialize!();
                      if (mounted.current)
                        setFeedback(
                          'Economia ativada. Nenhuma moeda ou item foi concedido.',
                        );
                    } catch {
                      if (mounted.current)
                        setFeedback(
                          'Ativação não confirmada. Tente consultar novamente.',
                        );
                    } finally {
                      running.current = false;
                      if (mounted.current) setBusy(false);
                    }
                  }}
                >
                  Ativar economia
                </button>
              )}
            {qa && (
              <details className={shop.details}>
                <summary>Ajuda e recuperação</summary>
                <p>
                  {training
                    ? 'Saldo e itens de treino separados.'
                    : 'Compras com moedas de jogo.'}
                </p>
                <button
                  disabled={!operationsAllowed || busy || !!pendingOpen}
                  onClick={() => void resume()}
                >
                  Consultar compra pendente
                </button>
                <button
                  disabled={!operationsAllowed || busy || !!pendingOpen}
                  onClick={() => void recover()}
                >
                  Abrir baú guardado
                </button>
                <Link href="/journey/equipment">Meus equipamentos</Link>
              </details>
            )}
            {pendingOpen && (
              <section aria-label="Baú comprado">
                <p>
                  Compra confirmada. Seu baú permanece guardado até a abertura.
                </p>
                <button
                  disabled={!operationsAllowed || busy}
                  onClick={() => void retryOpen()}
                >
                  Tentar abrir novamente
                </button>
              </section>
            )}
            {confirmation && (
              <section
                aria-label="Confirmar compra"
                className={shop.confirmation}
              >
                <p>Confirmar compra de {confirmation.name}?</p>
                <button
                  className={styles.primaryLink}
                  disabled={!operationsAllowed || busy}
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
                  <p className={shop.origin}>
                    <span aria-hidden="true">✦</span> Loja · atividade
                    comunitária
                  </p>
                  <details className={shop.details}>
                    <summary>Ver conteúdo aprovado</summary>
                    <p>
                      Moedas e possibilidade de equipamento, conforme o conteúdo
                      comum existente.
                    </p>
                  </details>
                  <strong className={shop.price}>
                    ◈ 40 {TRAVELER_CURRENCY_NAME}
                  </strong>
                  <button
                    className={styles.primaryLink}
                    disabled={
                      !operationsAllowed ||
                      busy ||
                      !!pendingOpen ||
                      traveler.coins < 40
                    }
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
                  {operationsAllowed && traveler.coins < 40 && (
                    <p className={shop.origin}>
                      Moedas insuficientes para este baú.
                    </p>
                  )}
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
                          !operationsAllowed ||
                          owned ||
                          busy ||
                          (!!qa && traveler.coins < price)
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
              <section
                aria-labelledby="activity-chests"
                className={shop.catalogSection}
              >
                <h2 id="activity-chests">Tesouros de atividades</h2>
                <p className={shop.sectionLead}>
                  Baús concedidos por atividades comunitárias validadas.
                </p>
                <div className={shop.products}>
                  {(['epic'] as const).map((id) => (
                    <article
                      className={`${styles.itemCard} ${shop.product}`}
                      key={id}
                      data-rarity="épico"
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
                      <p className={shop.origin}>
                        <span aria-hidden="true">✦</span> Atividade comunitária
                      </p>
                      <details className={shop.details}>
                        <summary>Ver conteúdo aprovado</summary>
                        <p>
                          Moedas e possibilidade de Elmo do Viajante, conforme o
                          sorteio épico aprovado. Não está à venda.
                        </p>
                      </details>
                      <Link href="/journey/guild">
                        Consultar atividades da Guilda
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {qa && (
              <section
                aria-labelledby="other-acquisitions"
                className={shop.catalogSection}
              >
                <h2 id="other-acquisitions">Mais artefatos</h2>
                <p className={shop.sectionLead}>
                  Descubra como cada item entra na jornada.
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
                        <p className={shop.origin}>
                          <span aria-hidden="true">✦</span>{' '}
                          {item.slot === 'boots'
                            ? 'Equipamento inicial'
                            : item.slot === 'helmet'
                              ? 'Baú épico comunitário'
                              : 'Jornada'}
                        </p>
                        <span className={shop.availability}>
                          Sem oferta de compra
                        </span>
                      </article>
                    ))}
                  {category !== 'equipment' &&
                    (['uncommon', 'rare', 'extraordinary'] as const).map(
                      (id) => (
                        <article
                          className={`${styles.itemCard} ${shop.product}`}
                          key={id}
                          data-rarity={
                            id === 'uncommon'
                              ? 'incomum'
                              : id === 'rare'
                                ? 'raro'
                                : 'lendário'
                          }
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
                          <p className={shop.origin}>
                            <span aria-hidden="true">✦</span>{' '}
                            {id === 'extraordinary'
                              ? 'Guilda · fonte não liberada'
                              : 'Fonte não homologada'}
                          </p>
                          <span className={shop.availability}>
                            Sem oferta de compra
                          </span>
                        </article>
                      ),
                    )}
                </div>
              </section>
            )}
            {qa && category === 'all' && (
              <section aria-labelledby="existing-cards">
                <details className={shop.catalogDetails}>
                  <summary>
                    <h2 id="existing-cards">Cartas da Arena</h2>
                  </summary>
                  <p>
                    Sete cartas de combate existentes pelo pacote inicial:
                    solicitação e confirmação manuais, uma vez por conta. A
                    coleção e o baralho de sete cartas permanecem em Meu
                    Baralho, com raridades, efeitos e posse próprios.
                  </p>
                  <p>
                    Venda de cartas indisponível: não há tabela de preços ou
                    contrato de compra aprovado. Nenhuma carta adicional é
                    concedida por esta tela.
                  </p>
                  <Link href="/journey/arena/deck">
                    Consultar cartas e pacote inicial em Meu Baralho
                  </Link>
                </details>
              </section>
            )}
            {reveal && qa && (
              <ChestReveal
                key={reveal.receipt.id}
                receipt={reveal.receipt}
                traveler={traveler}
                cursor={reveal.cursor}
                cinematic
                presentationLabel={
                  training ? 'Tesouro de treino QA' : 'Seu tesouro'
                }
                onProgress={(cursor) =>
                  saveCursor(reveal.owner, qa.actor, cursor)
                }
                onClose={() => setReveal(null)}
                onViewEquipment={() => {
                  setReveal(null);
                  router.push(routes.backpack);
                }}
              />
            )}
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
