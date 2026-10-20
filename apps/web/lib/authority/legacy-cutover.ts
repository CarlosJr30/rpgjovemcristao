import type { Traveler } from '../../features/journey/domain/traveler';
export const ECONOMY_TRANSITION_NOTICE =
  'Economia online pausada até validação autoritativa. Nenhuma concessão local será sincronizada.';
/** UX guard only; database ACLs independently enforce the boundary. */
export function hasEconomicChange(a: Traveler, b: Traveler): boolean {
  const fields = (t: Traveler) => [
    t.id,
    t.level,
    t.xp,
    t.coins,
    t.attributes,
    t.inventory,
    t.equipped,
    t.chests,
    t.chestSources,
    t.chestHistory,
    t.chestOperationIds,
  ];
  return JSON.stringify(fields(a)) !== JSON.stringify(fields(b));
}
