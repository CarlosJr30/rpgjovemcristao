import {
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../supabase/online-sync';
const selected = new Map<string, string | null>();
const work = new Map<string, number>();
const listeners = new Set<() => void>();
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const key = (actor: string) =>
  `${getCurrentOnlineUserId()}:${getOnlineSessionRevision()}:${actor}`;
const preferenceKey = (actor: string) =>
  `rpg-guild-selection:${getCurrentOnlineUserId()}:${actor}`;
export const subscribeGuildSelection = (notify: () => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};
export const getGuildSelection = (actor: string): string | null =>
  selected.get(key(actor)) ?? null;
export const isGuildBusy = (actor: string) => (work.get(key(actor)) ?? 0) > 0;
export function beginGuildWork(actor: string) {
  const binding = key(actor);
  if ((work.get(binding) ?? 0) > 0)
    throw Error('Aguarde a confirmação da operação nesta comunidade.');
  work.set(binding, 1);
  for (const listener of listeners) listener();
  return () => {
    work.delete(binding);
    for (const listener of listeners) listener();
  };
}
export function selectGuild(actor: string, guildId: string | null) {
  if (isGuildBusy(actor) && guildId !== getGuildSelection(actor))
    throw Error('Aguarde a confirmação antes de trocar de Guilda.');
  if (!getCurrentOnlineUserId() || (guildId !== null && !uuid.test(guildId)))
    throw Error('Seleção de Guilda inválida.');
  selected.set(key(actor), guildId);
  // Preference only. Every read/command still checks ownership and scope on the server.
  try {
    if (guildId) sessionStorage.setItem(preferenceKey(actor), guildId);
    else sessionStorage.removeItem(preferenceKey(actor));
  } catch {
    /* Optional navigation preference. */
  }
  for (const listener of listeners) listener();
}
export function restoreGuildSelection(actor: string) {
  if (!getCurrentOnlineUserId() || selected.has(key(actor))) return;
  let value: string | null = null;
  try {
    const saved = sessionStorage.getItem(preferenceKey(actor));
    if (saved && uuid.test(saved)) value = saved;
  } catch {
    /* RAM selection still works. */
  }
  selected.set(key(actor), value);
  for (const listener of listeners) listener();
}
