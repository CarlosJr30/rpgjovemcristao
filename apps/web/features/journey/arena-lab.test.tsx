// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ArenaVisualLab } from './dev/arena-visual-lab';
import { arenaLabFixture } from './dev/arena-lab-fixtures';
import { useBattlePresentation } from './hooks/use-battle-presentation';
import { gameAudio } from './audio/audio-manager';
import {
  ArenaFocusMeter,
  ArenaSpecialPanel,
} from './components/arena-specials';
import {
  ARENA_COMPOSITION,
  arenaEventTiming,
  ARENA_LAYERS,
  arenaStageVariables,
} from './data/arenaPresentation';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
test('Lab não escreve localStorage nem toca áudio real ao inspecionar e reproduzir fixtures', async () => {
  localStorage.setItem('sentinel', 'preservar');
  const save = vi.spyOn(Storage.prototype, 'setItem');
  const sound = vi.spyOn(gameAudio, 'playEffect');
  await act(async () => {
    render(<ArenaVisualLab />);
  });
  fireEvent.change(screen.getByLabelText('Estado'), {
    target: { value: 'special' },
  });
  fireEvent.change(screen.getByLabelText('Movimento'), {
    target: { value: 'reduced' },
  });
  vi.useFakeTimers();
  fireEvent.click(screen.getByText('Reproduzir sequência'));
  expect(screen.getByTestId('arena-stage').dataset.phase).toBe('anticipation');
  act(() => vi.advanceTimersByTime(100));
  expect(screen.getByTestId('arena-stage').dataset.phase).toBe('impact');
  act(() => vi.runAllTimers());
  expect(save).not.toHaveBeenCalled();
  expect(sound).not.toHaveBeenCalled();
  expect(localStorage.getItem('sentinel')).toBe('preservar');
});
test.each([false, true])(
  'cancelar preview remove timers e não conclui nem emite efeitos futuros, reduced=%s',
  (reducedMotion) => {
    vi.useFakeTimers();
    const fixture = arenaLabFixture(1, 'special', 'path-strike', 3);
    const sound = vi.fn(),
      complete = vi.fn();
    const { result } = renderHook(() =>
      useBattlePresentation({ reducedMotion, onSound: sound }),
    );
    act(() =>
      result.current.playPreview(
        fixture.before,
        fixture.after,
        fixture.events,
        complete,
      ),
    );
    act(() => result.current.cancel());
    sound.mockClear();
    act(() => vi.runAllTimers());
    expect(result.current.busy).toBe(false);
    expect(sound).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  },
);
test('Escape fecha painel e devolve foco ao acionador', () => {
  const close = vi.fn();
  render(
    <>
      <button id="arena-special-trigger">ESPECIAIS</button>
      <ArenaSpecialPanel
        fighter={arenaLabFixture(0, 'idle', 'basic', 3).before.player}
        busy={false}
        onSelect={vi.fn()}
        onClose={close}
      />
    </>,
  );
  fireEvent.keyDown(screen.getByRole('button', { name: 'Fechar especiais' }), {
    key: 'Escape',
  });
  expect(close).toHaveBeenCalledOnce();
  expect(document.activeElement?.id).toBe('arena-special-trigger');
});
test('Foco ganha e gasta com cleanup, mantendo feedback não invasivo do máximo', () => {
  vi.useFakeTimers();
  const base = arenaLabFixture(0, 'idle', 'basic', 0).before.player;
  const view = render(<ArenaFocusMeter fighter={base} />);
  view.rerender(<ArenaFocusMeter fighter={{ ...base, focusPoints: 3 }} />);
  expect(screen.getByRole('meter').dataset.change).toBe('gain');
  expect(screen.getByText('FOCO CHEIO')).toBeTruthy();
  act(() => vi.advanceTimersByTime(320));
  expect(screen.getByRole('meter').dataset.change).toBeUndefined();
  view.rerender(<ArenaFocusMeter fighter={{ ...base, focusPoints: 1 }} />);
  expect(screen.getByRole('meter').dataset.change).toBe('spend');
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
test('limites de composição preservam piso, proporção e área segura; timings preservam TASK-0040', () => {
  for (const c of Object.values(ARENA_COMPOSITION)) {
    expect(c.PLAYER_POSITION.x).toBeLessThan(50);
    expect(c.OPPONENT_POSITION.x).toBeGreaterThan(50);
    expect(c.PLAYER_POSITION.y).toBe(c.GROUND_LINE);
    expect(c.OPPONENT_POSITION.y).toBe(c.GROUND_LINE);
    expect(c.minHeight).toBeLessThanOrEqual(c.maxHeight);
    expect((c.stageHeight * c.GROUND_LINE) / 100 - c.minHeight).toBeGreaterThan(
      c.HUD_SAFE_AREA,
    );
  }
  expect(arenaStageVariables('mobile')).toMatchObject({
    '--stage-height': '390px',
    '--player-x': '25%',
  });
  expect(arenaEventTiming().duration).toBe(650);
  expect(
    ['agile', 'offensive', 'guardian', 'tactical'].map(
      (p) => arenaEventTiming(p as 'agile').duration,
    ),
  ).toEqual([520, 680, 760, 620]);
  expect(arenaEventTiming(undefined, true).impactAt).toBe(700);
  expect(arenaEventTiming(undefined, true, true).duration).toBe(450);
  expect(Object.values(ARENA_LAYERS)).toEqual(
    [...Object.values(ARENA_LAYERS)].sort((a, b) => a - b),
  );
});
