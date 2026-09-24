'use client';

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { GARDEN_HELMET, type Traveler } from '../domain/traveler';
import { equipmentAssetForItem } from '../data/avatarAssets';
import { bibleLinkForReference } from '../data/bibleLinks';
import { updateTraveler } from '../state/use-journey';
import { Avatar } from './avatar';
import styles from '../journey.module.css';

type GardenInteraction = {
  id: string;
  label: string;
  action: 'Investigar' | 'Coletar' | 'Abrir' | 'Observar';
  kind: 'fragment' | 'coins' | 'chest' | 'secret' | 'passage' | 'puzzle';
  x: number;
  y: number;
  reward?: number;
  asset?: string;
  text: string;
};

const GARDEN_INTERACTIONS: readonly GardenInteraction[] = [
  { id: 'stones', label: 'Sinais do limite', action: 'Investigar', kind: 'fragment', x: 20, y: 51, text: 'Liberdade e responsabilidade caminham juntas.' },
  { id: 'leaves', label: 'Pistas da escolha', action: 'Investigar', kind: 'fragment', x: 48, y: 27, text: 'Escolhas produzem consequências no relato.' },
  { id: 'water', label: 'Sinais de cuidado', action: 'Investigar', kind: 'fragment', x: 79, y: 55, text: 'Cultivar e guardar expressam responsabilidade.' },
  { id: 'coins-grove', label: 'Moedas na clareira', action: 'Coletar', kind: 'coins', x: 34, y: 73, reward: 8, asset: '/assets/items/coin_pouch.png', text: 'Um pequeno grupo de moedas estava entre as raízes.' },
  { id: 'coins-river', label: 'Bolsa junto ao rio', action: 'Coletar', kind: 'coins', x: 87, y: 77, reward: 12, asset: '/assets/items/coin_pouch.png', text: 'Uma bolsa esquecida ainda guarda algumas moedas.' },
  { id: 'chest-path', label: 'Baú da trilha', action: 'Abrir', kind: 'chest', x: 39, y: 44, reward: 10, asset: '/assets/items/reward_chest.png', text: 'O baú simples guardava moedas para a viagem.' },
  { id: 'chest-hidden', label: 'Baú escondido', action: 'Abrir', kind: 'chest', x: 89, y: 29, reward: 18, asset: '/assets/items/reward_chest.png', text: 'Você encontrou um compartimento de equipamento.' },
  { id: 'hidden-corner', label: 'Recanto escondido', action: 'Observar', kind: 'secret', x: 10, y: 25, reward: 7, text: 'SEGREDO DESCOBERTO · Recanto Escondido' },
  { id: 'blocked-passage', label: 'Passagem bloqueada', action: 'Observar', kind: 'passage', x: 61, y: 57, text: 'O tronco bloqueia a passagem direta. A clareira oferece outro caminho.' },
  { id: 'wind-pattern', label: 'Sinais do vento', action: 'Observar', kind: 'puzzle', x: 69, y: 22, text: 'As marcas pedem atenção ao movimento do Jardim.' },
] as const;

const BLOCKED_ZONE = { left: 55, right: 67, top: 42, bottom: 67 };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export function GardenExploration({ traveler, onComplete }: { traveler: Traveler; onComplete: () => void }) {
  const [position, setPosition] = useState({ x: 49, y: 82 });
  const [activeInteraction, setActiveInteraction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<'care' | 'limit' | 'consequence' | null>(null);
  const [careSignals, setCareSignals] = useState<string[]>([]);
  const [challengeSequence, setChallengeSequence] = useState<string[]>([]);
  const [consequenceClues, setConsequenceClues] = useState<string[]>([]);
  const progress = traveler.progress;
  const nearby = useMemo(
    () => GARDEN_INTERACTIONS.filter((point) => !isResolved(point, traveler)).sort((a, b) => distance(position, a) - distance(position, b))[0],
    [position, traveler],
  );
  const nearbyInRange = nearby && distance(position, nearby) <= 12 ? nearby : undefined;
  const equipmentPending = progress.gardenOpenedChests.includes('chest-hidden') &&
    !traveler.inventory.some((item) => item.id === GARDEN_HELMET.id);

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback((current) => current === message ? null : current), 6000);
  }, []);

  const moveTo = useCallback((next: { x: number; y: number }) => {
    const bounded = { x: clamp(next.x, 5, 95), y: clamp(next.y, 16, 88) };
    const blocked = bounded.x >= BLOCKED_ZONE.left && bounded.x <= BLOCKED_ZONE.right &&
      bounded.y >= BLOCKED_ZONE.top && bounded.y <= BLOCKED_ZONE.bottom;
    if (blocked) {
      showFeedback('PASSAGEM BLOQUEADA · Procure outro caminho pela clareira.');
      return false;
    }
    setPosition(bounded);
    return true;
  }, [showFeedback]);

  const interact = useCallback((point: GardenInteraction) => {
    if (isResolved(point, traveler)) return;
    if (point.kind === 'fragment') {
      setActiveChallenge(point.id === 'water' ? 'care' : point.id === 'stones' ? 'limit' : 'consequence');
      setChallengeSequence([]);
      return;
    }
    if (point.kind === 'puzzle') {
      setPuzzleOpen(true);
      return;
    }
    if (point.id === 'chest-hidden' && !progress.gardenEvents.includes('wind-pattern')) {
      showFeedback('BAÚ PROTEGIDO · Resolva primeiro os Sinais do vento.');
      return;
    }
    updateTraveler((current) => {
      const currentProgress = current.progress;
      if (point.kind === 'coins') {
        if (currentProgress.gardenCollectedLoot.includes(point.id)) return current;
        return { ...current, coins: current.coins + (point.reward ?? 0), progress: { ...currentProgress, gardenCollectedLoot: [...currentProgress.gardenCollectedLoot, point.id] } };
      }
      if (point.kind === 'chest') {
        if (currentProgress.gardenOpenedChests.includes(point.id)) return current;
        return { ...current, coins: current.coins + (point.reward ?? 0), progress: { ...currentProgress, gardenOpenedChests: [...currentProgress.gardenOpenedChests, point.id] } };
      }
      if (point.kind === 'secret') {
        if (currentProgress.gardenSecrets.includes(point.id)) return current;
        return { ...current, coins: current.coins + (point.reward ?? 0), progress: { ...currentProgress, gardenSecrets: [...currentProgress.gardenSecrets, point.id] } };
      }
      if (currentProgress.gardenEvents.includes(point.id)) return current;
      return { ...current, progress: { ...currentProgress, gardenEvents: [...currentProgress.gardenEvents, point.id] } };
    });
    showFeedback(point.reward
        ? `${point.text} +${String(point.reward)} MOEDAS`
        : point.text);
  }, [progress.gardenEvents, showFeedback, traveler]);

  const completeFragment = useCallback((pointId: 'water' | 'stones' | 'leaves', objectiveId: string) => {
    updateTraveler((current) => {
      if (current.progress.gardenExploredPoints.includes(pointId)) return current;
      const gardenExploredPoints = [...current.progress.gardenExploredPoints, pointId];
      const explorationObjectives = current.progress.explorationObjectives.includes(objectiveId)
        ? current.progress.explorationObjectives
        : [...current.progress.explorationObjectives, objectiveId];
      return {
        ...current,
        progress: {
          ...current.progress,
          gardenExploredPoints,
          gardenFragments: Math.min(3, gardenExploredPoints.length),
          explorationObjectives,
        },
      };
    });
    setActiveChallenge(null);
    setChallengeSequence([]);
    showFeedback(`FRAGMENTO DE SABEDORIA · ${Math.min(3, progress.gardenFragments + 1)} / 3`);
  }, [progress.gardenFragments, showFeedback]);

  const approachAndInteract = useCallback((point: GardenInteraction) => {
    if (activeInteraction || isResolved(point, traveler)) return;
    setActiveInteraction(point.id);
    const destination = point.kind === 'passage'
      ? { x: point.x - 10, y: point.y + 10 }
      : { x: point.x, y: point.y + 8 };
    if (!moveTo(destination)) {
      setActiveInteraction(null);
      return;
    }
    window.setTimeout(() => {
      interact(point);
      setActiveInteraction(null);
    }, 650);
  }, [activeInteraction, interact, moveTo, traveler]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const directions: Record<string, [number, number]> = {
        ArrowUp: [0, -3], w: [0, -3], W: [0, -3],
        ArrowDown: [0, 3], s: [0, 3], S: [0, 3],
        ArrowLeft: [-3, 0], a: [-3, 0], A: [-3, 0],
        ArrowRight: [3, 0], d: [3, 0], D: [3, 0],
      };
      if (event.key === 'e' || event.key === 'E') {
        if (nearbyInRange) {
          event.preventDefault();
          interact(nearbyInRange);
        }
        return;
      }
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      setPosition((current) => {
        const next = { x: current.x + direction[0], y: current.y + direction[1] };
        const bounded = { x: clamp(next.x, 5, 95), y: clamp(next.y, 16, 88) };
        const blocked = bounded.x >= BLOCKED_ZONE.left && bounded.x <= BLOCKED_ZONE.right &&
          bounded.y >= BLOCKED_ZONE.top && bounded.y <= BLOCKED_ZONE.bottom;
        return blocked ? current : bounded;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interact, nearbyInRange]);

  const clickDestination = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    moveTo({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  };

  const solvePuzzle = (answer: 'pedras' | 'folhas' | 'agua') => {
    if (answer !== 'folhas') {
      showFeedback('As marcas não reagiram. Observe o que se move com o vento.');
      return;
    }
    updateTraveler((current) => current.progress.gardenEvents.includes('wind-pattern') ? current : ({
      ...current,
      coins: current.coins + 5,
      progress: { ...current.progress, gardenEvents: [...current.progress.gardenEvents, 'wind-pattern'] },
    }));
    setPuzzleOpen(false);
    showFeedback('PADRÃO DESCOBERTO · As folhas revelaram a direção. +5 MOEDAS');
  };

  const claimEquipment = () => {
    updateTraveler((current) => current.inventory.some((item) => item.id === GARDEN_HELMET.id) ? current : ({
      ...current,
      inventory: [...current.inventory, { ...GARDEN_HELMET, isNew: true }],
      progress: { ...current.progress, gardenEvents: current.progress.gardenEvents.includes('garden-equipment') ? current.progress.gardenEvents : [...current.progress.gardenEvents, 'garden-equipment'] },
    }));
    showFeedback('NOVO EQUIPAMENTO ADICIONADO À MOCHILA');
  };

  const selectCareSignal = (signal: string) => {
    setCareSignals((current) => current.includes(signal) ? current : [...current, signal]);
  };

  const selectLimitStep = (value: string) => {
    const expected = ['liberdade', 'orientacao', 'limite'];
    const sequence = [...challengeSequence, value];
    if (expected[sequence.length - 1] !== value) {
      setChallengeSequence([]);
      showFeedback('A sequência não se completou. Observe liberdade, orientação e limite.');
      return;
    }
    setChallengeSequence(sequence);
    if (sequence.length === expected.length) completeFragment('stones', 'limit-sequence');
  };

  const selectConsequenceStep = (value: string) => {
    const expected = ['orientacao', 'escolha', 'consequencia'];
    const sequence = [...challengeSequence, value];
    if (expected[sequence.length - 1] !== value) {
      setChallengeSequence([]);
      showFeedback('Essa ordem não acompanha o desenvolvimento do relato. Tente novamente.');
      return;
    }
    setChallengeSequence(sequence);
    if (sequence.length === expected.length) completeFragment('leaves', 'choice-consequence-order');
  };

  const nextObjective = !progress.gardenExploredPoints.includes('water')
    ? 'Investigue o significado do cuidado'
    : !progress.gardenExploredPoints.includes('stones')
      ? 'Relacione liberdade, orientação e limite'
      : !progress.gardenExploredPoints.includes('leaves')
        ? 'Organize escolha e consequência'
        : 'Os três Fragmentos foram encontrados';

  return (
    <div className={styles.gardenExploration}>
      <div className={styles.gardenHud}>
        <span>OBJETIVO ATUAL <strong>{nextObjective}</strong></span>
        <span>FRAGMENTOS <strong>◆ {progress.gardenFragments} / 3</strong></span>
        <span>BAÚS <strong>{progress.gardenOpenedChests.length} / 2</strong></span>
        <span>SEGREDOS <strong>{progress.gardenSecrets.length} / 1</strong></span>
        <span>MOEDAS <strong>◈ {traveler.coins}</strong></span>
      </div>
      <div className={styles.gardenScene} onClick={clickDestination} role="application" aria-label="Área explorável do Jardim">
        <div className={styles.gardenMist} aria-hidden="true" />
        <div className={styles.gardenLights} aria-hidden="true" />
        <div className={styles.gardenBlockedPath} aria-label="Tronco bloqueando a passagem" />
        <div className={styles.gardenAvatar} style={{ left: `${String(position.x)}%`, top: `${String(position.y)}%` }}>
          <Avatar appearance={traveler.appearance} avatar={traveler.avatar} />
        </div>
        {GARDEN_INTERACTIONS.map((point) => {
          const resolved = isResolved(point, traveler);
          const close = distance(position, point) <= 12;
          return (
            <button
              key={point.id}
              type="button"
              className={`${styles.gardenWorldPoint} ${styles[`gardenPoint${point.kind}`]} ${resolved ? styles.gardenWorldPointDone : ''} ${activeInteraction === point.id ? styles.gardenWorldPointActive : ''}`}
              style={{ left: `${String(point.x)}%`, top: `${String(point.y)}%` }}
              onClick={(event) => { event.stopPropagation(); approachAndInteract(point); }}
              disabled={resolved}
              aria-label={`${point.label}: ${resolved ? 'concluído' : point.action}`}
            >
              {point.asset ? (
                // eslint-disable-next-line @next/next/no-img-element -- local exploration asset
                <img src={point.asset} alt="" aria-hidden="true" />
              ) : <span aria-hidden="true">{pointIcon(point, resolved)}</span>}
              <small>{point.label}</small>
              {close && !resolved && <em>[E] {point.action}</em>}
            </button>
          );
        })}
        <div className={styles.gardenControlsHint}>WASD / SETAS · CLIQUE OU TOQUE PARA MOVER · E PARA INTERAGIR</div>
        {feedback && <div className={styles.gardenDiscovery} role="status">{feedback}</div>}
        {puzzleOpen && (
          <div className={styles.gardenPuzzle} role="group" aria-label="Desafio de observação">
            <strong>Qual sinal se move sem deixar o lugar?</strong>
            <div>
              <button onClick={() => solvePuzzle('pedras')}>Pedras</button>
              <button onClick={() => solvePuzzle('folhas')}>Folhas</button>
              <button onClick={() => solvePuzzle('agua')}>Água</button>
            </div>
          </div>
        )}
        {activeChallenge === 'care' && (
          <div className={styles.gardenObjectivePanel} role="dialog" aria-label="Desafio do cuidado">
            <small>REFERÊNCIA · Gênesis 2:8–15</small>
            <strong>Cuidado do Jardim</strong>
            <p>O relato associa o jardim a água, cultivo e guarda. Encontre três sinais de cuidado nesta região.</p>
            <div className={styles.gardenSignalGrid}>
              {[
                ['water-flow', 'Água que irriga'],
                ['cultivated-soil', 'Solo que pode ser cultivado'],
                ['protected-plants', 'Vegetação a ser guardada'],
              ].map(([id, label]) => (
                <button key={id} className={careSignals.includes(id) ? styles.gardenSignalFound : undefined} onClick={() => selectCareSignal(id)}>
                  {careSignals.includes(id) ? '✓ ' : '✦ '}{label}
                </button>
              ))}
            </div>
            <span>Sinais encontrados {careSignals.length} / 3</span>
            <a href={bibleLinkForReference('Gênesis 2:8–15').url} target="_blank" rel="noopener noreferrer">Abrir na Bíblia ↗</a>
            <button disabled={careSignals.length < 3} onClick={() => completeFragment('water', 'care-signs')}>Concluir observação</button>
          </div>
        )}
        {activeChallenge === 'limit' && (
          <div className={styles.gardenObjectivePanel} role="dialog" aria-label="Desafio do limite">
            <small>REFERÊNCIA · Gênesis 2:16–17</small>
            <strong>Liberdade e limite</strong>
            <p>Toque nos conceitos na ordem em que a orientação é apresentada.</p>
            <div className={styles.gardenSequence}>
              <button onClick={() => selectLimitStep('limite')}>Limite</button>
              <button onClick={() => selectLimitStep('liberdade')}>Liberdade</button>
              <button onClick={() => selectLimitStep('orientacao')}>Orientação</button>
            </div>
            <span>Sequência {challengeSequence.length} / 3</span>
            <a href={bibleLinkForReference('Gênesis 2:16–17').url} target="_blank" rel="noopener noreferrer">Abrir na Bíblia ↗</a>
          </div>
        )}
        {activeChallenge === 'consequence' && (
          <div className={styles.gardenObjectivePanel} role="dialog" aria-label="Desafio de escolha e consequência">
            <small>REFERÊNCIA · Gênesis 3:1–7</small>
            <strong>Escolha e consequência</strong>
            <p>Revele as pistas e organize o desenvolvimento do relato sem assumir o lugar de seus personagens.</p>
            {consequenceClues.length < 3 ? (
              <div className={styles.gardenSignalGrid}>
                {[
                  ['heard-guidance', 'Orientação lembrada'],
                  ['made-choice', 'Escolha realizada'],
                  ['perceived-change', 'Mudança percebida'],
                ].map(([id, label]) => (
                  <button key={id} className={consequenceClues.includes(id) ? styles.gardenSignalFound : undefined} onClick={() => setConsequenceClues((current) => current.includes(id) ? current : [...current, id])}>
                    {consequenceClues.includes(id) ? '✓ ' : '? '}{label}
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.gardenSequence}>
                <button onClick={() => selectConsequenceStep('consequencia')}>Consequência</button>
                <button onClick={() => selectConsequenceStep('orientacao')}>Orientação</button>
                <button onClick={() => selectConsequenceStep('escolha')}>Escolha</button>
              </div>
            )}
            <span>{consequenceClues.length < 3 ? `Pistas ${String(consequenceClues.length)} / 3` : `Ordem ${String(challengeSequence.length)} / 3`}</span>
            <a href={bibleLinkForReference('Gênesis 3:1–7').url} target="_blank" rel="noopener noreferrer">Abrir na Bíblia ↗</a>
          </div>
        )}
        {equipmentPending && (
          <div className={styles.gardenEquipmentFound} role="status">
            <strong>NOVO EQUIPAMENTO</strong>
            {/* eslint-disable-next-line @next/next/no-img-element -- central local asset registry */}
            <img src={equipmentAssetForItem(GARDEN_HELMET)} alt="Elmo do Viajante" />
            <span>{GARDEN_HELMET.name}</span>
            <small>RARO · poder {GARDEN_HELMET.power}</small>
            <button onClick={claimEquipment}>Adicionar à mochila</button>
          </div>
        )}
      </div>
      {progress.gardenFragments === 3 && (
        <div className={styles.gardenCompletion}>
          <p>Você percebe que cada caminho trouxe uma lição.</p>
          <strong>3 / 3 Fragmentos encontrados</strong>
          <button className={styles.primaryLink} onClick={onComplete}>Continuar a jornada →</button>
        </div>
      )}
    </div>
  );
}

function isResolved(point: GardenInteraction, traveler: Traveler): boolean {
  const progress = traveler.progress;
  if (point.kind === 'fragment') return progress.gardenExploredPoints.includes(point.id);
  if (point.kind === 'coins') return progress.gardenCollectedLoot.includes(point.id);
  if (point.kind === 'chest') return progress.gardenOpenedChests.includes(point.id);
  if (point.kind === 'secret') return progress.gardenSecrets.includes(point.id);
  return progress.gardenEvents.includes(point.id);
}

function pointIcon(point: GardenInteraction, resolved: boolean): string {
  if (resolved) return '✓';
  if (point.kind === 'fragment') return '✦';
  if (point.kind === 'coins') return '◈';
  if (point.kind === 'chest') return '▣';
  if (point.kind === 'secret') return '?';
  if (point.kind === 'passage') return '⌁';
  return '◇';
}
