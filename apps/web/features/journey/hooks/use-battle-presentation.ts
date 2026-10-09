'use client';
import { useEffect, useRef, useState } from 'react';
import type { BattleState } from '@rpg/game-engine';
import {
  battleFeedback,
  type BattleFeedback,
} from '../data/battlePresentation';
import { emitArenaSound } from '../audio/arena-audio';
import { gameAudio } from '../audio/audio-manager';
import { arenaEventTiming, ARENA_FEEDBACK } from '../data/arenaPresentation';
import type { ArenaSound } from '../audio/arena-audio';

export type CombatPhase = 'anticipation' | 'execution' | 'impact' | 'recovery';
export function useBattlePresentation(options?: {
  reducedMotion?: boolean;
  onSound?: (kind: ArenaSound, abilityId?: string) => void;
}) {
  const [event, setEvent] = useState<BattleFeedback | null>(null);
  const [phase, setPhase] = useState<CombatPhase>('anticipation');
  const [display, setDisplay] = useState<BattleState | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      locked.current = false;
    },
    [],
  );
  const sound = options?.onSound ?? emitArenaSound;
  const cancel = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    locked.current = false;
    setEvent(null);
    setDisplay(null);
    setBusy(false);
  };
  const run = (
    before: BattleState,
    after: BattleState,
    queue: BattleFeedback[],
    complete: () => void,
  ) => {
    if (locked.current || before === after) return false;
    locked.current = true;
    setBusy(true);
    let shown = before;
    const later = (callback: () => void, delay: number) => {
      timers.current.push(setTimeout(callback, delay));
    };
    const advance = (index: number) => {
      const next = queue[index];
      if (!next) {
        setEvent(null);
        setDisplay(null);
        setBusy(false);
        locked.current = false;
        timers.current = [];
        complete();
        return;
      }
      setDisplay(shown);
      setEvent(next);
      setPhase('anticipation');
      const reduced =
        options?.reducedMotion ??
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const actor =
        next.actorId === before.player.snapshot.id
          ? before.player
          : before.opponent;
      const timing = arenaEventTiming(
        actor.snapshot.arenaProfile,
        Boolean(next.specialId),
        reduced,
      );
      const duration = reduced
        ? timing.duration
        : (next.duration ?? timing.duration);
      const impactAt = timing.impactAt;
      later(() => {
        setPhase('execution');
        if (next.specialId) sound('special', next.specialId);
        else if (next.kind === 'effect') {
          if (!options?.onSound) gameAudio.playEffect('equipment');
        } else if (next.kind !== 'focus')
          sound(next.kind === 'defend' ? 'defense' : 'attack');
      }, timing.executionAt);
      later(() => {
        setPhase('impact');
        if (next.amount !== undefined) {
          const side =
            next.targetId === before.player.snapshot.id ? 'player' : 'opponent';
          shown = {
            ...shown,
            [side]: {
              ...shown[side],
              hp: Math.max(0, shown[side].hp - next.amount),
            },
          };
          if (next.amount > 0) sound('impact');
          else sound('dodge');
        }
        if (next.fighterState) {
          const side =
            next.actorId === before.player.snapshot.id ? 'player' : 'opponent';
          shown = {
            ...shown,
            [side]: { ...shown[side], ...next.fighterState },
          };
        } else if (next.focusAfter !== undefined) {
          const side =
            next.actorId === before.player.snapshot.id ? 'player' : 'opponent';
          shown = {
            ...shown,
            [side]: { ...shown[side], focusPoints: next.focusAfter },
          };
        }
        if (next.targetState) {
          const side =
            next.targetId === before.player.snapshot.id ? 'player' : 'opponent';
          shown = { ...shown, [side]: { ...shown[side], ...next.targetState } };
        }
        if (
          !next.specialId &&
          (next.kind === 'focus' || (next.focusDelta ?? 0) > 0)
        )
          sound('focus');
        setDisplay(shown);
      }, impactAt);
      later(() => setPhase('recovery'), timing.recoveryAt);
      later(
        () => advance(index + 1),
        duration +
          (index === queue.length - 1 && after.status === 'finished'
            ? ARENA_FEEDBACK.victoryPause
            : 0),
      );
    };
    advance(0);
    return true;
  };
  const play = (
    before: BattleState,
    after: BattleState,
    complete: () => void,
  ) => run(before, after, battleFeedback(before, after), complete);
  const playPreview = (
    before: BattleState,
    after: BattleState,
    queue: BattleFeedback[],
    complete: () => void,
  ) => run(before, after, queue, complete);
  return { event, phase, display, busy, play, playPreview, cancel };
}
