import { getSupabaseBrowserClient } from '../supabase/client';
import {
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
  canUseTravelerInCurrentSession,
} from '../supabase/online-sync';
import type {
  Json,
  ChestOperationRow,
  TravelerChestRow,
} from '../supabase/database.types';
import {
  selectedTraining,
  trainingSnapshot,
  trainingEpoch,
  setTraining,
  type TrainingState,
  type TrainingReceipt,
} from './store';
import { uuid } from '../../features/chest-reveal/receipt';

function guard(actor: string) {
  const owner = getCurrentOnlineUserId(),
    session = getOnlineSessionRevision();
  const verify = () => {
    if (
      !owner ||
      owner !== getCurrentOnlineUserId() ||
      session !== getOnlineSessionRevision() ||
      !canUseTravelerInCurrentSession(actor)
    )
      throw Error('Retome a conta e o avatar do treino.');
  };
  verify();
  return { owner: owner!, session, verify };
}
export function activeTraining(actor: string) {
  const b = selectedTraining(actor);
  if (!b) return null;
  const g = guard(actor);
  if (
    b.owner !== g.owner ||
    b.session !== g.session ||
    Date.parse(b.state.expiresAt) <= Date.now()
  )
    throw Error('Treino expirado ou sessão alterada. Retome o modo normal.');
  return b;
}
export function decodeTraining(input: unknown): TrainingState | null {
  const data = input as Json;
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data.version !== 1 ||
    data.qaOnly !== true ||
    typeof data.enabled !== 'boolean'
  )
    throw Error('Resposta do treino não confirmada.');
  if (!data.enabled) return null;
  if (
    !uuid(data.actor) ||
    !uuid(data.activation) ||
    typeof data.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(data.expiresAt)) ||
    !Number.isSafeInteger(data.coins) ||
    Number(data.coins) < 0 ||
    Number(data.coins) > 10000 ||
    !Number.isSafeInteger(data.chests) ||
    Number(data.chests) < 0 ||
    !Number.isSafeInteger(data.revision) ||
    !data.items ||
    typeof data.items !== 'object' ||
    Array.isArray(data.items) ||
    !data.equipped ||
    typeof data.equipped !== 'object' ||
    Array.isArray(data.equipped) ||
    !Array.isArray(data.history)
  )
    throw Error('Estado de treino inválido.');
  const slots: Record<string, string> = {
    'traveler-sword-common': 'weapon',
    'traveler-armor-uncommon': 'armor',
    'traveler-shield-rare': 'shield',
  };
  if (
    Object.entries(data.items).some(
      ([id, n]) => !slots[id] || !Number.isSafeInteger(n) || Number(n) < 1,
    ) ||
    Object.entries(data.equipped).some(
      ([slot, id]) =>
        !['weapon', 'armor', 'shield'].includes(slot) ||
        (id !== null &&
          (typeof id !== 'string' ||
            slots[id] !== slot ||
            !Object.hasOwn(data.items as object, id))),
    )
  )
    throw Error('Equipamento de treino inválido.');
  return data as unknown as TrainingState;
}
export async function readTraining(actor: string) {
  const g = guard(actor);
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'get_training_qa',
    { p_actor: actor },
  );
  g.verify();
  if (error) throw Error('Treino temporariamente indisponível.');
  const value = decodeTraining(data);
  if (value && value.actor !== actor)
    throw Error('Avatar do treino divergente.');
  return value;
}
export async function refreshTraining(actor: string) {
  const b = trainingSnapshot(),
    epoch = trainingEpoch(),
    state = await readTraining(actor);
  const current = trainingSnapshot();
  if (b && current && trainingEpoch() === epoch && current.actor === actor) {
    setTraining(
      state
        ? {
            ...current,
            state:
              state.revision >= current.state.revision ? state : current.state,
          }
        : null,
    );
  }
  return state;
}
export async function commandTraining(
  actor: string,
  command: string,
  payload: Record<string, Json>,
  operation: string,
) {
  const b = activeTraining(actor);
  if (!b) throw Error('Ative o treino isolado antes de continuar.');
  const g = guard(actor);
  const epoch = trainingEpoch();
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'command_training_qa',
    {
      p_actor: actor,
      p_command: command,
      p_payload: payload,
      p_operation_id: operation,
    },
  );
  g.verify();
  if (trainingEpoch() !== epoch)
    throw Error('O contexto mudou. Consulte o recibo no treino original.');
  if (error)
    throw Error(
      'Operação de treino não confirmada. Reenvie a mesma solicitação para consultar o recibo.',
    );
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    (command !== 'open' &&
      (data.version !== 1 || data.qaOnly !== true || !uuid(data.receiptId))) ||
    (command === 'equip' && data.status !== 'equipped') ||
    (command === 'open' &&
      (data.chestType !== 'common' ||
        data.source !== 'training002:' + b.state.activation ||
        ![10, 25].includes(Number(data.coins)) ||
        data.itemId !== (data.coins === 25 ? null : 'traveler-sword-common')))
  )
    throw Error('Recibo de treino incompatível. Consulte a mesma solicitação.');
  await refreshTraining(actor);
  g.verify();
  return data;
}
export function trainingOperation(
  actor: string,
  r: TrainingReceipt,
): ChestOperationRow {
  return {
    id: r.id,
    traveler_id: actor,
    account_id: getCurrentOnlineUserId(),
    created_at: r.createdAt,
    operation_type:
      r.command === 'open'
        ? 'open'
        : r.payload.kind === 'chest'
          ? 'purchase'
          : 'equipment-purchase',
    operation_key:
      (r.command === 'open' ? 'open:' : 'training:') + r.operationId,
    chest_type:
      r.command === 'open' || r.payload.kind === 'chest' ? 'common' : null,
    source: 'training002:' + trainingSnapshot()?.state.activation,
    rewards:
      r.command === 'purchase' && r.payload.kind === 'equipment'
        ? { ...r.result, itemId: r.payload.offer }
        : r.result,
    price_paid: Number(r.result.pricePaid ?? 0),
    identity_key: null,
  } as unknown as ChestOperationRow;
}
export async function readTrainingReceipt(actor: string, operation: string) {
  const g = guard(actor);
  const { data, error } = await getSupabaseBrowserClient().rpc(
    'get_training_qa_receipt',
    { p_actor: actor, p_operation_id: operation },
  );
  g.verify();
  if (error) throw Error('Recibo de treino não confirmado.');
  if (
    data &&
    (typeof data !== 'object' ||
      Array.isArray(data) ||
      data.operationId !== operation ||
      !uuid(data.id))
  )
    throw Error('Recibo de treino divergente.');
  return data
    ? trainingOperation(actor, data as unknown as TrainingReceipt)
    : null;
}
export async function trainingHistory(actor: string) {
  const state = await refreshTraining(actor);
  if (!state) throw Error('Treino indisponível.');
  return state.history
    .filter((r) => r.command === 'purchase' || r.command === 'open')
    .map((r) => trainingOperation(actor, r));
}
export async function trainingChests(
  actor: string,
): Promise<TravelerChestRow[]> {
  const s = await refreshTraining(actor);
  if (!s) throw Error('Treino indisponível.');
  return s.chests
    ? [
        {
          traveler_id: actor,
          chest_type: 'common',
          quantity: s.chests,
          sources: ['shop001c:training002:' + s.activation],
          created_at: s.expiresAt,
        } as TravelerChestRow,
      ]
    : [];
}
export async function changeTrainingEquipment(
  actor: string,
  slot: string,
  itemId: string | null,
) {
  const b = activeTraining(actor);
  if (!b) throw Error('Treino indisponível.');
  const key = `rpg:training002:equip:${b.owner}:${actor}:${b.state.activation}`;
  if (!navigator.locks?.request)
    throw Error('Este navegador não oferece coordenação segura.');
  await navigator.locks.request(key, { mode: 'exclusive' }, async () => {
    const saved = localStorage.getItem(key);
    const intent = saved
      ? JSON.parse(saved)
      : {
          id: crypto.randomUUID(),
          payload: {
            slot,
            itemId,
            expectedItemId: b.state.equipped[slot] ?? null,
          },
        };
    if (
      !uuid(intent.id) ||
      intent.payload.slot !== slot ||
      intent.payload.itemId !== itemId
    )
      throw Error(
        'Repita a seleção de equipamento pendente antes de iniciar outra.',
      );
    if (!saved) localStorage.setItem(key, JSON.stringify(intent));
    await commandTraining(actor, 'equip', intent.payload, intent.id);
    if (localStorage.getItem(key) === JSON.stringify(intent))
      localStorage.removeItem(key);
  });
}
