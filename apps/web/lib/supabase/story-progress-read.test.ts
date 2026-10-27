import { beforeEach, expect, it, vi } from 'vitest';
import { parseStoryProgress, readStoryProgress } from './story-progress-read';
const m = vi.hoisted(() => ({
  owner: 'owner',
  revision: 1,
  usable: true,
  eq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
}));
vi.mock('./client', () => ({
  getSupabaseBrowserClient: () => ({ from: m.from }),
}));
vi.mock('./online-sync', () => ({
  getCurrentOnlineUserId: () => m.owner,
  getOnlineSessionRevision: () => m.revision,
  canUseTravelerInCurrentSession: () => m.usable,
}));
const row = () => ({
  traveler_id: 'hero',
  story_id: 'creation',
  completed_steps: ['reading'],
  video_completed: false,
  reward_receipt: null,
  completed_at: null,
});
beforeEach(() => {
  vi.clearAllMocks();
  m.owner = 'owner';
  m.revision = 1;
  m.usable = true;
  m.from.mockReturnValue({ select: m.select });
  m.select.mockReturnValue({ eq: m.eq });
  m.eq.mockResolvedValue({ data: [], error: null });
});
it('reads only the selected owner-bound projection and accepts an honest empty result', async () => {
  expect(await readStoryProgress('hero')).toEqual([]);
  expect(m.from).toHaveBeenCalledExactlyOnceWith('story_progress');
  expect(m.eq).toHaveBeenCalledExactlyOnceWith('traveler_id', 'hero');
});
it('retains partial persisted progress without inventing completion', () => {
  expect(parseStoryProgress([row()], 'hero')).toEqual([row()]);
});
it.each(['anonymous', 'foreign'])(
  'rejects %s before making a request',
  async (kind) => {
    if (kind === 'anonymous') m.owner = '';
    else m.usable = false;
    await expect(readStoryProgress('hero')).rejects.toThrow();
    expect(m.from).not.toHaveBeenCalled();
  },
);
it.each(['revision', 'owner', 'selection'])(
  'discards delayed data after %s changes',
  async (kind) => {
    m.eq.mockImplementation(async () => {
      if (kind === 'revision') m.revision++;
      else if (kind === 'owner') m.owner = 'other';
      else m.usable = false;
      return { data: [row()], error: null };
    });
    await expect(readStoryProgress('hero')).rejects.toThrow();
  },
);
it.each([
  null,
  {},
  [{ ...row(), traveler_id: 'other' }],
  [row(), row()],
  [{ ...row(), story_id: 'invented' }],
  [{ ...row(), completed_steps: ['forged'] }],
  [{ ...row(), completed_at: 'bad' }],
  [{ ...row(), video_completed: 'yes' }],
])('rejects malformed or foreign data %#', (data) => {
  expect(() => parseStoryProgress(data, 'hero')).toThrow();
});
it('does not turn denied read into a successful empty state', async () => {
  m.eq.mockResolvedValue({ data: [], error: { code: '42501' } });
  await expect(readStoryProgress('hero')).rejects.toThrow();
});
