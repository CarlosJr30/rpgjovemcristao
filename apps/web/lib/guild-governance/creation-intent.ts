import { getCurrentOnlineUserId } from '../supabase/online-sync';
export type GuildCreationIntent = {
  id: string;
  request: string;
  name: string;
  description: string;
};
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function key(actor: string) {
  const owner = getCurrentOnlineUserId();
  if (!owner) throw Error('Confirme sua conta antes de criar uma Guilda.');
  return `rpg-guild-creation:${owner}:${actor}`;
}
export function pendingGuildCreation(
  actor: string,
): GuildCreationIntent | null {
  const value = sessionStorage.getItem(key(actor));
  if (!value) return null;
  let data: GuildCreationIntent;
  try {
    data = JSON.parse(value);
  } catch {
    throw Error(
      'Há uma solicitação de criação ilegível. Confira suas comunidades antes de continuar.',
    );
  }
  if (
    !data ||
    !uuid.test(data.id) ||
    !uuid.test(data.request) ||
    typeof data.name !== 'string' ||
    data.name.length < 2 ||
    data.name.length > 60 ||
    typeof data.description !== 'string' ||
    data.description.length > 500
  )
    throw Error('A solicitação pendente precisa ser conferida.');
  return data;
}
export function beginGuildCreation(
  actor: string,
  name: string,
  description: string,
) {
  const prior = pendingGuildCreation(actor);
  if (prior) {
    if (prior.name !== name || prior.description !== description)
      throw Error(
        'Repita a solicitação pendente com os mesmos dados antes de iniciar outra criação.',
      );
    return prior;
  }
  const intent = {
    id: crypto.randomUUID(),
    request: crypto.randomUUID(),
    name,
    description,
  };
  // Pending community draft, never credentials or devotional/game progress.
  // Fail closed if the nonce cannot survive a reload/reconnection.
  sessionStorage.setItem(key(actor), JSON.stringify(intent));
  return intent;
}
export function confirmGuildCreation(actor: string, id: string) {
  const prior = pendingGuildCreation(actor);
  if (prior?.id === id) sessionStorage.removeItem(key(actor));
}
