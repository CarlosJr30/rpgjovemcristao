'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  availableEquipmentAbility,
  calculateTrainingReward,
  createBattle,
  equipmentEffects,
  isWithinMatchmakingRange,
  resolveRound,
  type BattleAction,
  type BattleParticipantSnapshot,
  type BattleState,
  type TrainingReward,
} from '@rpg/game-engine';
import { Shell, RequireTraveler } from '../components/shell';
import { EquippedAvatar } from '../components/equipped-avatar';
import { ATTRIBUTE_LABELS } from '../data/attributes';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { nearestTrainingOpponent, TRAINING_OPPONENTS, travelerBattleSnapshot } from '../data/arena';
import { arenaRepository, type ArenaBattleRecord } from '../persistence/arena-storage';
import { journeyRepository } from '../persistence/journey-storage';
import { updateTraveler } from '../state/use-journey';
import { addGameplayReward } from '../data/progression';
import type { Traveler } from '../domain/traveler';
import styles from '../journey.module.css';

type OpponentOption = { snapshot: BattleParticipantSnapshot; traveler?: Traveler; source: 'training' | 'saved' };
type Stage = 'lobby' | 'preview' | 'battle' | 'result';
const attributeKeys = ['life', 'strength', 'defense', 'wisdom'] as const;

function FighterPortrait({ traveler, name, side, active }: { traveler?: Traveler; name: string; side: 'player' | 'opponent'; active?: boolean }) {
  return <div className={`${styles.arenaPortrait} ${styles[`arenaPortrait${side === 'player' ? 'Player' : 'Opponent'}`]} ${active ? styles.arenaPortraitActive : ''}`}>
    {traveler ? <EquippedAvatar traveler={traveler} /> : <div className={styles.trainingAvatar} aria-hidden="true"><span>✦</span><b>{name.slice(0, 1)}</b></div>}
  </div>;
}

function Stats({ snapshot }: { snapshot: BattleParticipantSnapshot }) {
  return <dl className={styles.arenaStats}>
    {attributeKeys.map((key) => <div key={key}><dt>{ATTRIBUTE_LABELS[key]}</dt><dd>{snapshot.attributes[key]}</dd></div>)}
  </dl>;
}

function ArenaExperience({ traveler }: { traveler: Traveler }) {
  const playerSnapshot = useMemo(() => travelerBattleSnapshot(traveler), [traveler]);
  const [stage, setStage] = useState<Stage>('lobby');
  const [options, setOptions] = useState<OpponentOption[]>(TRAINING_OPPONENTS.map((snapshot) => ({ snapshot, source: 'training' })));
  const [selected, setSelected] = useState<OpponentOption | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [history, setHistory] = useState<ArenaBattleRecord[]>([]);
  const [reward, setReward] = useState<TrainingReward | null>(null);
  const [lastAction, setLastAction] = useState<BattleAction | null>(null);

  useEffect(() => {
    const sync = window.setTimeout(() => {
      const saved = journeyRepository.listSaved().filter((candidate) => candidate.id !== traveler.id)
        .map((candidate): OpponentOption => ({ snapshot: travelerBattleSnapshot(candidate), traveler: candidate, source: 'saved' }));
      setOptions([...saved, ...TRAINING_OPPONENTS.map((snapshot): OpponentOption => ({ snapshot, source: 'training' }))]);
      setHistory(arenaRepository.list(traveler.id));
    }, 0);
    return () => window.clearTimeout(sync);
  }, [traveler.id]);

  function pickClosest() {
    const match = [...options].sort((a, b) => Math.abs(a.snapshot.combatPower - playerSnapshot.combatPower) - Math.abs(b.snapshot.combatPower - playerSnapshot.combatPower))[0];
    setSelected(match ?? { snapshot: nearestTrainingOpponent(playerSnapshot.combatPower, TRAINING_OPPONENTS), source: 'training' });
    setStage('preview');
  }

  function begin() {
    if (!selected) return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    setBattle(createBattle(playerSnapshot, selected.snapshot, seed, crypto.randomUUID()));
    setReward(null); setLastAction(null); setStage('battle');
  }

  function settle(finished: BattleState) {
    if (!selected || arenaRepository.has(finished.id)) return;
    const won = finished.winnerId === traveler.id;
    const calculated = calculateTrainingReward(won, arenaRepository.rewardedToday(traveler.id, selected.snapshot.id));
    const granted = !calculated.rewarded || updateTraveler((current) => addGameplayReward(current, calculated.xp, calculated.coins));
    const applied = granted ? calculated : { xp: 0, coins: 0, rewarded: false, reason: calculated.reason } as TrainingReward;
    const record: ArenaBattleRecord = {
      id: finished.id, playerId: traveler.id, opponentId: selected.snapshot.id, opponentName: selected.snapshot.name,
      result: won ? 'victory' : 'defeat', roundCount: finished.round, createdAt: new Date().toISOString(),
      damageDealt: finished.player.damageDealt, damageTaken: finished.player.damageTaken,
      abilitiesUsed: finished.player.abilitiesUsed, reward: applied,
    };
    arenaRepository.add(record); setReward(applied); setHistory(arenaRepository.list(traveler.id));
  }

  function act(action: BattleAction) {
    if (!battle || battle.status !== 'in_progress') return;
    const next = resolveRound(battle, action);
    setLastAction(action); setBattle(next);
    if (next.status === 'finished') { settle(next); setStage('result'); }
  }

  function reset() { setBattle(null); setReward(null); setLastAction(null); setSelected(null); setStage('lobby'); }
  const nearby = (power: number) => isWithinMatchmakingRange(playerSnapshot.combatPower, power);

  return <section className={styles.arenaHub}>
    <header className={styles.arenaHeader}>
      <div><span>ÁREA DE TREINO</span><h1>Arena dos Viajantes</h1><p>Batalhas estratégicas 1x1 com atributos, equipamentos e escolhas por rodada.</p></div>
      <div className={styles.combatPower}><small>PODER DE COMBATE</small><strong>{playerSnapshot.combatPower}</strong><span>Nível {traveler.level}</span></div>
    </header>
    <p className={styles.arenaEthics}>Os atributos representam somente regras do jogo. A Arena não mede fé, espiritualidade ou valor pessoal.</p>

    {stage === 'lobby' && <>
      <div className={styles.arenaLobbyGrid}>
        <article className={styles.arenaTravelerCard}>
          <FighterPortrait traveler={traveler} name={traveler.name} side="player" />
          <div><span>SEU VIAJANTE</span><h2>{traveler.name}</h2><Stats snapshot={playerSnapshot} /><p>{playerSnapshot.equipment.length} equipamentos ativos</p></div>
        </article>
        <section className={styles.arenaMatchPanel}>
          <span>DESAFIO 1x1</span><h2>Escolha um adversário</h2>
          <button className={styles.arenaPrimary} onClick={pickClosest}>Buscar adversário próximo</button>
          <p>Faixa sugerida: ±10% do seu poder. O resultado depende das ações e da build.</p>
          <div className={styles.arenaOpponentList}>
            {options.map((option) => <button key={option.snapshot.id} onClick={() => { setSelected(option); setStage('preview'); }}>
              <b>{option.snapshot.name}</b><span>Poder {option.snapshot.combatPower} · Nível {option.snapshot.level}</span>
              <small>{option.source === 'saved' ? 'Viajante salvo · cópia de treino' : 'Adversário de treino'} {nearby(option.snapshot.combatPower) ? '· faixa próxima' : ''}</small>
            </button>)}
          </div>
        </section>
      </div>
      <section className={styles.arenaHistory}><div><span>HISTÓRICO</span><h2>Últimos treinos</h2></div>
        {history.length ? <ol>{history.slice(0, 5).map((item) => <li key={item.id}><b>{item.result === 'victory' ? 'Vitória' : 'Derrota'}</b><span>vs {item.opponentName}</span><small>{item.roundCount} rodadas · {item.damageDealt} dano causado</small></li>)}</ol> : <p>Seu histórico começará depois da primeira batalha.</p>}
      </section>
      <section className={styles.arenaOnlineNotice}><b>PvP online em preparação</b><p>Este projeto ainda não possui autenticação, servidor multiplayer ou banco compartilhado. Nenhum desafio remoto é enviado nesta versão.</p></section>
    </>}

    {stage === 'preview' && selected && <section className={styles.arenaPreview}>
      <span>PRÉ-BATALHA</span><h2>Confronto de treino</h2>
      <div className={styles.arenaVersus}>
        <article><FighterPortrait traveler={traveler} name={traveler.name} side="player" /><h3>{traveler.name}</h3><b>Poder {playerSnapshot.combatPower}</b><Stats snapshot={playerSnapshot} /></article>
        <strong>VS</strong>
        <article><FighterPortrait traveler={selected.traveler} name={selected.snapshot.name} side="opponent" /><h3>{selected.snapshot.name}</h3><b>Poder {selected.snapshot.combatPower}</b><Stats snapshot={selected.snapshot} /></article>
      </div>
      <div className={styles.arenaEquipmentPreview}>{selected.snapshot.equipment.map((item) => <span key={item.id}>{item.name}</span>)}</div>
      <p>{selected.source === 'saved' ? 'A build salva será usada como snapshot e controlada pelo sistema.' : 'Adversário controlado pelo sistema.'}</p>
      <div className={styles.arenaControls}><button onClick={reset}>Voltar</button><button className={styles.arenaPrimary} onClick={begin}>Iniciar batalha</button></div>
    </section>}

    {(stage === 'battle' || stage === 'result') && battle && selected && <section className={styles.battleArena}>
      <div className={styles.battleRound}>RODADA {battle.round}</div>
      <div className={styles.battleField}>
        <FighterHud fighter={battle.player} traveler={traveler} side="player" active={lastAction !== null} />
        <div className={styles.battleSigil} aria-hidden="true">✦</div>
        <FighterHud fighter={battle.opponent} traveler={selected.traveler} side="opponent" />
      </div>
      {stage === 'battle' && <div className={styles.battleActions} aria-label="Ações da batalha">
        <button onClick={() => act('attack')}><b>ATACAR</b><span>Dano com Força</span></button>
        <button onClick={() => act('defend')}><b>DEFENDER</b><span>Reduz dano da rodada</span></button>
        <button onClick={() => act('focus')}><b>FOCAR</b><span>Sabedoria fortalece a próxima ação</span></button>
        <button disabled={!availableEquipmentAbility(battle.player)} onClick={() => act('equipment')}><b>HABILIDADE</b><span>{availableEquipmentAbility(battle.player)?.name ?? 'Nenhuma disponível'}</span></button>
      </div>}
      <BattleLog battle={battle} />
      {stage === 'result' && <section className={styles.battleResult}>
        <span>{battle.winnerId === traveler.id ? 'VITÓRIA' : 'DERROTA'}</span>
        <h2>{battle.winnerId === traveler.id ? 'Treino concluído com vitória' : 'Uma nova estratégia espera por você'}</h2>
        <div><b>{battle.round} rodadas</b><b>{battle.player.damageDealt} dano causado</b><b>{battle.player.damageTaken} dano recebido</b><b>{battle.player.abilitiesUsed} habilidades usadas</b></div>
        <p>{reward?.rewarded ? `Recompensa: +${reward.xp} XP e +${reward.coins} moedas.` : reward?.reason === 'daily-limit' ? 'Limite diário de recompensas contra este adversário atingido. Você pode continuar treinando.' : 'Treinos sem vitória não concedem recursos.'}</p>
        <div className={styles.arenaControls}><button onClick={reset}>Voltar à Arena</button><button className={styles.arenaPrimary} onClick={begin}>Jogar novamente</button></div>
      </section>}
    </section>}
  </section>;
}

function FighterHud({ fighter, traveler, side, active }: { fighter: BattleState['player']; traveler?: Traveler; side: 'player' | 'opponent'; active?: boolean }) {
  const percentage = Math.max(0, fighter.hp / fighter.maxHp * 100);
  return <article className={styles.battleFighter}>
    <div><span>NÍVEL {fighter.snapshot.level}</span><h2>{fighter.snapshot.name}</h2><b>{fighter.hp} / {fighter.maxHp} HP</b><div className={styles.hpTrack}><span style={{ width: `${percentage}%` }} /></div></div>
    <FighterPortrait traveler={traveler} name={fighter.snapshot.name} side={side} active={active} />
    <div className={styles.battleBuffs}>{fighter.focusMultiplier > 1 && <span>Foco ×{fighter.focusMultiplier.toFixed(2)}</span>}{fighter.defendedLastRound && <span>Defesa preparada</span>}{fighter.usedEffects.slice(-2).map((id, index) => <span key={`${id}-${index}`}>{equipmentEffects[id].name}</span>)}</div>
  </article>;
}

function BattleLog({ battle }: { battle: BattleState }) {
  return <details className={styles.battleLog} open><summary>Log da batalha</summary><ol>{battle.log.slice(-8).map((entry, index) => <li key={`${entry.round}-${index}`}><b>{entry.round ? `R${entry.round}` : 'INÍCIO'}</b> {entry.message}</li>)}</ol></details>;
}

export function ArenaScreen() {
  return <Shell back={routes.map} backLabel="Voltar à Jornada"><RequireTraveler>{(traveler) => <ArenaExperience traveler={traveler} />}</RequireTraveler></Shell>;
}
