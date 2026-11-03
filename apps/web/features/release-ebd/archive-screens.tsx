'use client';
import { arenaCardDescription, describeArenaAction } from '@rpg/game-engine';
import { ArchiveAccess } from './archive';
import type { ArchiveSnapshot } from '../../lib/supabase/online-sync';
import type { ArchiveCard } from '../../lib/supabase/owned-cards-read';
import { EQUIPMENT_CATALOG } from '../journey/data/equipmentCatalog';
import { equipmentBibleFor } from '../journey/data/equipmentBible';
import { EquipmentBibleDetails } from '../journey/components/equipment-bible-details';
import { EquipmentStatBonuses } from '../journey/components/equipment-stat-bonuses';
import { equipmentAssetForItem } from '../journey/data/avatarAssets';
import { DiaryContents } from '../journey/screens/diary';
import styles from '../journey/journey.module.css';
import book from '../journey/components/diary-experience.module.css';
import cardsCss from '../guild-missions/panel.module.css';
import archiveCss from './archive.module.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isShopTestPreview } from '../../lib/release-scope';
import { readQAShop } from '../../lib/qa-shop/client';
import { useAuth } from '../../lib/supabase/auth-context';
import { useJourney } from '../journey/state/use-journey';
import { ChestPanel } from '../journey/components/chest-panel';

export function ArchiveBackpack() {
  const [revision, setRevision] = useState(0);
  return (
    <ArchiveAccess key={revision} includeCards>
      {(snapshot, cards) => (
        <>
          <BackpackContents snapshot={snapshot} cards={cards} />
          <CommunityChests onRefresh={() => setRevision((v) => v + 1)} />
        </>
      )}
    </ArchiveAccess>
  );
}
const ignoreCount = () => {};
function CommunityChests({ onRefresh }: { onRefresh: () => void }) {
  const auth = useAuth(),
    journey = useJourney();
  const actor = journey.status === 'ready' ? journey.traveler.id : null;
  const [qaActor, setQAActor] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (isShopTestPreview() && actor)
      readQAShop(actor)
        .then((s) => {
          if (live) setQAActor(s.enabled && s.balanceVerified ? actor : null);
        })
        .catch(() => {
          if (live) setQAActor(null);
        });
    return () => {
      live = false;
    };
  }, [actor]);
  if (auth.status !== 'signedIn' || journey.status !== 'ready') return null;
  const qa = qaActor === journey.traveler.id;
  return (
    <section aria-label="Baús de atividades">
      <h2>{qa ? 'Baús da Loja QA' : 'Baús de atividades'}</h2>
      <p>
        Saldo confirmado: {journey.traveler.coins} moedas.{' '}
        {qa ? (
          <>
            <Link href="/journey/shop">Loja TEST</Link> ·{' '}
            <Link href="/journey/equipment">Equipar itens próprios</Link>
          </>
        ) : (
          'Equipamentos adquiridos ficam em consulta; ações de equipar e Loja continuam bloqueadas.'
        )}
      </p>
      <ChestPanel
        key={`${auth.user.id}:${journey.traveler.id}:${qa}`}
        ownerId={auth.user.id}
        traveler={journey.traveler}
        online
        communityOnly
        qaShop={qa}
        onCountChange={ignoreCount}
        onViewEquipment={onRefresh}
        onRefreshInventory={onRefresh}
      />
    </section>
  );
}
export function BackpackContents({
  snapshot,
  cards,
}: {
  snapshot: ArchiveSnapshot;
  cards: ArchiveCard[];
}) {
  return (
    <section className={styles.diarySection}>
      <p className={styles.eyebrow}>INVENTÁRIO GERAL</p>
      <h1>Mochila</h1>
      <p className={styles.phaseLead}>Seus itens guardados, para consulta.</p>
      {!snapshot.inventory.length && <p>Nenhum item guardado neste avatar.</p>}
      <div className={`${styles.itemShelf} ${archiveCss.backpackGrid}`}>
        {snapshot.inventory
          .filter((row) => row.quantity > 0)
          .map((row) => {
            const equipment = !row.card_receipt_id
              ? EQUIPMENT_CATALOG.find((item) => item.id === row.item_id)
              : undefined;
            const ownedCard = cards.find(
              (item) => item.card.id === row.item_id,
            )?.card;
            return (
              <article
                className={`${styles.itemCard} ${archiveCss.backpackItem}`}
                key={row.id}
                data-rarity={equipment?.rarity ?? ownedCard?.rarity}
              >
                {equipment /* eslint-disable-next-line @next/next/no-img-element -- approved existing inventory icon */ && (
                  <img
                    className={archiveCss.backpackIcon}
                    src={equipmentAssetForItem(equipment)}
                    alt=""
                  />
                )}
                <h2>{equipment?.name ?? ownedCard?.name ?? row.item_id}</h2>
                <p>
                  Quantidade: {row.quantity} · Raridade:{' '}
                  {equipment?.rarity ?? ownedCard?.rarity ?? 'Não cadastrada'}
                </p>
                <p>
                  {equipment
                    ? equipmentBibleFor(equipment)?.biblicalDescription
                    : ownedCard
                      ? arenaCardDescription(ownedCard)
                      : 'Descrição autorizada indisponível.'}
                </p>
                <p>
                  {equipment
                    ? snapshot.traveler.equipped[equipment.slot] ===
                      equipment.id
                      ? 'Equipamento · equipado'
                      : 'Equipamento · guardado'
                    : ownedCard
                      ? 'Carta adquirida'
                      : 'Item guardado'}
                </p>
                {equipment && (
                  <>
                    <EquipmentStatBonuses stats={equipment.stats} />
                    <EquipmentBibleDetails item={equipment} />
                  </>
                )}
              </article>
            );
          })}
      </div>
    </section>
  );
}
export function ArchiveCollection() {
  return (
    <ArchiveAccess includeCards>
      {(_snapshot, cards) => <CollectionContents cards={cards} />}
    </ArchiveAccess>
  );
}
export function CollectionContents({ cards }: { cards: ArchiveCard[] }) {
  return (
    <section className={styles.diarySection}>
      <p className={styles.eyebrow}>CARTAS ADQUIRIDAS</p>
      <h1>Coleção</h1>
      <p>Cartas na sua coleção: {cards.length}.</p>
      {!cards.length && <p>Nenhuma carta adquirida neste avatar.</p>}
      <div className={cardsCss.grid}>
        {cards.map(({ card }) => {
          const detail = describeArenaAction(card.action);
          return (
            <article
              className={cardsCss.card}
              key={card.id}
              aria-label={`Carta: ${card.name}`}
            >
              <h2>{card.name}</h2>
              <p>
                {card.rarity} ·{' '}
                {card.type === 'OFFENSIVE'
                  ? 'Ofensiva'
                  : card.type === 'DEFENSIVE'
                    ? 'Defensiva'
                    : 'Tática'}
              </p>
              <p>{arenaCardDescription(card)}</p>
              <strong>{detail.headline}</strong>
              <p>{detail.explanation}</p>
              <p>Duração: {detail.duration}</p>
              <p>Condição: {detail.condition}</p>
              <p>
                Custo base: {detail.focusCost} Foco · Nível mínimo:{' '}
                {detail.minimumLevel}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
export function ArchiveDiary() {
  return (
    <ArchiveAccess>
      {({ traveler, persistedProgress }) =>
        persistedProgress ? (
          <DiaryContents traveler={traveler} readOnly />
        ) : (
          <article className={book.book}>
            <header className={book.cover}>
              <h1>Diário do Viajante</h1>
            </header>
            <section className={book.panel}>
              <p>
                Nenhum registro de progresso persistido disponível para este
                avatar.
              </p>
              <p>
                Os registros existentes serão apresentados quando estiverem
                disponíveis na sua conta.
              </p>
            </section>
          </article>
        )
      }
    </ArchiveAccess>
  );
}
