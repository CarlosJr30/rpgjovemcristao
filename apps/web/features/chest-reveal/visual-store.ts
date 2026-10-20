import { isChestType, uuid, type RevealReceipt } from './receipt';
import type { ChestType } from '../journey/data/chests';
export type VisualCursor = {
  receiptId: string;
  operationKey: string;
  index: number;
  seen: number;
  summary: boolean;
};
export type OpeningIntent = { operationId: string; type: ChestType };
type VisualState = {
  version: 1;
  intent: OpeningIntent | null;
  view: VisualCursor | null;
};
const key = (owner: string, traveler: string) => {
  if (!owner || owner.length > 100 || !traveler || traveler.length > 100)
    throw new Error('Identidade indisponível para a apresentação.');
  return (
    'rpg-jovem-cristao:chest-reveal:v1:' +
    encodeURIComponent(JSON.stringify([owner, traveler]))
  );
};
export function readVisual(owner: string, traveler: string): VisualState {
  try {
    const raw = localStorage.getItem(key(owner, traveler));
    if (!raw) return { version: 1, intent: null, view: null };
    if (raw.length > 2000) throw new Error();
    const v = JSON.parse(raw) as VisualState;
    if (
      !v ||
      v.version !== 1 ||
      (v.intent !== null &&
        (!v.intent ||
          !uuid(v.intent.operationId) ||
          !isChestType(v.intent.type))) ||
      (v.view !== null &&
        (!v.view ||
          !uuid(v.view.receiptId) ||
          !/^open:[0-9a-f-]{36}$/i.test(v.view.operationKey) ||
          !uuid(v.view.operationKey.slice(5)) ||
          !Number.isInteger(v.view.index) ||
          v.view.index < 0 ||
          v.view.index > 99 ||
          !Number.isInteger(v.view.seen) ||
          v.view.seen < v.view.index ||
          v.view.seen > 100 ||
          typeof v.view.summary !== 'boolean'))
    )
      throw new Error();
    return v;
  } catch {
    throw new Error(
      'Não foi possível confirmar o estado visual. Dados preservados; consulte o histórico confirmado.',
    );
  }
}
function write(owner: string, traveler: string, v: VisualState) {
  try {
    localStorage.setItem(key(owner, traveler), JSON.stringify(v));
  } catch {
    throw new Error(
      'Não foi possível salvar a apresentação. A recompensa do servidor não foi alterada.',
    );
  }
}
export function startIntent(owner: string, traveler: string, type: ChestType) {
  const state = readVisual(owner, traveler);
  if (state.intent)
    throw new Error('Consulte a abertura pendente antes de iniciar outra.');
  const intent = { operationId: crypto.randomUUID(), type };
  write(owner, traveler, { ...state, intent });
  return intent;
}
export function bindReceipt(
  owner: string,
  traveler: string,
  receipt: RevealReceipt,
  replay = false,
) {
  const state = readVisual(owner, traveler);
  if (
    receipt.travelerId !== traveler ||
    (state.intent &&
      (receipt.operationKey !== `open:${state.intent.operationId}` ||
        receipt.chestType !== state.intent.type))
  )
    throw new Error('Recibo não corresponde à abertura pendente.');
  const same = state.view?.receiptId === receipt.id && !replay;
  const view = same
    ? state.view!
    : {
        receiptId: receipt.id,
        operationKey: receipt.operationKey,
        index: 0,
        seen: 0,
        summary: false,
      };
  if (
    view.index >= receipt.entries.length ||
    view.seen > receipt.entries.length ||
    (view.summary && view.seen !== receipt.entries.length)
  )
    throw new Error('Índice visual incompatível. Consulte o histórico.');
  write(owner, traveler, { version: 1, intent: null, view });
  return view;
}
export function saveCursor(
  owner: string,
  traveler: string,
  view: VisualCursor,
) {
  const state = readVisual(owner, traveler);
  // A stale tab must not erase an opening intent or another receipt's pointer.
  if (state.view?.receiptId !== view.receiptId)
    throw new Error('Outra apresentação foi selecionada. Reabra o histórico.');
  write(owner, traveler, { ...state, view });
}
export async function openingLock<T>(
  owner: string,
  traveler: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!navigator.locks?.request)
    throw new Error(
      'Este navegador não oferece coordenação segura para abrir baús.',
    );
  return await navigator.locks.request(
    key(owner, traveler),
    { mode: 'exclusive' },
    fn,
  );
}
