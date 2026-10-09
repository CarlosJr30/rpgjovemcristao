import type { ArenaProfile } from '@rpg/game-engine';
import type { CSSProperties } from 'react';

export type ArenaViewport = 'mobile' | 'tablet' | 'desktop';
type Point = Readonly<{ x: number; y: number }>;
type Composition = Readonly<{
  PLAYER_POSITION: Point;
  OPPONENT_POSITION: Point;
  GROUND_LINE: number;
  HUD_SAFE_AREA: number;
  ATTACK_CENTER: Point;
  IMPACT_CENTER: Point;
  SPECIAL_FOCUS_CENTER: Point;
  minHeight: number;
  maxHeight: number;
  stageHeight: number;
  motionScale: number;
}>;
// Percent coordinates belong to the stage; character bounds are CSS px at 2:3.
export const ARENA_COMPOSITION: Readonly<Record<ArenaViewport, Composition>> = {
  mobile: {
    PLAYER_POSITION: { x: 25, y: 91 },
    OPPONENT_POSITION: { x: 75, y: 91 },
    GROUND_LINE: 91,
    HUD_SAFE_AREA: 176,
    ATTACK_CENTER: { x: 50, y: 63 },
    IMPACT_CENTER: { x: 50, y: 62 },
    SPECIAL_FOCUS_CENTER: { x: 50, y: 47 },
    minHeight: 150,
    maxHeight: 220,
    stageHeight: 390,
    motionScale: 0.4,
  },
  tablet: {
    PLAYER_POSITION: { x: 26, y: 91 },
    OPPONENT_POSITION: { x: 74, y: 91 },
    GROUND_LINE: 91,
    HUD_SAFE_AREA: 176,
    ATTACK_CENTER: { x: 50, y: 62 },
    IMPACT_CENTER: { x: 50, y: 61 },
    SPECIAL_FOCUS_CENTER: { x: 50, y: 46 },
    minHeight: 210,
    maxHeight: 300,
    stageHeight: 460,
    motionScale: 0.7,
  },
  desktop: {
    PLAYER_POSITION: { x: 27, y: 91 },
    OPPONENT_POSITION: { x: 73, y: 91 },
    GROUND_LINE: 91,
    HUD_SAFE_AREA: 200,
    ATTACK_CENTER: { x: 50, y: 62 },
    IMPACT_CENTER: { x: 50, y: 60 },
    SPECIAL_FOCUS_CENTER: { x: 50, y: 45 },
    minHeight: 240,
    maxHeight: 330,
    stageHeight: 520,
    motionScale: 1,
  },
};
export const ARENA_LAYERS = {
  background: 0,
  environment: 1,
  ground: 2,
  fighters: 3,
  weaponEffect: 4,
  combatText: 5,
  hud: 6,
  cinematic: 7,
} as const;
export const ARENA_FACING = { player: 1, opponent: -1 } as const;
type Motion = Readonly<{
  anticipation: number;
  execution: number;
  impact: number;
  recovery: number;
  cameraZoom: number;
  cameraPan: number;
  shakeStrength: number;
  fighterTravel: number;
  hitReaction: number;
}>;
// Timings preserve TASK-0040 totals (520/680/760/620/650 ms) and impact at 120ms.
export const ARENA_ANIMATION: Readonly<
  Record<'player' | ArenaProfile, Motion>
> = {
  player: {
    anticipation: 70,
    execution: 50,
    impact: 330,
    recovery: 200,
    cameraZoom: 1.01,
    cameraPan: 1,
    shakeStrength: 2,
    fighterTravel: 18,
    hitReaction: 9,
  },
  agile: {
    anticipation: 70,
    execution: 50,
    impact: 200,
    recovery: 200,
    cameraZoom: 1.006,
    cameraPan: 0.5,
    shakeStrength: 1,
    fighterTravel: 12,
    hitReaction: 6,
  },
  offensive: {
    anticipation: 70,
    execution: 50,
    impact: 360,
    recovery: 200,
    cameraZoom: 1.015,
    cameraPan: 2,
    shakeStrength: 3,
    fighterTravel: 24,
    hitReaction: 10,
  },
  guardian: {
    anticipation: 70,
    execution: 50,
    impact: 440,
    recovery: 200,
    cameraZoom: 1.008,
    cameraPan: 0.5,
    shakeStrength: 2,
    fighterTravel: 10,
    hitReaction: 5,
  },
  tactical: {
    anticipation: 70,
    execution: 50,
    impact: 300,
    recovery: 200,
    cameraZoom: 1.008,
    cameraPan: 1,
    shakeStrength: 1,
    fighterTravel: 15,
    hitReaction: 7,
  },
};
export const ARENA_CINEMATIC = {
  anticipation: 350,
  execution: 350,
  impact: 600,
  recovery: 200,
  overlayOpacity: 0.14,
  titleDuration: 700,
  cameraScale: 1.024,
  impactStrength: 1.25,
  fxIntensity: 0.8,
  returnDuration: 200,
} as const;
export const ARENA_REDUCED = {
  anticipation: 50,
  execution: 50,
  impact: 150,
  recovery: 200,
  victoryPause: 300,
} as const;
export const ARENA_FEEDBACK = {
  combatTextDuration: 650,
  focusPulse: 320,
  focusSpend: 180,
  rewardEnter: 480,
  unlockEnter: 600,
  coinDelay: 220,
  unlockDelay: 440,
  victoryPause: 300,
} as const;
export function arenaMotion(profile?: ArenaProfile): Motion {
  return ARENA_ANIMATION[profile ?? 'player'];
}
export function arenaEventTiming(
  profile?: ArenaProfile,
  special = false,
  reduced = false,
) {
  const t = reduced
    ? ARENA_REDUCED
    : special
      ? ARENA_CINEMATIC
      : arenaMotion(profile);
  return {
    executionAt: t.anticipation,
    impactAt: t.anticipation + t.execution,
    recoveryAt: t.anticipation + t.execution + t.impact,
    duration: t.anticipation + t.execution + t.impact + t.recovery,
  };
}
export function arenaStageVariables(layout?: ArenaViewport): CSSProperties {
  const vars: Record<string, string | number> = {};
  for (const [size, c] of Object.entries(ARENA_COMPOSITION)) {
    for (const [key, value] of Object.entries({
      'player-x': c.PLAYER_POSITION.x + '%',
      'opponent-x': c.OPPONENT_POSITION.x + '%',
      ground: c.GROUND_LINE + '%',
      'hud-safe': c.HUD_SAFE_AREA + 'px',
      'attack-x': c.ATTACK_CENTER.x + '%',
      'attack-y': c.ATTACK_CENTER.y + '%',
      'impact-x': c.IMPACT_CENTER.x + '%',
      'impact-y': c.IMPACT_CENTER.y + '%',
      'special-x': c.SPECIAL_FOCUS_CENTER.x + '%',
      'special-y': c.SPECIAL_FOCUS_CENTER.y + '%',
      'fighter-min': c.minHeight + 'px',
      'fighter-max': c.maxHeight + 'px',
      height: c.stageHeight + 'px',
      'motion-scale': c.motionScale,
    })) {
      vars[`--${size}-${key}`] = value;
      if (layout === size)
        vars[`--${key === 'height' ? 'stage-height' : key}`] = value;
    }
  }
  for (const [layer, value] of Object.entries(ARENA_LAYERS))
    vars[`--layer-${layer}`] = value;
  vars['--cinematic-opacity'] = ARENA_CINEMATIC.overlayOpacity;
  vars['--cinematic-title-duration'] = ARENA_CINEMATIC.titleDuration + 'ms';
  vars['--cinematic-camera'] = ARENA_CINEMATIC.cameraScale;
  vars['--fx-intensity'] = ARENA_CINEMATIC.fxIntensity;
  vars['--cinematic-impact-strength'] = ARENA_CINEMATIC.impactStrength;
  vars['--cinematic-return'] = ARENA_CINEMATIC.returnDuration + 'ms';
  vars['--text-duration'] = ARENA_FEEDBACK.combatTextDuration + 'ms';
  vars['--reward-enter'] = ARENA_FEEDBACK.rewardEnter + 'ms';
  vars['--coin-delay'] = ARENA_FEEDBACK.coinDelay + 'ms';
  vars['--unlock-delay'] = ARENA_FEEDBACK.unlockDelay + 'ms';
  vars['--unlock-enter'] = ARENA_FEEDBACK.unlockEnter + 'ms';
  return vars as CSSProperties;
}
export function arenaFighterVariables(
  profile: ArenaProfile | undefined,
  side: 'player' | 'opponent',
): CSSProperties {
  const m = arenaMotion(profile),
    facing = ARENA_FACING[side];
  return {
    '--facing': facing,
    '--fighter-travel': `${m.fighterTravel * facing}px`,
    '--hit-reaction': `${-m.hitReaction * facing}px`,
    '--motion-recovery': `${m.recovery}ms`,
    '--camera-zoom': m.cameraZoom,
    '--camera-pan': `${m.cameraPan * facing}px`,
    '--shake-strength': `${m.shakeStrength}px`,
  } as CSSProperties;
}
