export type Point = { x: number; y: number };

export const CREATION_DAYS = [
  'Luz e trevas',
  'Firmamento',
  'Terra e vegetação',
  'Luminares',
  'Aves e criaturas das águas',
  'Animais terrestres e humanidade',
  'Descanso e reflexão',
] as const;

const BARRIER = { left: 44, right: 56, top: 34, bottom: 68 };
const RADIUS = 2.5;

function blocked({ x, y }: Point) {
  return (
    x < 9 ||
    x > 91 ||
    y < 22 ||
    y > 94 ||
    (x >= BARRIER.left - RADIUS &&
      x <= BARRIER.right + RADIUS &&
      y >= BARRIER.top - RADIUS &&
      y <= BARRIER.bottom + RADIUS)
  );
}

export function movePoint(from: Point, to: Point): Point {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / 1.5));
  let current = from;
  for (let step = 1; step <= steps; step += 1) {
    const candidate = {
      x: from.x + ((to.x - from.x) * step) / steps,
      y: from.y + ((to.y - from.y) * step) / steps,
    };
    if (blocked(candidate)) break;
    current = candidate;
  }
  return current;
}

export function pointIsNear(from: Point, to: Point, radius = 14) {
  return Math.hypot(to.x - from.x, to.y - from.y) <= radius;
}
