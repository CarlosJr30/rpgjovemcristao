import { describe, expect, it } from 'vitest';
import { movePoint, pointIsNear } from './creation-explorer-model';

describe('movement and interaction geometry', () => {
  it('keeps the traveler inside scene bounds', () => {
    expect(movePoint({ x: 18, y: 50 }, { x: -12, y: 50 })).toEqual({
      x: 9,
      y: 50,
    });
    expect(
      movePoint({ x: 18, y: 50 }, { x: 18, y: 0 }).y,
    ).toBeGreaterThanOrEqual(22);
  });

  it('blocks crossing the barrier along a long movement segment', () => {
    const result = movePoint({ x: 20, y: 50 }, { x: 80, y: 50 });
    expect(result.x).toBeLessThan(42);
    expect(result.y).toBe(50);
  });

  it('allows a path around the barrier and detects nearby points', () => {
    const upper = movePoint({ x: 20, y: 25 }, { x: 80, y: 25 });
    expect(upper).toEqual({ x: 80, y: 25 });
    expect(pointIsNear({ x: 70, y: 50 }, { x: 78, y: 50 })).toBe(true);
    expect(pointIsNear({ x: 20, y: 50 }, { x: 78, y: 50 })).toBe(false);
  });
});
