import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  rpc: vi.fn(),
  owner: 'owner',
  revision: 1,
  allowed: true,
}));
vi.mock('../../lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: m.rpc }),
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => m.owner,
  getOnlineSessionRevision: () => m.revision,
  canUseTravelerInCurrentSession: () => m.allowed,
}));
import { readArenaQaProfile } from './profile';
const profile = {
  kind: 'qa-training',
  trainingLevel: 50,
  canonicalLevel: 1,
  canonicalXp: 0,
};
beforeEach(() => {
  m.owner = 'owner';
  m.revision = 1;
  m.allowed = true;
  m.rpc.mockReset();
  vi.stubEnv('NEXT_PUBLIC_ARENA_TEST_PRACTICE', '1');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wkdvdzfkbwvhyjmamrsg.supabase.co',
  );
});
afterEach(() => vi.unstubAllEnvs());
test('only server QA profile enables training50; normal avatar remains ordinary', async () => {
  m.rpc.mockResolvedValue({ data: profile, error: null });
  expect(await readArenaQaProfile('owner', 'hero')).toBe(50);
  expect(m.rpc).toHaveBeenCalledWith('get_arena_qa_profile', {
    p_traveler_id: 'hero',
  });
  m.rpc.mockResolvedValue({ data: null, error: null });
  expect(await readArenaQaProfile('owner', 'hero')).toBeNull();
});
test('production and foreign traveler denied before request', async () => {
  m.allowed = false;
  await expect(readArenaQaProfile('owner', 'hero')).rejects.toThrow();
  m.allowed = true;
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wspafhlbtlpabypzymjo.supabase.co',
  );
  await expect(readArenaQaProfile('owner', 'hero')).rejects.toThrow();
  expect(m.rpc).not.toHaveBeenCalled();
});
test('late response from old session rejected even for same owner', async () => {
  m.rpc.mockImplementation(async () => {
    m.revision++;
    return { data: profile, error: null };
  });
  await expect(readArenaQaProfile('owner', 'hero')).rejects.toThrow();
});
test('unknown profile or canonical XP cannot become training50', async () => {
  for (const data of [
    { ...profile, kind: 'official' },
    { ...profile, canonicalXp: 245000 },
    { ...profile, trainingLevel: 49 },
    {},
  ]) {
    m.rpc.mockResolvedValue({ data, error: null });
    await expect(readArenaQaProfile('owner', 'hero')).rejects.toThrow();
  }
});
test('RPC failures do not fall back to an unverified profile', async () => {
  m.rpc.mockResolvedValue({ data: profile, error: { code: '42501' } });
  await expect(readArenaQaProfile('owner', 'hero')).rejects.toThrow();
});
