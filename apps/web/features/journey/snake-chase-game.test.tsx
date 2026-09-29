// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getSnakeRenderProfile, SnakeChaseGame } from './components/snake-chase-game';

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
  render(<SnakeChaseGame portrait={{ imageUrl: '/assets/avatar/runtime/male/male_short_moss_light.png', source: { x: 150, y: 0, width: 212, height: 205 } }} tutorialCompleted={false} onTutorialComplete={vi.fn()} onComplete={vi.fn()} />);

  expect(screen.getByText('Fuga da Serpente')).toBeVisible();
  expect(screen.getByText(/Encontre 3 Fragmentos de Sabedoria/)).toBeVisible();
  expect(screen.getAllByText(/SABEDORIA/).length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(/LUZ/)).toBeVisible();
  expect(screen.queryByText(/maçã/i)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mover para cima' })).toBeVisible();
});

test('começa sem concluir a fase ou conceder progresso automaticamente', () => {
  const onComplete = vi.fn();
  render(<SnakeChaseGame portrait={{ imageUrl: '/assets/avatar/runtime/female/female_long_ochre_medium.png', source: { x: 150, y: 0, width: 212, height: 205 } }} tutorialCompleted onTutorialComplete={vi.fn()} onComplete={onComplete} />);

  fireEvent.click(screen.getByRole('button', { name: 'Começar perseguição' }));

  expect(screen.queryByRole('button', { name: 'Começar perseguição' })).not.toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});

test('centraliza zoom e escala visual por viewport sem alterar o desktop', () => {
  expect(getSnakeRenderProfile(390, 844)).toEqual({ mode: 'mobile-portrait', zoom: 1.4, actorScale: 1.2, pickupScale: 1.16 });
  expect(getSnakeRenderProfile(844, 390)).toEqual({ mode: 'mobile-landscape', zoom: 1.25, actorScale: 1.15, pickupScale: 1.15 });
  expect(getSnakeRenderProfile(768, 1024)).toEqual({ mode: 'tablet', zoom: 1.3, actorScale: 1.15, pickupScale: 1.12 });
  expect(getSnakeRenderProfile(1440, 900)).toEqual({ mode: 'desktop', zoom: 1, actorScale: 1, pickupScale: 1 });
});
