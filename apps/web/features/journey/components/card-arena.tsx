'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CARD_COMBAT_RULES,
  COMBAT_CARDS,
  combatCard,
  createCardBattle,
  playCombatCard,
  endCardTurn,
  resolveCardEnemyTurn,
  concedeCardBattle,
  enemyCardIntent,
  cardPlayError,
  type CardBattle,
  type CardCommand,
  type TrainingReward,
} from '@rpg/game-engine';
import { useAuth } from '../../../lib/supabase/auth-context';
import { getCurrentOnlineUserId } from '../../../lib/supabase/online-sync';
import { TRAINING_OPPONENTS, travelerBattleSnapshot } from '../data/arena';
import { equippedItems, ATTRIBUTE_LABELS } from '../data/attributes';
import { addGameplayReward } from '../data/progression';
import { settleCardArenaReward } from '../data/card-arena-reward';
import { settleOnlineCardArenaReward } from '../data/online-card-arena-reward';
import { economyClient } from '../../../lib/economy/client';
import type { Traveler, EquipmentSlot } from '../domain/traveler';
import {
  cardArenaStorage,
  cardArenaKey,
  type CardArenaScope,
  type CardSettlement,
} from '../persistence/card-arena-storage';
import { arenaRepository } from '../persistence/arena-storage';
import { journeyRepository } from '../persistence/journey-storage';
import { updateTraveler } from '../state/use-journey';
import { emitArenaSound } from '../audio/arena-audio';
import styles from './card-arena.module.css';
import {
  Fighter,
  CardFace,
  CardPreview,
  TrainingArt,
} from './card-arena-presentation';

const slots: Record<EquipmentSlot, { label: string; glyph: string }> = {
  weapon: { label: 'Espada', glyph: '⚔' },
  armor: { label: 'Couraça', glyph: '⬡' },
  helmet: { label: 'Elmo', glyph: '♜' },
  shield: { label: 'Escudo', glyph: '◇' },
  boots: { label: 'Botas', glyph: '➶' },
  amulet: { label: 'Medalhão', glyph: '◉' },
};
const equipmentStrategy: Readonly<Record<string, string>> = {
  'traveler-sword-common': '+1 de dano em cada carta de ataque.',
  'traveler-armor-uncommon':
    '+1 de Bloqueio quando uma carta concede Bloqueio.',
  'traveler-shield-rare': '+1 de Bloqueio quando uma carta concede Bloqueio.',
  'traveler-boots': '+1 de Foco no início do duelo.',
  'wisdom-amulet': '+1 de Foco ao jogar uma carta que concede Foco.',
  'traveler-helmet-rare':
    'Reduz em 1 o dano anunciado, respeitando o mínimo de 1.',
};
/** Nine visual categories are extensible metadata; no new persistent slot is created. */
export const EQUIPMENT_CARD_CATEGORIES = [
  'sword',
  'armor',
  'helmet',
  'shield',
  'boots',
  'medallion',
  'pants',
  'gloves',
  'accessory',
] as const;
const motionDuration = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 30 : 460;

function EquipmentCards({ traveler }: { traveler: Traveler }) {
  const equipment = equippedItems(traveler);
  return (
    <details className={styles.loadout}>
      <summary>Cartas de equipamento · {equipment.length} equipadas</summary>
      <p>
        Os atributos vêm dos seus itens equipados no Portal. Nesta Arena, a
        identidade HD permanece fixa; os itens são cartas. Trocas no Portal
        valem para o próximo duelo.
      </p>
      <Link href="/journey/equipment">Preparar equipamentos no Portal →</Link>
      <div className={styles.equipmentGrid}>
        {equipment.map((item) => (
          <article
            key={item.id}
            className={styles.equipmentCard}
            data-rarity={item.rarity}
          >
            <span aria-hidden="true">{slots[item.slot].glyph}</span>
            <small>
              {slots[item.slot].label} · {item.rarity}
            </small>
            <h3>{item.name}</h3>
            <p>
              {Object.entries(item.stats ?? {})
                .map(
                  ([key, value]) =>
                    `+${value} ${ATTRIBUTE_LABELS[key as keyof typeof ATTRIBUTE_LABELS]}`,
                )
                .join(' · ') || 'Sem bônus adicional'}
            </p>
            {equipmentStrategy[item.id] && <p>{equipmentStrategy[item.id]}</p>}
          </article>
        ))}
      </div>
    </details>
  );
}

function CardArenaExperience({
  traveler,
  scope,
}: {
  traveler: Traveler;
  scope: CardArenaScope;
}) {
  const [battle, setBattle] = useState<CardBattle | null>(null),
    [hydrated, setHydrated] = useState(false);
  const [settlement, setSettlement] = useState<CardSettlement | null>(null),
    [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [historyCount, setHistoryCount] = useState(0);
  const [animatedRevision, setAnimatedRevision] = useState<number | null>(null);
  const acting = useRef(false),
    mounted = useRef(true),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handElement = useRef<HTMLDivElement>(null);
  const playerSnapshot = useMemo(
    () => travelerBattleSnapshot(traveler),
    [traveler],
  );
  const alive = useCallback(
    () =>
      mounted.current &&
      (getCurrentOnlineUserId() ?? 'local') === scope.ownerId &&
      journeyRepository.activeTravelerId() === scope.travelerId,
    [scope],
  );
  useEffect(() => {
    mounted.current = true;
    const sync = () => {
      if (!alive()) return;
      const session = cardArenaStorage.load(scope);
      setBattle(session?.battle ?? null);
      setSettlement(session?.settlement ?? null);
      setHistoryCount(arenaRepository.list(traveler.id).length);
      setHydrated(true);
    };
    queueMicrotask(sync);
    const changed = (event: StorageEvent) => {
      if (event.key === cardArenaKey(scope)) sync();
    };
    window.addEventListener('storage', changed);
    return () => {
      mounted.current = false;
      window.removeEventListener('storage', changed);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [scope, traveler.id, alive]);
  const locked = useCallback(
    async <T,>(operation: () => T | Promise<T>): Promise<T> => {
      if (!navigator.locks)
        throw Error(
          'Este navegador não oferece proteção entre abas. Use uma versão atual para iniciar um treino seguro.',
        );
      return navigator.locks.request(
        'rpg:card-arena:' + cardArenaKey(scope),
        () => {
          if (!alive()) throw Error('Sua sessão mudou. Retorne à Jornada.');
          return operation();
        },
      );
    },
    [scope, alive],
  );

  const applyReward = useCallback(
    (reward: TrainingReward) => {
      if (!alive()) return false;
      let changed = false;
      const saved = updateTraveler((current) => {
        if (current.id !== scope.travelerId || !alive()) return current;
        changed = true;
        return addGameplayReward(current, reward.xp, reward.coins);
      });
      return saved && changed;
    },
    [scope, alive],
  );
  useEffect(() => {
    if (!battle || battle.phase !== 'finished') return;
    let cancelled = false;
    void locked(() =>
      scope.ownerId === 'local'
        ? settleCardArenaReward(scope, applyReward)
        : settleOnlineCardArenaReward(scope),
    )
      .then((result) => {
        if (cancelled || !alive()) return;
        setSettlement(result);
        setHistoryCount(arenaRepository.list(traveler.id).length);
        if (!result)
          setError(
            'Não foi possível registrar a recompensa. Nenhum crédito será repetido.',
          );
      })
      .catch((cause: unknown) => {
        if (!cancelled && alive())
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível registrar o resultado.',
          );
      });
    return () => {
      cancelled = true;
    };
  }, [battle, locked, scope, applyReward, traveler.id, alive]);

  const perform = useCallback(
    async (command: CardCommand) => {
      if (acting.current || !alive()) return;
      acting.current = true;
      setBusy(true);
      setAnimatedRevision(null);
      setError('');
      try {
        const outcome = await locked(() => {
          const session = cardArenaStorage.load(scope);
          if (!session)
            throw Error(
              'O treino não foi encontrado. Volte à Jornada e tente novamente.',
            );
          const current = session.battle;
          if (current.revision !== command.revision)
            return { battle: current, accepted: false };
          const updated =
            command.kind === 'play'
              ? playCombatCard(current, command.instanceId, command.revision)
              : command.kind === 'end'
                ? endCardTurn(current, command.revision)
                : command.kind === 'enemy'
                  ? resolveCardEnemyTurn(current, command.revision)
                  : concedeCardBattle(current, command.revision);
          if (
            updated !== current &&
            !cardArenaStorage.advance(scope, updated, current.revision)
          )
            throw Error(
              'Não foi possível guardar esta jogada. Nenhuma ação foi aplicada.',
            );
          return { battle: updated, accepted: updated !== current };
        });
        if (!alive()) return;
        const next = outcome.battle;
        setBattle(next);
        setSelected(null);
        if (!outcome.accepted) {
          setError('Este treino foi atualizado. A jogada não foi repetida.');
          return;
        }
        setAnimatedRevision(next.revision);
        if (command.kind === 'play' || next.phase === 'finished')
          requestAnimationFrame(() => {
            if (!alive()) return;
            if (next.phase === 'finished')
              document.getElementById('card-result-title')?.focus();
            else
              handElement.current
                ?.querySelector<HTMLButtonElement>('button')
                ?.focus({ preventScroll: true });
          });
        const event = next.lastEvent;
        if (next.phase === 'finished')
          emitArenaSound(next.winner === 'player' ? 'victory' : 'defeat');
        else if (event)
          emitArenaSound(
            ['special', 'charge'].includes(event.motion)
              ? 'special'
              : ['block', 'counter'].includes(event.motion)
                ? 'defense'
                : ['focus', 'heal', 'rally'].includes(event.motion)
                  ? 'focus'
                  : 'attack',
          );
      } catch (cause) {
        if (alive())
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível realizar a jogada.',
          );
      } finally {
        if (mounted.current)
          timer.current = setTimeout(() => {
            acting.current = false;
            setBusy(false);
          }, motionDuration());
        else acting.current = false;
      }
    },
    [scope, locked, alive],
  );
  useEffect(() => {
    if (!battle || battle.phase !== 'enemy' || busy) return;
    const expected = battle.revision;
    const timeout = setTimeout(() => {
      void perform({ kind: 'enemy', revision: expected });
    }, motionDuration());
    return () => clearTimeout(timeout);
  }, [battle, busy, perform]);

  async function start(opponentId: string) {
    if (acting.current) return;
    setError('');
    acting.current = true;
    setBusy(true);
    try {
      const opponent = TRAINING_OPPONENTS.find(
        (item) => item.id === opponentId,
      )!;
      const next =
        scope.ownerId !== 'local'
          ? await economyClient.start(scope.travelerId, opponentId)
          : createCardBattle(
              playerSnapshot,
              opponent,
              crypto.getRandomValues(new Uint32Array(1))[0],
              crypto.randomUUID(),
            );
      await locked(() => {
        if (!cardArenaStorage.start(scope, next))
          throw Error(
            'Não foi possível guardar o novo treino. Verifique o armazenamento do navegador.',
          );
      });
      if (!alive()) return;
      setBattle(next);
      setSettlement(null);
      setSelected(null);
    } catch (cause) {
      if (alive())
        setError(
          cause instanceof Error ? cause.message : 'Não foi possível iniciar.',
        );
    } finally {
      acting.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const chosen = battle?.hand.find((item) => item.id === selected),
    card = chosen && combatCard(chosen.cardId);
  const intent = battle && enemyCardIntent(battle);
  const animating =
    busy &&
    animatedRevision === battle?.revision &&
    battle?.lastEvent?.revision === battle?.revision;
  const currentCard =
    battle?.lastEvent?.actor === 'player'
      ? COMBAT_CARDS.find((item) => item.name === battle.lastEvent!.label)
      : null;
  const showLobby = !battle || battle.phase === 'finished';
  if (!hydrated) return <p role="status">Carregando treino salvo…</p>;
  return (
    <section
      className={styles.page}
      data-mobile-screen="card-arena"
      data-card-arena-state={battle?.phase ?? 'lobby'}
      data-battle-revision={battle?.revision ?? 0}
    >
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>
            ARENA DOS VIAJANTES · NOVA EXPERIÊNCIA
          </p>
          <h1>Duelo de Cartas</h1>
          <p>Observe. Prepare sua mão. Escolha o momento de agir.</p>
        </div>
        <Link href="/journey/arena/legacy">Arena clássica</Link>
      </header>
      <details className={styles.rules}>
        <summary>Como funciona o treino?</summary>
        <p>
          20 cartas, mão de até 5 e 3 de Energia por turno. As cartas não usadas
          ficam na mão; no início do seu próximo turno você compra somente até
          completar 5. Descarte é temporário e será reembaralhado. Foco tem
          limite 6. Bloqueio dura até seu próximo turno.
        </p>
        <p>
          Equipamentos preservam seus bônus. Estas ações e treinadores são
          ficção de gameplay, sem medir fé pessoal nem representar milagres
          controláveis. Não há PvP online nesta versão.
        </p>
        <p>
          Vitórias seguem o limite existente: até 3 recompensas por adversário
          por dia neste navegador. Um treino em andamento é retomado após
          recarregar; a recompensa usa reserva para impedir novo crédito.
        </p>
      </details>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <EquipmentCards traveler={traveler} />
      {battle && (
        <>
          <div className={styles.turnBar}>
            <strong>
              Turno {battle.round} ·{' '}
              {battle.phase === 'finished'
                ? 'Treino concluído'
                : battle.phase === 'enemy'
                  ? 'Adversário agindo'
                  : 'Sua vez'}
            </strong>
            <span
              className={styles.energy}
              aria-label={`Energia ${battle.energy} de 3`}
            >
              <b key={`${battle.id}:${battle.energy}`}>{battle.energy}</b> / 3
              Energia{' '}
              <i aria-hidden="true">
                {[0, 1, 2].map((n) => (
                  <span key={n} data-active={n < battle.energy} />
                ))}
              </i>
            </span>
            <span>◈ {battle.player.focus} / 6 Foco</span>
          </div>
          {battle.phase !== 'finished' && (
            <p className={styles.intent} role="status">
              <b>Intenção: {intent!.label}</b>
              <span>
                {intent!.damage
                  ? `${intent!.damage} de dano antes do Bloqueio`
                  : intent!.block
                    ? `${intent!.block} de Bloqueio`
                    : '+2 de Foco'}
              </span>
              {battle.opponent.weak > 0 && (
                <small>Enfraquecido nesta ação</small>
              )}
            </p>
          )}
          <div
            className={styles.field}
            data-motion={battle.lastEvent?.motion}
            data-outcome={
              battle.phase === 'finished' ? battle.winner : undefined
            }
            aria-label="Campo de batalha"
          >
            <div className={styles.fieldLight} aria-hidden="true" />
            <div
              key={battle.id}
              className={styles.camera}
              data-impact={animating ? battle.lastEvent?.motion : undefined}
            >
              <Fighter
                fighter={battle.player}
                traveler={traveler}
                side="player"
                battle={battle}
                animating={animating}
              />
              <span className={styles.versus} aria-hidden="true">
                VS
              </span>
              <Fighter
                fighter={battle.opponent}
                side="opponent"
                battle={battle}
                animating={animating}
              />
            </div>
            {animating && battle.lastEvent && (
              <div
                key={`fx:${battle.lastEvent.revision}`}
                className={styles.particles}
                data-motion={battle.lastEvent.motion}
                aria-hidden="true"
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <i key={index} />
                ))}
                <span />
              </div>
            )}
            {animating && currentCard && (
              <span
                key={battle.lastEvent!.revision}
                className={styles.playedCard}
                aria-hidden="true"
              >
                <span>{currentCard.glyph}</span>
                {currentCard.name}
              </span>
            )}
          </div>
          {battle.phase === 'finished' ? (
            <section
              className={styles.result}
              aria-live="polite"
              aria-labelledby="card-result-title"
            >
              <span aria-hidden="true">
                {battle.winner === 'player' ? '✦' : '◇'}
              </span>
              <h2 id="card-result-title" tabIndex={-1}>
                {battle.winner === 'player'
                  ? 'Vitória no treino!'
                  : 'Você pode tentar novamente'}
              </h2>
              <p>
                {battle.winner === 'player'
                  ? 'Boa estratégia. Suas cartas continuam na coleção.'
                  : 'Nenhuma carta foi perdida. Combine defesa e preparação na próxima tentativa.'}
              </p>
              {settlement?.status === 'applied' ? (
                <p data-testid="card-reward">
                  {settlement.reward.rewarded
                    ? `Recompensa registrada: +${settlement.reward.xp} XP · +${settlement.reward.coins} moedas`
                    : settlement.reward.reason === 'daily-limit'
                      ? 'Limite diário de recompensas alcançado. Você pode continuar treinando.'
                      : 'Sem recompensa nesta tentativa.'}
                </p>
              ) : (
                <p data-testid="card-reward">
                  {settlement?.status === 'reserved'
                    ? 'Resultado reservado; não repetiremos um crédito de confirmação incerta.'
                    : settlement?.status === 'failed'
                      ? 'Recompensa não aplicada. Seu saldo foi preservado.'
                      : 'Registrando resultado…'}
                </p>
              )}
              <div>
                <button
                  className={styles.primary}
                  disabled={busy || !settlement}
                  onClick={() => void start(battle.opponent.snapshot.id)}
                >
                  Tentar novamente
                </button>
                <Link href="/journey">Voltar à Jornada</Link>
              </div>
            </section>
          ) : (
            <>
              <section
                className={styles.handSection}
                aria-labelledby="hand-heading"
              >
                <div className={styles.handHeading}>
                  <h2 id="hand-heading">
                    Sua mão <small>{battle.hand.length} / 5</small>
                  </h2>
                  <span>Toque em uma carta para ampliar</span>
                </div>
                <div className={styles.hand} ref={handElement}>
                  {battle.hand.map((item) => {
                    const definition = combatCard(item.cardId)!,
                      reason = cardPlayError(battle, item.id);
                    return (
                      <button
                        key={item.id}
                        className={styles.actionCard}
                        data-category={definition.category}
                        data-unavailable={!!reason}
                        data-card-id={item.id}
                        aria-label={`Ampliar ${definition.name}, ${definition.cost} de Energia${reason ? `, ${reason}` : ''}`}
                        onClick={() => setSelected(item.id)}
                      >
                        <CardFace card={definition} />
                        <small>{reason ?? 'Ampliar e jogar'}</small>
                      </button>
                    );
                  })}
                </div>
              </section>
              <div className={styles.turnActions}>
                <span>
                  Compra: {battle.draw.length} · Descarte:{' '}
                  {battle.discard.length} · Baralho:{' '}
                  {CARD_COMBAT_RULES.deckSize}
                </span>
                <button
                  className={styles.primary}
                  disabled={busy || battle.phase !== 'player'}
                  onClick={() =>
                    void perform({ kind: 'end', revision: battle.revision })
                  }
                >
                  Encerrar turno
                </button>
              </div>
              <button
                className={styles.concede}
                disabled={busy}
                onClick={() =>
                  void perform({ kind: 'concede', revision: battle.revision })
                }
              >
                Encerrar treino sem recompensa
              </button>
            </>
          )}
          <details className={styles.history}>
            <summary>
              Histórico do treino · {battle.player.cardsPlayed} cartas jogadas
            </summary>
            <ol>
              {battle.log.map((line, index) => (
                <li key={`${battle.revision}-${index}`}>{line}</li>
              ))}
            </ol>
          </details>
          {battle.lastEvent && (
            <p className={styles.live} role="status" aria-live="polite">
              {battle.lastEvent.label}: {battle.lastEvent.damage} de dano,{' '}
              {battle.lastEvent.blocked} bloqueado
              {battle.lastEvent.healed
                ? `, ${battle.lastEvent.healed} de Vida recuperada`
                : ''}
              .
            </p>
          )}
        </>
      )}
      {showLobby && (
        <section className={styles.lobby} aria-labelledby="training-heading">
          <p className={styles.eyebrow}>ESTRATÉGIA EM UM TREINO DE CADA VEZ</p>
          <h2 id="training-heading">Escolha seu adversário</h2>
          <p>
            Seu baralho básico já está pronto: 20 cartas de ação, com 15 tipos.
            Não depende de baús. {historyCount} treino(s) no histórico local.
          </p>
          <div className={styles.opponents}>
            {TRAINING_OPPONENTS.map((opponent) => (
              <article key={opponent.id}>
                <TrainingArt id={opponent.id} name={opponent.name} />
                <h3>{opponent.name}</h3>
                <p>Personagem fictício · nível {opponent.level}</p>
                <p>
                  {opponent.arenaProfile === 'guardian'
                    ? 'Defende e prepara contra-pressão'
                    : opponent.arenaProfile === 'tactical'
                      ? 'Prepara combinações e habilidades'
                      : opponent.arenaProfile === 'offensive'
                        ? 'Acumula Foco para golpes fortes'
                        : 'Ataques ágeis e intenção clara'}
                </p>
                <button disabled={busy} onClick={() => void start(opponent.id)}>
                  Treinar com {opponent.name}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
      {card && battle && selected && (
        <CardPreview
          card={card}
          busy={busy}
          error={cardPlayError(battle, selected)}
          onClose={() => setSelected(null)}
          onPlay={() =>
            void perform({
              kind: 'play',
              instanceId: selected,
              revision: battle.revision,
            })
          }
        />
      )}
    </section>
  );
}

export function CardArena({ traveler }: { traveler: Traveler }) {
  const auth = useAuth(),
    ownerId = auth.status === 'signedIn' ? auth.user.id : 'local';
  const scope = useMemo(
    () => ({ ownerId, travelerId: traveler.id }),
    [ownerId, traveler.id],
  );
  return (
    <CardArenaExperience
      key={cardArenaKey(scope)}
      traveler={traveler}
      scope={scope}
    />
  );
}
