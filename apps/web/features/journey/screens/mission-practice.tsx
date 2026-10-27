'use client';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArchiveAccess } from '../../release-ebd/archive';
import type { Traveler } from '../domain/traveler';
import {
  BibleReading,
  ReadingComprehension,
} from '../components/bible-reading';
import { Devotional } from '../components/devotional';
import { GardenExploration } from '../components/garden-exploration';
import { GARDEN, GARDEN_CONTENT } from '../data/campaign';
import { createGardenQuizSession } from '../data/gardenQuiz';
import { bibleLinkForReference } from '../data/bibleLinks';
import styles from '../journey.module.css';

export function missionPracticeTraveler(source: Traveler): Traveler {
  return {
    ...source,
    progress: {
      ...source.progress,
      bibleReading: {
        genesis2Opened: null,
        genesis2Confirmed: false,
        genesis3Opened: null,
        genesis3Confirmed: false,
        comprehensionCompleted: false,
      },
      devotionalCompleted: false,
      devotionalReflection: '',
      gardenExploredPoints: [],
      gardenFragments: 0,
      explorationObjectives: [],
      gardenEvents: [],
      gardenOpenedChests: [],
      gardenSecrets: [],
      gardenCollectedLoot: [],
    },
  };
}
export function MissionPracticeScreen() {
  return (
    <ArchiveAccess>
      {(snapshot) => (
        <MissionPractice
          key={snapshot.traveler.id}
          source={snapshot.traveler}
        />
      )}
    </ArchiveAccess>
  );
}
type Stage =
  | 'opening'
  | 'reading'
  | 'comprehension'
  | 'reflection'
  | 'explore'
  | 'quiz'
  | 'finished';
export function MissionPractice({ source }: { source: Traveler }) {
  const [traveler, setTraveler] = useState(() =>
    missionPracticeTraveler(source),
  );
  const [stage, setStage] = useState<Stage>('opening');
  const [attempt, setAttempt] = useState(1);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const applyUpdate = useCallback((recipe: (current: Traveler) => Traveler) => {
    // Only transient progress can change. Never forward recipes to persistence.
    setTraveler((current) => ({
      ...current,
      progress: recipe(current).progress,
    }));
  }, []);
  const questions = createGardenQuizSession(attempt),
    question = questions[index];
  const reset = () => {
    setTraveler(missionPracticeTraveler(source));
    setStage('opening');
    setAttempt((a) => a + 1);
    setIndex(0);
    setScore(0);
    setSelected(null);
  };
  return (
    <article
      data-mission-mode="demonstration"
      data-practice-stage={stage}
      className={styles.phasePresentation}
    >
      <div className={`${styles.phaseBanner} ${styles.gardenBanner}`}>
        <span className={styles.bannerLabel}>
          ATO I · AS ORIGENS · FASE 1.1
        </span>
      </div>
      <div className={styles.phaseDetails}>
        <p className={styles.eyebrow}>MISSÕES · DEMONSTRAÇÃO SEM PROGRESSÃO</p>
        <h1>{GARDEN.title}</h1>
        <p role="note">
          Exercício somente na memória desta tela. Sair ou recarregar descarta
          as respostas. Não salva conclusão, Diário ou progresso e não concede
          XP, moedas, itens ou cartas.
        </p>
        <p>
          Missão individual: não exige participação nem aprovação da Guilda.
          Oração e reflexão não recebem nota nem medem espiritualidade.
        </p>
        {stage === 'opening' && (
          <>
            <p>{GARDEN_CONTENT.opening}</p>
            <p>{GARDEN_CONTENT.context}</p>
            <p>
              O Viajante, a exploração e os Fragmentos de Sabedoria são ficção
              de jogo; não alteram o relato bíblico.
            </p>
            <button
              className={styles.primaryLink}
              onClick={() => setStage('reading')}
            >
              Iniciar demonstração →
            </button>
          </>
        )}
        {stage === 'reading' && (
          <BibleReading
            demonstration
            traveler={traveler}
            onUpdate={applyUpdate}
            onComplete={() => setStage('comprehension')}
          />
        )}
        {stage === 'comprehension' && (
          <ReadingComprehension
            demonstration
            traveler={traveler}
            onUpdate={applyUpdate}
            onComplete={() => setStage('reflection')}
          />
        )}
        {stage === 'reflection' && (
          <Devotional
            demonstration
            traveler={traveler}
            onUpdate={applyUpdate}
            onComplete={() => setStage('explore')}
          />
        )}
        {stage === 'explore' && (
          <>
            <p>
              Exploração demonstrativa: encontre os três objetivos existentes.
              Coletas, baús e equipamentos permanecem bloqueados.
            </p>
            <GardenExploration
              demonstration
              traveler={traveler}
              onUpdate={applyUpdate}
              onComplete={() => setStage('quiz')}
            />
          </>
        )}
        {stage === 'quiz' && question && (
          <section
            className={styles.quizPanel}
            aria-labelledby="practice-question"
          >
            <p className={styles.phaseLead}>
              Quiz bíblico · exercício {index + 1}/5
            </p>
            <h2 id="practice-question">{question.question}</h2>
            <div className={styles.choiceGrid}>
              {question.options.map((option) => (
                <button
                  key={option.id}
                  className={styles.choiceCard}
                  disabled={selected !== null}
                  onClick={() => setSelected(option.id)}
                >
                  {option.text}
                </button>
              ))}
            </div>
            {selected !== null && (
              <div className={styles.quizFeedback} role="status">
                <strong>
                  {selected === question.correctOptionId
                    ? 'Resposta correta.'
                    : 'Resposta incorreta.'}
                </strong>
                <p>{question.explanation}</p>
                <small>Referência: {question.reference}</small>
                <a
                  href={bibleLinkForReference(question.reference).url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir na Bíblia ↗
                </a>
                <button
                  className={styles.primaryLink}
                  onClick={() => {
                    setScore(
                      (s) => s + Number(selected === question.correctOptionId),
                    );
                    setSelected(null);
                    if (index === questions.length - 1) setStage('finished');
                    else setIndex((i) => i + 1);
                  }}
                >
                  Próxima →
                </button>
              </div>
            )}
          </section>
        )}
        {stage === 'finished' && (
          <section aria-label="Resultado da demonstração">
            <h2>Exercício encerrado</h2>
            <p>
              Quiz nesta execução: {score}/5. Esse resultado verifica
              compreensão textual; não mede fé.
            </p>
            <p>
              Nenhuma fase foi concluída ou desbloqueada. Seu progresso oficial
              continua preservado. Vídeo, conclusão persistida e recompensas
              permanecem bloqueados.
            </p>
            <p>
              Fuga da Serpente aguarda a entrega de minigames, independente
              deste exercício.
            </p>
          </section>
        )}
        {stage !== 'opening' && (
          <button onClick={reset}>Reiniciar demonstração</button>
        )}
        <p>
          <Link href="/journey/diary">Consultar Diário existente →</Link>
        </p>
      </div>
    </article>
  );
}
