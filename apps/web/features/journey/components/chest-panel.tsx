'use client';
import { gameAudio } from '../audio/audio-manager';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { chestCatalog, type ChestType } from '../data/chests';
import type { Traveler } from '../domain/traveler';
import { buyChest } from '../state/use-journey';
import { chestRepository } from '../../../lib/supabase/repositories/chest-repository';
import { reloadOnlineTraveler } from '../../../lib/supabase/online-sync';
import styles from '../journey.module.css';
import { ChestReveal } from '../../chest-reveal/reveal';
import { requestChestOpening } from '../../chest-reveal/opening';
import {
  receiptFromOperation,
  isChestType,
  type RevealReceipt,
} from '../../chest-reveal/receipt';
import {
  bindReceipt,
  readVisual,
  saveCursor,
  type OpeningIntent,
  type VisualCursor,
} from '../../chest-reveal/visual-store';
import type { ChestOperationRow } from '../../../lib/supabase/database.types';

type OwnedChest = { type: ChestType; quantity: number };
const chestTypes = Object.keys(chestCatalog) as ChestType[];

export function ChestPanel({
  ownerId,
  traveler,
  online,
  onCountChange,
  onViewEquipment,
}: {
  ownerId: string;
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
    receipt: RevealReceipt;
    cursor: VisualCursor;
  } | null>(null);
  const [history, setHistory] = useState<ChestOperationRow[]>([]);
  const [pending, setPending] = useState<OpeningIntent | null>(null);
  const [resumable, setResumable] = useState<RevealReceipt | null>(null);
  const opening = useRef(false);
  const mounted = useRef(true);
  const operations = useRef(new Map<string, string>());
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const consult = useCallback(async () => {
    if (!online || !ownerId) return;
    let saved: ReturnType<typeof readVisual> | null = null;
    let visualError: unknown;
    try {
      saved = readVisual(ownerId, traveler.id);
    } catch (e) {
      visualError = e;
    }
    const operationKey = saved?.intent
      ? `open:${saved.intent.operationId}`
      : saved?.view?.operationKey;
    const [rows, row] = await Promise.all([
      chestRepository.history(traveler.id),
      operationKey
        ? chestRepository.operation(traveler.id, operationKey)
        : Promise.resolve(null),
    ]);
    if (!mounted.current) return;
    setHistory(rows);
    if (!saved) throw visualError;
    setPending(saved.intent);
    if (row) {
      const receipt = receiptFromOperation(row, traveler.id);
      bindReceipt(ownerId, traveler.id, receipt);
      setPending(null);
      setResumable(receipt);
    }
  }, [ownerId, online, traveler.id]);
  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(
      () =>
        void consult().catch((e) => {
          if (live)
            setMessage(
              e instanceof Error ? e.message : 'Confirmação pendente.',
            );
        }),
      0,
    );
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [consult]);

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
      const remote = rows
        .filter(
          (row) =>
            isChestType(row.chest_type) &&
            Number.isSafeInteger(row.quantity) &&
            row.quantity > 0,
        )
        .map((row) => ({
          type: row.chest_type as ChestType,
          quantity: row.quantity,
        }));
      setOwned(remote);
      onCountChange(remote.reduce((sum, entry) => sum + entry.quantity, 0));
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

  const present = (receipt: RevealReceipt, replay = false) => {
    let cursor: VisualCursor;
    try {
      cursor = bindReceipt(ownerId, traveler.id, receipt, replay);
    } catch (e) {
      if (!replay) throw e;
      // A fresh server record remains readable when local visual storage fails.
      // Never repair/delete bytes or treat this in-memory cursor as ownership.
      cursor = {
        receiptId: receipt.id,
        operationKey: receipt.operationKey,
        index: 0,
        seen: 0,
        summary: false,
      };
      setMessage(
        'Histórico confirmado em modo de leitura. A apresentação não pôde ser salva neste navegador.',
      );
    }
    setReveal({ receipt, cursor });
    setResumable(receipt);
  };
  const open = async (type: ChestType, retry = false) => {
    if (!online || !ownerId || opening.current) return;
    opening.current = true;
    setBusy(`open:${type}`);
    setMessage('');
    try {
      const receipt = await requestChestOpening(
        ownerId,
        traveler.id,
        type,
        retry,
      );
      // Sync is separate from receipt confirmation; failure never opens again.
      await reloadOnlineTraveler(traveler.id);
      if (!mounted.current) return;
      present(receipt);
      setPending(null);
      await Promise.all([load(), consult()]);
    } catch (error) {
      if (!mounted.current) return;
      try {
        setPending(readVisual(ownerId, traveler.id).intent);
      } catch {
        /* Preserve corrupt bytes. */
      }
      setMessage(error instanceof Error ? error.message : 'Abertura pendente.');
    } finally {
      opening.current = false;
      if (mounted.current) setBusy(null);
    }
  };

  return (
    <div className={styles.chestPanel}>
      {!online && (
        <p className={styles.notice}>
          Abertura de Baús exige conta online e registro confirmado do servidor.
          O modo local não concede prêmios nesta apresentação.
        </p>
      )}
      {pending && (
        <section aria-label="Abertura pendente" className={styles.notice}>
          <h2>Abertura pendente de confirmação</h2>
          <p>
            O resultado ainda não foi confirmado. Consulte o resultado ou tente
            reenviar a solicitação. Isso não abre outro Baú.
          </p>
          <button
            disabled={!!busy}
            onClick={() =>
              void consult().catch((e) =>
                setMessage(
                  e instanceof Error ? e.message : 'Confirmação pendente.',
                ),
              )
            }
          >
            Consultar resultado
          </button>
          <button
            disabled={!!busy}
            onClick={() => void open(pending.type, true)}
          >
            Reenviar mesma solicitação
          </button>
        </section>
      )}
      {resumable && !reveal && (
        <button
          disabled={!!busy}
          onClick={() => {
            try {
              present(resumable);
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : 'Apresentação indisponível.',
              );
            }
          }}
        >
          Retomar apresentação registrada
        </button>
      )}
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
                disabled={!!busy || !!pending || !online || !ownerId}
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
              disabled={!!busy || !!pending}
              onAction={() => void purchase(type)}
            />
          ))}
        </div>
      </section>
      {online && (
        <section aria-label="Histórico de aberturas">
          <h2>Aberturas registradas</h2>
          <p>Ver novamente consulta o registro e não abre outro Baú.</p>
          {history.length === 0 ? (
            <p>Nenhuma abertura confirmada carregada.</p>
          ) : (
            <ul>
              {history
                .filter(
                  (r) =>
                    r.traveler_id === traveler.id && isChestType(r.chest_type),
                )
                .map((row) => (
                  <li key={row.id}>
                    {chestCatalog[row.chest_type as ChestType].name} ·{' '}
                    {new Date(row.created_at).toLocaleDateString('pt-BR')}{' '}
                    <button
                      disabled={!!busy || !!pending}
                      onClick={async () => {
                        if (opening.current) return;
                        opening.current = true;
                        setBusy('history');
                        try {
                          const fresh = await chestRepository.operation(
                            traveler.id,
                            row.operation_key,
                          );
                          if (!fresh)
                            throw new Error('Registro não confirmado.');
                          if (mounted.current)
                            present(
                              receiptFromOperation(fresh, traveler.id),
                              true,
                            );
                        } catch (e) {
                          if (mounted.current)
                            setMessage(
                              e instanceof Error
                                ? e.message
                                : 'Histórico indisponível.',
                            );
                        } finally {
                          opening.current = false;
                          if (mounted.current) setBusy(null);
                        }
                      }}
                    >
                      Ver novamente
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}
      {message && (
        <p className={styles.notice} role="status">
          {message}
        </p>
      )}
      {reveal && (
        <ChestReveal
          key={reveal.receipt.id}
          receipt={reveal.receipt}
          traveler={traveler}
          cursor={reveal.cursor}
          onProgress={(cursor) => saveCursor(ownerId, traveler.id, cursor)}
          onClose={() => setReveal(null)}
          onViewEquipment={() => {
            setReveal(null);
            onViewEquipment();
          }}
        />
      )}
    </div>
  );
}

function ChestCard({
  type,
  quantity,
  action,
  busy,
  disabled = false,
  onAction,
}: {
  type: ChestType;
  quantity?: number;
  action: 'open' | 'purchase';
  busy: boolean;
  disabled?: boolean;
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
        <button disabled={busy || disabled} onClick={onAction}>
          {busy ? 'Abrindo…' : 'Abrir'}
        </button>
      ) : purchasable ? (
        <button disabled={busy || disabled} onClick={onAction}>
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
