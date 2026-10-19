'use client';
import { Shell, RequireTraveler } from '../components/shell';
import { CardArena } from '../components/card-arena';
export function CardArenaScreen() {
  return (
    <Shell back="/journey" backLabel="Voltar à Jornada">
      <RequireTraveler>
        {(traveler) => <CardArena traveler={traveler} />}
      </RequireTraveler>
    </Shell>
  );
}
