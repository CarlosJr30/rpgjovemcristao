'use client';
import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { Shell, RequireTraveler } from '../components/shell';
import { CAMPAIGN, JOURNEY_ROUTES as routes } from '../data/campaign';
import styles from '../journey.module.css';
const positions = [
  { x: 13, y: 72 },
  { x: 32, y: 55 },
  { x: 23, y: 26 },
  { x: 45, y: 17 },
  { x: 55, y: 46 },
  { x: 68, y: 72 },
  { x: 81, y: 43 },
  { x: 88, y: 16 },
];
export function MapScreen() {
  const [list, setList] = useState(false);
  return (
    <Shell>
      <RequireTraveler>
        {(traveler) => (
          <section className={styles.mapSection}>
            <div className={styles.mapHeading}>
              <div>
                <p className={styles.eyebrow}>O MUNDO À SUA FRENTE</p>
                <h1>Mapa da jornada</h1>
                <p>Oito atos. Um caminho que começa com você.</p>
              </div>
              <button
                className={styles.viewToggle}
                aria-pressed={list}
                onClick={() => setList((value) => !value)}
              >
                {list ? '⌁ Ver mapa' : '☷ Ver em lista'}
              </button>
            </div>
            <div className={list ? styles.listMap : styles.journeyMap}>
              {!list && (
                <>
                  <svg
                    className={styles.mapTerrain}
                    viewBox="0 0 1000 620"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 100Q200 10 400 170T1000 100M0 500Q300 280 600 470T1000 400M100 620Q260 380 140 0M700 0Q600 250 1000 560"
                      stroke="#c4c6a4"
                      strokeWidth="60"
                      opacity=".22"
                      fill="none"
                    />
                    <path
                      d="M130 446C250 450 360 412 320 341S148 231 230 161 413 44 450 105 530 200 550 285 592 462 680 446 805 377 810 267 804 105 880 99"
                      stroke="#b6af8c"
                      strokeWidth="3"
                      strokeDasharray="5 9"
                      fill="none"
                    />
                    <path
                      d="m340 470 24-42 24 42m-7-1 27-58 28 58m267-332 26-53 26 53m-425 157 18-34 18 34"
                      stroke="#a7ad8d"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                  <span className={styles.mapCompass} aria-hidden="true">
                    N<br />✥<br />S
                  </span>
                  <span className={styles.mapRegion} aria-hidden="true">
                    TERRAS A DESCOBRIR
                  </span>
                </>
              )}
              <ol className={styles.actNodes} aria-label="Atos da campanha">
                {CAMPAIGN.map((act, index) => (
                  <li
                    key={act.id}
                    className={
                      act.status === 'available'
                        ? styles.availableNode
                        : styles.lockedNode
                    }
                    style={
                      {
                        '--x': `${positions[index].x}%`,
                        '--y': `${positions[index].y}%`,
                      } as CSSProperties
                    }
                  >
                    {act.status === 'available' ? (
                      <Link href={routes.origins} className={styles.actLink}>
                        <span className={styles.nodeIcon} aria-hidden="true">
                          ♧
                        </span>
                        <span className={styles.actText}>
                          <small>ATO {act.numeral}</small>
                          <strong>{act.title}</strong>
                          <span className={styles.availableLabel}>
                            Disponível <span aria-hidden="true">↗</span>
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <div
                        className={styles.lockedAct}
                        aria-label={`Ato ${act.numeral} — ${act.title} — Bloqueado`}
                      >
                        <span className={styles.nodeIcon} aria-hidden="true">
                          {act.numeral}
                        </span>
                        <span className={styles.actText}>
                          <small>ATO {act.numeral}</small>
                          <strong>{act.title}</strong>
                          <span className={styles.lockedLabel}>
                            ▣ Bloqueado
                          </span>
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              {!list && (
                <p className={styles.mapLegend}>
                  <span>◆ Você começa aqui</span>
                  <span>◈ Caminhos ainda não abertos</span>
                </p>
              )}
            </div>
            <div className={styles.mapFoot}>
              <span>SEU PRÓXIMO PASSO</span>
              <p>
                {traveler.progress.gardenCompleted && !traveler.progress.nextPhaseUnlocked
                  ? `${traveler.name}, a próxima fase aguarda o Desafio da Célula.`
                  : `${traveler.name}, as primeiras histórias esperam por você.`}
              </p>
              <Link href={traveler.progress.gardenCompleted && !traveler.progress.nextPhaseUnlocked ? routes.guild : routes.origins}>
                {traveler.progress.gardenCompleted && !traveler.progress.nextPhaseUnlocked ? 'Ver gate da Guilda →' : 'Explorar As Origens →'}
              </Link>
            </div>
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
