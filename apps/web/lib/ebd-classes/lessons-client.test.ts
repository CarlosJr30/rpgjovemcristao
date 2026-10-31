import { expect, test, vi } from 'vitest';
const mocked = vi.hoisted(() => ({
  rpc: vi.fn(),
  verify: vi.fn(),
  finish: vi.fn(),
}));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: mocked.rpc }),
}));
vi.mock('../guild-governance/context-guard', () => ({
  guardGuildContext: () => mocked.verify,
}));
vi.mock('../guild-governance/selection', () => ({
  beginGuildWork: () => mocked.finish,
}));
import { classLessonsRepository, parseClassLessons } from './lessons-client';
const frame = () => ({
  version: 2,
  guildId: 'guild',
  classId: 'class',
  leader: false,
  teacher: false,
  lessons: [{ ebd_class_id: 'class', guild_id: 'guild' }],
  activities: [],
  answers: [],
  attendance: [],
  members: [],
  teachers: [],
  history: [],
  rewards: [],
  quizzes: [],
  quizResults: [],
  eligibility: [],
});
test('workspace rejects another Guild or class and refuses malformed response rather than claiming empty success', () => {
  expect(parseClassLessons(frame(), 'guild', 'class').classId).toBe('class');
  expect(() => parseClassLessons(frame(), 'guild', 'other')).toThrow();
  expect(() =>
    parseClassLessons({ ...frame(), guildId: 'foreign' }, 'guild', 'class'),
  ).toThrow();
  expect(() =>
    parseClassLessons({ ...frame(), lessons: [null] }, 'guild', 'class'),
  ).toThrow();
});
test('late reply is discarded when session or Guild guard invalidates the request', async () => {
  mocked.rpc.mockResolvedValueOnce({ data: frame(), error: null });
  mocked.verify.mockImplementationOnce(() => {
    throw Error('session changed');
  });
  await expect(
    classLessonsRepository.load('actor', 'guild', 'class'),
  ).rejects.toThrow('session changed');
});
test('class command carries explicit scope and idempotency nonce, rejects a receipt for another lesson', async () => {
  mocked.rpc.mockResolvedValueOnce({
    data: { id: 'wrong', revision: 1, replayed: false },
    error: null,
  });
  await expect(
    classLessonsRepository.command(
      'actor',
      'guild',
      'class',
      'lesson',
      'lesson',
      0,
      {},
      'request',
    ),
  ).rejects.toThrow(/não foi confirmada/);
  expect(mocked.rpc).toHaveBeenLastCalledWith(
    'ebd_class_lessons_command',
    expect.objectContaining({
      p_actor: 'actor',
      p_guild: 'guild',
      p_class: 'class',
      p_request: 'request',
    }),
  );
  expect(mocked.finish).toHaveBeenCalled();
});
