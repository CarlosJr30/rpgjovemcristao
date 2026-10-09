import { memo } from 'react';
import type { EquipmentSlot, Traveler } from '../domain/traveler';
import { AvatarRuntime } from './avatar-runtime';
// Preserve equipment/cinematic API; there is one compositor.
export const EquippedAvatar = memo(function EquippedAvatar({
  traveler,
  highlightedSlot,
  hidingSlot,
}: {
  traveler: Traveler;
  highlightedSlot?: EquipmentSlot | null;
  hidingSlot?: EquipmentSlot | null;
}) {
  return (
    <AvatarRuntime
      traveler={traveler}
      highlightedSlot={highlightedSlot}
      hidingSlot={hidingSlot}
    />
  );
});
