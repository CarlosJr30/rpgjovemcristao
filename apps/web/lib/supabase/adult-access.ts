import { getSupabaseBrowserClient } from './client';

export function verifiedGameAccess(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  return result.version === 1 && result.allowed === true;
}

export async function hasAdultGameAccess(): Promise<boolean> {
  try {
    const result = await getSupabaseBrowserClient().rpc('phase1_game_access');
    return !result.error && verifiedGameAccess(result.data);
  } catch {
    return false;
  }
}
