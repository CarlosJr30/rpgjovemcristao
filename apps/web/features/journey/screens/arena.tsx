'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  arenaSpecials,
  arenaProfiles,
  arenaProbableIntent,
  calculateCombatPowerBreakdown,
  calculateTrainingReward,
  createArenaBattle,
  equipmentEffects,
  isWithinMatchmakingRange,
  resolveArenaRound,
  type ArenaAction,
  type BattleParticipantSnapshot,
  type BattleState,
  type BattleEffectId,
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
import { economyClient } from '../../../lib/economy/client';
import { getCurrentOnlineUserId,reloadOnlineTraveler } from '../../../lib/supabase/online-sync';
import { updateTraveler } from '../state/use-journey';
import { addGameplayReward } from '../data/progression';
import type { Traveler } from '../domain/traveler';
import styles from '../journey.module.css';
import { useBattlePresentation } from '../hooks/use-battle-presentation';
import { ArenaSpecialPanel } from '../components/arena-specials';
import { emitArenaSound } from '../audio/arena-audio';
import { ArenaStage, FighterPortrait } from '../components/arena-stage';
import { ArenaUnlockNotice } from '../components/arena-unlock-notice';
import { specialAvailability } from '@rpg/game-engine';
import { arenaStageVariables } from '../data/arenaPresentation';

type OpponentOption = {
  snapshot: BattleParticipantSnapshot;
  traveler?: Traveler;
  source: 'training' | 'saved';
};
type Stage = 'lobby' | 'preview' | 'battle' | 'result';
const attributeKeys = ['life', 'strength', 'defense', 'wisdom'] as const;
const triggerLabels = {
  onBattleStart: 'início da batalha',
  onRoundStart: 'início da rodada',
  onAttack: 'ao atacar',
  onDefend: 'ao defender',
  onDamageTaken: 'ao receber dano',
  onLowHealth: 'quando a vida fica baixa',
  onFocus: 'ao focar',
  onVictory: 'na vitória',
} as const;

function fighterEffects(snapshot: BattleParticipantSnapshot) {
  return snapshot.equipment.flatMap((item) =>
    item.effectIds.map((id) => ({
      item: item.name,
      effect: equipmentEffects[id],
    })),
  );
}

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

function ArenaExperience({ traveler }: { traveler: Traveler }) {
  const playerSnapshot = useMemo(
    () => travelerBattleSnapshot(traveler),
    [traveler],
  );
  const commands=useRef<ArenaAction[]>([]);
  const [stage, setStage] = useState<Stage>('lobby');
  const [options, setOptions] = useState<OpponentOption[]>(
    TRAINING_OPPONENTS.map((snapshot) => ({ snapshot, source: 'training' })),
  );
  const [selected, setSelected] = useState<OpponentOption | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [history, setHistory] = useState<ArenaBattleRecord[]>([]);
  const [reward, setReward] = useState<TrainingReward | null>(null);
  const [specialsOpen, setSpecialsOpen] = useState(false);
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
  }, [traveler.id]);

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
    if (!selected) return;
    commands.current=[];
    if(getCurrentOnlineUserId()){
      try{const next=await economyClient.startClassic(traveler.id,selected.snapshot.id);setBattle(next);setReward(null);setLevelNotice(null);setSpecialsOpen(false);setStage('battle');}catch{setStage('preview');}
      return;
    }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    setBattle(
      createArenaBattle(
        playerSnapshot,
        selected.snapshot,
        seed,
        crypto.randomUUID(),
      ),
    );
    setReward(null);
    setLevelNotice(null);
    setSpecialsOpen(false);
    setStage('battle');
  }

  async function settle(finished: BattleState) {
    if (!selected || arenaRepository.has(finished.id)) return;
    const won = finished.winnerId === traveler.id;
    let serverReward:TrainingReward|null=null;
    if(getCurrentOnlineUserId()){try{serverReward=await economyClient.settleClassic(traveler.id,finished.id,commands.current);await reloadOnlineTraveler(traveler.id);}catch{return;}}
    const calculated = serverReward??calculateTrainingReward(
      won,
      arenaRepository.rewardedToday(traveler.id, selected.snapshot.id),
    );
    let changedLevel: { before: number; after: number } | null = null;
    if(serverReward){const current=journeyRepository.load();if(current.status==='ready'&&current.traveler.id===traveler.id&&current.traveler.level>traveler.level)changedLevel={before:traveler.level,after:current.traveler.level};}
    const granted =
      !!serverReward || !calculated.rewarded ||
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

  function act(action: ArenaAction) {
    if (!battle || battle.status !== 'in_progress' || presentation.busy) return;
    const next = resolveArenaRound(battle, action);
    if (next === battle) return;
    commands.current.push(action);
    presentation.play(battle, next, () => {
      setBattle(next);
      if (next.status === 'finished') {
        settle(next);
        setStage('result');
      }
    });
  }

  function reset() {
    setBattle(null);
    setReward(null);
    setSpecialsOpen(false);
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
          <span>ÁREA DE TREINO</span>
          <h1>Arena dos Viajantes</h1>
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
          <h2>Confronto de treino</h2>
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
            <button className={styles.arenaPrimary} onClick={begin}>
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
            <div className={styles.battleRound}>RODADA {battle.round}</div>
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
              <div
                className={styles.battleActions}
                aria-label="Ações da batalha"
              >
                <button
                  disabled={presentation.busy}
                  onClick={() => act('attack')}
                >
                  <b>ATACAR</b>
                  <span>Dano com Força</span>
                  <small>+1 Foco</small>
                </button>
                <button
                  disabled={presentation.busy}
                  onClick={() => act('defend')}
                >
                  <b>DEFENDER</b>
                  <span>Protege o próximo golpe</span>
                  <small>+1 Foco · próximo golpe</small>
                </button>
                <button
                  disabled={presentation.busy}
                  data-special-ready={arenaSpecials.some(
                    (special) =>
                      specialAvailability(battle.player, special.id) ===
                      'available',
                  )}
                  id="arena-special-trigger"
                  aria-expanded={specialsOpen}
                  aria-controls="arena-specials"
                  onClick={() => setSpecialsOpen((open) => !open)}
                >
                  <b>ESPECIAIS</b>
                  <span>Use seu Foco</span>
                </button>
              </div>
            )}
            {stage === 'battle' && specialsOpen && (
              <ArenaSpecialPanel
                fighter={battle.player}
                busy={presentation.busy}
                onSelect={act}
                onClose={() => setSpecialsOpen(false)}
              />
            )}
            {stage === 'battle' &&
              (battle.player.tacticalMultiplier ?? 1) > 1 && (
                <p className={styles.arenaIntent} role="status">
                  Discernimento · {arenaProbableIntent(battle)}
                </p>
              )}
            <ArenaEffects fighter={battle.player} />
            <BattleLog battle={battle} />
            {stage === 'result' && (
              <section className={styles.battleResult}>
                <span>
                  {battle.winnerId === traveler.id
                    ? 'VITÓRIA'
                    : 'TREINO ENCERRADO'}
                </span>
                <h2>
                  {battle.winnerId === traveler.id
                    ? 'Treino concluído com vitória'
                    : 'Uma nova estratégia espera por você'}
                </h2>
                <div>
                  <b>{battle.round} rodadas</b>
                  <b>{battle.player.damageDealt} dano causado</b>
                  <b>{battle.player.damageTaken} dano recebido</b>
                  <b>{battle.player.abilitiesUsed} habilidades usadas</b>
                </div>
                <p>
                  {reward?.rewarded
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
                  <button onClick={reset}>Voltar à Arena</button>
                  <button className={styles.arenaPrimary} onClick={begin}>
                    {battle.winnerId === traveler.id
                      ? 'Jogar novamente'
                      : 'Tentar novamente'}
                  </button>
                </div>
              </section>
            )}
          </section>
        )}
    </section>
  );
}

function ArenaEffects({ fighter }: { fighter: BattleState['player'] }) {
  const entries = fighterEffects(fighter.snapshot);
  const remaining = (id: BattleEffectId) =>
    Math.max(
      0,
      equipmentEffects[id].usesPerBattle -
        fighter.usedEffects.filter((used) => used === id).length,
    );
  return (
    <section
      className={styles.arenaEffects}
      aria-label="Efeitos dos equipamentos"
    >
      <div>
        <h3>EFEITOS ATIVOS DOS EQUIPAMENTOS</h3>
        <small>
          Reforçam o especial correspondente quando desbloqueado, respeitando
          usos e cooldown.
        </small>
        {entries
          .filter(({ effect }) => effect.type === 'ACTIVE')
          .map(({ item, effect }) => (
            <details key={effect.id}>
              <summary>
                {effect.name}{' '}
                <span>
                  {(fighter.cooldowns[effect.id] ?? 0) > 0
                    ? `${fighter.cooldowns[effect.id]} rodadas restantes`
                    : remaining(effect.id)
                      ? 'Disponível'
                      : 'Usos esgotados'}
                </span>
              </summary>
              <p>
                <b>{item}</b> · ATIVA
              </p>
              <p>{effect.description}</p>
              <small>
                Condição: {triggerLabels[effect.trigger]} · Cooldown:{' '}
                {effect.cooldown || 'sem cooldown'} · Usos restantes:{' '}
                {remaining(effect.id)}
              </small>
            </details>
          ))}
        {!entries.some(({ effect }) => effect.type === 'ACTIVE') && (
          <p>Nenhuma habilidade ativa equipada.</p>
        )}
      </div>
      <div>
        <h3>EFEITOS PASSIVOS E AUTOMÁTICOS</h3>
        {entries
          .filter(({ effect }) => effect.type !== 'ACTIVE')
          .map(({ item, effect }) => (
            <details key={effect.id}>
              <summary>
                {effect.name}{' '}
                <span>
                  {effect.type === 'PASSIVE' ? 'Passivo' : 'Automático'}
                </span>
              </summary>
              <p>
                <b>{item}</b> ·{' '}
                {effect.type === 'PASSIVE' ? 'PASSIVA' : 'DISPARADA'}
              </p>
              <p>{effect.description}</p>
              <small>
                Condição: {triggerLabels[effect.trigger]} · Usos restantes:{' '}
                {effect.usesPerBattle ? remaining(effect.id) : 'sempre ativo'}
              </small>
            </details>
          ))}
      </div>
    </section>
  );
}

function BattleLog({ battle }: { battle: BattleState }) {
  return (
    <details className={styles.battleLog} open>
      <summary>Log da batalha</summary>
      <ol>
        {battle.log.slice(-8).map((entry, index) => (
          <li key={`${entry.round}-${index}`}>
            <b>{entry.round ? `R${entry.round}` : 'INÍCIO'}</b>{' '}
            {entry.effectType && (
              <em>
                [
                {entry.effectType === 'ACTIVE'
                  ? 'ATIVA'
                  : entry.effectType === 'PASSIVE'
                    ? 'PASSIVA'
                    : 'DISPARADA'}
                ]
              </em>
            )}{' '}
            {entry.message}
          </li>
        ))}
      </ol>
    </details>
  );
}

export function ArenaScreen() {
  return (
    <Shell back={routes.map} backLabel="Voltar à Jornada">
      <RequireTraveler>
        {(traveler) => <ArenaExperience traveler={traveler} />}
      </RequireTraveler>
    </Shell>
  );
}
