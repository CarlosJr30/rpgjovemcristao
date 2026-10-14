'use client';
import { useEffect, useRef, useState } from 'react';
import type {
  GuildChatMessageRow,
  GuildChatSummary,
} from '../../../lib/supabase/database.types';
import {
  CHAT_PAGE_SIZE,
  ChatError,
  guildChatRepository as repository,
} from '../../../lib/supabase/repositories/guild-chat-repository';

const emptySummary: GuildChatSummary = {
  unread_count: 0,
  last_read_sequence: 0,
  can_announce: false,
  can_moderate: false,
};
export function useGuildChat(
  guildId: string,
  travelerId: string,
  open: boolean,
) {
  const [messages, setMessages] = useState<GuildChatMessageRow[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [historical, setHistorical] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');
  const controls = useRef({
    refresh: async () => {},
    older: async () => {},
    read: async () => {},
    latest: async () => {},
  });

  useEffect(() => {
    let active = true,
      refused = false;
    let rows: GuildChatMessageRow[] = [];
    let history = false;
    let queue = Promise.resolve();
    let refreshQueued = false;
    const fail = (cause: unknown) => {
      if (!active) return;
      if (cause instanceof ChatError && cause.denied) {
        refused = true;
        rows = [];
        setMessages([]);
        setSummary(emptySummary);
        setDenied(true);
        setConnected(false);
      }
      setError(
        cause instanceof ChatError
          ? cause.message
          : 'Não foi possível atualizar o chat. Tente novamente.',
      );
    };
    const schedule = (task: () => Promise<void>) => {
      queue = queue.then(async () => {
        if (!active || refused) return;
        try {
          await task();
        } catch (cause) {
          fail(cause);
        } finally {
          if (active) setLoading(false);
        }
      });
      return queue;
    };
    const refresh = () => {
      if (refreshQueued) return queue;
      refreshQueued = true;
      return schedule(async () => {
        refreshQueued = false;
        const nextSummary = await repository.summary(guildId, travelerId);
        const nextRows = open
          ? history
            ? await repository.byIds(
                guildId,
                rows.map((row) => row.id),
              )
            : await repository.page(guildId)
          : [];
        if (!active) return;
        setSummary(nextSummary);
        setError('');
        if (open) {
          const reversed = [...nextRows].reverse();
          // Replace, never merge stale bodies: reconnect must honor moderation.
          if (!history) setHasMore(nextRows.length >= CHAT_PAGE_SIZE);
          rows = reversed;
          setMessages(rows);
        }
      });
    };
    controls.current = {
      refresh,
      latest: () =>
        schedule(async () => {
          const nextSummary = await repository.summary(guildId, travelerId);
          const newest = await repository.page(guildId);
          if (!active) return;
          history = false;
          setHistorical(false);
          setSummary(nextSummary);
          rows = [...newest].reverse();
          setMessages(rows);
          setHasMore(newest.length === CHAT_PAGE_SIZE);
        }),
      older: () =>
        schedule(async () => {
          const nextSummary = await repository.summary(guildId, travelerId);
          const older = await repository.page(guildId, rows[0]?.sequence);
          if (!active) return;
          setSummary(nextSummary);
          if (!older.length) {
            setHasMore(false);
            return;
          }
          history = true;
          setHistorical(true);
          rows = [...older].reverse();
          setMessages(rows);
          setHasMore(older.length === CHAT_PAGE_SIZE);
        }),
      read: () =>
        schedule(async () => {
          if (!rows.length || document.visibilityState === 'hidden') return;
          await repository.markRead(
            guildId,
            travelerId,
            rows[rows.length - 1].sequence,
          );
          const next = await repository.summary(guildId, travelerId);
          if (active) setSummary(next);
        }),
    };
    const unsubscribe = repository.subscribe(
      guildId,
      () => {
        void refresh();
      },
      (online) => {
        if (!active || refused) return;
        setConnected(online);
        if (online) void refresh();
      },
    );
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 15_000);
    const recover = () => {
      void refresh();
    };
    window.addEventListener('online', recover);
    window.addEventListener('focus', recover);
    document.addEventListener('visibilitychange', recover);
    return () => {
      active = false;
      clearInterval(timer);
      unsubscribe();
      window.removeEventListener('online', recover);
      window.removeEventListener('focus', recover);
      document.removeEventListener('visibilitychange', recover);
    };
  }, [guildId, travelerId, open]);

  return {
    messages,
    summary,
    connected,
    loading,
    hasMore,
    historical,
    denied,
    error,
    refresh: () => controls.current.refresh(),
    loadOlder: () => controls.current.older(),
    markRead: () => controls.current.read(),
    latest: () => controls.current.latest(),
  };
}
