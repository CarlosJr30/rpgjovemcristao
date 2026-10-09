'use client';
import { useEffect, useState } from 'react';
import {
  arenaSpecials,
  type ArenaSpecialId,
  type BattleState,
} from '@rpg/game-engine';
import { ArenaStage } from '../components/arena-stage';
import { ArenaSpecialPanel } from '../components/arena-specials';
import { ArenaUnlockNotice } from '../components/arena-unlock-notice';
import {
  useBattlePresentation,
  type CombatPhase,
} from '../hooks/use-battle-presentation';
import { TRAINING_OPPONENTS } from '../data/arena';
import { arenaMotion, arenaStageVariables } from '../data/arenaPresentation';
import type { ArenaSound } from '../audio/arena-audio';
import type { ArenaAssetStatus } from './arena-asset-status';
import type { VisualSlot } from '../data/audiovisualAssets';
import {
  arenaLabFixture,
  LAB_STATES,
  LAB_TRAVELER,
  type LabState,
} from './arena-lab-fixtures';
import styles from '../journey.module.css';
import lab from './arena-visual-lab.module.css';
import { AvatarRuntimePanel } from './avatar-runtime-panel';
import { BodyFitPanel } from './body-fit-panel';

const stateLabels: Record<LabState, string> = {
  idle: 'Idle',
  attack: 'Ataque',
  defend: 'Defesa',
  dodge: 'Esquiva',
  special: 'Especial',
  hit: 'Recebendo dano',
  victory: 'Vitória',
  defeat: 'Derrota',
  unlock: 'Unlock',
  buffs: 'Buffs empilhados (DEV)',
};
const widths = {
  auto: '100%',
  portrait: '390px',
  landscape: '844px',
  tablet: '768px',
  desktop: '1440px',
};
export function ArenaVisualLab() {
  const [opponent, setOpponent] = useState(0);
  const [state, setState] = useState<LabState>('idle');
  const [ability, setAbility] = useState<ArenaSpecialId | 'basic'>(
    'path-strike',
  );
  const [side, setSide] = useState<'player' | 'opponent'>('player');
  const [focus, setFocus] = useState(3);
  const [motion, setMotion] = useState<'normal' | 'reduced'>('normal');
  const [viewport, setViewport] = useState<keyof typeof widths>('auto');
  const [phase, setPhase] = useState<CombatPhase>('impact');
  const [events, setEvents] = useState<string[]>([]);
  const [assets, setAssets] = useState<ArenaAssetStatus[]>([]);
  const [assetError, setAssetError] = useState('');
  const [specials, setSpecials] = useState(false);
  const [finished, setFinished] = useState<BattleState | null>(null);
  const fixture = arenaLabFixture(opponent, state, ability, focus, side);
  const presentation = useBattlePresentation({
    reducedMotion: motion === 'reduced',
    onSound: (kind, id) => record(kind, id),
  });
  function record(kind: ArenaSound, id?: string) {
    setEvents((previous) => [
      ...previous.slice(-11),
      `${kind}${id ? ` · ${id}` : ''}`,
    ]);
  }
  function resetPreview() {
    presentation.cancel();
    setFinished(null);
  }
  async function refreshAssets(signal?: AbortSignal) {
    try {
      const response = await fetch('/__arena_lab/assets', {
        signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('audit');
      setAssets(await response.json());
      setAssetError('');
    } catch {
      if (!signal?.aborted)
        setAssetError('Auditoria indisponível. Não significa aprovação.');
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/__arena_lab/assets', {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((response) => {
        if (!response.ok) throw new Error('audit');
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setAssets(data);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setAssetError('Auditoria indisponível. Não significa aprovação.');
      });
    return () => controller.abort();
  }, []);
  function replay() {
    resetPreview();
    setEvents([]);
    presentation.playPreview(
      fixture.before,
      fixture.after,
      fixture.events,
      () => {
        setFinished(fixture.after);
        if (fixture.result) record(fixture.result);
      },
    );
  }
  const visualBattle =
    presentation.display ??
    finished ??
    (fixture.events.length > 0 &&
    (phase === 'anticipation' || phase === 'execution')
      ? fixture.before
      : fixture.after);
  const result = !presentation.busy ? fixture.result : undefined;
  const timing = arenaMotion(TRAINING_OPPONENTS[opponent].arenaProfile);
  const allowedAssets = new Set(
    assets
      .filter(
        (asset) =>
          asset.status === 'READY' &&
          asset.key !== 'arenaBackgroundMobile' &&
          (asset.key !== 'arenaBackground' ||
            assets.find((mobile) => mobile.key === 'arenaBackgroundMobile')
              ?.status === 'READY'),
      )
      .map((asset) => asset.key as VisualSlot),
  );
  return (
    <main className={lab.lab}>
      <AvatarRuntimePanel />
      <BodyFitPanel />
      <header>
        <span>LOCAL / DEV · FIXTURES</span>
        <h1>Arena Visual Lab</h1>
        <p>
          Inspeção visual isolada. Nenhum XP, moeda, histórico ou save é
          alterado.
        </p>
      </header>
      <section className={lab.controls} aria-label="Controles do laboratório">
        <label>
          Oponente
          <select
            aria-label="Oponente"
            value={opponent}
            onChange={(e) => {
              resetPreview();
              setOpponent(Number(e.target.value));
            }}
          >
            {TRAINING_OPPONENTS.map((o, i) => (
              <option key={o.id} value={i}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select
            aria-label="Estado"
            value={state}
            onChange={(e) => {
              resetPreview();
              setState(e.target.value as LabState);
            }}
          >
            {LAB_STATES.map((s) => (
              <option key={s} value={s}>
                {stateLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Habilidade
          <select
            aria-label="Habilidade"
            value={ability}
            onChange={(e) => {
              resetPreview();
              setAbility(e.target.value as ArenaSpecialId | 'basic');
            }}
          >
            <option value="basic">Ataque Básico</option>
            {arenaSpecials.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ator
          <select
            aria-label="Ator"
            value={side}
            onChange={(e) => {
              resetPreview();
              setSide(e.target.value as 'player' | 'opponent');
            }}
          >
            <option value="player">Jogador</option>
            <option value="opponent">Oponente</option>
          </select>
        </label>
        <label>
          Foco inicial
          <select
            aria-label="Foco inicial"
            value={focus}
            onChange={(e) => {
              resetPreview();
              setFocus(Number(e.target.value));
            }}
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          Viewport/preview
          <select
            aria-label="Viewport/preview"
            value={viewport}
            onChange={(e) => setViewport(e.target.value as keyof typeof widths)}
          >
            <option value="auto">Viewport real</option>
            <option value="portrait">Mobile portrait</option>
            <option value="landscape">Mobile landscape</option>
            <option value="tablet">Tablet</option>
            <option value="desktop">Desktop</option>
          </select>
        </label>
        <label>
          Movimento
          <select
            aria-label="Movimento"
            value={motion}
            onChange={(e) => {
              resetPreview();
              setMotion(e.target.value as 'normal' | 'reduced');
            }}
          >
            <option value="normal">NORMAL</option>
            <option value="reduced">REDUCED MOTION</option>
          </select>
        </label>
        <label>
          Fase congelada
          <select
            aria-label="Fase congelada"
            value={phase}
            onChange={(e) => {
              resetPreview();
              setPhase(e.target.value as CombatPhase);
            }}
          >
            {['anticipation', 'execution', 'impact', 'recovery'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <button onClick={replay}>Reproduzir sequência</button>
        <button onClick={resetPreview}>Parar / congelar</button>
      </section>
      <p className={lab.caption}>
        Preview limita a largura disponível. Para QA exata, use o viewport real
        do navegador.{' '}
        {timing.anticipation +
          timing.execution +
          timing.impact +
          timing.recovery}{' '}
        ms · viagem {timing.fighterTravel}px · reação {timing.hitReaction}px
      </p>
      <section
        className={`${styles.battleArena} ${lab.preview}`}
        style={{ ...arenaStageVariables(), maxWidth: widths[viewport] }}
        data-motion-preference={motion}
        aria-label="Preview Arena"
      >
        <ArenaStage
          allowedAssets={allowedAssets}
          layout={
            viewport === 'auto'
              ? undefined
              : viewport === 'tablet'
                ? 'tablet'
                : viewport === 'desktop'
                  ? 'desktop'
                  : 'mobile'
          }
          battle={visualBattle}
          player={LAB_TRAVELER}
          event={presentation.busy ? presentation.event : fixture.events[0]}
          phase={presentation.busy ? presentation.phase : phase}
          motion={motion}
          result={result}
        />
        <p className={lab.turn} role="status">
          {presentation.busy
            ? 'AGUARDE'
            : result
              ? result === 'victory'
                ? 'VITÓRIA'
                : 'TREINO ENCERRADO'
              : 'SEU TURNO'}{' '}
          ·{' '}
          {presentation.event?.description ??
            fixture.events[0]?.description ??
            'DEV FIXTURE · Idle'}
        </p>
        <div className={styles.battleActions} aria-label="Ações da batalha">
          <button
            disabled={presentation.busy}
            onClick={() => {
              resetPreview();
              setState('attack');
            }}
          >
            ATACAR
          </button>
          <button
            disabled={presentation.busy}
            onClick={() => {
              resetPreview();
              setState('defend');
            }}
          >
            DEFENDER
          </button>
          <button
            id="arena-special-trigger"
            data-special-ready={focus >= 2}
            disabled={presentation.busy}
            aria-expanded={specials}
            onClick={() => setSpecials(!specials)}
          >
            ESPECIAIS
          </button>
        </div>
        {specials && (
          <ArenaSpecialPanel
            fighter={visualBattle.player}
            busy={presentation.busy}
            onClose={() => setSpecials(false)}
            onSelect={(action) => {
              resetPreview();
              setAbility(action.replace('special:', '') as ArenaSpecialId);
              setState('special');
            }}
          />
        )}
        {state === 'special' && ability === 'discernment' && (
          <p className={styles.arenaIntent}>
            DEV FIXTURE · intenção provável: defender (exemplo visual)
          </p>
        )}
        {result && (
          <section className={styles.battleResult}>
            <span>{result === 'victory' ? 'VITÓRIA' : 'TREINO ENCERRADO'}</span>
            <h2>
              {result === 'victory'
                ? 'Treino concluído com vitória'
                : 'Uma nova estratégia espera por você'}
            </h2>
            <p>DEV FIXTURE · recompensas somente ilustrativas</p>
            {result === 'victory' && (
              <ol
                className={styles.arenaRewardSequence}
                aria-label="Preview recompensas"
                data-lab-rewards="true"
              >
                <li>+8 XP · preview</li>
                <li>+3 moedas · preview</li>
              </ol>
            )}
            <button
              onClick={() => {
                resetPreview();
                setState('idle');
              }}
            >
              TENTAR NOVAMENTE
            </button>
          </section>
        )}
        {state === 'unlock' && !presentation.busy && (
          <ArenaUnlockNotice before={1} after={2} preview />
        )}
      </section>
      <div className={lab.panels}>
        <section aria-label="Asset status">
          <h2>Asset status</h2>
          <p>
            Leitura do manifesto, receipts, auditor e catálogo existentes.
            Nenhuma aprovação é escrita.
          </p>
          <button onClick={() => void refreshAssets()}>Atualizar status</button>
          <button onClick={() => window.location.reload()}>
            Recarregar catálogo / hot-swap
          </button>
          {assetError && <p role="alert">{assetError}</p>}
          {!assetError && assets.length === 0 && (
            <p role="status">Auditando arquivos locais…</p>
          )}
          <ul>
            {assets.map((a) => (
              <li key={a.key}>
                <b>
                  {a.label} · {a.status}
                </b>
                <code>{a.file}</code>
                <span>
                  {a.width}×{a.height}
                </span>
                {a.reason && <span>{a.reason}</span>}
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Eventos de áudio DEV">
          <h2>Áudio DEV</h2>
          <p>Apenas eventos da sequência. Nenhum arquivo é tocado.</p>
          <div className={lab.audio}>
            {(
              [
                'attack',
                'defense',
                'focus',
                'dodge',
                'special',
                'impact',
                'victory',
                'defeat',
              ] as ArenaSound[]
            ).map((kind) => (
              <button key={kind} onClick={() => record(kind)}>
                {kind}
              </button>
            ))}
          </div>
          <ol aria-live="polite">
            {events.map((event, i) => (
              <li key={i}>{event}</li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
