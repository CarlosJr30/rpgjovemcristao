import type { EquipmentSlot } from '../domain/traveler';
import {
  BODY_ANCHORS,
  type BodyType,
  type NormalizedPoint,
} from './bodyAnchors';

export const EQUIP_ANIMATION_TIMING = {
  fly: 440,
  impact: 120,
  reveal: 180,
  leave: 120,
} as const;
export const EQUIP_FLIGHT_DURATION =
  EQUIP_ANIMATION_TIMING.fly + EQUIP_ANIMATION_TIMING.impact;
type Rect = { left: number; top: number; width: number; height: number };
export type IconFlight = {
  src: string;
  slot: EquipmentSlot;
  x: number;
  y: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
  arc: number;
  midDx: number;
  midDy: number;
  targetX: number;
  targetY: number;
};

export function equipmentAnimationAnchor(
  body: BodyType,
  slot: EquipmentSlot,
): NormalizedPoint {
  const anchors = BODY_ANCHORS[body];
  if (slot === 'boots')
    return {
      x: (anchors.leftFoot.x + anchors.rightFoot.x) / 2,
      y: (anchors.leftFoot.y + anchors.rightFoot.y) / 2,
    };
  const anchor = {
    helmet: 'head',
    armor: 'torso',
    weapon: 'rightHand',
    shield: 'leftHand',
    amulet: 'chest',
  } as const;
  return anchors[anchor[slot]];
}

// Rectangles are captured once by the caller. No frame performs layout reads.
export function iconFlightGeometry(
  source: Rect,
  target: Rect,
  body: BodyType,
  slot: EquipmentSlot,
  viewport: { width: number; height: number },
): Omit<IconFlight, 'src' | 'slot'> | null {
  if (
    ![
      source.left,
      source.top,
      source.width,
      source.height,
      target.left,
      target.top,
      target.width,
      target.height,
      viewport.width,
      viewport.height,
    ].every(Number.isFinite) ||
    source.width <= 0 ||
    source.height <= 0 ||
    target.width <= 0 ||
    target.height <= 0 ||
    viewport.width <= 0 ||
    viewport.height <= 0
  )
    return null;
  const anchor = equipmentAnimationAnchor(body, slot);
  const mobile = viewport.width < 768;
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
  const sizeRatio = Math.min(1, 80 / source.width, 80 / source.height);
  const width = source.width * sizeRatio,
    height = source.height * sizeRatio;
  const sourceX = clamp(
    source.left + source.width / 2,
    width / 2,
    viewport.width - width / 2,
  );
  const sourceY = clamp(
    source.top + source.height / 2,
    height / 2,
    viewport.height - height / 2,
  );
  // Offscreen endpoints get a directional arrival at the viewport edge.
  // Its real overlay still reveals in the original, untouched avatar container.
  const targetX = clamp(
    target.left + target.width * anchor.x,
    20,
    viewport.width - 20,
  );
  const targetY = clamp(
    target.top + target.height * anchor.y,
    20,
    viewport.height - 20,
  );
  const x = sourceX - width / 2,
    y = sourceY - height / 2;
  const dx = targetX - sourceX,
    dy = targetY - sourceY;
  const arc = Math.min(
    mobile ? 28 : 64,
    Math.max(12, Math.hypot(dx, dy) * 0.12),
  );
  return {
    x,
    y,
    width,
    height,
    dx,
    dy,
    targetX,
    targetY,
    arc,
    midDx: dx * 0.45,
    // Near the viewport edge the arc bends inward instead of leaving the screen.
    midDy:
      clamp(
        sourceY + dy * 0.45 - arc,
        height * 0.53 + 8,
        viewport.height - height * 0.53 - 8,
      ) - sourceY,
  };
}
