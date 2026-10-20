import {
  validateArenaDeck,
  type ArenaCard,
  type BattleState,
} from '@rpg/game-engine';
import {
  arenaDeckStorage,
  createArenaDeckStorage,
} from '../arena-deck/storage';
import { TOWER_FLOORS, TOWER_VERSION } from './config';
const battleStore = createArenaDeckStorage('tower-local');
type Receipt = {
  floorId: string;
  battleId: string;
  outcome: 'victory' | 'defeat';
};
export type TowerProgress = {
  version: 1;
  authority: 'local-demo';
  config: string;
  owner: string;
  traveler: string;
  revision: number;
  wins: Receipt[];
  active: { floorId: string; battleId: string } | null;
  last: Receipt | null;
};
const key = (owner: string, traveler: string) =>
  'rpg-jovem-cristao:arena-tower:v1:' +
  encodeURIComponent(JSON.stringify([owner, traveler]));
const fail = () =>
  new Error(
    'O checkpoint local da Torre não pôde ser confirmado. Os dados foram preservados para revisão.',
  );
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
const id = (x: unknown): x is string =>
  typeof x === 'string' && x.length > 0 && x.length <= 100;
const receipt = (x: unknown): x is Receipt =>
  object(x) &&
  id(x.battleId) &&
  TOWER_FLOORS.some((f) => f.id === x.floorId) &&
  ['victory', 'defeat'].includes(String(x.outcome));
function read(owner: string, traveler: string): TowerProgress {
  if (!id(owner) || !id(traveler)) throw fail();
  const raw = localStorage.getItem(key(owner, traveler));
  if (!raw)
    return {
      version: 1,
      authority: 'local-demo',
      config: TOWER_VERSION,
      owner,
      traveler,
      revision: 0,
      wins: [],
      active: null,
      last: null,
    };
  if (raw.length > 16000) throw fail();
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    throw fail();
  }
  if (
    !object(v) ||
    v.version !== 1 ||
    v.authority !== 'local-demo' ||
    v.config !== TOWER_VERSION ||
    v.owner !== owner ||
    v.traveler !== traveler ||
    !Number.isSafeInteger(v.revision) ||
    Number(v.revision) < 0 ||
    !Array.isArray(v.wins) ||
    v.wins.length > 7 ||
    v.wins.some(
      (r, i) =>
        !receipt(r) ||
        r.outcome !== 'victory' ||
        r.floorId !== TOWER_FLOORS[i].id,
    ) ||
    new Set(v.wins.map((r) => (r as Receipt).battleId)).size !==
      v.wins.length ||
    (v.last !== null && !receipt(v.last))
  )
    throw fail();
  if (
    v.active !== null &&
    (!object(v.active) ||
      !id(v.active.battleId) ||
      v.active.floorId !== TOWER_FLOORS[v.wins.length]?.id ||
      v.wins.some(
        (r) =>
          (r as Receipt).battleId ===
          (v.active as Record<string, unknown>).battleId,
      ))
  )
    throw fail();
  if (
    v.last &&
    receipt(v.last) &&
    (v.last.outcome === 'victory'
      ? (v.wins.at(-1) as Receipt | undefined)?.battleId !== v.last.battleId
      : v.last.floorId !== TOWER_FLOORS[v.wins.length]?.id)
  )
    throw fail();
  return v as TowerProgress;
}
function write(v: TowerProgress) {
  try {
    localStorage.setItem(key(v.owner, v.traveler), JSON.stringify(v));
  } catch {
    throw new Error(
      'Não foi possível salvar o progresso local da Torre. O combate salvo permanece pendente; recarregue para revisar.',
    );
  }
}
async function lock<T>(
  owner: string,
  traveler: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!navigator.locks?.request)
    return Promise.reject(
      new Error(
        'Este navegador não oferece coordenação para os checkpoints da Torre.',
      ),
    );
  return await navigator.locks.request(
    key(owner, traveler),
    { mode: 'exclusive' },
    fn,
  );
}
function completed(v: TowerProgress, battleId: string) {
  return (
    v.wins.some((r) => r.battleId === battleId) || v.last?.battleId === battleId
  );
}
function checkBattle(v: TowerProgress, b: BattleState) {
  const floor = TOWER_FLOORS[v.wins.length];
  if (
    !floor ||
    b.player.snapshot.id !== v.traveler ||
    JSON.stringify(b.opponent.snapshot) !== JSON.stringify(floor.snapshot)
  )
    throw fail();
}
export function loadTower(
  owner: string,
  traveler: string,
  cards: readonly ArenaCard[],
) {
  const progress = read(owner, traveler);
  const saved = battleStore.load(owner, traveler, cards).battle;
  if (progress.active && (!saved || saved.id !== progress.active.battleId))
    throw fail();
  const battle = saved && !completed(progress, saved.id) ? saved : null;
  if (battle) checkBattle(progress, battle);
  if (progress.active && !battle) throw fail();
  // A journal written before a failed progress write is recoverable explicitly.
  return {
    progress,
    battle,
    recovery: !!battle && !progress.active,
    selection: arenaDeckStorage.load(owner, traveler, cards).selection,
  };
}
export function recoverTower(
  owner: string,
  traveler: string,
  cards: readonly ArenaCard[],
) {
  return lock(owner, traveler, async () => {
    const view = loadTower(owner, traveler, cards);
    if (view.recovery && view.battle)
      write({
        ...view.progress,
        revision: view.progress.revision + 1,
        active: {
          floorId: view.battle.opponent.snapshot.id,
          battleId: view.battle.id,
        },
      });
  });
}
export function finishTower(
  owner: string,
  traveler: string,
  cards: readonly ArenaCard[],
  battleId: string,
) {
  return lock(owner, traveler, async () => {
    const v = read(owner, traveler);
    if (completed(v, battleId)) return v;
    const view = loadTower(owner, traveler, cards);
    const b = view.battle;
    if (
      !b ||
      !v.active ||
      b.id !== battleId ||
      v.active.battleId !== battleId ||
      b.status !== 'finished'
    )
      throw new Error(
        'Resultado local ainda pendente de conclusão ou identidade incorreta.',
      );
    const result: Receipt = {
      floorId: b.opponent.snapshot.id,
      battleId: b.id,
      outcome: b.winnerId === traveler ? 'victory' : 'defeat',
    };
    const next = {
      ...v,
      revision: v.revision + 1,
      active: null,
      last: result,
      wins: result.outcome === 'victory' ? [...v.wins, result] : v.wins,
    };
    write(next);
    return next;
  });
}
export function towerArenaSession(floorIndex: number): typeof arenaDeckStorage {
  return {
    load: (owner, traveler, cards) => {
      const view = loadTower(owner, traveler, cards);
      return {
        selection: view.selection,
        battle: view.battle,
        settlementStarted: false,
      };
    },
    save: async () => {
      throw new Error(
        'Use Meu Baralho entre batalhas; o snapshot desta batalha não pode ser trocado.',
      );
    },
    begin: (owner, traveler, cards, player, opponent) =>
      lock(owner, traveler, async () => {
        const view = loadTower(owner, traveler, cards);
        const floor = TOWER_FLOORS[floorIndex];
        if (
          !floor ||
          view.progress.wins.length !== floorIndex ||
          view.battle ||
          player.id !== traveler ||
          JSON.stringify(opponent) !== JSON.stringify(floor.snapshot)
        )
          throw new Error(
            'Andar bloqueado ou combate já salvo. Retome o checkpoint atual.',
          );
        if (validateArenaDeck(view.selection, cards))
          throw new Error(
            'A Torre exige sete cartas válidas, possuídas e diferentes.',
          );
        await battleStore.save(owner, traveler, cards, view.selection);
        const battle = await battleStore.begin(
          owner,
          traveler,
          cards,
          player,
          floor.snapshot,
        );
        write({
          ...view.progress,
          revision: view.progress.revision + 1,
          active: { floorId: floor.id, battleId: battle.id },
        });
        return battle;
      }),
    command: (owner, traveler, cards, battleId, round, action) =>
      lock(owner, traveler, async () => {
        const v = read(owner, traveler);
        if (
          v.wins.length !== floorIndex ||
          !v.active ||
          v.active.battleId !== battleId
        )
          throw fail();
        const view = loadTower(owner, traveler, cards);
        if (!view.battle || view.recovery) throw fail();
        return battleStore.command(
          owner,
          traveler,
          cards,
          battleId,
          round,
          action,
        );
      }),
    // This modality has no economic authority. Never claim training rewards.
    claimSettlement: async () => false,
  };
}
