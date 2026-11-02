'use client';
import { useEffect, useRef, useState } from 'react';
import { readOwnedCards } from '../../lib/supabase/owned-cards-read';
import { requestArenaStarter } from './starter';
import css from '../release-ebd/release.module.css';

export function ArenaStarterPanel({
  owner,
  traveler,
  onGranted,
}: {
  owner: string;
  traveler: string;
  onGranted: () => void;
}) {
  const [count, setCount] = useState<number>(),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const mounted = useRef(false);
  useEffect(() => {
    let live = true;
    mounted.current = true;
    readOwnedCards(traveler, true)
      .then((cards) => {
        if (live) setCount(cards.length);
      })
      .catch(() => {
        if (live)
          setError('Não foi possível consultar o pacote inicial.');
      });
    return () => {
      live = false;
      mounted.current = false;
    };
  }, [traveler]);
  async function claim() {
    setBusy(true);
    setError('');
    try {
      const receipt = await requestArenaStarter(owner, traveler);
      if (!mounted.current) return;
      setConfirm(false);
      if (receipt.status === 'claimed-on-another-traveler') {
        setMessage(
          'O pacote desta conta já foi destinado a outro Viajante. Use esse Viajante para acessar as cartas.',
        );
        return;
      }
      const cards = await readOwnedCards(traveler, true);
      if (!mounted.current) return;
      setCount(cards.length);
      setMessage(
        'Solicitação confirmada. As cartas pertencem à sua coleção; nenhuma recompensa de XP ou moedas foi concedida.',
      );
      onGranted();
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error
            ? e.message
            : 'Não foi possível solicitar as cartas.',
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section className={css.card} aria-label="Pacote inicial de cartas">
      <h2>Pacote inicial de cartas</h2>
      <p>
        Sete cartas existentes, uma única solicitação por conta. O pacote fica
        neste Viajante e não altera XP, moedas ou equipamentos.
      </p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {count === undefined && !error && (
        <p role="status">Consultando coleção…</p>
      )}
      {count !== undefined && count < 7 && !message && !confirm && (
        <button disabled={busy} onClick={() => setConfirm(true)}>
          Solicitar pacote inicial
        </button>
      )}
      {confirm && (
        <div>
          <p>
            Confirma destinar o pacote inicial a este Viajante? Ele não será
            repetido em outro avatar desta conta.
          </p>
          <button disabled={busy} onClick={() => void claim()}>
            {busy ? 'Confirmando…' : 'Confirmar solicitação'}
          </button>
          <button disabled={busy} onClick={() => setConfirm(false)}>
            Cancelar
          </button>
        </div>
      )}
      {count !== undefined && count >= 7 && (
        <p>
          Sua coleção possui sete cartas de combate. Monte o baralho abaixo; os
          níveis mínimos de cada carta permanecem válidos.
        </p>
      )}
    </section>
  );
}
