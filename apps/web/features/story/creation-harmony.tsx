'use client';

import { useRef, useState } from 'react';
import { CREATION_DAYS } from './creation-days';
import css from './creation-harmony.module.css';

const symbols = CREATION_DAYS.map((day) => ({
  id: day.id,
  label: day.harmonyLabel ?? day.title,
  icon: day.motifs,
}));

function shuffleSymbols() {
  const shuffled = [...symbols];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.every((symbol, i) => symbol.id === symbols[i].id)) {
    shuffled.push(shuffled.shift()!);
  }
  return shuffled;
}

function focusTitle(node: HTMLHeadingElement | null) {
  node?.focus();
}

export function CreationHarmony({
  onStartQuiz,
  onVerify,
  verified,
}: {
  onStartQuiz?: () => void;
  onVerify?: (order: number[]) => Promise<boolean>;
  verified?: boolean;
}) {
  const request = useRef(false);
  const [pending, setPending] = useState(false);
  const [bank, setBank] = useState(shuffleSymbols);
  const [sequence, setSequence] = useState<typeof symbols>([]);
  const [feedback, setFeedback] = useState('Escolha o primeiro símbolo.');
  const [result, setResult] = useState<'retry' | 'correct'>();
  const complete = verified || result === 'correct';
  const full = sequence.length === symbols.length;

  function place(symbol: (typeof symbols)[number]) {
    if (request.current || complete || full || sequence.includes(symbol))
      return;
    setSequence([...sequence, symbol]);
    setResult(undefined);
    setFeedback(
      `${symbol.label} na posição ${sequence.length + 1}. ${sequence.length === symbols.length - 1 ? 'Confira a sequência.' : `Escolha o símbolo da posição ${sequence.length + 2}.`}`,
    );
  }

  function undo() {
    const last = sequence.at(-1);
    if (request.current || !last || complete) return;
    setSequence(sequence.slice(0, -1));
    setResult(undefined);
    setFeedback(
      `Posição ${sequence.length} liberada. ${last.label} voltou à lista.`,
    );
  }

  function reset() {
    if (request.current || (onVerify && complete)) return;
    setBank(shuffleSymbols());
    setSequence([]);
    setResult(undefined);
    setFeedback('Tabuleiro reiniciado. Escolha o primeiro símbolo.');
  }

  async function verify() {
    if (request.current || !full || complete) return;
    let correct: boolean;
    if (onVerify) {
      request.current = true;
      setPending(true);
      try {
        correct = await onVerify(
          sequence.map((symbol) => symbols.indexOf(symbol) + 1),
        );
      } catch {
        setFeedback('Não foi possível confirmar a Harmonia. Tente novamente.');
        return;
      } finally {
        request.current = false;
        setPending(false);
      }
    } else {
      correct = sequence.every((symbol, i) => symbol.id === symbols[i].id);
    }
    if (correct) {
      setResult('correct');
      setFeedback(
        'Sequência correta! Harmonia da Criação concluída nesta demonstração.',
      );
    } else {
      setResult('retry');
      setFeedback(
        'A sequência ainda está fora de ordem. Consulte Gênesis 1:1–2:3 e use Desfazer ou Reiniciar para tentar novamente.',
      );
    }
  }

  return (
    <section
      className={css.panel}
      aria-labelledby="harmony-title"
      data-result={result}
    >
      <header className={css.header}>
        <h2 id="harmony-title" ref={focusTitle} tabIndex={-1}>
          Harmonia da Criação
        </h2>
        <p>
          Escolha os símbolos na ordem dos acontecimentos. Cada escolha preenche
          a próxima posição.
        </p>
        <p className={css.editorial}>
          Desafio demonstrativo. Associações em revisão editorial.
        </p>
        <p className={css.references}>
          <a href="https://www.bible.com/pt/bible/129/GEN.1.NVI">
            Gênesis 1:1–31 (NVI)
          </a>
          <a href="https://www.bible.com/pt/bible/129/GEN.2.1-3.NVI">
            Gênesis 2:1–3 (NVI)
          </a>
        </p>
      </header>
      <div className={css.board}>
        <ol
          className={css.slots}
          role="list"
          aria-label="Posições da sequência"
        >
          {symbols.map((slot, i) => (
            <li
              key={slot.id}
              className={css.slot}
              data-filled={Boolean(sequence[i])}
              style={{ animationDelay: `${i * 85}ms` }}
            >
              <span className={css.number}>Posição {i + 1}</span>
              {sequence[i] ? (
                <>
                  <span className={css.icon} aria-hidden="true">
                    {sequence[i].icon}
                  </span>
                  <span>{sequence[i].label}</span>
                </>
              ) : (
                <span className={css.empty}>Vazia</span>
              )}
            </li>
          ))}
        </ol>
        <ul className={css.bank} role="list" aria-label="Símbolos embaralhados">
          {bank.map((symbol) => {
            const placed = sequence.includes(symbol);
            return (
              <li key={symbol.id}>
                <button
                  type="button"
                  aria-disabled={placed}
                  aria-label={
                    placed ? `${symbol.label}, posicionado` : undefined
                  }
                  onClick={() => place(symbol)}
                >
                  <span className={css.icon} aria-hidden="true">
                    {symbol.icon}
                  </span>
                  <span>{symbol.label}</span>
                  {placed && <small>Posicionado</small>}
                </button>
              </li>
            );
          })}
        </ul>
        <div className={css.actions}>
          <button
            type="button"
            aria-disabled={!sequence.length || complete}
            onClick={undo}
          >
            Desfazer
          </button>
          <button type="button" onClick={reset}>
            Reiniciar
          </button>
          <button
            type="button"
            className={css.verify}
            aria-disabled={pending || !full || complete}
            onClick={verify}
          >
            Verificar sequência
          </button>
        </div>
        <p className={css.feedback} role="status" aria-atomic="true">
          {pending
            ? 'Conferindo sequência…'
            : verified
              ? 'Harmonia confirmada pelo servidor.'
              : feedback}
        </p>
        {complete && onStartQuiz && (
          <div className={css.actions}>
            <button type="button" onClick={onStartQuiz}>
              Abrir Quiz da Criação
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
