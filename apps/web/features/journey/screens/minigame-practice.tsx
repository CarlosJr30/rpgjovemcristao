'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArchiveAccess } from '../../release-ebd/archive';
import { SnakeChaseGame } from '../components/snake-chase-game';
import { getGameplayAvatarPortrait } from '../data/gameplayAvatarPortrait';
import type { Traveler } from '../domain/traveler';
import styles from '../journey.module.css';

export function MinigamePracticeScreen() {
  return (
    <ArchiveAccess>
      {(snapshot) => (
        <MinigamePractice
          key={snapshot.traveler.id}
          traveler={snapshot.traveler}
        />
      )}
    </ArchiveAccess>
  );
}
export function MinigamePractice({ traveler }: { traveler: Traveler }) {
  const [tutorial, setTutorial] = useState(false);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(0);
  return (
    <article
      data-minigame-mode="demonstration"
      className={styles.phasePresentation}
    >
      <div className={`${styles.phaseBanner} ${styles.gardenBanner}`}>
        <span className={styles.bannerLabel}>
          ATO I · AS ORIGENS · GRANDE DESAFIO
        </span>
      </div>
      <div className={styles.phaseDetails}>
        <p className={styles.eyebrow}>FUGA DA SERPENTE · DEMONSTRAÇÃO</p>
        <h1>Fuga da Serpente</h1>
        <p>
          Partida somente na memória desta tela. Vitória, derrota, tutorial e
          reinício não salvam progresso nem concluem fases. Sem XP, moedas,
          itens, cartas ou recompensas.
        </p>
        <p>
          Ficção de jogo contextualizada em Gênesis 2–3: labirinto, perseguição,
          portal e maçãs não fazem parte do relato bíblico. As maçãs não
          identificam o fruto de Gênesis. O Viajante não substitui Adão ou Eva
          nem altera os acontecimentos.
        </p>
        {finished ? (
          <section aria-label="Resultado demonstrativo">
            <h2>Partida encerrada</h2>
            <p>
              Resultado apenas desta execução. Nenhuma fase ou missão foi
              concluída ou desbloqueada.
            </p>
            <button
              className={styles.primaryLink}
              onClick={() => {
                setFinished(false);
                setRound((r) => r + 1);
              }}
            >
              Jogar outra demonstração
            </button>
          </section>
        ) : (
          <SnakeChaseGame
            key={round}
            portrait={getGameplayAvatarPortrait(traveler)}
            tutorialCompleted={tutorial}
            onTutorialComplete={() => setTutorial(true)}
            onComplete={() => setFinished(true)}
            completionLabel="Encerrar demonstração →"
          />
        )}
        <p>
          <Link href="/journey">Voltar ao salão →</Link>
        </p>
      </div>
    </article>
  );
}
