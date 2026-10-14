'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../../lib/supabase/auth-context';
import type {
  GuildChatLogRow,
  GuildChatReportRow,
  GuildChatMessageRow,
} from '../../../lib/supabase/database.types';
import {
  CHAT_MAX_LENGTH,
  ChatError,
  guildChatRepository as repository,
  reportReasons,
  type ReportReason,
} from '../../../lib/supabase/repositories/guild-chat-repository';
import { useGuildChat } from '../hooks/use-guild-chat';
import { AvatarRuntime } from './avatar-runtime';
import { DEFAULT_AVATAR } from '../domain/traveler';
import styles from './guild-chat.module.css';

const timestamp = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
export function GuildChat({
  guildId,
  travelerId,
}: {
  guildId: string;
  travelerId: string;
}) {
  const auth = useAuth();
  if (auth.status !== 'signedIn') return null;
  return (
    <GuildChatSession
      key={`${auth.user.id}:${guildId}:${travelerId}`}
      guildId={guildId}
      travelerId={travelerId}
    />
  );
}
function GuildChatSession({
  guildId,
  travelerId,
}: {
  guildId: string;
  travelerId: string;
}) {
  const [open, setOpen] = useState(false);
  const chat = useGuildChat(guildId, travelerId, open);
  const [body, setBody] = useState('');
  const [announcement, setAnnouncement] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [revoked, setRevoked] = useState(false);
  const [dialog, setDialog] = useState<{
    id: string;
    action: 'report' | 'remove' | 'dismiss_reports';
  } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('bullying');
  const [moderationReason, setModerationReason] = useState('');
  const [review, setReview] = useState(false);
  const [reports, setReports] = useState<GuildChatReportRow[]>([]);
  const [reportedMessages, setReportedMessages] = useState<
    GuildChatMessageRow[]
  >([]);
  const [log, setLog] = useState<GuildChatLogRow[]>([]);
  const [logMore, setLogMore] = useState(false);
  const retry = useRef<{
    id: string;
    body: string;
    announcement: boolean;
  } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const denied = chat.denied || revoked;
  const fail = (cause: unknown) => {
    if (!alive.current) return;
    if (cause instanceof ChatError && cause.denied) {
      setRevoked(true);
      setDialog(null);
      setReports([]);
      setLog([]);
      setBody('');
      retry.current = null;
    }
    setFeedback(
      cause instanceof ChatError
        ? cause.message
        : 'Não foi possível concluir. Tente novamente.',
    );
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || denied || !chat.connected) return;
    const text = body.trim();
    const notice = chat.summary.can_announce && announcement;
    if (
      !retry.current ||
      retry.current.body !== text ||
      retry.current.announcement !== notice
    )
      retry.current = {
        id: crypto.randomUUID(),
        body: text,
        announcement: notice,
      };
    setBusy(true);
    setFeedback('');
    try {
      await repository.send(
        guildId,
        travelerId,
        retry.current.id,
        text,
        notice,
      );
      if (!alive.current) return;
      retry.current = null;
      setBody('');
      setAnnouncement(false);
      setFeedback('Mensagem enviada.');
      await chat.refresh();
    } catch (cause) {
      fail(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const submitAction = async (event: FormEvent) => {
    event.preventDefault();
    if (!dialog || busy || denied) return;
    setBusy(true);
    setFeedback('');
    try {
      if (dialog.action === 'report')
        await repository.report(guildId, travelerId, dialog.id, reportReason);
      else
        await repository.moderate(
          guildId,
          travelerId,
          dialog.id,
          dialog.action,
          moderationReason,
        );
      if (!alive.current) return;
      setDialog(null);
      setModerationReason('');
      setFeedback(
        dialog.action === 'report'
          ? 'Denúncia enviada à moderação da célula.'
          : 'Ação de moderação registrada.',
      );
      await chat.refresh();
      if (review) await loadReview();
    } catch (cause) {
      fail(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const loadReview = async () => {
    try {
      const [nextReports, nextLog] = await Promise.all([
        repository.reports(guildId),
        repository.log(guildId),
      ]);
      if (!alive.current) return;
      setReports(nextReports);
      const reported = await repository.byIds(
        guildId,
        nextReports.map((report) => report.message_id),
      );
      if (!alive.current) return;
      setReportedMessages(reported);
      setLog(nextLog);
      setLogMore(nextLog.length === 20);
      setReview(true);
    } catch (cause) {
      fail(cause);
    }
  };
  const olderLog = async () => {
    try {
      const rows = await repository.log(guildId, log.at(-1)?.created_at);
      if (alive.current) {
        setLog([...log, ...rows]);
        setLogMore(rows.length === 20);
      }
    } catch (cause) {
      fail(cause);
    }
  };
  return (
    <section className={styles.chat} aria-label="Chat da célula">
      <header className={styles.header}>
        <div>
          <small>COMUNIDADE</small>
          <h2>Chat da célula</h2>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="guild-chat-panel"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Fechar chat' : 'Abrir chat'}
          {!denied && chat.summary.unread_count > 0 && (
            <span className={styles.badge}>
              {' '}
              {chat.summary.unread_count}{' '}
              {chat.summary.unread_count === 1 ? 'não lida' : 'não lidas'}
            </span>
          )}
        </button>
      </header>
      {denied ? (
        <p role="alert">
          Seu acesso ao chat não está autorizado. Atualize sua participação na
          Guilda.
        </p>
      ) : (
        open && (
          <div id="guild-chat-panel">
            <p className={styles.rules}>
              Converse com respeito. Não compartilhe telefone, endereço, escola,
              senhas ou outros dados pessoais. Se algo incomodar, denuncie e
              procure um adulto de confiança. A liderança pode moderar as
              mensagens.
            </p>
            <div className={styles.toolbar}>
              <span role="status">
                {chat.connected ? 'Conectado em tempo real' : 'Reconectando…'}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void chat.refresh()}
              >
                Atualizar
              </button>
              <button
                type="button"
                disabled={!chat.messages.length || busy}
                onClick={() => void chat.markRead()}
              >
                Marcar como lidas
              </button>
              {chat.summary.can_moderate && (
                <button
                  type="button"
                  onClick={() =>
                    review ? setReview(false) : void loadReview()
                  }
                >
                  {review ? 'Fechar moderação' : 'Moderação'}
                </button>
              )}
            </div>
            {chat.error && <p role="alert">{chat.error}</p>}
            {chat.loading && <p role="status">Carregando mensagens…</p>}
            {chat.hasMore && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void chat.loadOlder()}
              >
                Mensagens anteriores
              </button>
            )}
            {chat.historical && (
              <button type="button" onClick={() => void chat.latest()}>
                Mensagens recentes
              </button>
            )}
            <ol
              className={styles.messages}
              aria-label="Mensagens da célula"
              tabIndex={0}
            >
              {chat.messages.map((message) => (
                <li
                  key={message.id}
                  className={`${styles.message} ${message.is_announcement ? styles.announcement : ''}`}
                >
                  <AvatarRuntime
                    traveler={{
                      appearance: {
                        hair: message.author_hair_style,
                        skin: message.author_skin_tone,
                        outfit: message.author_outfit,
                      },
                      avatar: {
                        ...DEFAULT_AVATAR,
                        gender: message.author_body_type,
                      },
                    }}
                    showEquipment={false}
                    mode="thumbnail"
                    decorative
                  />
                  <div className={styles.messageContent}>
                    <div className={styles.byline}>
                      <strong>{message.author_name}</strong>
                      <time dateTime={message.created_at}>
                        {timestamp(message.created_at)}
                      </time>
                    </div>
                    {message.is_announcement && (
                      <strong className={styles.notice}>Aviso do líder</strong>
                    )}
                    <p>
                      {message.removed_at
                        ? 'Mensagem removida pela moderação.'
                        : message.body}
                    </p>
                    {!message.removed_at && (
                      <div className={styles.actions}>
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={`Denunciar mensagem de ${message.author_name}`}
                          onClick={() =>
                            setDialog({ id: message.id, action: 'report' })
                          }
                        >
                          Denunciar
                        </button>
                        {chat.summary.can_moderate && (
                          <button
                            type="button"
                            disabled={busy}
                            aria-label={`Remover mensagem de ${message.author_name}`}
                            onClick={() =>
                              setDialog({ id: message.id, action: 'remove' })
                            }
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {!chat.loading && !chat.messages.length && !chat.error && (
              <p>Ainda não há mensagens. Comece uma conversa com sua célula.</p>
            )}
            <form className={styles.composer} onSubmit={send}>
              <label htmlFor="chat-message">Mensagem para a célula</label>
              <textarea
                id="chat-message"
                rows={3}
                maxLength={CHAT_MAX_LENGTH}
                value={body}
                disabled={busy}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Escreva uma mensagem respeitosa…"
              />
              <div className={styles.toolbar}>
                <small>
                  {Array.from(body).length}/1.000 · intervalo mínimo de 3
                  segundos
                </small>
                {chat.summary.can_announce && (
                  <label>
                    <input
                      type="checkbox"
                      checked={announcement}
                      onChange={(event) =>
                        setAnnouncement(event.target.checked)
                      }
                    />{' '}
                    Aviso destacado
                  </label>
                )}
                <button
                  type="submit"
                  disabled={busy || !body.trim() || !chat.connected}
                >
                  {busy ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </form>
            {dialog && (
              <form
                className={styles.dialog}
                onSubmit={submitAction}
                aria-label={
                  dialog.action === 'report'
                    ? 'Denunciar mensagem'
                    : 'Moderar mensagem'
                }
              >
                <h3>
                  {dialog.action === 'report'
                    ? 'Denunciar mensagem'
                    : dialog.action === 'remove'
                      ? 'Remover mensagem'
                      : 'Encerrar denúncias'}
                </h3>
                {dialog.action === 'report' ? (
                  <label>
                    Motivo da denúncia
                    <select
                      value={reportReason}
                      onChange={(event) =>
                        setReportReason(event.target.value as ReportReason)
                      }
                    >
                      {Object.entries(reportReasons).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    Motivo da moderação
                    <input
                      minLength={3}
                      maxLength={200}
                      required
                      value={moderationReason}
                      onChange={(event) =>
                        setModerationReason(event.target.value)
                      }
                    />
                  </label>
                )}
                <p>
                  {dialog.action === 'report'
                    ? 'Sua denúncia será visível apenas à moderação.'
                    : 'Esta ação ficará registrada no histórico da moderação.'}
                </p>
                <div className={styles.toolbar}>
                  <button type="submit" disabled={busy}>
                    Confirmar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setDialog(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
            {review && chat.summary.can_moderate && (
              <aside className={styles.review} aria-label="Moderação da célula">
                <h3>Denúncias pendentes</h3>
                <button type="button" onClick={() => void loadReview()}>
                  Atualizar moderação
                </button>
                {!reports.length && <p>Nenhuma denúncia pendente.</p>}
                <ul>
                  {reports.map((report) => (
                    <li key={report.id}>
                      <p>
                        {reportedMessages.find(
                          (message) => message.id === report.message_id,
                        )?.author_name ?? 'Viajante'}
                        :{' '}
                        {reportedMessages.find(
                          (message) => message.id === report.message_id,
                        )?.body ?? 'Mensagem indisponível ou removida'}
                      </p>
                      <p>
                        Mensagem {report.message_id} ·{' '}
                        {reportReasons[report.reason as ReportReason]} ·{' '}
                        {timestamp(report.created_at)}
                      </p>
                      <div className={styles.toolbar}>
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              id: report.message_id,
                              action: 'remove',
                            })
                          }
                        >
                          Remover mensagem denunciada
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              id: report.message_id,
                              action: 'dismiss_reports',
                            })
                          }
                        >
                          Encerrar sem remover
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <h3>Histórico de moderação</h3>
                <ul>
                  {log.map((entry) => (
                    <li key={entry.id}>
                      {timestamp(entry.created_at)} ·{' '}
                      {entry.action === 'remove'
                        ? 'Remoção'
                        : 'Denúncias encerradas'}{' '}
                      · {entry.reason} · mensagem {entry.message_id} · moderador{' '}
                      {entry.actor_traveler_id ?? 'indisponível'}
                    </li>
                  ))}
                </ul>
                {logMore && (
                  <button type="button" onClick={() => void olderLog()}>
                    Ações anteriores
                  </button>
                )}
              </aside>
            )}
          </div>
        )
      )}
      {feedback && !denied && <p role="status">{feedback}</p>}
    </section>
  );
}
