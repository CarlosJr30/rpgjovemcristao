'use client';
import { gameAudio } from '../audio/audio-manager';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  chestCatalog,
  resolveChestEquipmentReward,
  type ChestEquipmentReward,
  type ChestReward,
  type ChestType,
} from '../data/chests';
import type { Traveler } from '../domain/traveler';
import { buyChest, openOwnedChest } from '../state/use-journey';
import { chestRepository } from '../../../lib/supabase/repositories/chest-repository';
import { reloadOnlineTraveler } from '../../../lib/supabase/online-sync';
import styles from '../journey.module.css';

type OwnedChest = { type: ChestType; quantity: number };
const chestTypes = Object.keys(chestCatalog) as ChestType[];

export function ChestPanel({
  traveler,
  online,
  onCountChange,
  onViewEquipment,
}: {
  traveler: Traveler;
  online: boolean;
  onCountChange: (count: number) => void;
  onViewEquipment: () => void;
}) {
  const [owned, setOwned] = useState<OwnedChest[]>(() =>
    chestTypes
      .filter((type) => traveler.chests[type] > 0)
      .map((type) => ({ type, quantity: traveler.chests[type] })),
  );
  const [loading, setLoading] = useState(online);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [reveal, setReveal] = useState<{
    type: ChestType;
    reward: ChestReward;
    equipment: ChestEquipmentReward | null;
  } | null>(null);
  const operations = useRef(new Map<string, string>());
  const continueButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!reveal) return;
    continueButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setReveal(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [reveal]);

  const load = useCallback(async () => {
    if (!online) {
      const local = chestTypes
        .filter((type) => traveler.chests[type] > 0)
        .map((type) => ({ type, quantity: traveler.chests[type] }));
      setOwned(local);
      onCountChange(local.reduce((sum, entry) => sum + entry.quantity, 0));
      setLoading(false);
      return;
    }
    try {
      const rows = await chestRepository.list(traveler.id);
      const remote = rows.map((row) => ({
        type: row.chest_type as ChestType,
        quantity: row.quantity,
      }));
      setOwned(remote);
      onCountChange(remote.reduce((sum, entry) => sum + entry.quantity, 0));
      setMessage('');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar seus Baús.',
      );
    } finally {
      setLoading(false);
    }
  }, [online, onCountChange, traveler]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const operationId = (key: string) => {
    const existing = operations.current.get(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    operations.current.set(key, created);
    return created;
  };

  const purchase = async (type: ChestType) => {
    const key = `purchase:${type}`;
    setBusy(key);
    setMessage('');
    try {
      const id = operationId(key);
      if (online) {
        await chestRepository.purchase(traveler.id, type, id);
        await reloadOnlineTraveler(traveler.id);
      } else {
        const status = buyChest(type, id);
        if (status === 'insufficient') throw new Error('Moedas insuficientes.');
        if (status === 'level-required')
          throw new Error('Seu nível ainda não libera este Baú.');
        if (status === 'unavailable' || status === 'save-failed')
          throw new Error('Não foi possível comprar este Baú.');
      }
      operations.current.delete(key);
      gameAudio.playEffect('chest');
      setMessage(`${chestCatalog[type].name} adicionado à Mochila.`);
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível comprar o Baú.',
      );
    } finally {
      setBusy(null);
    }
  };

  const open = async (type: ChestType) => {
    const key = `open:${type}`;
    setBusy(key);
    setMessage('');
    try {
      const id = operationId(key);
      let reward: ChestReward;
      if (online) {
        const result = await chestRepository.open(traveler.id, type, id);
        reward = {
          coins: result.coins,
          itemId: result.itemId,
          itemName: result.itemName,
        };
        if (!(await reloadOnlineTraveler(traveler.id))) {
          setMessage(
            'Recompensa concedida. A Mochila será sincronizada novamente em instantes.',
          );
        }
      } else {
        const result = openOwnedChest(type, id);
        if (!('reward' in result))
          throw new Error('Este Baú não está mais disponível.');
        reward = result.reward;
      }
      operations.current.delete(key);
      setReveal({
        type,
        reward,
        equipment: resolveChestEquipmentReward(reward, traveler.inventory),
      });
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível abrir o Baú.',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={styles.chestPanel}>
      <section aria-labelledby="owned-chests-title">
        <p className={styles.eyebrow}>SEUS BAÚS</p>
        <h2 id="owned-chests-title">Tesouros guardados</h2>
        {loading ? (
          <p role="status">Carregando Baús…</p>
        ) : owned.length === 0 ? (
          <div className={styles.chestEmpty}>
            <b>Você ainda não possui Baús.</b>
            <span>Conclua missões, desafios ou compre um Baú.</span>
          </div>
        ) : (
          <div className={styles.chestGrid}>
            {owned.map(({ type, quantity }) => (
              <ChestCard
                key={type}
                type={type}
                quantity={quantity}
                action="open"
                busy={busy === `open:${type}`}
                onAction={() => void open(type)}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="available-chests-title">
        <p className={styles.eyebrow}>BAÚS DISPONÍVEIS</p>
        <h2 id="available-chests-title">Mercador de Baús</h2>
        <div className={styles.chestGrid}>
          {chestTypes.map((type) => (
            <ChestCard
              key={type}
              type={type}
              action="purchase"
              busy={busy === `purchase:${type}`}
              onAction={() => void purchase(type)}
            />
          ))}
        </div>
      </section>
      {message && (
        <p className={styles.notice} role="status">
          {message}
        </p>
      )}
      {reveal && (
        <div className={styles.chestRevealBackdrop} role="presentation">
          <section
            className={styles.chestReveal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chest-result-title"
          >
            <Image
              className={styles.chestRevealChest}
              src={chestCatalog[reveal.type].image}
              alt={`${chestCatalog[reveal.type].name} aberto`}
              width={180}
              height={180}
            />
            <p className={styles.eyebrow}>VOCÊ RECEBEU</p>
            <h2 id="chest-result-title">
              {chestCatalog[reveal.type].name} aberto!
            </h2>
            <div className={styles.chestRewardList}>
              {reveal.reward.coins > 0 && (
                <article className={styles.chestCoinReward}>
                  <Image
                    src="/assets/items/coin_pouch.png"
                    alt="Moedas do Viajante"
                    width={72}
                    height={72}
                  />
                  <strong>+ {reveal.reward.coins} Moedas do Viajante</strong>
                </article>
              )}
              {reveal.equipment && (
                <article
                  className={styles.chestEquipmentReward}
                  data-rarity={reveal.equipment.rarity}
                >
                  <Image
                    src={reveal.equipment.iconAsset}
                    alt={reveal.equipment.name}
                    width={168}
                    height={168}
                  />
                  <div>
                    <h3>{reveal.equipment.name}</h3>
                    <b className={styles.chestRewardRarity}>
                      {reveal.equipment.rarityLabel}
                    </b>
                    <strong>+1</strong>
                    {reveal.equipment.duplicate && (
                      <span>
                        Duplicado — quantidade aumentada para{' '}
                        {reveal.equipment.quantity}
                      </span>
                    )}
                  </div>
                </article>
              )}
            </div>
            <div className={styles.chestRevealActions}>
              {reveal.equipment && (
                <button
                  className={styles.chestSecondaryAction}
                  onClick={() => {
                    setReveal(null);
                    onViewEquipment();
                  }}
                >
                  Ver na Mochila
                </button>
              )}
              <button ref={continueButton} onClick={() => setReveal(null)}>
                Continuar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ChestCard({
  type,
  quantity,
  action,
  busy,
  onAction,
}: {
  type: ChestType;
  quantity?: number;
  action: 'open' | 'purchase';
  busy: boolean;
  onAction: () => void;
}) {
  const chest = chestCatalog[type];
  const purchasable = chest.price !== null;
  return (
    <article className={styles.chestCard} data-tier={type}>
      <Image src={chest.image} alt="" width={128} height={128} />
      <div>
        <small>{chest.rarityLabel}</small>
        <h3>{chest.name}</h3>
        {quantity !== undefined && <b>Quantidade: {quantity}</b>}
        <p>{chest.description}</p>
        <span>Pode conter: {chest.possibleRewards.join(' · ')}</span>
      </div>
      {action === 'open' ? (
        <button disabled={busy} onClick={onAction}>
          {busy ? 'Abrindo…' : 'Abrir'}
        </button>
      ) : purchasable ? (
        <button disabled={busy} onClick={onAction}>
          {busy ? 'Comprando…' : `Comprar · ◈ ${chest.price}`}
        </button>
      ) : (
        <b className={styles.chestLocked}>
          {chest.availability === 'guild'
            ? 'Recompensa de Guilda'
            : 'Disponível em eventos'}
        </b>
      )}
    </article>
  );
}
