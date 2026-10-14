import { getSupabaseBrowserClient } from '../client';
import type { GuildChatMessageRow, GuildChatSummary } from '../database.types';

export const CHAT_PAGE_SIZE = 30;
export const CHAT_MAX_LENGTH = 1000;
export const reportReasons = {
  bullying: 'Ofensa ou intimidação',
  personal_data: 'Exposição de dados pessoais',
  sexual_content: 'Conteúdo sexual',
  violence: 'Violência ou ameaça',
  other: 'Outro conteúdo inadequado',
} as const;
export type ReportReason = keyof typeof reportReasons;
export class ChatError extends Error {
  constructor(
    message: string,
    public readonly denied = false,
  ) {
    super(message);
  }
}
function checked<T>(result: { data: T; error: { code?: string } | null }): T {
  if (result.error) {
    const code = result.error.code;
    throw new ChatError(
      code === '42501'
        ? 'Seu acesso ao chat não está autorizado.'
        : code === 'P0001'
          ? 'Aguarde alguns segundos. O limite de envios foi atingido.'
          : code === '22023'
            ? 'Confira o tamanho e os dados da mensagem.'
            : 'Não foi possível atualizar o chat. Tente novamente.',
      code === '42501',
    );
  }
  return result.data;
}
export const guildChatRepository = {
  async byIds(guildId: string, ids: string[]): Promise<GuildChatMessageRow[]> {
    if (!ids.length) return [];
    return (
      checked(
        await getSupabaseBrowserClient()
          .from('guild_chat_messages')
          .select('*')
          .eq('guild_id', guildId)
          .in('id', ids.slice(0, 50))
          .order('sequence', { ascending: false }),
      ) ?? []
    );
  },
  async summary(
    guildId: string,
    travelerId: string,
  ): Promise<GuildChatSummary> {
    const rows = checked(
      await getSupabaseBrowserClient().rpc('guild_chat_summary', {
        p_guild_id: guildId,
        p_traveler_id: travelerId,
      }),
    );
    if (!rows?.[0])
      throw new ChatError('Seu acesso ao chat não está autorizado.', true);
    return rows[0];
  },
  async page(guildId: string, before?: number): Promise<GuildChatMessageRow[]> {
    let query = getSupabaseBrowserClient()
      .from('guild_chat_messages')
      .select('*')
      .eq('guild_id', guildId);
    if (before !== undefined) query = query.lt('sequence', before);
    return (
      checked(
        await query
          .order('sequence', { ascending: false })
          .limit(CHAT_PAGE_SIZE),
      ) ?? []
    );
  },
  async send(
    guildId: string,
    travelerId: string,
    clientId: string,
    body: string,
    announcement: boolean,
  ) {
    if (
      Array.from(body.trim()).length < 1 ||
      Array.from(body.trim()).length > CHAT_MAX_LENGTH ||
      new TextEncoder().encode(body).length > 4000
    )
      throw new ChatError('A mensagem deve ter entre 1 e 1.000 caracteres.');
    return checked(
      await getSupabaseBrowserClient().rpc('send_guild_chat_message', {
        p_guild_id: guildId,
        p_traveler_id: travelerId,
        p_client_id: clientId,
        p_body: body,
        p_announcement: announcement,
      }),
    );
  },
  async markRead(guildId: string, travelerId: string, sequence: number) {
    checked(
      await getSupabaseBrowserClient().rpc('mark_guild_chat_read', {
        p_guild_id: guildId,
        p_traveler_id: travelerId,
        p_sequence: sequence,
      }),
    );
  },
  async report(
    guildId: string,
    travelerId: string,
    messageId: string,
    reason: ReportReason,
  ) {
    checked(
      await getSupabaseBrowserClient().rpc('report_guild_chat_message', {
        p_guild_id: guildId,
        p_traveler_id: travelerId,
        p_message_id: messageId,
        p_reason: reason,
      }),
    );
  },
  async moderate(
    guildId: string,
    travelerId: string,
    messageId: string,
    action: 'remove' | 'dismiss_reports',
    reason: string,
  ) {
    checked(
      await getSupabaseBrowserClient().rpc('moderate_guild_chat_message', {
        p_guild_id: guildId,
        p_traveler_id: travelerId,
        p_message_id: messageId,
        p_action: action,
        p_reason: reason,
      }),
    );
  },
  async reports(guildId: string) {
    return (
      checked(
        await getSupabaseBrowserClient()
          .from('guild_chat_reports')
          .select('*')
          .eq('guild_id', guildId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(50),
      ) ?? []
    );
  },
  async log(guildId: string, before?: string) {
    let query = getSupabaseBrowserClient()
      .from('guild_chat_moderation_log')
      .select('*')
      .eq('guild_id', guildId);
    if (before) query = query.lt('created_at', before);
    return (
      checked(
        await query.order('created_at', { ascending: false }).limit(20),
      ) ?? []
    );
  },
  subscribe(
    guildId: string,
    invalidate: () => void,
    status: (connected: boolean) => void,
  ) {
    const client = getSupabaseBrowserClient();
    const channel = client
      .channel(`guild-chat:${guildId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guild_chat_messages',
          filter: `guild_id=eq.${guildId}`,
        },
        invalidate,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guild_chat_messages',
          filter: `guild_id=eq.${guildId}`,
        },
        invalidate,
      )
      .subscribe((state) => {
        status(state === 'SUBSCRIBED');
      });
    return () => {
      void client.removeChannel(channel);
    };
  },
};
