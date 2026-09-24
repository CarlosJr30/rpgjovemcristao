'use client';
import { useState } from 'react';
import { Shell, RequireTraveler } from '../components/shell';
import { GARDEN_CONTENT, JOURNEY_ROUTES as routes } from '../data/campaign';
import { saveDiaryEntry } from '../state/use-journey';
import { BIBLE_LINKS } from '../data/bibleLinks';
import { EquipmentBibleDetails } from '../components/equipment-bible-details';
import { equipmentAssetForItem } from '../data/avatarAssets';
import styles from '../journey.module.css';
export function DiaryScreen() {
  const [saved, setSaved] = useState(false);
  return (
    <Shell back={routes.map} backLabel="Voltar ao mapa">
      <RequireTraveler>
        {(traveler) => (
          <section className={styles.diarySection}>
            <p className={styles.eyebrow}>CADERNO DO VIAJANTE</p>
            <h1>Meu Diário de Jornada</h1>
            <p className={styles.phaseLead}>
              Um espaço de participação e memória. Suas respostas não são
              avaliadas.
            </p>
            <div className={styles.diaryEntry}>
              <p className={styles.eyebrow}>PASSAGEM · GÊNESIS 2–3</p>
              <p>{GARDEN_CONTENT.context}</p>
              <p><a className={styles.textLink} href={BIBLE_LINKS.genesis2.url} target="_blank" rel="noopener noreferrer">Abrir Gênesis 2 na Bíblia ↗</a></p>
              <p><a className={styles.textLink} href={BIBLE_LINKS.genesis3.url} target="_blank" rel="noopener noreferrer">Abrir Gênesis 3 na Bíblia ↗</a></p>
              <label htmlFor="reflection">
                Que sinal pode ajudar você a discernir uma escolha?
              </label>
              <textarea
                id="reflection"
                rows={4}
                placeholder="Escreva apenas se quiser."
              />
              <label htmlFor="application">
                Uma aplicação prática para esta semana
              </label>
              <textarea
                id="application"
                rows={3}
                placeholder="Registre seu próximo passo."
              />
              <button
                className={styles.primaryLink}
                onClick={() => {
                  if (saveDiaryEntry()) setSaved(true);
                }}
              >
                Salvar entrada
              </button>
              {saved && (
                <p className={styles.guildNotice}>
                  Entrada registrada. Obrigado por participar.
                </p>
              )}
            </div>
            <section className={styles.equipmentCodex} aria-labelledby="equipment-codex-title">
              <p className={styles.eyebrow}>CÓDICE</p>
              <h2 id="equipment-codex-title">Equipamentos &amp; Bíblia</h2>
              <p>Itens fictícios descobertos na jornada, com a inspiração bíblica de cada um.</p>
              <div className={styles.itemShelf}>
                {traveler.inventory.map((item) => (
                  <article className={styles.itemCard} key={item.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local item icon registry */}
                    <img className={styles.equipmentItemIcon} src={equipmentAssetForItem(item)} alt="" />
                    <h3>{item.name}</h3>
                    <EquipmentBibleDetails item={item} />
                  </article>
                ))}
              </div>
            </section>
            <p className={styles.micro}>
              Devocionais concluídos: {traveler.progress.diaryEntries} ·
              sequência: {traveler.progress.diaryEntries > 0 ? '1' : '0'} dia
            </p>
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
