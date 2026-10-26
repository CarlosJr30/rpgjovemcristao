import Link from 'next/link';
import type { Traveler } from '../journey/domain/traveler';
import { ATTRIBUTE_KEYS } from '../journey/domain/traveler';
import {
  ATTRIBUTE_LABELS,
  calculateTotalAttributes,
} from '../journey/data/attributes';
import {
  MAX_LEVEL,
  xpForLevel,
  TRAVELER_CURRENCY_NAME,
} from '../journey/data/progression';
import { AvatarRuntime } from '../journey/components/avatar-runtime';
import styles from '../journey/journey.module.css';
import css from './release.module.css';

// Original HeroScreen presentation, with current data/rendering and no game actions.
const slots = [
  ['helmet', 'ELMO', 'Head', '⌃'],
  ['armor', 'ARMADURA', 'Body', '◆'],
  ['weapon', 'ARMA', 'Weapon', '╱'],
  ['shield', 'ESCUDO', 'Shield', '◈'],
  ['boots', 'BOTAS', 'Boots', '∪'],
  ['amulet', 'MEDALHÃO', 'Amulet', '✧'],
] as const;

export function ReleasedSanctuary({
  traveler,
  home = false,
}: {
  traveler: Traveler;
  home?: boolean;
}) {
  const attributes = calculateTotalAttributes(traveler);
  const nextLevel =
    traveler.level < MAX_LEVEL ? xpForLevel(traveler.level + 1) : traveler.xp;
  return (
    <section
      className={styles.heroHub}
      aria-label={home ? 'Seu Viajante' : 'Meu avatar'}
    >
      <div className={styles.heroWorld}>
        <header className={styles.heroTop}>
          <div>
            <span className={styles.heroKicker}>SANTUÁRIO DO VIAJANTE</span>
            {home ? <h2>{traveler.name}</h2> : <h1>{traveler.name}</h1>}
            <p>Viajante · Nível {traveler.level}</p>
          </div>
          <div className={styles.heroStats}>
            <span>
              ◈ {traveler.coins} {TRAVELER_CURRENCY_NAME}
            </span>
            <span>
              XP {traveler.xp} /{' '}
              {traveler.level < MAX_LEVEL ? nextLevel : 'MÁX.'}
            </span>
          </div>
        </header>
        <label className={styles.stageHint} htmlFor="released-hero-progress">
          Progresso para o próximo nível
        </label>
        <progress
          id="released-hero-progress"
          max={Math.max(1, nextLevel - xpForLevel(traveler.level))}
          value={
            traveler.level < MAX_LEVEL
              ? traveler.xp - xpForLevel(traveler.level)
              : 1
          }
        />
        <div className={styles.heroStage}>
          <div className={styles.equipmentRing}>
            {slots.map(([slot, label, position, glyph]) => {
              const item = traveler.inventory.find(
                (item) => item.id === traveler.equipped[slot],
              );
              return (
                <div
                  key={slot}
                  className={`${styles.ringSlot} ${styles['ring' + position]}`}
                >
                  <span className={styles.slotGlyph} aria-hidden="true">
                    {glyph}
                  </span>
                  <small>{label}</small>
                  <strong>{item?.name ?? 'Sem equipamento'}</strong>
                </div>
              );
            })}
          </div>
          <div className={styles.heroAvatar}>
            <span className={styles.avatarAura} aria-hidden="true" />
            <AvatarRuntime
              traveler={traveler}
              className={css.sanctuaryAvatar}
            />
            <span className={styles.heroShadow} aria-hidden="true" />
          </div>
        </div>
        <p className={styles.heroEquipmentNote}>
          <Link href="/journey/equipment">Gerenciar equipamentos →</Link>
        </p>
        <div className={styles.heroBottom}>
          <section>
            <span className={styles.panelLabel}>ATRIBUTOS</span>
            <dl className={styles.statStrip} aria-label="Atributos do Viajante">
              {ATTRIBUTE_KEYS.map((key) => (
                <div key={key}>
                  <dt>{ATTRIBUTE_LABELS[key]}</dt>
                  <dd>{attributes.total[key]}</dd>
                  <small>
                    Base {attributes.base[key]} · Equip. +
                    {attributes.equipment[key]}
                  </small>
                  <span className={styles.statLine} />
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </section>
  );
}
