'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  arenaProfiles,
  arenaProbableIntent,
  calculateCombatPowerBreakdown,
  calculateTrainingReward,
  isWithinMatchmakingRange,
  type ArenaProductAction,
  type BattleParticipantSnapshot,
  type BattleState,
  type TrainingReward,
} from '@rpg/game-engine';
import { Shell, RequireTraveler } from '../components/shell';
import { ResponsivePanel } from '../components/responsive-panel';
import { ATTRIBUTE_LABELS } from '../data/attributes';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import {
  nearestTrainingOpponent,
  TRAINING_OPPONENTS,
  travelerBattleSnapshot,
} from '../data/arena';
import {
  arenaRepository,
  type ArenaBattleRecord,
} from '../persistence/arena-storage';
import { journeyRepository } from '../persistence/journey-storage';
import { updateTraveler } from '../state/use-journey';
import { addGameplayReward } from '../data/progression';
import type { Traveler } from '../domain/traveler';
import styles from '../journey.module.css';
import { useBattlePresentation } from '../hooks/use-battle-presentation';
import { emitArenaSound } from '../audio/arena-audio';
import { useAudioScene } from '../hooks/use-game-audio';
import { ArenaStage, FighterPortrait } from '../components/arena-stage';
import { ArenaUnlockNotice } from '../components/arena-unlock-notice';
import { arenaStageVariables } from '../data/arenaPresentation';

type OpponentOption = {
  snapshot: BattleParticipantSnapshot;
  traveler?: Traveler;
  source: 'training' | 'saved';
};
import Link from 'next/link';
import { useAuth } from '../../../lib/supabase/auth-context';
import { getCurrentOnlineUserId } from '../../../lib/supabase/online-sync';
import {
  loadArenaCollection,
  type CollectionSource,
} from '../../arena-deck/collection';
import { arenaDeckStorage } from '../../arena-deck/storage';
import { DeckEditor, BattleCards } from '../../arena-deck/editor';
import { ArenaBattleActions } from '../../arena-deck/battle-actions';
import {
  ArenaEffectDetails,
  ArenaRuleSummary,
  ArenaRecentHistory,
} from '../components/arena-rule-details';
import { validateArenaDeck, type ArenaCard } from '@rpg/game-engine';

type Stage = 'lobby' | 'preview' | 'battle' | 'result';
const attributeKeys = ['life', 'strength', 'defense', 'wisdom'] as const;
function Stats({ snapshot }: { snapshot: BattleParticipantSnapshot }) {
  return (
    <dl className={styles.arenaStats}>
      {attributeKeys.map((key) => (
        <div key={key}>
          <dt>{ATTRIBUTE_LABELS[key]}</dt>
          <dd>{snapshot.attributes[key]}</dd>
        </div>
      ))}
    </dl>
  );
}
export type LocalTowerMode = {
  boss?: boolean;
  opponent: BattleParticipantSnapshot;
  session: typeof arenaDeckStorage;
  onFinished: (battleId: string) => Promise<unknown>;
  onExit: () => void;
};

export function ArenaExperience({
  traveler,
  ownerId,
  collectionSource = loadArenaCollection,
  localTower,
}: {
  traveler: Traveler;
  ownerId: string;
  collectionSource?: CollectionSource;
  localTower?: LocalTowerMode;
}) {
  const session = localTower?.session ?? arenaDeckStorage;
  useAudioScene(
    localTower ? (localTower.boss ? 'boss' : 'tower') : null,
    localTower ? Math.min(1, 0.65 + localTower.opponent.level * 0.035) : 1,
  );
  const [towerConfirmed, setTowerConfirmed] = useState(false);
  const playerSnapshot = useMemo(
    () => travelerBattleSnapshot(traveler),
    [traveler],
  );
  const [deckData, setDeckData] = useState<{
    cards: readonly ArenaCard[];
    selection: readonly string[];
  } | null>(null);
  const [deckError, setDeckError] = useState('');
  const [deckBusy, setDeckBusy] = useState(false);
  const pending = useRef(false);
  const [showDeck, setShowDeck] = useState(false);
  const [stage, setStage] = useState<Stage>(localTower ? 'preview' : 'lobby');
  const [options, setOptions] = useState<OpponentOption[]>(
    TRAINING_OPPONENTS.map((snapshot) => ({ snapshot, source: 'training' })),
  );
  const [selected, setSelected] = useState<OpponentOption | null>(
    localTower ? { snapshot: localTower.opponent, source: 'training' } : null,
  );
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [history, setHistory] = useState<ArenaBattleRecord[]>([]);
  const [reward, setReward] = useState<TrainingReward | null>(null);
  const [levelNotice, setLevelNotice] = useState<{
    before: number;
    after: number;
  } | null>(null);
  const presentation = useBattlePresentation();
  const visibleBattle = presentation.display ?? battle;

  useEffect(() => {
    // The preview button can scroll the page; begin mobile combat at its field.
    if (
      stage === 'battle' &&
      window.matchMedia?.('(max-width: 1024px)').matches
    ) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [stage]);

  useEffect(() => {
    if (localTower) return;
    const sync = window.setTimeout(() => {
      const saved = journeyRepository
        .listSaved()
        .filter((candidate) => candidate.id !== traveler.id)
        .map((candidate): OpponentOption => ({
          snapshot: travelerBattleSnapshot(candidate),
          traveler: candidate,
          source: 'saved',
        }));
      setOptions([
        ...saved,
        ...TRAINING_OPPONENTS.map((snapshot): OpponentOption => ({
          snapshot,
          source: 'training',
        })),
      ]);
      setHistory(arenaRepository.list(traveler.id));
    }, 0);
    return () => window.clearTimeout(sync);
  }, [traveler.id, localTower]);

  useEffect(() => {
    let live = true;
    collectionSource(ownerId, traveler.id)
      .then((cards) => {
        const saved = session.load(ownerId, traveler.id, cards);
        if (!live) return;
        setDeckData({ cards, selection: saved.selection });
        if (saved.battle) {
          setBattle(saved.battle);
          setSelected({
            snapshot: saved.battle.opponent.snapshot,
            source: saved.battle.opponent.snapshot.id.startsWith('training-')
              ? 'training'
              : 'saved',
          });
          setStage(saved.battle.status === 'in_progress' ? 'battle' : 'result');
          if (!localTower)
            setReward(
              arenaRepository
                .list(traveler.id)
                .find((r) => r.id === saved.battle?.id)?.reward ?? null,
            );
        }
      })
      .catch((e) => {
        if (live)
          setDeckError(e instanceof Error ? e.message : 'Arena indisponível.');
      });
    return () => {
      live = false;
    };
  }, [ownerId, traveler.id, collectionSource, session, localTower]);
  function pickClosest() {
    const match = [...options].sort(
      (a, b) =>
        Math.abs(a.snapshot.combatPower - playerSnapshot.combatPower) -
        Math.abs(b.snapshot.combatPower - playerSnapshot.combatPower),
    )[0];
    setSelected(
      match ?? {
        snapshot: nearestTrainingOpponent(
          playerSnapshot.combatPower,
          TRAINING_OPPONENTS,
        ),
        source: 'training',
      },
    );
    setStage('preview');
  }

  async function begin() {
    if (!selected || pending.current || !deckData) return;
    pending.current = true;
    setDeckBusy(true);
    setDeckError('');
    try {
      const cards = await collectionSource(ownerId, traveler.id);
      const next = await session.begin(
        ownerId,
        traveler.id,
        cards,
        playerSnapshot,
        selected.snapshot,
      );
      setBattle(next);
      setDeckData({ cards, selection: next.deck!.cards.map((c) => c.id) });
      presentation.cancel();
      setReward(null);
      setLevelNotice(null);
      setShowDeck(false);
      setStage('battle');
    } catch (e) {
      setDeckError(e instanceof Error ? e.message : 'Arena indisponível.');
    } finally {
      pending.current = false;
      setDeckBusy(false);
    }
  }

  function settle(finished: BattleState) {
    if (localTower) return;
    const active = journeyRepository.load();
    if (
      getCurrentOnlineUserId() !== ownerId ||
      active.status !== 'ready' ||
      active.traveler.id !== traveler.id
    )
      return;
    if (!selected || arenaRepository.has(finished.id)) return;
    const won = finished.winnerId === traveler.id;
    const calculated = calculateTrainingReward(
      won,
      arenaRepository.rewardedToday(traveler.id, selected.snapshot.id),
    );
    let changedLevel: { before: number; after: number } | null = null;
    const granted =
      !calculated.rewarded ||
      updateTraveler((current) => {
        const next = addGameplayReward(
          current,
          calculated.xp,
          calculated.coins,
        );
        if (next.level > current.level)
          changedLevel = { before: current.level, after: next.level };
        return next;
      });
    if (granted && changedLevel) setLevelNotice(changedLevel);
    const applied = granted
      ? calculated
      : ({
          xp: 0,
          coins: 0,
          rewarded: false,
          reason: calculated.reason,
        } as TrainingReward);
    const record: ArenaBattleRecord = {
      id: finished.id,
      playerId: traveler.id,
      opponentId: selected.snapshot.id,
      opponentName: selected.snapshot.name,
      result: won ? 'victory' : 'defeat',
      roundCount: finished.round,
      createdAt: new Date().toISOString(),
      damageDealt: finished.player.damageDealt,
      damageTaken: finished.player.damageTaken,
      abilitiesUsed: finished.player.abilitiesUsed,
      reward: applied,
    };
    arenaRepository.add(record);
    setReward(applied);
    setHistory(arenaRepository.list(traveler.id));
    emitArenaSound(won ? 'victory' : 'defeat');
  }

  async function act(action: ArenaProductAction) {
    if (
      !battle ||
      battle.status !== 'in_progress' ||
      presentation.busy ||
      pending.current ||
      !deckData
    )
      return;
    pending.current = true;
    setDeckBusy(true);
    setDeckError('');
    try {
      const next = await session.command(
        ownerId,
        traveler.id,
        deckData.cards,
        battle.id,
        battle.round,
        action,
      );
      const started = presentation.play(battle, next, () => {
        setBattle(next);
        if (next.status === 'finished') {
          setStage('result');
          const confirmation = localTower
            ? localTower.onFinished(next.id).then(() => {
                setTowerConfirmed(true);
                emitArenaSound(
                  next.winnerId === traveler.id ? 'victory' : 'defeat',
                );
              })
            : session
                .claimSettlement(ownerId, traveler.id, deckData.cards, next.id)
                .then((claimed) => {
                  if (claimed) settle(next);
                });
          void confirmation
            .catch((e) =>
              setDeckError(
                e instanceof Error ? e.message : 'Resultado pendente.',
              ),
            )
            .finally(() => {
              pending.current = false;
              setDeckBusy(false);
            });
        } else {
          pending.current = false;
          setDeckBusy(false);
        }
      });
      if (!started) {
        pending.current = false;
        setDeckBusy(false);
        setDeckError('Rodada salva. Recarregue para retomar.');
      }
    } catch (e) {
      pending.current = false;
      setDeckBusy(false);
      setDeckError(e instanceof Error ? e.message : 'Ação indisponível.');
    }
  }

  function reset() {
    presentation.cancel();
    if (localTower) {
      localTower.onExit();
      return;
    }
    setBattle(null);
    setReward(null);
    setLevelNotice(null);
    setSelected(null);
    setStage('lobby');
  }
  const nearby = (power: number) =>
    isWithinMatchmakingRange(playerSnapshot.combatPower, power);
  const powerBreakdown = calculateCombatPowerBreakdown(playerSnapshot);
  return (
    <section
      className={styles.arenaHub}
      data-mobile-screen="arena"
      data-arena-state={stage}
    >
      <header className={styles.arenaHeader}>
        <div>
          <span>
            {localTower
              ? 'TREINO LOCAL · SEM RECOMPENSAS OFICIAIS'
              : 'ÁREA DE TREINO'}
          </span>
          <h1>{localTower ? 'Torre dos 7 Desafios' : 'Arena dos Viajantes'}</h1>
          <p>
            Batalhas estratégicas 1x1 com atributos, equipamentos e escolhas por
            rodada.
          </p>
        </div>
        <div className={styles.combatPower}>
          <small>PODER DE COMBATE</small>
          <strong>{playerSnapshot.combatPower}</strong>
          <span>Nível {traveler.level}</span>
          <details>
            <summary>Como é calculado?</summary>
            <p>
              Estimativa para aproximar adversários. Não determina quem vence.
            </p>
            <dl>
              <div>
                <dt>Nível</dt>
                <dd>{powerBreakdown.level}</dd>
              </div>
              <div>
                <dt>Atributos</dt>
                <dd>{powerBreakdown.attributes}</dd>
              </div>
              <div>
                <dt>Equipamentos</dt>
                <dd>{powerBreakdown.equipment}</dd>
              </div>
              <div>
                <dt>Efeitos</dt>
                <dd>{powerBreakdown.specialEffects}</dd>
              </div>
            </dl>
          </details>
        </div>
      </header>
      <p className={styles.arenaEthics}>
        Os atributos representam somente regras do jogo. A Arena não mede fé,
        espiritualidade ou valor pessoal.
      </p>

      <p>
        <Link href="/journey/arena/deck">Meu Baralho</Link>
        {!localTower && (
          <>
            {' '}
            · <Link href="/journey/arena/tower">Torre dos 7 Desafios</Link>
          </>
        )}
      </p>
      {localTower && stage !== 'result' && (
        <button disabled={deckBusy} onClick={reset}>
          Voltar à Torre
        </button>
      )}
      {deckError && <p role="alert">{deckError}</p>}
      {!deckData && !deckError && <p role="status">Carregando baralho...</p>}
      {deckData && stage !== 'battle' && !localTower && (
        <>
          <p>Cartas selecionadas: {deckData.selection.length}/7</p>
          <button disabled={deckBusy} onClick={() => setShowDeck((v) => !v)}>
            Montar baralho nesta tela
          </button>
        </>
      )}
      {deckData && showDeck && (
        <DeckEditor
          key={traveler.id}
          cards={deckData.cards}
          initial={deckData.selection}
          locked={battle?.status === 'in_progress'}
          busy={deckBusy}
          onSave={async (ids) => {
            const cards = await collectionSource(ownerId, traveler.id);
            await arenaDeckStorage.save(ownerId, traveler.id, cards, ids);
            setDeckData({ cards, selection: [...ids] });
            setShowDeck(false);
          }}
        />
      )}
      {deckData &&
        validateArenaDeck(deckData.selection, deckData.cards) &&
        stage !== 'battle' && (
          <p>
            Monte um baralho com sete cartas de combate válidas para iniciar. O
            catálogo e a aquisição de cartas ainda aguardam integração
            autorizada.
          </p>
        )}
      {stage === 'lobby' && (
        <>
          <div className={styles.arenaLobbyGrid}>
            <article className={styles.arenaTravelerCard}>
              <FighterPortrait
                traveler={traveler}
                name={traveler.name}
                side="player"
              />
              <div>
                <span>SEU VIAJANTE</span>
                <h2>{traveler.name}</h2>
                <Stats snapshot={playerSnapshot} />
                <p>{playerSnapshot.equipment.length} equipamentos ativos</p>
              </div>
            </article>
            <section className={styles.arenaMatchPanel}>
              <span>DESAFIO 1x1</span>
              <h2>Escolha um adversário</h2>
              <button className={styles.arenaPrimary} onClick={pickClosest}>
                Buscar adversário próximo
              </button>
              <p>
                Faixa sugerida: ±10% do seu poder. O resultado depende das ações
                e da build.
              </p>
              <div className={styles.arenaOpponentList}>
                {options.map((option) => (
                  <button
                    key={option.snapshot.id}
                    onClick={() => {
                      setSelected(option);
                      setStage('preview');
                    }}
                  >
                    <b>{option.snapshot.name}</b>
                    {option.snapshot.arenaProfile && (
                      <small>
                        {arenaProfiles[option.snapshot.arenaProfile].label} ·{' '}
                        {
                          arenaProfiles[option.snapshot.arenaProfile]
                            .description
                        }
                      </small>
                    )}
                    <span>
                      Poder {option.snapshot.combatPower} · Nível{' '}
                      {option.snapshot.level}
                    </span>
                    <small>
                      {option.source === 'saved'
                        ? 'Viajante salvo · cópia de treino'
                        : 'Adversário de treino'}{' '}
                      {nearby(option.snapshot.combatPower)
                        ? '· faixa próxima'
                        : ''}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <section className={styles.arenaHistory}>
            <div>
              <span>HISTÓRICO</span>
              <h2>Últimos treinos</h2>
            </div>
            {history.length ? (
              <ol>
                {history.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <b>{item.result === 'victory' ? 'Vitória' : 'Derrota'}</b>
                    <span>vs {item.opponentName}</span>
                    <small>
                      {item.roundCount} rodadas · {item.damageDealt} dano
                      causado
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Seu histórico começará depois da primeira batalha.</p>
            )}
          </section>
          <section className={styles.arenaOnlineNotice}>
            <b>PvP online em preparação</b>
            <p>
              A Arena usa adversários de treino e cópias locais de builds.
              Nenhum desafio remoto é enviado nesta versão.
            </p>
          </section>
        </>
      )}

      {stage === 'preview' && selected && (
        <section className={styles.arenaPreview}>
          <span>PRÉ-BATALHA</span>
          <h2>
            {localTower
              ? localTower.boss
                ? 'Último desafio — Campeão da Torre'
                : 'Próximo desafio da Torre'
              : 'Confronto de treino'}
          </h2>
          {localTower?.boss && (
            <p>
              Você chegou ao sétimo andar. Prepare seu baralho: o campeão
              combina defesa, leitura e ataque pelas mesmas regras da Arena.
              Este é um treino local.
            </p>
          )}
          <div className={styles.arenaVersus}>
            <article>
              <FighterPortrait
                traveler={traveler}
                name={traveler.name}
                side="player"
              />
              <h3>{traveler.name}</h3>
              <b>Poder {playerSnapshot.combatPower}</b>
              <Stats snapshot={playerSnapshot} />
            </article>
            <strong>VS</strong>
            <article>
              <FighterPortrait
                traveler={selected.traveler}
                name={selected.snapshot.name}
                participantId={selected.snapshot.id}
                side="opponent"
              />
              <h3>{selected.snapshot.name}</h3>
              <b>Poder {selected.snapshot.combatPower}</b>
              <Stats snapshot={selected.snapshot} />
            </article>
          </div>
          <div className={styles.arenaEquipmentPreview}>
            {selected.snapshot.equipment.map((item) => (
              <span key={item.id}>{item.name}</span>
            ))}
          </div>
          <p>
            {selected.source === 'saved'
              ? 'A build salva será usada como snapshot e controlada pelo sistema.'
              : 'Adversário controlado pelo sistema.'}
          </p>
          <div className={styles.arenaControls}>
            <button onClick={reset}>Voltar</button>
            <button
              className={styles.arenaPrimary}
              onClick={() => void begin()}
              disabled={
                deckBusy ||
                showDeck ||
                !deckData ||
                !!validateArenaDeck(deckData.selection, deckData.cards)
              }
            >
              Iniciar batalha
            </button>
          </div>
        </section>
      )}

      {(stage === 'battle' || stage === 'result') &&
        battle &&
        visibleBattle &&
        selected && (
          <section className={styles.battleArena} style={arenaStageVariables()}>
            <div className={styles.battleRound}>
              {localTower ? 'TORRE LOCAL · ' : ''}RODADA {battle.round}
            </div>
            <ResponsivePanel title="Ajuda do combate">
              <p className={styles.arenaFocusHelp}>
                Atacar gera Foco. Defender protege e gera Foco. Foco é um
                recurso mecânico de batalha.
              </p>
            </ResponsivePanel>
            <ArenaStage
              battle={visibleBattle}
              player={traveler}
              opponent={selected.traveler}
              event={presentation.event}
              phase={presentation.phase}
              result={
                stage === 'result'
                  ? battle.winnerId === traveler.id
                    ? 'victory'
                    : 'defeat'
                  : undefined
              }
            />
            <div
              className={styles.combatAnnouncement}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {presentation.event ? (
                <>
                  <b>
                    {presentation.event.actorId === traveler.id
                      ? 'SUA AÇÃO'
                      : 'AGUARDE'}{' '}
                    · {presentation.event.label}
                  </b>
                  <span>{presentation.event.description}</span>
                </>
              ) : (
                <>
                  <b>
                    {stage === 'result'
                      ? 'TREINO CONCLUÍDO'
                      : presentation.busy
                        ? 'AGUARDE'
                        : 'SEU TURNO'}
                  </b>
                  <span>
                    Observe os movimentos e prepare sua próxima estratégia.
                  </span>
                </>
              )}
            </div>
            {stage === 'battle' && (
              <ArenaBattleActions
                key={battle.id}
                battle={battle}
                busy={presentation.busy || deckBusy}
                onAction={(action) => void act(action)}
              />
            )}
            {stage === 'battle' &&
              (battle.player.tacticalMultiplier ?? 1) > 1 && (
                <p className={styles.arenaIntent} role="status">
                  Discernimento · {arenaProbableIntent(battle)}
                </p>
              )}
            {stage === 'result' && (
              <BattleCards
                battle={battle}
                busy={false}
                onPlay={() => undefined}
              />
            )}
            <ArenaEffectDetails fighter={battle.player} />
            <ArenaRuleSummary snapshot={battle.player.snapshot} />
            <ArenaRecentHistory battle={visibleBattle ?? battle} />
            {stage === 'result' && (
              <section className={styles.battleResult}>
                <span>
                  {battle.winnerId === traveler.id
                    ? 'VITÓRIA'
                    : 'TREINO ENCERRADO'}
                </span>
                <h2>
                  {battle.winnerId === traveler.id
                    ? localTower?.boss
                      ? 'Campeão superado no treino local!'
                      : 'Treino concluído com vitória'
                    : 'Uma nova estratégia espera por você'}
                </h2>
                <div>
                  <b>{battle.round} rodadas</b>
                  <b>{battle.player.damageDealt} dano causado</b>
                  <b>{battle.player.damageTaken} dano recebido</b>
                  <b>{battle.player.abilitiesUsed} habilidades usadas</b>
                </div>
                <p>
                  {localTower
                    ? towerConfirmed
                      ? 'Resultado demonstrativo registrado neste navegador. Nenhuma recompensa ou conquista oficial concedida.'
                      : 'Resultado local pendente de registro. Nenhuma recompensa ou conquista oficial concedida.'
                    : !reward
                      ? 'Resultado salvo; recompensa ainda não confirmada. Recarregar não repete a concessão.'
                      : reward.rewarded
                        ? `Recompensa: +${reward.xp} XP e +${reward.coins} moedas.`
                        : reward?.reason === 'daily-limit'
                          ? 'Limite diário de recompensas contra este adversário atingido. Você pode continuar treinando.'
                          : 'Treinos sem vitória não concedem recursos.'}
                </p>
                {reward?.rewarded && (
                  <ol
                    className={styles.arenaRewardSequence}
                    aria-label="Recompensas do treino"
                  >
                    <li>+{reward.xp} XP</li>
                    <li>+{reward.coins} moedas</li>
                  </ol>
                )}
                {levelNotice && (
                  <ArenaUnlockNotice
                    before={levelNotice.before}
                    after={levelNotice.after}
                  />
                )}
                <div className={styles.arenaControls}>
                  <button onClick={reset}>
                    {localTower ? 'Voltar à Torre' : 'Voltar à Arena'}
                  </button>
                  {localTower && !towerConfirmed && (
                    <button
                      disabled={deckBusy}
                      onClick={async () => {
                        setDeckBusy(true);
                        try {
                          await localTower.onFinished(battle.id);
                          setTowerConfirmed(true);
                        } catch (e) {
                          setDeckError(
                            e instanceof Error
                              ? e.message
                              : 'Resultado local pendente.',
                          );
                        } finally {
                          setDeckBusy(false);
                        }
                      }}
                    >
                      Registrar resultado local
                    </button>
                  )}
                  {!localTower && (
                    <button
                      className={styles.arenaPrimary}
                      onClick={() => void begin()}
                      disabled={
                        deckBusy ||
                        showDeck ||
                        !deckData ||
                        !!validateArenaDeck(deckData.selection, deckData.cards)
                      }
                    >
                      {battle.winnerId === traveler.id
                        ? 'Jogar novamente'
                        : 'Tentar novamente'}
                    </button>
                  )}
                </div>
              </section>
            )}
          </section>
        )}
    </section>
  );
}

export function ArenaScreen() {
  const auth = useAuth();
  return (
    <Shell back={routes.map} backLabel="Voltar à Jornada">
      <RequireTraveler>
        {(traveler) => (
          <ArenaExperience
            key={`${auth.user?.id}:${traveler.id}`}
            traveler={traveler}
            ownerId={auth.user?.id ?? ''}
          />
        )}
      </RequireTraveler>
    </Shell>
  );
}
