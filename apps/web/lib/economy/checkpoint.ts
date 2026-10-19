import type { Traveler } from '../../features/journey/domain/traveler';

/** Checkpoints may change presentation/progress; resources require a server command. */
export function sameEconomicResources(
  previous: Traveler,
  next: Traveler,
): boolean {
  const resources = (value: Traveler) =>
    JSON.stringify({
      xp: value.xp,
      level: value.level,
      coins: value.coins,
      attributes: value.attributes,
      inventory: value.inventory
        .map((item) => [item.id, item.quantity ?? 1])
        .sort(),
    });
  return previous.id === next.id && resources(previous) === resources(next);
}
