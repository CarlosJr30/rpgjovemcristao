import { expect, test } from 'vitest';
import { SnakeInput } from './components/snake-input';
import {
  moveWithCollision,
  normalizeInput,
  PLAYER_SPAWN,
} from './components/snake-game-engine';

test('hold, troca, dois dedos e release não deixam direção presa', () => {
  const input = new SnakeInput();
  input.pointer(1, 'arrowup');
  input.pointer(2, 'arrowright');
  expect(normalizeInput(input.axis()).x).toBeCloseTo(Math.SQRT1_2);
  expect(normalizeInput(input.axis()).y).toBeCloseTo(-Math.SQRT1_2);
  input.pointer(1, 'arrowdown');
  expect(input.axis()).toEqual({ x: 1, y: 1 });
  input.pointer(2, null);
  expect(input.axis()).toEqual({ x: 0, y: 1 });
  input.pointer(1, null);
  expect(input.axis()).toEqual({ x: 0, y: 0 });
});

test('soltar dedo preserva outro dedo e teclado na mesma direção', () => {
  const input = new SnakeInput();
  input.key('D', true);
  input.pointer(1, 'arrowright');
  input.pointer(2, 'arrowright');
  input.pointer(1, null);
  input.key('D', false);
  expect(input.axis()).toEqual({ x: 1, y: 0 });
  input.pointer(2, null);
  expect(input.axis()).toEqual({ x: 0, y: 0 });
});

test('entrada move o jogador real e suspender cancela todas as fontes', () => {
  const input = new SnakeInput();
  input.pointer(1, 'arrowright');
  const direction = input.axis();
  const moved = moveWithCollision(
    PLAYER_SPAWN,
    { x: direction.x * 120, y: direction.y * 120 },
    0.1,
  );
  expect(moved.x).toBeGreaterThan(PLAYER_SPAWN.x);
  input.key('w', true);
  input.clear();
  expect(moveWithCollision(moved, input.axis(), 0.1)).toEqual(moved);
});
