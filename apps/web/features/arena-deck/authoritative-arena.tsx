'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { validateArenaDeck, type ArenaProductAction } from '@rpg/game-engine';
import { requestAuthority } from '../../lib/authority/client';
import type { BattleView, OwnedCard } from '../../lib/authority/service';
import { TRAINING_OPPONENTS } from '../journey/data/arena';
import { TOWER_FLOORS } from '../arena-tower/config';
import { DeckEditor } from './editor';
import { ArenaBattleActions } from './battle-actions';
import { ArenaStage } from '../journey/components/arena-stage';
import { reloadOnlineTraveler } from '../../lib/supabase/online-sync';
import styles from '../journey/journey.module.css';
import { useBattlePresentation } from '../journey/hooks/use-battle-presentation';
import { useAudioScene } from '../journey/hooks/use-game-audio';
import { emitArenaSound } from '../journey/audio/arena-audio';

export function AuthoritativeArena({
  travelerId,
  mode,
  transport = requestAuthority,
}: {
  travelerId: string;
  mode: 'arena-v3' | 'tower-v3';
  transport?: typeof requestAuthority;
}) {
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const presentation = useBattlePresentation();
  const [ids, setIds] = useState<readonly string[]>([]);
  const [battle, setBattle] = useState<BattleView | null>(null);
  const [floor, setFloor] = useState(1);
  useAudioScene(mode === 'tower-v3' ? (floor === 7 ? 'boss' : 'tower') : null);
  const [opponent, setOpponent] = useState(TRAINING_OPPONENTS[0].id);
  const [message, setMessage] = useState('Consultando servidor oficial…');
  const [busy, setBusy] = useState(true);
  const pending = useRef(false);
  const startRequest = useRef<string | null>(null);
  const commandRequest = useRef<{
    revision: number;
    id: string;
    action: ArenaProductAction;
  } | null>(null);
  const cards = owned.map((o) => o.card);
  const base = { travelerId };
  useEffect(() => {
    let live = true;
    Promise.all([
      transport<OwnedCard[]>({ operation: 'collection', travelerId }),
      transport<BattleView | null>({ operation: 'resume', travelerId, mode }),
      mode === 'tower-v3'
        ? transport<{ nextFloor: number }>({ operation: 'tower', travelerId })
        : Promise.resolve({ nextFloor: 1 }),
    ])
      .then(([collection, current, tower]) => {
        if (!live) return;
        setOwned(collection);
        setBattle(current);
        setFloor(tower.nextFloor);
        setIds(current?.state.deck?.cards.map((c) => c.id) ?? []);
        setMessage(
          collection.length < 7
            ? 'Catálogo e aquisição aguardam homologação. Nenhuma carta foi concedida.'
            : 'Estado confirmado pelo servidor.',
        );
      })
      .catch(() => {
        if (live)
          setMessage(
            'Servidor oficial indisponível. Catálogo e combate permanecem bloqueados.',
          );
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [travelerId, mode, transport]);
  async function run(operation: () => Promise<void>) {
    if (pending.current || presentation.busy) return;
    pending.current = true;
    setBusy(true);
    try {
      await operation();
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : 'Operação pendente. Retome pelo servidor.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const active = battle?.state.status === 'in_progress';
  return (
    <section className={styles.diarySection}>
      <h1>
        {mode === 'tower-v3' ? 'Torre dos 7 Desafios' : 'Arena de Treinamento'}
      </h1>
      <p>
        Combate oficial por rodada. Saves locais anteriores permanecem
        demonstrativos.
      </p>
      <nav aria-label="Modos da Arena">
        <Link
          className={styles.primaryLink}
          href={mode === 'tower-v3' ? '/journey/arena' : '/journey/arena/tower'}
        >
          {mode === 'tower-v3' ? 'Arena de Treinamento' : 'Torre dos 7 Desafios'}
        </Link>
      </nav>
      {mode === 'tower-v3' && (
        <p>
          Próximo andar: {floor <= 7 ? floor : 'Torre concluída'}. Recompensas
          da Torre aguardam homologação.
        </p>
      )}
      <p role="status">{message}</p>
      <DeckEditor
        key={cards.map((c) => c.id).join(',') + (battle?.state.id ?? '')}
        cards={cards}
        saveMessage="Baralho pronto para iniciar no servidor."
        initial={ids}
        locked={!!active}
        busy={busy || presentation.busy}
        onSave={async (next) => {
          setIds(next);
          startRequest.current = null;
        }}
      />
      {!active && mode === 'arena-v3' && (
        <label>
          Adversário de treino{' '}
          <select
            value={opponent}
            disabled={busy}
            onChange={(e) => {
              setOpponent(e.target.value);
              startRequest.current = null;
            }}
          >
            {TRAINING_OPPONENTS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {!active && (
        <button
          disabled={
            busy ||
            presentation.busy ||
            !!validateArenaDeck(ids, cards) ||
            (mode === 'tower-v3' && floor > 7)
          }
          onClick={() =>
            void run(async () => {
              startRequest.current ??= crypto.randomUUID();
              const next = await transport<BattleView>({
                ...base,
                operation: 'start',
                requestId: startRequest.current,
                mode,
                ids,
                opponentId: mode === 'arena-v3' ? opponent : null,
                floor: mode === 'tower-v3' ? floor : null,
              });
              setBattle(next);
              startRequest.current = null;
              commandRequest.current = null;
              setMessage('Batalha registrada pelo servidor.');
            })
          }
        >
          {mode === 'tower-v3'
            ? `Enfrentar ${TOWER_FLOORS[floor - 1]?.snapshot.name ?? 'Torre'}`
            : 'Iniciar batalha'}
        </button>
      )}
      <button
        disabled={busy || presentation.busy}
        onClick={() =>
          void run(async () => {
            setBattle(
              await transport<BattleView | null>({
                ...base,
                operation: 'resume',
                mode,
              }),
            );
            if (mode === 'tower-v3')
              setFloor(
                (
                  await transport<{ nextFloor: number }>({
                    ...base,
                    operation: 'tower',
                  })
                ).nextFloor,
              );
            setMessage(
              'Estado consultado. Nenhuma recompensa foi solicitada pelo reload.',
            );
          })
        }
      >
        Retomar pelo servidor
      </button>
      {battle && (
        <>
          <ArenaStage
            battle={presentation.display ?? battle.state}
            phase={presentation.phase}
            event={presentation.event}
          />
          <ArenaBattleActions
            battle={battle.state}
            busy={busy || presentation.busy}
            onAction={(action) =>
              void run(async () => {
                if (
                  commandRequest.current?.revision !== battle.revision ||
                  commandRequest.current.action !== action
                )
                  commandRequest.current = {
                    revision: battle.revision,
                    id: crypto.randomUUID(),
                    action,
                  };
                const next = await transport<BattleView>({
                  ...base,
                  operation: 'command',
                  battleId: battle.state.id,
                  revision: battle.revision,
                  round: battle.state.round,
                  commandId: commandRequest.current.id,
                  action,
                });
                setBattle(next);
                presentation.play(battle.state, next.state, () => {
                  if (next.state.status === 'finished')
                    emitArenaSound(
                      next.state.winnerId === travelerId ? 'victory' : 'defeat',
                    );
                });
                commandRequest.current = null;
                if (next.state.status === 'finished') {
                  setMessage(
                    next.reward?.rewarded
                      ? 'Resultado e recompensa confirmados.'
                      : next.reward?.status === 'blocked'
                        ? 'Resultado confirmado. Recompensa bloqueada até homologação.'
                        : 'Resultado confirmado sem prêmio.',
                  );
                  if (mode === 'tower-v3')
                    setFloor(
                      (
                        await transport<{ nextFloor: number }>({
                          ...base,
                          operation: 'tower',
                        })
                      ).nextFloor,
                    );
                  await reloadOnlineTraveler(travelerId);
                }
              })
            }
          />
          {battle.receiptId && (
            <p>
              Recibo: {battle.receiptId}. XP: {battle.reward?.xp ?? 0}. Moedas:{' '}
              {battle.reward?.coins ?? 0}.
              {!!battle.reward?.levelBonusCoins && <> Bônus de nível: {battle.reward.levelBonusCoins} moedas.</>}
            </p>
          )}
        </>
      )}
    </section>
  );
}
