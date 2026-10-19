'use client';
import { gameAudio } from '../audio/audio-manager';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Shell, RequireTraveler } from '../components/shell';
import {
  BibleReading,
  ReadingComprehension,
} from '../components/bible-reading';
import { Devotional } from '../components/devotional';
import { GardenExploration } from '../components/garden-exploration';
import { SnakeChaseGame } from '../components/snake-chase-game';
import {
  GARDEN,
  GARDEN_CONTENT,
  JOURNEY_ROUTES as routes,
} from '../data/campaign';
import { bibleLinkForReference } from '../data/bibleLinks';
import { getGameplayAvatarPortrait } from '../data/gameplayAvatarPortrait';
import { createGardenQuizSession } from '../data/gardenQuiz';
import { resolveGardenStep, type GardenStep } from '../data/phaseProgress';
import { updateTraveler, useJourney } from '../state/use-journey';
import { findStory, storyRoute } from '../../story/catalog';
import { StoryVideoPanel } from '../../story/video-panel';
import styles from '../journey.module.css';

export function PhaseScreen() {
  const journey = useJourney();
  const savedProgress =
    journey.status === 'ready' ? journey.traveler.progress : undefined;
  const [step, setStep] = useState<GardenStep>(() =>
    resolveGardenStep(savedProgress),
  );
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [quizAttemptId, setQuizAttemptId] = useState(
    Math.max(1, savedProgress?.quizAttemptId ?? 1),
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const quizQuestions = useMemo(
    () => createGardenQuizSession(quizAttemptId),
    [quizAttemptId],
  );
  const question = quizQuestions[questionIndex];

  useEffect(() => {
    if (!savedProgress || progressHydrated) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setStep(resolveGardenStep(savedProgress));
      setQuizAttemptId(Math.max(1, savedProgress.quizAttemptId));
      setProgressHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [progressHydrated, savedProgress]);

  const next = (nextStep: GardenStep) => {
    if (nextStep === 'reward') gameAudio.playEffect('victory');
    setSelectedOptionId(null);
    setStep(nextStep);
    updateTraveler((traveler) => ({
      ...traveler,
      progress: { ...traveler.progress, gardenStep: nextStep },
    }));
  };

  const startQuiz = () => {
    let attempt = quizAttemptId + 1;
    updateTraveler((traveler) => {
      attempt = traveler.progress.quizAttemptId + 1;
      return {
        ...traveler,
        progress: {
          ...traveler.progress,
          gardenStep: 'quiz',
          quizAttemptId: attempt,
        },
      };
    });
    setQuizAttemptId(attempt);
    setQuestionIndex(0);
    setScore(0);
    setSelectedOptionId(null);
    setStep('quiz');
  };

  return (
    <Shell
      back={step === 'opening' ? routes.origins : undefined}
      backLabel="Voltar a As Origens"
    >
      <RequireTraveler>
        {(traveler) => {
          const gameplayPortrait = getGameplayAvatarPortrait(traveler);
          return (
            <section
              data-mobile-screen="phase"
              data-phase-step={step}
              className={`${styles.phasePresentation} ${step === 'explore' ? styles.phaseExploring : ''}`}
            >
              <div className={`${styles.phaseBanner} ${styles.gardenBanner}`}>
                <span className={styles.bannerLabel}>
                  ATO I · AS ORIGENS · FASE 1.1
                </span>
              </div>
              <div className={styles.phaseDetails}>
                <p className={styles.eyebrow}>
                  GÊNESIS 2–3 ·{' '}
                  {traveler.progress.gardenCompleted
                    ? 'ATIVIDADES REGISTRADAS · HISTÓRICO PRESERVADO'
                    : 'AVENTURA EM ANDAMENTO'}
                </p>
                <h1>{step === 'done' ? 'Caminho registrado' : GARDEN.title}</h1>

                {step === 'opening' && (
                  <>
                    <p className={styles.phaseLead}>O Jardim e a Escolha</p>
                    <p>{GARDEN_CONTENT.opening}</p>
                    <p className={styles.micro}>
                      Exploração · Leitura bíblica · Devocional · Fuga da
                      Serpente · Quiz
                    </p>
                    <button
                      className={styles.primaryLink}
                      onClick={() => next('explore')}
                    >
                      Entrar no jardim →
                    </button>
                  </>
                )}

                {step === 'explore' && (
                  <GardenExploration
                    key={traveler.id}
                    traveler={traveler}
                    onComplete={() => next('reading')}
                  />
                )}
                {step === 'reading' && (
                  <BibleReading
                    traveler={traveler}
                    onComplete={() => next('comprehension')}
                  />
                )}
                {step === 'comprehension' && (
                  <ReadingComprehension
                    traveler={traveler}
                    onComplete={() => next('context')}
                  />
                )}

                {step === 'context' && (
                  <>
                    <p className={styles.phaseLead}>Contexto bíblico</p>
                    <p>{GARDEN_CONTENT.context}</p>
                    <p className={styles.micro}>
                      CANÔNICO: Gênesis 2–3 · INTERPRETATIVO: enquadramento do
                      Viajante
                    </p>
                    <button
                      className={styles.primaryLink}
                      onClick={() => next('reflection')}
                    >
                      Continuar para o Devocional →
                    </button>
                  </>
                )}

                {step === 'reflection' && (
                  <Devotional
                    traveler={traveler}
                    onComplete={() => next('mission')}
                  />
                )}

                {step === 'mission' && (
                  <>
                    <p className={styles.phaseLead}>
                      Missão: Escolhas e Responsabilidade
                    </p>
                    <p>
                      Observe uma decisão cotidiana: qual liberdade existe, que
                      orientação pode ajudar e quem poderá ser afetado? Seu
                      registro devocional permanece privado.
                    </p>
                    <button
                      className={styles.primaryLink}
                      onClick={() => next('snake')}
                    >
                      Continuar para o Grande Desafio →
                    </button>
                  </>
                )}

                {step === 'snake' && (
                  <SnakeChaseGame
                    key={traveler.id}
                    portrait={gameplayPortrait}
                    tutorialCompleted={traveler.progress.snakeTutorialCompleted}
                    onTutorialComplete={() =>
                      updateTraveler((current) => ({
                        ...current,
                        progress: {
                          ...current.progress,
                          snakeTutorialCompleted: true,
                        },
                      }))
                    }
                    onComplete={startQuiz}
                  />
                )}

                {step === 'quiz' && question && (
                  <section
                    className={styles.quizPanel}
                    aria-labelledby="quiz-question"
                  >
                    <p className={styles.phaseLead}>
                      Quiz bíblico · {questionIndex + 1}/5
                    </p>
                    <p id="quiz-question">{question.question}</p>
                    <div className={styles.choiceGrid}>
                      {question.options.map((option, optionIndex) => (
                        <button
                          key={option.id}
                          className={styles.choiceCard}
                          disabled={selectedOptionId !== null}
                          onClick={() => setSelectedOptionId(option.id)}
                        >
                          <span>{String.fromCharCode(65 + optionIndex)}</span>{' '}
                          {option.text}
                        </button>
                      ))}
                    </div>
                    {selectedOptionId !== null && (
                      <div className={styles.quizFeedback} role="status">
                        <strong>
                          {selectedOptionId === question.correctOptionId
                            ? 'Resposta correta.'
                            : 'Resposta incorreta.'}
                        </strong>
                        <p>{question.explanation}</p>
                        <small>Referência: {question.reference}</small>
                        <div>
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
                              const nextScore =
                                score +
                                Number(
                                  selectedOptionId === question.correctOptionId,
                                );
                              setScore(nextScore);
                              if (questionIndex === 4) next('video');
                              else {
                                setQuestionIndex((index) => index + 1);
                                setSelectedOptionId(null);
                              }
                            }}
                          >
                            Próxima →
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {['video', 'reward', 'diary'].includes(step) && (
                  <>
                    <StoryVideoPanel
                      video={findStory('garden-choice')!.video}
                      completed={false}
                    />
                    <p>
                      Quiz nesta sessão: {score}/5. Suas atividades foram
                      preservadas. A conclusão e a recompensa aguardam o vídeo
                      obrigatório e a integração segura.
                    </p>
                    <Link
                      className={styles.primaryLink}
                      href={storyRoute('garden-choice')}
                    >
                      Ver requisitos da história →
                    </Link>
                  </>
                )}

                {step === 'done' && (
                  <>
                    <p className={styles.phaseLead}>
                      Seu histórico de atividades foi preservado.
                    </p>
                    <p>
                      Você pode rejogar para observar novas rotas; a recompensa
                      principal não duplica.
                    </p>
                    <div className={styles.guildGateNotice}>
                      <strong>CONTINUE NO MODO HISTÓRIA</strong>
                      <span>
                        A progressão é individual. Consulte os novos requisitos
                        e o vídeo obrigatório; seu registro anterior não foi
                        apagado.
                      </span>
                      <Link href={storyRoute('garden-choice')}>
                        Ver história e requisitos →
                      </Link>
                    </div>
                    <Link href={routes.map} className={styles.primaryLink}>
                      Voltar ao mapa →
                    </Link>
                  </>
                )}
              </div>
            </section>
          );
        }}
      </RequireTraveler>
    </Shell>
  );
}
