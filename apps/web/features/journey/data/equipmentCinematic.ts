import type { Equipment, EquipmentSlot, Traveler } from '../domain/traveler';
import { equipmentSwapDelta } from './attributes';
import { travelerBattleSnapshot } from './arena';
import { equipmentAnimationAnchor } from './equipmentAnimation';

export const CINEMATIC_STAGES = [
  'PREPARE',
  'FOCUS',
  'REWARD_REVEAL',
  'FLY_TO_TARGET',
  'EQUIP_CONFIRM',
  'DONE',
] as const;
export type CinematicStage = (typeof CINEMATIC_STAGES)[number];
export type RarityPresentation = {
  label: string;
  color: string;
  duration: number;
  scale: number;
  glow: number;
  particleCount: number;
  impactStrength: number;
  timings: Record<Exclude<CinematicStage, 'DONE'>, number>;
};
function presentation(
  label: string,
  color: string,
  scale: number,
  glow: number,
  particleCount: number,
  impactStrength: number,
  focus: number,
  reward: number,
  fly: number,
  confirm: number,
): RarityPresentation {
  const timings = {
    PREPARE: 40,
    FOCUS: focus,
    REWARD_REVEAL: reward,
    FLY_TO_TARGET: fly,
    EQUIP_CONFIRM: confirm,
  };
  return {
    label,
    color,
    scale,
    glow,
    particleCount,
    impactStrength,
    timings,
    duration: Object.values(timings).reduce((sum, value) => sum + value, 0),
  };
}
// Presentation alias only: the saved/catalog rarity remains "lendário".
export const RARITY_PRESENTATION: Readonly<
  Record<Equipment['rarity'], RarityPresentation>
> = {
  comum: presentation('Comum', '#d7bd82', 1, 0.16, 0, 0.35, 280, 810, 320, 150),
  incomum: presentation(
    'Incomum',
    '#91c590',
    1.03,
    0.22,
    3,
    0.45,
    320,
    930,
    360,
    150,
  ),
  raro: presentation(
    'Raro',
    '#c0d899',
    1.06,
    0.28,
    5,
    0.55,
    360,
    1050,
    400,
    150,
  ),
  épico: presentation(
    'Épico',
    '#dcc591',
    1.09,
    0.34,
    8,
    0.65,
    400,
    1190,
    420,
    150,
  ),
  lendário: presentation(
    'Extraordinário',
    '#ffe1a1',
    1.12,
    0.4,
    12,
    0.75,
    440,
    1330,
    440,
    150,
  ),
};
export const EQUIPMENT_SLOT_LABELS: Readonly<Record<EquipmentSlot, string>> = {
  helmet: 'Elmo',
  armor: 'Armadura',
  weapon: 'Arma',
  shield: 'Escudo',
  boots: 'Botas',
  amulet: 'Medalhão',
};
export function equipmentReward(traveler: Traveler, item: Equipment) {
  const previous = traveler.inventory.find(
    (entry) =>
      entry.id === traveler.equipped[item.slot] && entry.slot === item.slot,
  );
  const after = {
    ...traveler,
    equipped: { ...traveler.equipped, [item.slot]: item.id },
  };
  const beforePower = travelerBattleSnapshot(traveler).combatPower;
  const afterPower = travelerBattleSnapshot(after).combatPower;
  return {
    item,
    previous,
    delta: equipmentSwapDelta(traveler, item),
    beforePower,
    afterPower,
    powerDelta: afterPower - beforePower,
  };
}
export type EquipmentReward = ReturnType<typeof equipmentReward>;
export const signedValue = (value: number) =>
  value > 0 ? `+${value}` : String(value);
type Rect = { x: number; y: number; width: number; height: number };
export type CinematicGeometry = {
  centerX: number;
  centerY: number;
  size: number;
  sourceDx: number;
  sourceDy: number;
  targetX: number;
  targetY: number;
  dx: number;
  dy: number;
  midDx: number;
  midDy: number;
};
export function cinematicGeometry(
  source: Rect | null,
  target: Rect | null,
  body: Traveler['avatar']['gender'],
  slot: EquipmentSlot,
  viewport: { width: number; height: number },
): CinematicGeometry {
  const width = Math.max(1, viewport.width),
    height = Math.max(1, viewport.height);
  const size = width < 600 ? 96 : 136;
  const centerX = width / 2,
    centerY = Math.max(size / 2 + 24, height / 2);
  const valid = (rect: Rect | null): rect is Rect =>
    !!rect &&
    Object.values(rect).every(Number.isFinite) &&
    rect.width > 0 &&
    rect.height > 0;
  const clampX = (x: number) => Math.max(20, Math.min(width - 20, x));
  const clampY = (y: number) => Math.max(20, Math.min(height - 20, y));
  const anchor = equipmentAnimationAnchor(body, slot);
  const targetX = valid(target)
    ? clampX(target.x + target.width * anchor.x)
    : centerX;
  const targetY = valid(target)
    ? clampY(target.y + target.height * anchor.y)
    : centerY;
  const dx = targetX - centerX,
    dy = targetY - centerY;
  const arc = Math.min(
    width < 600 ? 28 : 64,
    Math.max(12, Math.hypot(dx, dy) * 0.12),
  );
  return {
    centerX,
    centerY,
    size,
    sourceDx: valid(source) ? clampX(source.x + source.width / 2) - centerX : 0,
    sourceDy: valid(source)
      ? clampY(source.y + source.height / 2) - centerY
      : 0,
    targetX,
    targetY,
    dx,
    dy,
    midDx: dx * 0.45,
    midDy: clampY(centerY + dy * 0.45 - arc) - centerY,
  };
}
