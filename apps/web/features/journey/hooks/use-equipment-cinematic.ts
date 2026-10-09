'use client';
import { useEffect, useRef, useState } from 'react';
import {
  CINEMATIC_STAGES,
  RARITY_PRESENTATION,
  type CinematicGeometry,
  type CinematicStage,
  type EquipmentReward,
} from '../data/equipmentCinematic';

export type CinematicSession = {
  id: number;
  stage: CinematicStage;
  reward: EquipmentReward;
  geometry: CinematicGeometry;
  reducedMotion: boolean;
};
type Request = Omit<CinematicSession, 'id' | 'stage'> & {
  captureTarget: () => CinematicGeometry;
  confirm: () => boolean;
  onStage?: (stage: CinematicStage) => void;
};
export function useEquipmentCinematic() {
  const [session, setSession] = useState<CinematicSession | null>(null);
  const current = useRef<CinematicSession | null>(null);
  const request = useRef<Request | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const committed = useRef(false);
  const clear = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(
    () => () => {
      generation.current++;
      if (timer.current !== null) clearTimeout(timer.current);
      current.current = null;
      request.current = null;
    },
    [],
  );
  const publish = (next: CinematicSession | null) => {
    current.current = next;
    setSession(next);
  };
  const start = (input: Request) => {
    if (current.current && current.current.stage !== 'DONE') return false;
    clear();
    current.current = null;
    const id = ++generation.current;
    request.current = input;
    committed.current = false;
    const advance = (stage: CinematicStage) => {
      if (generation.current !== id) return;
      let geometry = current.current?.geometry ?? input.geometry;
      if (stage === 'FLY_TO_TARGET' && !input.reducedMotion)
        geometry = input.captureTarget();
      if (stage === 'EQUIP_CONFIRM' && !committed.current) {
        committed.current = true;
        if (!input.confirm()) {
          publish(null);
          request.current = null;
          return;
        }
      }
      publish({
        id,
        stage,
        reward: input.reward,
        geometry,
        reducedMotion: input.reducedMotion,
      });
      input.onStage?.(stage);
      if (stage === 'DONE') {
        request.current = null;
        timer.current = setTimeout(() => publish(null), 600);
        return;
      }
      const duration = input.reducedMotion
        ? stage === 'PREPARE'
          ? 120
          : stage === 'REWARD_REVEAL'
            ? 320
            : stage === 'EQUIP_CONFIRM'
              ? 120
              : 0
        : RARITY_PRESENTATION[input.reward.item.rarity].timings[stage];
      const next = CINEMATIC_STAGES[CINEMATIC_STAGES.indexOf(stage) + 1];
      if (duration === 0) advance(next);
      else timer.current = setTimeout(() => advance(next), duration);
    };
    advance('PREPARE');
    return true;
  };
  const skip = () => {
    const active = current.current,
      input = request.current;
    if (!active || active.stage === 'DONE' || !input) return;
    clear();
    generation.current++;
    if (!committed.current) {
      committed.current = true;
      if (!input.confirm()) {
        publish(null);
        request.current = null;
        return;
      }
      input.onStage?.('EQUIP_CONFIRM');
    }
    publish({ ...active, stage: 'DONE' });
    input.onStage?.('DONE');
    request.current = null;
    timer.current = setTimeout(() => publish(null), 600);
  };
  return { session, start, skip, busy: !!session && session.stage !== 'DONE' };
}
