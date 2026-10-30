import { beforeEach, expect, test, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  rpc: vi.fn(),
  verify: vi.fn(),
  finish: vi.fn(),
}));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: mock.rpc }),
}));
vi.mock('../guild-governance/context-guard', () => ({
  guardGuildContext: () => mock.verify,
}));
vi.mock('../guild-governance/selection', () => ({
  beginGuildWork: () => mock.finish,
}));
import { classesRepository, ClassConflict } from './client';
beforeEach(() => {
  vi.resetAllMocks();
});
test('late response from old Guild or session is discarded', async () => {
  mock.rpc.mockResolvedValue({ data: {}, error: null });
  mock.verify.mockImplementation(() => {
    throw Error('Session changed');
  });
  await expect(classesRepository.load('actor', 'guild', null)).rejects.toThrow(
    'Session changed',
  );
});
test('permission errors are not converted to empty classes', async () => {
  mock.rpc.mockResolvedValue({ error: { code: '42501' }, data: null });
  await expect(classesRepository.load('actor', 'guild', null)).rejects.toThrow(
    /indisponíveis/,
  );
});
test('conflict keeps the editor recoverable and releases Guild busy lock', async () => {
  mock.rpc.mockResolvedValue({ error: { code: 'PT409' }, data: null });
  await expect(
    classesRepository.command(
      'actor',
      'guild',
      'class',
      'save',
      1,
      { name: 'Original' },
      'request',
    ),
  ).rejects.toBeInstanceOf(ClassConflict);
  expect(mock.finish).toHaveBeenCalledOnce();
});
test('wrong command receipt cannot confirm another class', async () => {
  mock.rpc.mockResolvedValue({
    data: { id: 'other', revision: 2, replayed: false },
    error: null,
  });
  await expect(
    classesRepository.command(
      'actor',
      'guild',
      'class',
      'save',
      1,
      {},
      'request',
    ),
  ).rejects.toThrow(/não foi confirmada/);
  expect(mock.finish).toHaveBeenCalledOnce();
});
test('retry carries the same idempotency request without choosing privilege', async () => {
  mock.rpc.mockResolvedValue({
    data: { id: 'class', revision: 1, replayed: true },
    error: null,
  });
  await classesRepository.command(
    'actor',
    'guild',
    'class',
    'save',
    0,
    { name: 'Class', description: '' },
    'request',
  );
  expect(mock.rpc).toHaveBeenCalledWith(
    'ebd_classes_command',
    expect.objectContaining({
      p_actor: 'actor',
      p_guild: 'guild',
      p_class: 'class',
      p_request: 'request',
    }),
  );
});
