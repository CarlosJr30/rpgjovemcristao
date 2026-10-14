// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  getMapFit,
  getSnakeRenderProfile,
  SnakeChaseGame,
} from './components/snake-chase-game';

beforeEach(() => {
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    {} as CanvasRenderingContext2D,
  );
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    }),
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('HD portrait decode error and wrong dimensions retry only the own legacy source', () => {
  const loaded: HTMLImageElement[] = [];
  class FakeImage {
    src = '';
    naturalWidth = 0;
    naturalHeight = 0;
    onerror?: () => void;
    onload?: () => void;
    constructor() {
      loaded.push(this as unknown as HTMLImageElement);
    }
  }
  vi.stubGlobal('Image', FakeImage);
  const imageUrl = '/assets/avatar/hd/female/female_short_moss_dark_hd.png';
  const legacy = '/assets/avatar/runtime/female/female_short_moss_dark.png';
  const { unmount } = render(
    <SnakeChaseGame
      portrait={{
        imageUrl,
        source: { x: 300, y: 0, width: 424, height: 410 },
        fallback: {
          imageUrl: legacy,
          source: { x: 150, y: 0, width: 212, height: 205 },
        },
      }}
      tutorialCompleted
      onTutorialComplete={vi.fn()}
      onComplete={vi.fn()}
    />,
  );
  const player = loaded.find((image) => image.src === imageUrl)!;
  expect(player).toBeDefined();
  player.onerror?.(new Event('error'));
  expect(player.src).toBe(legacy);
  player.onerror?.(new Event('error'));
  expect(player.src).toBe(legacy);
  player.src = imageUrl;
  player.onload?.(new Event('load'));
  expect(player.src).toBe(legacy);
  unmount();
  player.src = imageUrl;
  player.onerror?.(new Event('error'));
  expect(player.src).toBe(imageUrl);
});

test('introdução apresenta objetivo e início sem HUD ou controles ativos; tutorial tem duas etapas', () => {
  render(
    <SnakeChaseGame
      portrait={{
        imageUrl: '/assets/avatar/runtime/male/male_short_moss_light.png',
        source: { x: 150, y: 0, width: 212, height: 205 },
      }}
      tutorialCompleted={false}
      onTutorialComplete={vi.fn()}
      onComplete={vi.fn()}
    />,
  );

  expect(screen.getByText('Fuga da Serpente')).toBeVisible();
  expect(screen.getByText(/Encontre 3 Fragmentos de Sabedoria/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Começar' })).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Mover para cima' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Como jogar' }));
  expect(screen.getByText('Etapa 1 de 2')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
  expect(screen.getByText('Etapa 2 de 2')).toBeVisible();
  expect(screen.getByText(/Fragmentos de Luz valem pontos/)).toBeVisible();
  expect(screen.queryByText(/maçã/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('começa sem concluir a fase ou conceder progresso automaticamente', () => {
  const onComplete = vi.fn();
  render(
    <SnakeChaseGame
      portrait={{
        imageUrl: '/assets/avatar/runtime/female/female_long_ochre_medium.png',
        source: { x: 150, y: 0, width: 212, height: 205 },
      }}
      tutorialCompleted
      onTutorialComplete={vi.fn()}
      onComplete={onComplete}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Começar' }));

  expect(
    screen.queryByRole('button', { name: 'Começar' }),
  ).not.toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});

test('remove camera follow responsiva e preserva escalas visuais independentes', () => {
  expect(getSnakeRenderProfile(390, 844)).toEqual({
    mode: 'mobile-portrait',
    cameraFollow: true,
    actorScale: 1.2,
    pickupScale: 1.16,
  });
  expect(getSnakeRenderProfile(844, 390)).toEqual({
    mode: 'mobile-landscape',
    cameraFollow: true,
    actorScale: 1.2,
    pickupScale: 1.16,
  });
  expect(getSnakeRenderProfile(768, 1024)).toEqual({
    mode: 'tablet',
    cameraFollow: true,
    actorScale: 1.2,
    pickupScale: 1.16,
  });
  expect(getSnakeRenderProfile(1440, 900)).toEqual({
    mode: 'desktop',
    cameraFollow: false,
    actorScale: 1,
    pickupScale: 1,
  });
});

test('enquadra e centraliza o mapa inteiro sem distorcer', () => {
  expect(getMapFit(360, 420)).toEqual({
    scale: 360 / 864,
    offsetX: 0,
    offsetY: 105,
    width: 360,
    height: 210,
  });
  expect(getMapFit(650, 270)).toEqual({
    scale: 270 / 504,
    offsetX: (650 - (864 * 270) / 504) / 2,
    offsetY: 0,
    width: (864 * 270) / 504,
    height: 270,
  });
});

test('pausa, retoma e sai sem concluir a fase ou registrar recompensa', () => {
  const onComplete = vi.fn();
  render(
    <SnakeChaseGame
      portrait={{
        imageUrl: '/assets/avatar/runtime/male/male_short_moss_light.png',
        source: { x: 150, y: 0, width: 212, height: 205 },
      }}
      tutorialCompleted
      onTutorialComplete={vi.fn()}
      onComplete={onComplete}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Começar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
  expect(screen.getByRole('dialog', { name: 'Partida pausada' })).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Mover para cima' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar partida' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mover para cima' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: /^Sair$/ }));
  expect(onComplete).not.toHaveBeenCalled();
});

test('fullscreen indisponível mantém o jogo e a alternativa de direcional', () => {
  render(
    <SnakeChaseGame
      portrait={{
        imageUrl: '/assets/avatar/runtime/male/male_short_moss_light.png',
        source: { x: 150, y: 0, width: 212, height: 205 },
      }}
      tutorialCompleted
      onTutorialComplete={vi.fn()}
      onComplete={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Começar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Entrar em tela cheia' }));
  expect(screen.getByText(/Tela cheia indisponível/)).toBeVisible();
  const toggle = screen.getByRole('button', { name: 'Direcional' });
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Pausar' })).toBeEnabled();
});
