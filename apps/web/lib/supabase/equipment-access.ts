import { getSupabaseBrowserClient } from './client';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from './online-sync';

export type EquipmentAccess = {
  itemId: string;
  sourceConfirmed: boolean;
  reason: string | null;
};

const reasons = new Set([
  'catalog-unavailable',
  'acquisition-unconfirmed',
  'economy-unverified',
  'equipment-disabled',
  'battle-in-progress',
]);

export function equipmentAccessMessage(reason: string | null | undefined) {
  switch (reason) {
    case 'acquisition-unconfirmed':
      return 'Origem pendente de reconhecimento. Item preservado na Mochila.';
    case 'economy-unverified':
      return 'Este avatar aguarda regularização econômica.';
    case 'equipment-disabled':
      return 'Equipamentos temporariamente indisponíveis.';
    case 'battle-in-progress':
      return 'Encerre o combate antes de trocar equipamentos.';
    case 'catalog-unavailable':
      return 'Este item ainda não está autorizado para equipar.';
    default:
      return 'Autorização não confirmada. Atualize a coleção.';
  }
}

// Only the authenticated server decides provenance. Missing/old responses fail closed.
export async function readEquipmentAccess(
  actor: string,
): Promise<EquipmentAccess[]> {
  const owner = getCurrentOnlineUserId();
  const session = getOnlineSessionRevision();
  const verify = () => {
    if (
      !owner ||
      owner !== getCurrentOnlineUserId() ||
      session !== getOnlineSessionRevision() ||
      !canUseTravelerInCurrentSession(actor)
    )
      throw Error('Retome a conta e o avatar autorizados.');
  };
  verify();
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'get_equipment_access',
    { p_actor: actor },
  );
  verify();
  if (
    error ||
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data.version !== 1 ||
    data.actor !== actor ||
    !Array.isArray(data.items)
  )
    throw Error('Não foi possível consultar a autorização dos equipamentos.');
  const ids = new Set<string>();
  return data.items.map((row) => {
    if (
      !row ||
      typeof row !== 'object' ||
      Array.isArray(row) ||
      typeof row.itemId !== 'string' ||
      typeof row.sourceConfirmed !== 'boolean' ||
      !(
        row.reason === null ||
        (typeof row.reason === 'string' && reasons.has(row.reason))
      ) ||
      ids.has(row.itemId) ||
      (!row.sourceConfirmed && row.reason === null)
    )
      throw Error('Autorização de equipamento inválida.');
    ids.add(row.itemId);
    return {
      itemId: row.itemId,
      sourceConfirmed: row.sourceConfirmed,
      reason: row.reason,
    };
  });
}

// Translate only known server refusals. Never expose arbitrary SQL/error text.
export function equipmentOperationError(error: {
  code?: string;
  message?: string;
}) {
  const message = error.message ?? '';
  if (error.code === '42501') {
    if (message === 'Verified acquisition receipt required')
      return equipmentAccessMessage('acquisition-unconfirmed');
    if (message === 'Verified economic provenance required')
      return equipmentAccessMessage('economy-unverified');
    if (message === 'Item ownership denied')
      return 'Este item não foi encontrado na sua Mochila.';
    if (message === 'Equipment level required')
      return 'Seu nível ainda não permite equipar este item.';
    if (
      message === 'Equipment policy disabled' ||
      message === 'Release scope denied'
    )
      return equipmentAccessMessage('equipment-disabled');
    if (message === 'Equipment slot denied' || message === 'Equipment denied')
      return 'Este item não é autorizado para o slot selecionado.';
    if (message === 'Reviewed equipment required')
      return equipmentAccessMessage('catalog-unavailable');
    return 'A sessão ou o avatar não autorizou esta operação. Retome seu Viajante.';
  }
  if (error.code === 'PT409' || error.code === '40001')
    return message === 'Battle in progress'
      ? equipmentAccessMessage('battle-in-progress')
      : 'O equipamento mudou em outra aba. Atualize a coleção antes de tentar novamente.';
  return 'Não foi possível confirmar a operação. Atualize a coleção para conferir o estado no servidor.';
}
