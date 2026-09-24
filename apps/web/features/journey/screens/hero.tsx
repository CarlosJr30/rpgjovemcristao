'use client';
import Link from 'next/link';
import { Shell, RequireTraveler } from '../components/shell';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { EquippedAvatar } from '../components/equipped-avatar';
import styles from '../journey.module.css';
import { EquipmentStatus, equipmentStateClass } from '../components/equipment-status';
import { MAX_LEVEL, TRAVELER_CURRENCY_NAME, nextUnlock, xpForLevel } from '../data/progression';
import { ATTRIBUTE_KEYS } from '../domain/traveler';
import { ATTRIBUTE_LABELS, calculateTotalAttributes } from '../data/attributes';
const slotMeta = [
  ['helmet', 'ELMO', 'head'],
  ['armor', 'ARMADURA', 'body'],
  ['weapon', 'ARMA', 'weapon'],
  ['shield', 'ESCUDO', 'shield'],
  ['boots', 'BOTAS', 'boots'],
  ['amulet', 'MEDALHÃO', 'amulet'],
] as const;
export function HeroScreen() {
  return (
    <Shell back={routes.map} backLabel="Voltar à Jornada">
      <RequireTraveler>
        {(t) => {
          const attributes = calculateTotalAttributes(t);
          const equipped = (slot: string) => {
            const id = t.equipped[slot as keyof typeof t.equipped];
            return t.inventory.find((item) => item.id === id);
          };
          return (
            <section className={styles.heroHub}>
              <div className={styles.heroWorld}>
                <header className={styles.heroTop}>
                  <div>
                    <span className={styles.heroKicker}>
                      SANTUÁRIO DO VIAJANTE
                    </span>
                    <h1>{t.name}</h1>
                    <p>Viajante · Nível {t.level}</p>
                  </div>
                  <div className={styles.heroStats}>
                    <span>◈ {t.coins} {TRAVELER_CURRENCY_NAME}</span>
                    <span>XP {t.xp} / {t.level < MAX_LEVEL ? xpForLevel(t.level + 1) : 'MÁX.'}</span>
                  </div>
                </header>
                <p role="status" className={styles.stageHint}>
                  Nível {t.level} · {t.level < MAX_LEVEL ? `Próximo nível: ${t.level + 1} (${xpForLevel(t.level + 1) - t.xp} XP restantes)` : 'Nível máximo'}
                  {' · '}
                  {nextUnlock(t.level) ? `Próximo desbloqueio: nível ${nextUnlock(t.level)?.level} · ${nextUnlock(t.level)?.label}` : 'Todos os marcos de nível alcançados'}
                </p>
                <label className={styles.stageHint} htmlFor="hero-xp-progress">Progresso para o próximo nível</label>
                <progress id="hero-xp-progress" max={t.level < MAX_LEVEL ? xpForLevel(t.level + 1) - xpForLevel(t.level) : 1} value={t.level < MAX_LEVEL ? t.xp - xpForLevel(t.level) : 1} />
                <div className={styles.heroStage}>
                  <div className={styles.equipmentRing}>
                    {slotMeta.map(([slot, label, kind]) => (
                      <div
                        key={slot}
                        className={
                          styles.ringSlot +
                          ' ' +
                          styles['ring' + kind[0].toUpperCase() + kind.slice(1)] +
                          ' ' +
                          equipmentStateClass(Boolean(equipped(slot)))
                        }
                      >
                        <span className={styles.slotGlyph}>
                          {kind === 'weapon'
                            ? '╱'
                            : kind === 'shield'
                              ? '◈'
                              : kind === 'head'
                                ? '⌃'
                                : kind === 'body'
                                  ? '◆'
                                  : kind === 'boots'
                                    ? '∪'
                                    : '✧'}
                        </span>
                        <small>{label}</small>
                        {equipped(slot) && <strong>{equipped(slot)?.name}</strong>}
                        <EquipmentStatus equipped={Boolean(equipped(slot))} item={equipped(slot)} />
                      </div>
                    ))}
                  </div>
                  <div className={styles.heroAvatar}>
                    <span className={styles.avatarAura} />
                    <EquippedAvatar traveler={t} />
                    <span className={styles.heroShadow} />
                  </div>
                </div>
                <p className={styles.heroEquipmentNote}>Itens com camada compatível aparecem no Avatar. <Link href={routes.equipment}>Gerenciar equipamentos →</Link></p>
                <div className={styles.heroBottom}>
                  <section>
                    <span className={styles.panelLabel}>ATRIBUTOS</span>
                    <div className={styles.statStrip}>
                      {ATTRIBUTE_KEYS.map((key) => (
                        <div key={key} data-attribute={key} title={`Base: ${attributes.base[key]} · Equipamentos: +${attributes.equipment[key]} · Progressão: +${attributes.progression[key]} · Temporário: +${attributes.temporary[key]}`}>
                          <b>{ATTRIBUTE_LABELS[key].toUpperCase()}</b>
                          <strong>
                            {attributes.total[key]}
                          </strong>
                          <small>Base {attributes.base[key]} · Equip. +{attributes.equipment[key]}</small>
                          <span className={styles.statLine} />
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className={styles.questDeck}>
                    <article>
                      <span>DEVOCIONAL</span>
                      <b>Meu Diário de Jornada</b>
                      <Link href={routes.diary}>Continuar →</Link>
                    </article>
                    <article>
                      <span>GUILDA</span>
                      <b>Desafio atual</b>
                      <Link href={routes.guild}>Ver status →</Link>
                    </article>
                    <article>
                      <span>JORNADA</span>
                      <b>O Jardim e a Escolha</b>
                      <Link href={routes.garden}>Entrar →</Link>
                    </article>
                  </section>
                </div>
              </div>
            </section>
          );
        }}
      </RequireTraveler>
    </Shell>
  );
}
