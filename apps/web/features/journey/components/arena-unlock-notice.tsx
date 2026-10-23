import { arenaSpecials, describeArenaAction } from '@rpg/game-engine';
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
        .filter((special) => !special.cardOnly)
        .filter((s) => s.minimumLevel > before && s.minimumLevel <= after)
        .map((s) => (
          <div key={s.id} style={{ position: 'relative' }}>
            <strong>REQUISITO DE NÍVEL ATINGIDO</strong>
            <h3>{s.name}</h3>
            <p>
              Para usar este efeito na Arena, adquira uma carta homologada
              correspondente e selecione-a no baralho. O nível não concede a
              carta.
            </p>
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
              <p>{describeArenaAction(`special:${s.id}`).explanation}</p>
              <p>Duração: {describeArenaAction(`special:${s.id}`).duration}</p>
            </details>
          </div>
        ))}
    </aside>
  );
}
