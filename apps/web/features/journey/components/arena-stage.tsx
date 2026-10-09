'use client';
import type { BattleState } from '@rpg/game-engine';
import { equipmentEffects } from '@rpg/game-engine';
import type { Traveler } from '../domain/traveler';
import type { BattleFeedback } from '../data/battlePresentation';
import type { CombatPhase } from '../hooks/use-battle-presentation';
import {
  arenaStageVariables,
  arenaFighterVariables,
  ARENA_FACING,
  type ArenaViewport,
} from '../data/arenaPresentation';
import {
  trainingPortraitSlot,
  type VisualSlot,
} from '../data/audiovisualAssets';
import { AvatarRuntime } from './avatar-runtime';
import { PackArtwork } from './pack-artwork';
import { ArenaFocusMeter } from './arena-specials';
import styles from '../journey.module.css';
import visual from './arena-stage.module.css';

export function FighterPortrait({
  traveler,
  name,
  side,
  active,
  participantId,
  allowedAssets,
}: {
  traveler?: Traveler;
  name: string;
  side: 'player' | 'opponent';
  active?: boolean;
  participantId?: string;
  allowedAssets?: ReadonlySet<VisualSlot>;
}) {
  const slot = trainingPortraitSlot(participantId);
  const fallback = (
    <div className={styles.trainingAvatar} aria-hidden="true">
      <span>✦</span>
      <b>{name.slice(0, 1)}</b>
    </div>
  );
  return (
    <div
      className={`${styles.arenaPortrait} ${active ? styles.arenaPortraitActive : ''}`}
      data-portrait-side={side}
    >
      <div
        className={visual.facing}
        style={{ transform: `scaleX(${ARENA_FACING[side]})` }}
      >
        {traveler ? (
          <AvatarRuntime traveler={traveler} mode="arena" decorative />
        ) : slot ? (
          <PackArtwork
            slot={slot}
            enabled={!allowedAssets || allowedAssets.has(slot)}
            fallback={
              <div style={{ transform: `scaleX(${ARENA_FACING[side]})` }}>
                {fallback}
              </div>
            }
          />
        ) : (
          fallback
        )}
      </div>
    </div>
  );
}

export type ArenaFxKind =
  | 'hit-flash'
  | 'slash'
  | 'block-impact'
  | 'dodge-trail'
  | 'focus-pulse'
  | 'special-reveal'
  | 'victory-glow'
  | 'defeat-fade'
  | 'level-up-burst';
export function ArenaFx({ kind }: { kind: ArenaFxKind }) {
  return <span className={visual.fx} data-fx={kind} aria-hidden="true" />;
}

function FighterHud({
  fighter,
  traveler,
  side,
  event,
  phase,
  outcome,
  allowedAssets,
}: {
  fighter: BattleState['player'];
  traveler?: Traveler;
  side: 'player' | 'opponent';
  event?: BattleFeedback | null;
  phase: CombatPhase;
  outcome?: 'victory' | 'defeat';
  allowedAssets?: ReadonlySet<VisualSlot>;
}) {
  const actor = event?.actorId === fighter.snapshot.id;
  const recipient = event?.targetId === fighter.snapshot.id;
  const impact = phase === 'impact' || phase === 'recovery';
  const motion =
    impact && recipient && event?.kind === 'attack'
      ? 'hit'
      : impact && recipient && event?.kind === 'dodge'
        ? 'dodge'
        : actor
          ? event?.kind === 'dodge'
            ? 'attack'
            : event?.kind
          : 'idle';
  return (
    <article
      className={`${styles.battleFighter} ${visual.fighter}`}
      data-side={side}
      data-motion={motion}
      data-profile={fighter.snapshot.arenaProfile}
      data-phase={phase}
      data-special={actor ? event?.specialId : undefined}
      data-guard={fighter.guard ?? undefined}
      data-block={impact && recipient && event?.defended ? 'true' : undefined}
      data-outcome={outcome}
      style={arenaFighterVariables(fighter.snapshot.arenaProfile, side)}
    >
      <div className={visual.hud}>
        <span>NÍVEL {fighter.snapshot.level}</span>
        <h2>{fighter.snapshot.name}</h2>
        <b>
          {fighter.hp} / {fighter.maxHp} HP
        </b>
        <div className={styles.hpTrack}>
          <span
            style={{
              width: `${Math.max(0, (fighter.hp / fighter.maxHp) * 100)}%`,
            }}
          />
        </div>
        <ArenaFocusMeter fighter={fighter} />
      </div>
      <div className={visual.actor}>
        <span className={visual.contact} aria-hidden="true" />
        <FighterPortrait
          traveler={traveler}
          name={fighter.snapshot.name}
          participantId={fighter.snapshot.id}
          side={side}
          allowedAssets={allowedAssets}
        />
        {actor &&
          (event?.kind === 'attack' || event?.kind === 'dodge') &&
          (phase === 'execution' || phase === 'impact') && (
            <ArenaFx kind="slash" />
          )}
        {actor && event?.specialId && <ArenaFx kind="special-reveal" />}
        {actor && event?.kind === 'focus' && <ArenaFx kind="focus-pulse" />}
        {((actor && event?.kind === 'defend') ||
          (recipient && event?.defended && impact)) && (
          <ArenaFx kind="block-impact" />
        )}
        {recipient && event?.kind === 'attack' && impact && (
          <ArenaFx kind="hit-flash" />
        )}
        {recipient && event?.kind === 'dodge' && impact && (
          <ArenaFx kind="dodge-trail" />
        )}
        {outcome && (
          <ArenaFx
            kind={outcome === 'victory' ? 'victory-glow' : 'defeat-fade'}
          />
        )}
        {actor &&
          impact &&
          (event?.focusDelta ?? 0) > 0 &&
          !event.specialId && (
            <span className={visual.focusText} aria-hidden="true">
              +1 FOCO
            </span>
          )}
      </div>
    </article>
  );
}

function FighterStatuses({
  fighter,
  side,
}: {
  fighter: BattleState['player'];
  side: 'player' | 'opponent';
}) {
  const hasStatus =
    (fighter.tacticalMultiplier ?? 1) > 1 ||
    fighter.guard ||
    fighter.mobilityReady ||
    fighter.usedEffects.length > 0;
  if (!hasStatus) return null;
  return (
    <div
      className={`${styles.battleBuffs} ${visual.buffs}`}
      data-fighter-status={side}
      aria-label={`Estado de ${fighter.snapshot.name}`}
    >
      {(fighter.tacticalMultiplier ?? 1) > 1 && (
        <span>Vantagem ×{fighter.tacticalMultiplier?.toFixed(2)}</span>
      )}
      {fighter.guard && (
        <span>
          {fighter.guard === 'fortified'
            ? 'Guarda reforçada'
            : 'Defesa preparada'}
        </span>
      )}
      {fighter.mobilityReady && <span>Mobilidade preparada</span>}
      {fighter.usedEffects.slice(-2).map((id, index) => (
        <span key={`${id}-${index}`}>{equipmentEffects[id].name}</span>
      ))}
    </div>
  );
}

export function ArenaStage({
  battle,
  player,
  opponent,
  event,
  phase,
  motion = 'system',
  result,
  allowedAssets,
  layout,
}: {
  battle: BattleState;
  player?: Traveler;
  opponent?: Traveler;
  event?: BattleFeedback | null;
  phase: CombatPhase;
  motion?: 'system' | 'normal' | 'reduced';
  result?: 'victory' | 'defeat';
  allowedAssets?: ReadonlySet<VisualSlot>;
  layout?: ArenaViewport;
}) {
  const actor =
    event?.actorId === battle.opponent.snapshot.id
      ? battle.opponent
      : battle.player;
  return (
    <>
      <div
        className={`${styles.battleField} ${visual.frame}`}
        data-testid="arena-stage"
        data-motion-preference={motion}
        data-layout={layout}
        data-combat-kind={event?.kind}
        data-phase={phase}
        data-special={event?.specialId}
        style={{
          ...arenaStageVariables(layout),
          ...arenaFighterVariables(
            actor.snapshot.arenaProfile,
            event?.actorId === battle.opponent.snapshot.id
              ? 'opponent'
              : 'player',
          ),
        }}
      >
        <div className={visual.background} data-layer="background">
          <PackArtwork
            slot="arenaBackground"
            enabled={!allowedAssets || allowedAssets.has('arenaBackground')}
          />
        </div>
        <div
          className={visual.environment}
          data-layer="environment"
          aria-hidden="true"
        />
        <div className={visual.ground} data-layer="ground" aria-hidden="true" />
        <FighterHud
          fighter={battle.player}
          traveler={player}
          side="player"
          event={event}
          phase={phase}
          outcome={result}
          allowedAssets={allowedAssets}
        />
        <div className={styles.battleSigil} aria-hidden="true">
          ✦
        </div>
        <FighterHud
          fighter={battle.opponent}
          traveler={opponent}
          side="opponent"
          event={event}
          phase={phase}
          outcome={
            result ? (result === 'victory' ? 'defeat' : 'victory') : undefined
          }
          allowedAssets={allowedAssets}
        />
        {event?.specialId && (
          <div className={visual.cinematic} aria-hidden="true">
            <b>{event.label}</b>
          </div>
        )}
      </div>
      {event && (phase === 'impact' || phase === 'recovery') && (
        <div
          className={visual.feedback}
          data-motion-preference={motion}
          style={arenaStageVariables(layout)}
          aria-hidden="true"
        >
          <div
            className={`${styles.combatFloat} ${visual.combatText}`}
            data-kind={event.kind}
            data-feedback-side={
              event.targetId === battle.player.snapshot.id
                ? 'player'
                : 'opponent'
            }
          >
            <b>
              {event.kind === 'dodge'
                ? 'ESQUIVOU'
                : event.defended
                  ? 'DANO REDUZIDO'
                  : event.label}
            </b>
            <strong>{event.value}</strong>
          </div>
        </div>
      )}
      <div
        className={visual.summary}
        role="group"
        aria-label="Estados dos combatentes"
      >
        <FighterStatuses fighter={battle.player} side="player" />
        <FighterStatuses fighter={battle.opponent} side="opponent" />
      </div>
    </>
  );
}
