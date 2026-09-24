'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@rpg/ui';
import { Shell, RequireTraveler } from '../components/shell';
import { Landscape } from '../components/landscape';
import { Avatar } from '../components/avatar';
import { finishIntroduction } from '../state/use-journey';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import styles from '../journey.module.css';
export function IntroScreen() {
  const router = useRouter();
  const [error, setError] = useState(false);
  return (
    <Shell>
      <RequireTraveler>
        {(traveler) => (
          <section className={styles.intro}>
            <Landscape className={styles.introLandscape} />
            <div className={styles.introContent}>
              <p className={styles.eyebrow}>
                BEM-VINDO AO CAMINHO, {traveler.name.toLocaleUpperCase('pt-BR')}
              </p>
              <h1>
                Toda grande jornada
                <br />
                começa com o<br />
                <em>primeiro passo.</em>
              </h1>
              <Avatar appearance={traveler.appearance} avatar={traveler.avatar} />
              <p>
                Há histórias esperando para serem descobertas.
                <br />O horizonte é só o começo.
              </p>
              <Button
                className={styles.primary}
                onClick={() => {
                  if (finishIntroduction()) router.push(routes.map);
                  else setError(true);
                }}
              >
                Entrar na jornada <span aria-hidden="true">→</span>
              </Button>
              {error && (
                <p className={styles.error} role="alert">
                  Não foi possível salvar seu primeiro passo. Tente novamente.
                </p>
              )}
            </div>
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
