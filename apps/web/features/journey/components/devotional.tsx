'use client';

import { useState } from 'react';
import type { Traveler } from '../domain/traveler';
import { updateTraveler } from '../state/use-journey';
import styles from '../journey.module.css';

export function Devotional({ traveler, onComplete }: { traveler: Traveler; onComplete: () => void }) {
  const [reflection, setReflection] = useState(traveler.progress.devotionalReflection);
  const [prayerVisible, setPrayerVisible] = useState(false);
  const canFinish = reflection.trim().length >= 3 && reflection.length <= 800;

  const finish = () => {
    if (!canFinish) return;
    updateTraveler((current) => ({
      ...current,
      progress: {
        ...current.progress,
        devotionalCompleted: true,
        devotionalReflection: reflection.trim(),
      },
    }));
    onComplete();
  };

  return (
    <section className={styles.devotionalPanel} aria-labelledby="devotional-title">
      <p className={styles.phaseLead}>Devocional</p>
      <h2 id="devotional-title">Escolhas, confiança e responsabilidade</h2>
      <p>Gênesis 2 apresenta liberdade acompanhada de cuidado e orientação. Gênesis 3 mostra que escolhas podem produzir consequências que alcançam relacionamentos, trabalho e o modo de enxergar a si mesmo.</p>
      <blockquote>Aplicação: antes de uma decisão, reconheça a liberdade que possui, a orientação disponível e as pessoas que podem ser afetadas.</blockquote>
      <label htmlFor="devotional-reflection">Depois da leitura, qual responsabilidade mais chamou sua atenção?</label>
      <textarea
        id="devotional-reflection"
        value={reflection}
        maxLength={800}
        rows={5}
        onChange={(event) => setReflection(event.target.value)}
        placeholder="Registre uma reflexão curta para o seu Diário privado."
      />
      <small>{reflection.length}/800 caracteres</small>
      <p className={styles.privateNotice}>Registro privado neste navegador. Não é enviado ao líder, não recebe nota e não mede espiritualidade.</p>
      <button type="button" className={styles.devotionalPrayerToggle} onClick={() => setPrayerVisible((value) => !value)}>
        {prayerVisible ? 'Fechar momento opcional de oração' : 'Reservar um momento de oração (opcional)'}
      </button>
      {prayerVisible && (
        <div className={styles.devotionalPrayer}>
          <strong>Oração opcional</strong>
          <p>Se desejar, ore por sabedoria para reconhecer responsabilidades e agir com confiança. Nenhum tempo ou conteúdo é registrado.</p>
        </div>
      )}
      <button className={styles.primaryLink} disabled={!canFinish} onClick={finish}>
        Salvar reflexão e continuar para a Missão →
      </button>
    </section>
  );
}
