'use client';

import { useState } from 'react';
import type { Traveler } from '../domain/traveler';
import { BIBLE_LINKS } from '../data/bibleLinks';
import { updateTraveler } from '../state/use-journey';
import styles from '../journey.module.css';

type ReadingKey = 'genesis2' | 'genesis3';
const readings = [
  { key: 'genesis2', link: BIBLE_LINKS.genesis2, opened: 'genesis2Opened', confirmed: 'genesis2Confirmed' },
  { key: 'genesis3', link: BIBLE_LINKS.genesis3, opened: 'genesis3Opened', confirmed: 'genesis3Confirmed' },
] as const;

const comprehensionQuestions = [
  {
    id: 'care',
    prompt: 'Qual responsabilidade aparece em Gênesis 2:15?',
    options: [
      { id: 'cultivate', text: 'Cultivar e guardar o jardim' },
      { id: 'abandon', text: 'Abandonar o jardim' },
      { id: 'rule-city', text: 'Governar uma cidade' },
    ],
    correctOptionId: 'cultivate',
  },
  {
    id: 'orientation',
    prompt: 'Como Gênesis 2:16–17 apresenta liberdade e limite?',
    options: [
      { id: 'freedom-limit', text: 'Há liberdade ampla e um limite específico' },
      { id: 'no-freedom', text: 'Nenhuma árvore podia ser usada' },
      { id: 'no-guidance', text: 'Nenhuma orientação foi apresentada' },
    ],
    correctOptionId: 'freedom-limit',
  },
  {
    id: 'consequence',
    prompt: 'O que muda no relato depois da desobediência?',
    options: [
      { id: 'rupture', text: 'Surgem vergonha, medo e consequências' },
      { id: 'nothing', text: 'Nada muda no relato' },
      { id: 'garden-grows', text: 'O jardim se transforma em cidade' },
    ],
    correctOptionId: 'rupture',
  },
] as const;

export function BibleReading({ traveler, onComplete }: { traveler: Traveler; onComplete: () => void }) {
  const reading = traveler.progress.bibleReading;
  const allConfirmed = reading.genesis2Confirmed && reading.genesis3Confirmed;

  const markOpened = (key: ReadingKey) => {
    updateTraveler((current) => {
      const field = key === 'genesis2' ? 'genesis2Opened' : 'genesis3Opened';
      if (current.progress.bibleReading[field]) return current;
      return {
        ...current,
        progress: {
          ...current.progress,
          bibleReading: { ...current.progress.bibleReading, [field]: new Date().toISOString() },
        },
      };
    });
  };

  const confirmReading = (key: ReadingKey) => {
    updateTraveler((current) => {
      const openedField = key === 'genesis2' ? 'genesis2Opened' : 'genesis3Opened';
      const confirmedField = key === 'genesis2' ? 'genesis2Confirmed' : 'genesis3Confirmed';
      if (!current.progress.bibleReading[openedField]) return current;
      return {
        ...current,
        progress: {
          ...current.progress,
          bibleReading: { ...current.progress.bibleReading, [confirmedField]: true },
        },
      };
    });
  };

  return (
    <section className={styles.readingPanel} aria-labelledby="reading-title">
      <p className={styles.phaseLead}>Leitura da fase</p>
      <h2 id="reading-title">Abra a Bíblia</h2>
      <p>Leia Gênesis 2–3 no serviço externo e volte quando estiver pronto. O jogo registra somente a abertura do link e a sua confirmação.</p>
      <div className={styles.readingList}>
        {readings.map((item) => {
          const opened = reading[item.opened];
          const confirmed = reading[item.confirmed];
          return (
            <article key={item.key} className={confirmed ? styles.readingComplete : undefined}>
              <div>
                <span aria-hidden="true">{confirmed ? '✓' : '□'}</span>
                <strong>{item.link.label}</strong>
                <small>{item.link.translation} · {item.link.source}</small>
              </div>
              <a href={item.link.url} target="_blank" rel="noopener noreferrer" onClick={() => markOpened(item.key)}>
                Abrir na Bíblia ↗
              </a>
              <button type="button" disabled={!opened || confirmed} onClick={() => confirmReading(item.key)}>
                {confirmed ? 'Leitura confirmada' : 'Concluí a leitura'}
              </button>
            </article>
          );
        })}
      </div>
      <p className={styles.privateNotice}>A confirmação é sua. O jogo não verifica tempo de leitura nem avalia espiritualidade.</p>
      <button className={styles.primaryLink} disabled={!allConfirmed} onClick={onComplete}>
        Continuar para o checkpoint →
      </button>
    </section>
  );
}

export function ReadingComprehension({ traveler, onComplete }: { traveler: Traveler; onComplete: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const allCorrect = comprehensionQuestions.every((item) => answers[item.id] === item.correctOptionId);

  const finish = () => {
    if (!allCorrect || !traveler.progress.bibleReading.genesis2Confirmed || !traveler.progress.bibleReading.genesis3Confirmed) return;
    updateTraveler((current) => ({
      ...current,
      progress: {
        ...current.progress,
        bibleReading: { ...current.progress.bibleReading, comprehensionCompleted: true },
      },
    }));
    onComplete();
  };

  return (
    <section className={styles.comprehensionPanel} aria-labelledby="comprehension-title">
      <p className={styles.phaseLead}>Checkpoint de compreensão</p>
      <h2 id="comprehension-title">O que você observou?</h2>
      <p>Estas perguntas verificam apenas a compreensão objetiva da leitura.</p>
      {comprehensionQuestions.map((item, index) => (
        <fieldset key={item.id}>
          <legend>{index + 1}. {item.prompt}</legend>
          {item.options.map((option) => (
            <label key={option.id}>
              <input
                type="radio"
                name={item.id}
                value={option.id}
                checked={answers[item.id] === option.id}
                onChange={() => setAnswers((current) => ({ ...current, [item.id]: option.id }))}
              />
              <span>{option.text}</span>
            </label>
          ))}
          {answers[item.id] && answers[item.id] !== item.correctOptionId && <small>Revise a passagem e tente novamente.</small>}
        </fieldset>
      ))}
      <button className={styles.primaryLink} disabled={!allCorrect} onClick={finish}>
        Concluir checkpoint →
      </button>
    </section>
  );
}
