import type { EquipmentSlot } from '../../features/journey/domain/traveler';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  reloadOnlineTraveler,
} from './online-sync';
import { equipmentRepository } from './repositories/equipment-repository';

// No optimistic economic snapshot or fallback: only a confirmed RPC followed
// by a fresh server read updates the cache consumed by avatar and attributes.
const pending = new Set<string>();
export async function changeOnlineEquipment(
  travelerId: string,
  slot: EquipmentSlot,
  itemId: string | null,
  expectedItemId: string | null,
): Promise<void> {
  const owner = getCurrentOnlineUserId();
  if (!owner || !canUseTravelerInCurrentSession(travelerId))
    throw new Error('Entre novamente na conta deste Viajante.');
  if (pending.has(travelerId))
    throw new Error('Aguarde a confirmação do equipamento.');
  pending.add(travelerId);
  try {
    if (itemId === null)
      await equipmentRepository.unequipItem(travelerId, slot, expectedItemId);
    else
      await equipmentRepository.equipItem(
        travelerId,
        slot,
        itemId,
        expectedItemId,
      );
    if (
      getCurrentOnlineUserId() !== owner ||
      !canUseTravelerInCurrentSession(travelerId)
    )
      throw new Error(
        'A sessão mudou. Retome o Viajante para consultar o equipamento.',
      );
    if (!(await reloadOnlineTraveler(travelerId)))
      throw new Error(
        'O servidor recebeu a operação, mas a leitura não foi confirmada. Atualize para conferir o equipamento.',
      );
  } finally {
    pending.delete(travelerId);
  }
}
