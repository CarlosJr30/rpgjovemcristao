import { beforeEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));
vi.mock('../client', () => ({ getSupabaseBrowserClient: () => mocks }));
import {
  ChatError,
  guildChatRepository as chat,
} from './guild-chat-repository';
beforeEach(() => vi.resetAllMocks());
describe('chat repository boundary', () => {
  test('size/blank validation rejects before network; unicode uses database character limit', async () => {
    for (const body of ['', ' ', 'a'.repeat(1001)])
      await expect(chat.send('g', 't', 'retry', body, false)).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValue({ data: 'id', error: null });
    await chat.send('g', 't', 'retry', '😀'.repeat(1000), false);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'send_guild_chat_message',
      expect.objectContaining({ p_traveler_id: 't', p_client_id: 'retry' }),
    );
  });
  test('database denial is typed and internal error details are hidden', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'private database detail' },
    });
    try {
      await chat.summary('g', 't');
      throw Error('Expected denial');
    } catch (error) {
      expect(error).toBeInstanceOf(ChatError);
      expect((error as ChatError).denied).toBe(true);
      expect((error as Error).message).not.toContain('private');
    }
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'P0001' } });
    await expect(chat.send('g', 't', 'retry', 'Teste', false)).rejects.toThrow(
      'Aguarde',
    );
  });
  test('page uses guild predicate, descending keyset and bounded size', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mocks.from.mockReturnValue(query);
    await chat.page('guild', 123);
    expect(query.eq).toHaveBeenCalledWith('guild_id', 'guild');
    expect(query.lt).toHaveBeenCalledWith('sequence', 123);
    expect(query.limit).toHaveBeenCalledWith(30);
  });
  test('realtime invalidates through INSERT/UPDATE only, scoped filter, and releases channel', () => {
    const channel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    };
    mocks.channel.mockReturnValue(channel);
    const invalidate = vi.fn(),
      status = vi.fn();
    const cleanup = chat.subscribe('guild', invalidate, status);
    expect(channel.on.mock.calls.map((call) => call[1].event)).toEqual([
      'INSERT',
      'UPDATE',
    ]);
    for (const call of channel.on.mock.calls)
      expect(call[1].filter).toBe('guild_id=eq.guild');
    channel.on.mock.calls[0][2]({ new: { body: 'untrusted' } });
    expect(invalidate).toHaveBeenCalled();
    channel.subscribe.mock.calls[0][0]('SUBSCRIBED');
    expect(status).toHaveBeenCalledWith(true);
    cleanup();
    expect(mocks.removeChannel).toHaveBeenCalledWith(channel);
  });
});
