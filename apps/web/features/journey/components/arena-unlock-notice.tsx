import { arenaSpecials } from '@rpg/game-engine';
import { ArenaFx } from './arena-stage';
import styles from '../journey.module.css';
import { arenaStageVariables } from '../data/arenaPresentation';

/** The caller provides a real granted level transition; previews are explicitly labelled. */
export function ArenaUnlockNotice({
  before,
  after,
  preview = false,
}: {
  before: number;
  after: number;
  preview?: boolean;
}) {
  return (
    <aside
      className={styles.arenaLevelNotice}
      data-arena-unlock="true"
      role="status"
      style={{
        ...arenaStageVariables(),
        position: 'relative',
        isolation: 'isolate',
      }}
    >
      <ArenaFx kind="level-up-burst" />
      <b>NÍVEL {after}</b>
      {preview && <p>DEV FIXTURE · nenhum desbloqueio salvo</p>}
      {arenaSpecials
        .filter((s) => s.minimumLevel > before && s.minimumLevel <= after)
        .map((s) => (
          <div key={s.id} style={{ position: 'relative' }}>
            <strong>NOVA HABILIDADE DESBLOQUEADA</strong>
            <h3>{s.name}</h3>
            <p>
              {s.type === 'OFFENSIVE'
                ? 'Ofensivo'
                : s.type === 'DEFENSIVE'
                  ? 'Defensivo'
                  : 'Tático'}{' '}
              · {s.focusCost} Foco
            </p>
            <details>
              <summary>Ver habilidade</summary>
              <p>{s.description}</p>
            </details>
          </div>
        ))}
    </aside>
  );
}
