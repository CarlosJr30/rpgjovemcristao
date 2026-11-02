'use client';
import { useEffect, useRef, useState } from 'react';
import {
  claimAttendanceXp,
  loadCommunityXpHistory,
  type XpReceipt,
  type XpResult,
} from '../../lib/ebd-classes/xp-client';
import css from '../guild-missions/panel.module.css';

export function xpMessage(result: XpResult, actor: string) {
  switch (result.status) {
    case 'disabled':
      return 'Créditos de XP temporariamente indisponíveis. Sua presença foi preservada.';
    case 'legacy-reconciliation-required':
      return 'Este Viajante depende de revisão dos saldos legados. Nenhum valor foi alterado.';
    case 'not-eligible':
      return 'A presença ou a data desta aula não permite crédito. Presenças anteriores à ativação não geram XP retroativo.';
    case 'suspended':
      return 'Concessão suspensa para revisão. Nenhum novo XP foi creditado.';
    case 'weekly-limit':
      return 'Limite semanal atingido na semana desta aula. A presença continua registrada, sem XP adicional.';
    case 'credited':
      return `${result.replayed ? 'Crédito já confirmado' : 'Crédito confirmado'}: 50 XP${result.travelerId !== actor ? ' no Viajante que recebeu este evento' : ''}. Total registrado: ${result.totalXp} XP · nível ${result.level}.${result.reviewPending ? ' Há uma correção de presença em análise; nenhum novo crédito foi emitido.' : ''}`;
  }
}
export function AttendanceXp({
  actor,
  guild,
  lesson,
  onBusyChange,
  disabled = false,
}: {
  actor: string;
  guild: string;
  lesson: string;
  onBusyChange?: (value: boolean) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const live = useRef(false),
    pending = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  async function claim() {
    if (pending.current || disabled) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const { result, refreshed } = await claimAttendanceXp(
        actor,
        guild,
        lesson,
      );
      if (live.current)
        setMessage(
          xpMessage(result, actor) +
            (refreshed
              ? ''
              : ' O crédito foi consultado, mas o painel do herói ainda precisa atualizar sua consulta.'),
        );
    } catch (e) {
      if (live.current)
        setError(e instanceof Error ? e.message : 'XP indisponível.');
    } finally {
      pending.current = false;
      if (live.current) setBusy(false);
    }
  }
  return (
    <section className={css.notice} aria-label="XP da presença">
      <p>
        Presença validada: até 50 XP. Limite conjunto de 1.500 XP por conta, na
        semana da aula, de segunda a segunda em São Paulo. Moedas e baús
        permanecem indisponíveis.
      </p>
      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => void claim()}
      >
        {busy ? 'Conferindo XP…' : 'Consultar e receber XP desta presença'}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
export function CommunityXpHistory({
  actor,
  guild,
}: {
  actor: string;
  guild: string;
}) {
  const [receipts, setReceipts] = useState<XpReceipt[] | null>(null),
    [suspended, setSuspended] = useState(0),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    loadCommunityXpHistory(actor, guild)
      .then((v) => {
        if (live) {
          setReceipts(v.receipts);
          setSuspended(v.suspendedEvents.length);
        }
      })
      .catch(() => {
        if (live) setError('Histórico de XP indisponível.');
      });
    return () => {
      live = false;
    };
  }, [actor, guild]);
  return (
    <section aria-label="Histórico oficial de XP">
      <h3>XP de Guilda e EBD</h3>
      {error && <p role="alert">{error}</p>}
      {receipts === null && !error && <p role="status">Consultando recibos…</p>}
      {receipts?.length === 0 && <p>Nenhum crédito oficial registrado.</p>}
      {receipts?.map((r) => (
        <p className={css.notice} key={r.receiptId}>
          {xpMessage(r, actor)} Semana iniciada em{' '}
          {new Date(r.weekStart).toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
          })}
          .
        </p>
      ))}
      {suspended > 0 && (
        <p>Há {suspended} evento(s) com concessão suspensa para revisão.</p>
      )}
    </section>
  );
}
