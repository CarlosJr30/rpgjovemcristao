// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { SnakeChaseGame } from './components/snake-chase-game';

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('apresenta objetivo, HUD e controles antes de iniciar a perseguição', () => {
  render(<SnakeChaseGame portrait={{ imageUrl: '/assets/avatar/runtime/male/male_short_moss_light.png', source: { x: 150, y: 0, width: 212, height: 205 } }} onComplete={vi.fn()} />);

  expect(screen.getByText('Fuga da Serpente')).toBeVisible();
  expect(screen.getByText(/Explore o Jardim, reúna 3 Fragmentos/)).toBeVisible();
  expect(screen.getByText('FRAGMENTOS')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Mover para cima' })).toBeVisible();
});

test('começa sem concluir a fase ou conceder progresso automaticamente', () => {
  const onComplete = vi.fn();
  render(<SnakeChaseGame portrait={{ imageUrl: '/assets/avatar/runtime/female/female_long_ochre_medium.png', source: { x: 150, y: 0, width: 212, height: 205 } }} onComplete={onComplete} />);

  fireEvent.click(screen.getByRole('button', { name: 'Começar perseguição' }));

  expect(screen.queryByRole('button', { name: 'Começar perseguição' })).not.toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});
