'use client';
import { arenaCardDescription, describeArenaAction } from '@rpg/game-engine';
import Image from 'next/image';
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { ArchiveAccess } from './archive';
import {
  getOnlineSessionRevision,
  type ArchiveSnapshot,
} from '../../lib/supabase/online-sync';
import type { ArchiveCard } from '../../lib/supabase/owned-cards-read';
import { EQUIPMENT_CATALOG } from '../journey/data/equipmentCatalog';
import { equipmentAssetForItem } from '../journey/data/avatarAssets';
import { DiaryContents } from '../journey/screens/diary';
import styles from '../journey/journey.module.css';
import book from '../journey/components/diary-experience.module.css';
import cardsCss from '../guild-missions/panel.module.css';
import archiveCss from './archive.module.css';
import { useTrainingTraveler } from '../training-qa/context';
import {
  trainingSnapshot,
  subscribeTraining,
  emptyTrainingSnapshot,
} from '../../lib/training-qa/store';
import Link from 'next/link';
import { isShopTestPreview, isShopRelease } from '../../lib/release-scope';
import { readQAShop } from '../../lib/qa-shop/client';
import { useAuth } from '../../lib/supabase/auth-context';
import { useJourney } from '../journey/state/use-journey';
import { ChestPanel } from '../journey/components/chest-panel';
import { JourneyIcon } from '../journey/components/journey-icon';
import { formatAttributeBonuses } from '../journey/data/attributes';
import { TRAVELER_CURRENCY_NAME } from '../journey/data/progression';
import { arenaCardIllustration } from '../arena-deck/card-illustrations';

type BackpackTab = 'equipment' | 'chests' | 'cards';

export function ArchiveBackpack() {
  const auth = useAuth();
  const journey = useJourney();
  const owner = auth.status === 'signedIn' ? auth.user.id : '';
  const actor = journey.status === 'ready' ? journey.traveler.id : '';
  return (
    <BackpackSession key={`${owner}:${actor}:${getOnlineSessionRevision()}`} />
  );
}

function BackpackSession() {
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState<BackpackTab>('equipment');
  const [chestCount, setChestCount] = useState(0);
  return (
    <ArchiveAccess key={revision} includeCards>
      {(snapshot, cards) => (
        <BackpackContents
          snapshot={snapshot}
          cards={cards}
          tab={tab}
          onTabChange={setTab}
          chestCount={chestCount}
          chests={
            <CommunityChests
              onCountChange={setChestCount}
              onRefresh={() => setRevision((v) => v + 1)}
              onViewEquipment={() => setTab('equipment')}
            />
          }
        />
      )}
    </ArchiveAccess>
  );
}
function CommunityChests({
  onCountChange,
  onRefresh,
  onViewEquipment,
}: {
  onCountChange: (count: number) => void;
  onRefresh: () => void;
  onViewEquipment: () => void;
}) {
  const auth = useAuth(),
    journey = useJourney();
  const actor = journey.status === 'ready' ? journey.traveler.id : null;
  const [qaActor, setQAActor] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if ((isShopTestPreview() || isShopRelease()) && actor)
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
  const released = isShopRelease();
  const qa = !released && qaActor === journey.traveler.id;
  return (
    <div aria-label={qa ? 'Baús da Loja QA' : 'Baús de atividades'}>
      <ChestPanel
        key={`${auth.user.id}:${journey.traveler.id}:${qa}`}
        ownerId={auth.user.id}
        traveler={journey.traveler}
        online
        communityOnly
        qaShop={qa}
        releaseShop={released}
        onCountChange={onCountChange}
        onViewEquipment={() => {
          onRefresh();
          onViewEquipment();
        }}
        onRefreshInventory={onRefresh}
      />
    </div>
  );
}
export function BackpackContents({
  snapshot: canonicalSnapshot,
  cards,
  tab,
  onTabChange,
  chestCount = 0,
  chests,
}: {
  snapshot: ArchiveSnapshot;
  cards: ArchiveCard[];
  tab?: BackpackTab;
  onTabChange?: (tab: BackpackTab) => void;
  chestCount?: number;
  chests?: ReactNode;
}) {
  const [localTab, setLocalTab] = useState<BackpackTab>('equipment');
  const [equipmentRarity, setEquipmentRarity] = useState('all');
  const [cardRarity, setCardRarity] = useState('all');
  const activeTab = tab ?? localTab;
  const selectTab = onTabChange ?? setLocalTab;
  const training = useTrainingTraveler(),
    binding = useSyncExternalStore(
      subscribeTraining,
      trainingSnapshot,
      emptyTrainingSnapshot,
    );
  const snapshot: ArchiveSnapshot =
    training && binding?.selected
      ? {
          ...canonicalSnapshot,
          traveler: training,
          inventory: [
            ...canonicalSnapshot.inventory.filter((row) => row.card_receipt_id),
            ...Object.entries(binding.state.items).map(
              ([item_id, quantity]) => ({
                id: 'training002:' + item_id,
                traveler_id: training.id,
                item_id,
                quantity,
                acquired_at: binding.state.expiresAt,
                metadata: { qaOnly: true },
              }),
            ),
          ],
        }
      : canonicalSnapshot;
  const equipmentById = new Map<
    string,
    { item: (typeof EQUIPMENT_CATALOG)[number]; quantity: number }
  >();
  for (const row of snapshot.inventory) {
    if (row.quantity <= 0 || row.card_receipt_id) continue;
    const item = EQUIPMENT_CATALOG.find(
      (candidate) => candidate.id === row.item_id,
    );
    if (item) {
      const current = equipmentById.get(item.id);
      equipmentById.set(item.id, {
        item,
        quantity: (current?.quantity ?? 0) + row.quantity,
      });
    }
  }
  const equipment = [...equipmentById.values()].sort((a, b) =>
    a.item.name.localeCompare(b.item.name, 'pt-BR'),
  );
  const equipmentRarities = [
    ...new Set(equipment.map(({ item }) => item.rarity)),
  ];
  const cardRarities = [...new Set(cards.map(({ card }) => card.rarity))];
  const ownedCardCount = cards.length;
  const tabItems: {
    id: BackpackTab;
    label: string;
    icon: 'equipment' | 'backpack' | 'collection';
    count: number;
  }[] = [
    {
      id: 'equipment',
      label: 'Equipamentos',
      icon: 'equipment',
      count: equipment.reduce((sum, row) => sum + row.quantity, 0),
    },
    { id: 'chests', label: 'Baús', icon: 'backpack', count: chestCount },
    { id: 'cards', label: 'Cartas', icon: 'collection', count: ownedCardCount },
  ];
  const moveTab = (index: number) => {
    const next = tabItems[(index + tabItems.length) % tabItems.length];
    selectTab(next.id);
    document.getElementById(`backpack-tab-${next.id}`)?.focus();
  };
  return (
    <section className={styles.diarySection}>
      <p className={styles.eyebrow}>INVENTÁRIO GERAL</p>
      <h1>Mochila</h1>
      <p className={styles.phaseLead}>
        {training
          ? 'Treino QA separado; itens oficiais preservados.'
          : 'Seu inventário, pronto para a jornada.'}
      </p>
      <p className={archiveCss.wallet}>
        ◈ {snapshot.traveler.coins} {TRAVELER_CURRENCY_NAME} ·{' '}
        <Link href="/journey/shop">Loja</Link>
      </p>
      <div
        className={archiveCss.tabs}
        role="tablist"
        aria-label="Categorias da Mochila"
      >
        {tabItems.map((item, index) => (
          <button
            key={item.id}
            id={`backpack-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === item.id}
            aria-controls={`backpack-panel-${item.id}`}
            tabIndex={activeTab === item.id ? 0 : -1}
            onClick={() => selectTab(item.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                moveTab(index + 1);
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                moveTab(index - 1);
              } else if (event.key === 'Home') {
                event.preventDefault();
                moveTab(0);
              } else if (event.key === 'End') {
                event.preventDefault();
                moveTab(tabItems.length - 1);
              }
            }}
          >
            <JourneyIcon name={item.icon} />
            <span>{item.label}</span>
            <span
              className={archiveCss.count}
              aria-label={`${item.count} possuídos`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>
      <section
        id="backpack-panel-equipment"
        className={archiveCss.backpackPanel}
        role="tabpanel"
        aria-labelledby="backpack-tab-equipment"
        hidden={activeTab !== 'equipment'}
      >
        <div className={archiveCss.panelHeading}>
          <h2>
            Equipamentos{' '}
            <small>
              {equipment.reduce((sum, row) => sum + row.quantity, 0)} possuídos
            </small>
          </h2>
          {!!equipmentRarities.length && (
            <label className={archiveCss.filter}>
              Raridade
              <select
                value={equipmentRarity}
                onChange={(event) => setEquipmentRarity(event.target.value)}
              >
                <option value="all">Todas</option>
                {equipmentRarities.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {!equipment.length ? (
          <div className={styles.chestEmpty}>
            <JourneyIcon name="equipment" />
            <b>Nenhum equipamento guardado.</b>
          </div>
        ) : (
          <div className={`${styles.itemShelf} ${archiveCss.backpackGrid}`}>
            {equipment
              .filter(
                ({ item }) =>
                  equipmentRarity === 'all' || item.rarity === equipmentRarity,
              )
              .map(({ item, quantity }) => {
                const equipped =
                  snapshot.traveler.equipped[item.slot] === item.id;
                const bonus =
                  formatAttributeBonuses(item.stats).join(' · ') ||
                  'Sem bônus de atributo';
                return (
                  <article
                    className={`${styles.itemCard} ${archiveCss.backpackItem}`}
                    key={item.id}
                    data-rarity={item.rarity}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- approved local inventory art */}
                    <img
                      src={equipmentAssetForItem(item)}
                      alt=""
                      width="88"
                      height="88"
                      className={archiveCss.backpackIcon}
                      loading="lazy"
                    />
                    <h3>{item.name}</h3>
                    <p>
                      {item.rarity} · {bonus}
                    </p>
                    <p>
                      {equipped ? 'Equipado' : 'Disponível'}
                      {quantity > 1 ? ` · ${quantity} possuídos` : ''}
                    </p>
                    <Link
                      className={archiveCss.itemAction}
                      href="/journey/equipment"
                    >
                      {equipped ? 'Trocar ou desequipar' : 'Equipar'}
                    </Link>
                  </article>
                );
              })}
          </div>
        )}
      </section>
      <section
        id="backpack-panel-chests"
        className={archiveCss.backpackPanel}
        role="tabpanel"
        aria-labelledby="backpack-tab-chests"
        hidden={activeTab !== 'chests'}
      >
        {chests ?? (
          <div className={styles.chestEmpty}>
            Seus baús disponíveis aparecem aqui.
          </div>
        )}
      </section>
      <section
        id="backpack-panel-cards"
        className={archiveCss.backpackPanel}
        role="tabpanel"
        aria-labelledby="backpack-tab-cards"
        hidden={activeTab !== 'cards'}
      >
        <div className={archiveCss.panelHeading}>
          <h2>
            Cartas <small>{ownedCardCount} possuídas</small>
          </h2>
          {!!cardRarities.length && (
            <label className={archiveCss.filter}>
              Raridade
              <select
                value={cardRarity}
                onChange={(event) => setCardRarity(event.target.value)}
              >
                <option value="all">Todas</option>
                {cardRarities.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <Link className={archiveCss.itemAction} href="/journey/arena/deck">
          Montar Meu Baralho · 7 cartas
        </Link>
        {!ownedCardCount ? (
          <div className={styles.chestEmpty}>
            <JourneyIcon name="collection" />
            <b>Nenhuma carta adquirida neste viajante.</b>
            <Link href="/journey/arena/deck">Ver Meu Baralho</Link>
          </div>
        ) : (
          <div className={archiveCss.cardsGrid}>
            {cards
              .filter(
                ({ card }) =>
                  cardRarity === 'all' || card.rarity === cardRarity,
              )
              .map(({ card }) => {
                const art = arenaCardIllustration(card.id);
                const detail = describeArenaAction(card.action);
                return (
                  <article
                    className={archiveCss.card}
                    key={card.id}
                    data-rarity={card.rarity}
                  >
                    {art ? (
                      <Image
                        className={archiveCss.cardArt}
                        src={art.src}
                        alt={art.alt}
                        width={320}
                        height={440}
                        loading="lazy"
                      />
                    ) : (
                      <JourneyIcon name="collection" />
                    )}
                    <div className={archiveCss.cardDetails}>
                      <h3>{card.name}</h3>
                      <p>
                        {card.rarity} · Custo {detail.focusCost} Foco
                      </p>
                      <strong>{detail.headline}</strong>
                      <details>
                        <summary>Detalhes do efeito</summary>
                        <p>{arenaCardDescription(card)}</p>
                        <p>
                          Duração: {detail.duration} · Nível mínimo:{' '}
                          {detail.minimumLevel}
                        </p>
                      </details>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>
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
