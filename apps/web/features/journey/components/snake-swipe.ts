import { CELL_SIZE, isBlocked, type Point } from './snake-game-engine';
import type { SnakeDirection } from './snake-input';

export const SWIPE_THRESHOLD = 24;
export const DIRECTION_BUFFER_SECONDS = 0.65;
const axes: Record<SnakeDirection, Point> = {
  arrowup: { x: 0, y: -1 },
  arrowdown: { x: 0, y: 1 },
  arrowleft: { x: -1, y: 0 },
  arrowright: { x: 1, y: 0 },
};

/** One captured pointer, one dominant command per segment; successive corners need no lift. */
export class SnakeSwipe {
  private active: {
    id: number;
    point: Point;
    last: SnakeDirection | null;
  } | null = null;
  constructor(private readonly threshold = SWIPE_THRESHOLD) {}
  start(id: number, point: Point) {
    if (this.active) return false;
    this.active = { id, point, last: null };
    return true;
  }
  owns(id: number) {
    return this.active?.id === id;
  }
  move(id: number, point: Point): SnakeDirection | null {
    const active = this.active;
    if (!active || active.id !== id) return null;
    const dx = point.x - active.point.x,
      dy = point.y - active.point.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < this.threshold) return null;
    const direction =
      Math.abs(dx) >= Math.abs(dy)
        ? dx > 0
          ? 'arrowright'
          : 'arrowleft'
        : dy > 0
          ? 'arrowdown'
          : 'arrowup';
    active.point = point;
    if (active.last === direction) return null;
    active.last = direction;
    return direction;
  }
  end(id: number) {
    if (!this.owns(id)) return false;
    this.active = null;
    return true;
  }
  clear() {
    this.active = null;
  }
}

/** Buffered intent for swipe only. Keyboard and held buttons keep the existing axis semantics. */
export class SnakeSteering {
  private current: SnakeDirection | null = null;
  private queued: { direction: SnakeDirection; expires: number } | null = null;
  request(direction: SnakeDirection, time: number) {
    this.queued = { direction, expires: time + DIRECTION_BUFFER_SECONDS };
  }
  axis(position: Point, time: number): Point {
    if (this.queued && time > this.queued.expires) this.queued = null;
    if (this.queued) {
      const candidate = axes[this.queued.direction];
      const ahead = {
        x: position.x + candidate.x * CELL_SIZE * 0.6,
        y: position.y + candidate.y * CELL_SIZE * 0.6,
      };
      if (!this.current || !isBlocked(ahead)) {
        this.current = this.queued.direction;
        this.queued = null;
      }
    }
    return this.current ? axes[this.current] : { x: 0, y: 0 };
  }
  clear() {
    this.current = null;
    this.queued = null;
  }
}
