import { describe, expect, it } from 'vitest';
import { movePoint, pointIsNear } from './creation-explorer-model';

describe('movement and interaction geometry', () => {
  it('keeps the traveler inside scene bounds', () => {
    expect(movePoint({ x: 10, y: 10 }, { x: -20, y: 10 })).toEqual({ x: 2.5, y: 10 });
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
