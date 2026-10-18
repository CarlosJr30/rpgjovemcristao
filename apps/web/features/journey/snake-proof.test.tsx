// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SnakeChaseGame } from './components/snake-chase-game';
import { SnakeSteering } from './components/snake-swipe';
import { winningSnakeProof } from '../../lib/economy/testing/journey-fixtures';
import { verifySnakeProof, type SnakeFrame } from './data/snake-replay';
vi.mock('./audio/audio-manager', () => ({
  gameAudio: { setContext: vi.fn(), playEffect: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
test('the unchanged canvas physics emits a winning proof accepted by the server replay', () => {
  const proof = winningSnakeProof();
  let frame: SnakeFrame = proof.frames[0],
    callback: FrameRequestCallback = () => {};
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('innerHeight', 844);
  vi.stubGlobal(
    'Path2D',
    class {
      constructor() {
        return new Proxy(this, { get: () => () => {} });
      }
    },
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => {
    callback = f;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.spyOn(SnakeSteering.prototype, 'axis').mockImplementation(() => ({
    x: frame[1],
    y: frame[2],
  }));
  const gradient = { addColorStop: () => {} };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement) {
      return new Proxy(
        {
          canvas: this,
          createLinearGradient: () => gradient,
          createRadialGradient: () => gradient,
          measureText: () => ({ width: 40 }),
        } as unknown as CanvasRenderingContext2D,
        { get: (target, key) => Reflect.get(target, key) ?? (() => {}) },
      );
    },
  );
  const complete = vi.fn();
  render(
    <SnakeChaseGame
      portrait={{
        imageUrl: '/synthetic-local.png',
        source: { x: 0, y: 0, width: 32, height: 32 },
      }}
      tutorialCompleted
      onTutorialComplete={vi.fn()}
      onComplete={complete}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Começar' }));
  act(() => {
    for (let i = 0; i < proof.frames.length; i++) {
      frame = proof.frames[i];
      callback((i + 1) * 16);
    }
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Continuar para o Quiz →' }),
  );
  expect(complete).toHaveBeenCalledTimes(1);
  expect(verifySnakeProof(complete.mock.calls[0][0])).toBe(true);
});
