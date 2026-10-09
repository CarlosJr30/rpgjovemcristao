// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  createBattle,
  resolveRound,
  createArenaBattle,
  resolveArenaRound,
} from '@rpg/game-engine';
import { TRAINING_OPPONENTS } from './data/arena';
import { useBattlePresentation } from './hooks/use-battle-presentation';
import { gameAudio } from './audio/audio-manager';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('golpe real emite ataque e impacto sincronizado; saída cancela impacto', () => {
  const sound = vi.spyOn(gameAudio, 'playEffect');
  const before = createBattle(
    { ...TRAINING_OPPONENTS[0], id: 'p' },
    { ...TRAINING_OPPONENTS[0], id: 'o' },
    2,
  );
  const { result, unmount } = renderHook(useBattlePresentation);
  act(() =>
    result.current.play(before, resolveRound(before, 'attack'), vi.fn()),
  );
  expect(sound).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(70));
  expect(sound).toHaveBeenCalledWith('attack', 0.75);
  expect(sound).not.toHaveBeenCalledWith('player_hit', 0.9);
  act(() => vi.advanceTimersByTime(50));
  expect(sound).toHaveBeenCalledWith('player_hit', 0.9);
  unmount();
  sound.mockClear();
  act(() => vi.runAllTimers());
  expect(sound).not.toHaveBeenCalled();
});
test('rodada toca eventos em ordem, HP só muda no alvo e dupla ação é recusada', () => {
  const before = createBattle(
    { ...TRAINING_OPPONENTS[0], id: 'player' },
    { ...TRAINING_OPPONENTS[0], id: 'opponent' },
    2,
  );
  const after = resolveRound(before, 'attack');
  const complete = vi.fn();
  const { result } = renderHook(useBattlePresentation);
  act(() => {
    expect(result.current.play(before, after, complete)).toBe(true);
    expect(result.current.play(before, after, complete)).toBe(false);
  });
  expect(result.current.busy).toBe(true);
  const first = result.current.event!;
  if (first.amount !== undefined) {
    const side = first.targetId === 'player' ? 'player' : 'opponent';
    expect(result.current.phase).toBe('anticipation');
    expect(result.current.display![side].hp).toBe(before[side].hp);
    act(() => vi.advanceTimersByTime(120));
    expect(result.current.phase).toBe('impact');
    expect(result.current.display![side].hp).toBe(
      Math.max(0, before[side].hp - first.amount),
    );
    expect(
      result.current.display![side === 'player' ? 'opponent' : 'player'].hp,
    ).toBe(before[side === 'player' ? 'opponent' : 'player'].hp);
  }
  act(() => vi.runAllTimers());
  expect(result.current.busy).toBe(false);
  expect(complete).toHaveBeenCalledOnce();
});
test('desmontar cancela conclusão e efeitos pendentes', () => {
  const before = createBattle(TRAINING_OPPONENTS[0], TRAINING_OPPONENTS[1], 2);
  const complete = vi.fn();
  const { result, unmount } = renderHook(useBattlePresentation);
  act(() =>
    result.current.play(before, resolveRound(before, 'attack'), complete),
  );
  unmount();
  act(() => vi.runAllTimers());
  expect(complete).not.toHaveBeenCalled();
});

test('guarda visível acompanha preparação e consumo do golpe, sem antecipar estado final', () => {
  const before = createArenaBattle(
    { ...TRAINING_OPPONENTS[0], id: 'p' },
    { ...TRAINING_OPPONENTS[0], id: 'o', arenaProfile: undefined },
    2,
  );
  const after = resolveArenaRound(before, 'defend');
  const { result } = renderHook(useBattlePresentation);
  act(() => result.current.play(before, after, vi.fn()));
  expect(result.current.display?.player.guard).toBeNull();
  act(() => vi.advanceTimersByTime(120));
  expect(result.current.display?.player.guard).toBe('basic');
  act(() => vi.advanceTimersByTime(600));
  expect(result.current.display?.player.guard).toBeNull();
  expect(result.current.display?.player.hp).toBe(after.player.hp);
});

test('defender emite defesa uma vez na execução, sem repeti-la no impacto bloqueado', () => {
  const sound = vi.spyOn(gameAudio, 'playEffect');
  const before = createArenaBattle(
    { ...TRAINING_OPPONENTS[0], id: 'p' },
    { ...TRAINING_OPPONENTS[0], id: 'o', arenaProfile: undefined },
    2,
  );
  const after = resolveArenaRound(before, 'defend');
  const { result } = renderHook(useBattlePresentation);
  act(() => result.current.play(before, after, vi.fn()));
  expect(sound).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(70));
  expect(sound).toHaveBeenCalledWith('defense', 0.8);
  act(() => vi.runAllTimers());
  expect(
    sound.mock.calls.filter(([effect]) => effect === 'defense'),
  ).toHaveLength(1);
  expect(
    sound.mock.calls.filter(([effect]) => effect === 'player_hit'),
  ).toHaveLength(1);
});

test.each([false, true])(
  'especial tem quatro fases e HP/Foco só no impacto; reduced motion=%s',
  (reduced) => {
    vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
    const base = createArenaBattle(
      {
        ...TRAINING_OPPONENTS[0],
        id: 'p',
        level: 8,
        attributes: { life: 8, strength: 2, defense: 2, wisdom: 20 },
      },
      TRAINING_OPPONENTS[1],
      2,
    );
    const before = { ...base, player: { ...base.player, focusPoints: 3 } };
    const after = resolveArenaRound(before, 'special:path-strike');
    const complete = vi.fn();
    const listener = vi.fn();
    window.addEventListener('rpg:arena-sound', listener);
    const { result } = renderHook(useBattlePresentation);
    act(() => result.current.play(before, after, complete));
    expect(listener).not.toHaveBeenCalled();
    expect(result.current.event?.specialId).toBe('path-strike');
    expect(result.current.phase).toBe('anticipation');
    expect(result.current.display?.opponent.hp).toBe(before.opponent.hp);
    act(() => vi.advanceTimersByTime(reduced ? 50 : 350));
    expect(result.current.phase).toBe('execution');
    expect(listener.mock.calls.map(([event]) => event.detail.kind)).toEqual([
      'special',
    ]);
    act(() => vi.advanceTimersByTime(reduced ? 50 : 350));
    expect(result.current.phase).toBe('impact');
    expect(result.current.display?.opponent.hp).toBe(after.opponent.hp);
    expect(result.current.display?.player.focusPoints).toBe(1);
    act(() => vi.advanceTimersByTime(reduced ? 150 : 600));
    expect(result.current.phase).toBe('recovery');
    expect(listener.mock.calls.map(([event]) => event.detail.kind)).toContain(
      'special',
    );
    act(() => vi.runAllTimers());
    expect(complete).toHaveBeenCalledOnce();
    expect(result.current.busy).toBe(false);
    window.removeEventListener('rpg:arena-sound', listener);
  },
);
