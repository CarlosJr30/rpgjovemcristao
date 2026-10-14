// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { GuildChatMessageRow } from '../../lib/supabase/database.types';

const mocks = vi.hoisted(() => ({
  auth: { status: 'signedIn', user: { id: 'account-a' } },
  summary: vi.fn(),
  page: vi.fn(),
  byIds: vi.fn(),
  send: vi.fn(),
  markRead: vi.fn(),
  report: vi.fn(),
  moderate: vi.fn(),
  reports: vi.fn(),
  log: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => mocks.auth,
}));
vi.mock(
  '../../lib/supabase/repositories/guild-chat-repository',
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import('../../lib/supabase/repositories/guild-chat-repository')
      >();
    return { ...original, guildChatRepository: mocks };
  },
);
import { GuildChat } from './components/guild-chat';
import { ChatError } from '../../lib/supabase/repositories/guild-chat-repository';
const row = (sequence: number, body = 'Olá, célula'): GuildChatMessageRow => ({
  id: `message-${sequence}`,
  sequence,
  guild_id: 'guild-a',
  author_traveler_id: 'other',
  client_id: `retry-${sequence}`,
  author_name: 'Lia',
  author_body_type: 'female',
  author_skin_tone: 'medio',
  author_hair_style: 'curto',
  author_outfit: 'musgo',
  body,
  is_announcement: false,
  created_at: '2026-10-14T12:00:00Z',
  removed_at: null,
});
let invalidate: () => void;
let status: (online: boolean) => void;
const mount = () =>
  render(<GuildChat guildId="guild-a" travelerId="traveler-a" />);
async function open() {
  fireEvent.click(await screen.findByRole('button', { name: /Abrir chat/ }));
  await screen.findByText('Olá, célula');
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth = { status: 'signedIn', user: { id: 'account-a' } };
  mocks.summary.mockResolvedValue({
    unread_count: 1,
    last_read_sequence: 0,
    can_announce: false,
    can_moderate: false,
  });
  mocks.page.mockResolvedValue([row(2)]);
  mocks.byIds.mockResolvedValue([row(2)]);
  mocks.send.mockResolvedValue('id');
  mocks.markRead.mockResolvedValue(undefined);
  mocks.reports.mockResolvedValue([]);
  mocks.log.mockResolvedValue([]);
  mocks.subscribe.mockImplementation((_guild, onChange, onStatus) => {
    invalidate = onChange;
    status = onStatus;
    onStatus(true);
    return mocks.unsubscribe;
  });
});
afterEach(cleanup);
describe('Guild chat interaction and lifecycle', () => {
  test('local mode never subscribes or fetches chat', () => {
    mocks.auth.status = 'local';
    mount();
    expect(mocks.subscribe).not.toHaveBeenCalled();
    expect(mocks.summary).not.toHaveBeenCalled();
  });
  test('closed badge, authorized name/avatar/time, plain text and explicit read checkpoint', async () => {
    mount();
    await screen.findByText(/1 não lida/);
    expect(mocks.page).not.toHaveBeenCalled();
    await open();
    expect(screen.getByText('Lia')).toBeVisible();
    expect(document.querySelector('time')).toHaveAttribute(
      'dateTime',
      '2026-10-14T12:00:00Z',
    );
    expect(
      document.querySelector('[data-avatar-mode="thumbnail"]'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Não compartilhe telefone/)).toBeVisible();
    expect(screen.queryByLabelText('Aviso destacado')).not.toBeInTheDocument();
    mocks.page.mockResolvedValue([
      row(2, '<img src=x onerror=alert(1)> https://example.com'),
    ]);
    await act(async () => invalidate());
    await screen.findByText('<img src=x onerror=alert(1)> https://example.com');
    expect(document.querySelector('a[href="https://example.com"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como lidas' }));
    await waitFor(() =>
      expect(mocks.markRead).toHaveBeenCalledWith('guild-a', 'traveler-a', 2),
    );
  });
  test('retry retains the id and draft, server leader permission controls announcement', async () => {
    mocks.summary.mockResolvedValue({
      unread_count: 1,
      last_read_sequence: 0,
      can_announce: true,
      can_moderate: true,
    });
    mount();
    await open();
    fireEvent.change(screen.getByLabelText('Mensagem para a célula'), {
      target: { value: 'Novo aviso' },
    });
    fireEvent.click(screen.getByLabelText('Aviso destacado'));
    mocks.send.mockRejectedValueOnce(new ChatError('Falha temporária'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText('Falha temporária');
    const first = mocks.send.mock.calls[0];
    expect(first.slice(0, 2)).toEqual(['guild-a', 'traveler-a']);
    expect(first.slice(3)).toEqual(['Novo aviso', true]);
    expect(screen.getByLabelText('Mensagem para a célula')).toHaveValue(
      'Novo aviso',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText('Mensagem enviada.');
    expect(mocks.send.mock.calls[1]).toEqual(first);
    expect(screen.getByLabelText('Mensagem para a célula')).toHaveValue('');
  });
  test('missed events are reloaded on reconnect; removal replaces cached body', async () => {
    mount();
    await open();
    await act(async () => status(false));
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    mocks.page.mockResolvedValue([
      { ...row(2), body: null, removed_at: '2026-10-14T12:01:00Z' },
      row(3, 'Mensagem na reconexão'),
    ]);
    await act(async () => status(true));
    await screen.findByText('Mensagem na reconexão');
    await screen.findByText('Mensagem removida pela moderação.');
    expect(screen.queryByText('Olá, célula')).not.toBeInTheDocument();
  });
  test('history pages do not impose a 300-message limit and retain current page during refresh', async () => {
    mocks.page.mockResolvedValue(
      Array.from({ length: 30 }, (_, i) => row(400 - i)),
    );
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /Abrir chat/ }));
    await screen.findByRole('button', { name: 'Mensagens anteriores' });
    mocks.page.mockResolvedValueOnce(
      Array.from({ length: 30 }, (_, i) => row(370 - i, 'Antiga')),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Mensagens anteriores' }),
    );
    await screen.findByRole('button', { name: 'Mensagens recentes' });
    expect(mocks.page).toHaveBeenLastCalledWith('guild-a', 371);
    mocks.byIds.mockResolvedValue(
      Array.from({ length: 30 }, (_, i) => row(370 - i, 'Antiga')),
    );
    await act(async () => invalidate());
    expect(mocks.byIds).toHaveBeenCalled();
    expect(screen.getAllByText('Antiga')).toHaveLength(30);
    mocks.page.mockResolvedValueOnce([row(340, 'Mais antiga')]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Mensagens anteriores' }),
    );
    await screen.findByText('Mais antiga');
    expect(mocks.page).toHaveBeenLastCalledWith('guild-a', 341);
  });
  test('report confirmation and moderation queue with content and audit', async () => {
    mocks.summary.mockResolvedValue({
      unread_count: 1,
      last_read_sequence: 0,
      can_announce: true,
      can_moderate: true,
    });
    mount();
    await open();
    fireEvent.click(
      screen.getByRole('button', { name: 'Denunciar mensagem de Lia' }),
    );
    fireEvent.change(screen.getByLabelText('Motivo da denúncia'), {
      target: { value: 'personal_data' },
    });
    fireEvent.click(
      within(
        screen.getByRole('form', { name: 'Denunciar mensagem' }),
      ).getByRole('button', { name: 'Confirmar' }),
    );
    await waitFor(() =>
      expect(mocks.report).toHaveBeenCalledWith(
        'guild-a',
        'traveler-a',
        'message-2',
        'personal_data',
      ),
    );
    mocks.reports.mockResolvedValue([
      {
        id: 'r',
        guild_id: 'guild-a',
        message_id: 'message-2',
        reason: 'personal_data',
        status: 'pending',
        created_at: '2026-10-14T12:00:00Z',
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Moderação' }));
    await screen.findByText('Lia: Olá, célula');
    fireEvent.click(
      screen.getByRole('button', { name: 'Remover mensagem denunciada' }),
    );
    fireEvent.change(screen.getByLabelText('Motivo da moderação'), {
      target: { value: 'Dados pessoais expostos' },
    });
    fireEvent.click(
      within(screen.getByRole('form', { name: 'Moderar mensagem' })).getByRole(
        'button',
        { name: 'Confirmar' },
      ),
    );
    await waitFor(() =>
      expect(mocks.moderate).toHaveBeenCalledWith(
        'guild-a',
        'traveler-a',
        'message-2',
        'remove',
        'Dados pessoais expostos',
      ),
    );
  });
  test('revocation clears rendered messages; account switch cancels stale responses and unsubscribes', async () => {
    const view = mount();
    await open();
    mocks.summary.mockRejectedValueOnce(new ChatError('Sem permissão', true));
    await act(async () => invalidate());
    await screen.findByRole('alert');
    expect(screen.queryByText('Olá, célula')).not.toBeInTheDocument();
    mocks.summary.mockResolvedValue({
      unread_count: 0,
      last_read_sequence: 0,
      can_announce: false,
      can_moderate: false,
    });
    mocks.auth.user.id = 'account-b';
    view.rerender(<GuildChat guildId="guild-b" travelerId="traveler-b" />);
    await waitFor(() =>
      expect(mocks.summary).toHaveBeenCalledWith('guild-b', 'traveler-b'),
    );
    expect(mocks.unsubscribe).toHaveBeenCalled();
    expect(screen.queryByText('Olá, célula')).not.toBeInTheDocument();
    mocks.auth.status = 'signedOut';
    view.rerender(<GuildChat guildId="guild-b" travelerId="traveler-b" />);
    expect(screen.queryByLabelText('Chat da célula')).not.toBeInTheDocument();
  });
});
