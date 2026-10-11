import { expect, test } from 'vitest';
import { getSnakeView, SnakeRenderQuality } from './components/snake-camera';
import { SnakeSwipe, SnakeSteering } from './components/snake-swipe';
import {
  CELL_SIZE,
  GAME_WIDTH,
  GAME_HEIGHT,
  cellCenter,
  moveWithCollision,
  isBlocked,
  PLAYER_MAX_SPEED,
} from './components/snake-game-engine';

test('render quality keeps fast/mobile and desktop resolution, ignores pause gaps, and only lowers backing DPR after sustained slow frames', () => {
  const q = new SnakeRenderQuality();
  for (let i = 0; i < 20; i++) q.observe(16.7, true);
  expect(q.dpr(3)).toBe(2);
  for (let i = 0; i < 20; i++) q.observe(140, false);
  expect(q.dpr(3)).toBe(2);
  for (let i = 0; i < 9; i++) q.observe(140, true);
  expect(q.dpr(3)).toBe(2);
  q.observe(300, true);
  q.observe(140, true);
  expect(q.dpr(3)).toBe(2);
  for (let i = 0; i < 9; i++) q.observe(140, true);
  expect(q.dpr(3)).toBe(1);
  q.reset();
  expect(q.dpr(3)).toBe(2);
  expect(q.dpr(0.5)).toBe(1);
});

test.each([
  [312, 430],
  [382, 690],
  [832, 263],
  [756, 850],
])('camera fills %s×%s without revealing outside the map', (width, height) => {
  for (const player of [
    { x: 0, y: 0 },
    { x: GAME_WIDTH, y: GAME_HEIGHT },
    cellCenter({ col: 11, row: 7 }),
  ]) {
    const view = getSnakeView(width, height, player, null, true, false, 0.016);
    expect(view.scale * CELL_SIZE).toBeGreaterThanOrEqual(40);
    expect(view.offsetX).toBeLessThanOrEqual(0);
    expect(view.offsetY).toBeLessThanOrEqual(0);
    expect(view.offsetX + view.width).toBeGreaterThanOrEqual(width - 0.001);
    expect(view.offsetY + view.height).toBeGreaterThanOrEqual(height - 0.001);
    expect(view.camera.x).toBeGreaterThanOrEqual(0);
    expect(view.camera.y).toBeGreaterThanOrEqual(0);
  }
});
test('camera centers when possible, follows smoothly, snaps under reduced motion and preserves desktop fit', () => {
  const player = { x: 500, y: 250 };
  const target = getSnakeView(390, 400, player, null, true, false, 0.016);
  expect(target.offsetX + player.x * target.scale).toBeCloseTo(195);
  const previous = { x: 0, y: 0 },
    smooth = getSnakeView(390, 400, player, previous, true, false, 0.016);
  expect(smooth.camera.x).toBeGreaterThan(0);
  expect(smooth.camera.x).toBeLessThan(target.camera.x);
  expect(
    getSnakeView(390, 400, player, previous, true, true, 0.016).camera,
  ).toEqual(target.camera);
  const desktop = getSnakeView(864, 504, player, null, false, false, 0.016);
  expect(desktop.scale).toBe(1);
  expect(desktop.camera).toEqual(previous);
});
test.each([
  [0, -40, 'arrowup'],
  [0, 40, 'arrowdown'],
  [-40, 0, 'arrowleft'],
  [40, 0, 'arrowright'],
  [35, 30, 'arrowright'],
])('dominant swipe %s,%s gives one command', (x, y, direction) => {
  const swipe = new SnakeSwipe();
  expect(swipe.start(1, { x: 100, y: 100 })).toBe(true);
  expect(swipe.move(1, { x: 100 + Number(x), y: 100 + Number(y) })).toBe(
    direction,
  );
  expect(swipe.move(1, { x: 100 + Number(x), y: 100 + Number(y) })).toBeNull();
});
test('short touch, continuous corners, second finger and cancellation are safe', () => {
  const swipe = new SnakeSwipe();
  swipe.start(1, { x: 0, y: 0 });
  expect(swipe.start(2, { x: 0, y: 0 })).toBe(false);
  expect(swipe.move(1, { x: 8, y: 8 })).toBeNull();
  expect(swipe.move(2, { x: 40, y: 0 })).toBeNull();
  expect(swipe.move(1, { x: 40, y: 0 })).toBe('arrowright');
  expect(swipe.move(1, { x: 80, y: 0 })).toBeNull();
  expect(swipe.move(1, { x: 80, y: -40 })).toBe('arrowup');
  swipe.clear();
  expect(swipe.move(1, { x: 80, y: -80 })).toBeNull();
});
test('buffer turns at a legal corridor, expires, and clears on restart', () => {
  const steering = new SnakeSteering();
  let position = cellCenter({ col: 2, row: 6 });
  // Column 2 row 6 is wall: use the adjacent safe corridor to approach its opening.
  position = cellCenter({ col: 1, row: 5 });
  steering.request('arrowright', 0);
  expect(steering.axis(position, 0)).toEqual({ x: 1, y: 0 });
  steering.request('arrowdown', 0.1);
  expect(steering.axis(position, 0.2)).toEqual({ x: 1, y: 0 });
  expect(steering.axis(cellCenter({ col: 3, row: 5 }), 0.3)).toEqual({
    x: 0,
    y: 1,
  });
  steering.clear();
  expect(steering.axis(position, 0.4)).toEqual({ x: 0, y: 0 });
  steering.request('arrowright', 1);
  steering.axis(position, 1);
  steering.request('arrowdown', 1.1);
  expect(steering.axis(cellCenter({ col: 3, row: 5 }), 2)).toEqual({
    x: 1,
    y: 0,
  });
});
test('swipe cannot cross walls; logical collision remains identical at every visual scale', () => {
  const steering = new SnakeSteering();
  steering.request('arrowleft', 0);
  let position = cellCenter({ col: 1, row: 11 });
  for (let frame = 0; frame < 120; frame++) {
    const axis = steering.axis(position, frame / 60);
    position = moveWithCollision(
      position,
      { x: axis.x * PLAYER_MAX_SPEED, y: axis.y * PLAYER_MAX_SPEED },
      1 / 60,
    );
    expect(isBlocked(position)).toBe(false);
    for (const size of [
      [320, 400],
      [915, 260],
    ])
      getSnakeView(size[0], size[1], position, null, true, false, 1 / 60);
  }
  expect(position.x).toBeGreaterThanOrEqual(CELL_SIZE + 6);
});

test('an early buffered corner survives while moving and turns without collision or teleport', () => {
  const steering = new SnakeSteering();
  let position = cellCenter({ col: 1, row: 5 });
  steering.request('arrowright', 0);
  steering.axis(position, 0);
  steering.request('arrowdown', 0.05);
  for (let frame = 0; frame < 50; frame++) {
    const previous = position;
    const axis = steering.axis(position, frame / 60);
    position = moveWithCollision(
      position,
      { x: axis.x * PLAYER_MAX_SPEED, y: axis.y * PLAYER_MAX_SPEED },
      1 / 60,
    );
    expect(isBlocked(position)).toBe(false);
    expect(
      Math.hypot(position.x - previous.x, position.y - previous.y),
    ).toBeLessThanOrEqual(PLAYER_MAX_SPEED / 60 + 0.001);
  }
  expect(position.y).toBeGreaterThan(230);
  expect(position.x).toBeGreaterThanOrEqual(114);
  expect(position.x).toBeLessThanOrEqual(138);
});

test('a valid turn at a corridor edge is not lost while the current direction faces a wall', () => {
  const steering = new SnakeSteering();
  const position = { x: 42, y: 414 };
  steering.request('arrowleft', 0);
  steering.axis(position, 0);
  steering.request('arrowup', 0.1);
  expect(steering.axis(position, 0.2)).toEqual({ x: 0, y: -1 });
  expect(
    isBlocked(
      moveWithCollision(position, { x: 0, y: -PLAYER_MAX_SPEED }, 1 / 60),
    ),
  ).toBe(false);
});
