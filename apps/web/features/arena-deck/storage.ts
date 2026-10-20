import {
  createArenaDeckBattle,
  resolveArenaCommand,
  equipmentEffects,
  isArenaCard,
  validateArenaDeck,
  type ArenaAction,
  type ArenaCard,
  type BattleParticipantSnapshot,
  type BattleState,
} from '@rpg/game-engine';
const PREFIX = 'rpg-jovem-cristao:arena-deck:v1:';
type Journal = {
  id: string;
  seed: number;
  player: BattleParticipantSnapshot;
  opponent: BattleParticipantSnapshot;
  ids: string[];
  signature: string;
  actions: ArenaAction[];
  settlementStarted: boolean;
};
type Stored = {
  version: 1;
  owner: string;
  traveler: string;
  selection: string[];
  journal: Journal | null;
};
export type DeckWorkspace = {
  selection: string[];
  battle: BattleState | null;
  settlementStarted: boolean;
};
const key = (owner: string, traveler: string) =>
  PREFIX + encodeURIComponent(JSON.stringify([owner, traveler]));
const fail = () =>
  new Error(
    'O estado local da Arena não pôde ser confirmado. Recarregue antes de continuar.',
  );
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
function snapshot(v: unknown): v is BattleParticipantSnapshot {
  if (
    !object(v) ||
    typeof v.id !== 'string' ||
    v.id.length > 100 ||
    typeof v.name !== 'string' ||
    v.name.length > 100 ||
    !Number.isSafeInteger(v.level) ||
    Number(v.level) < 1 ||
    Number(v.level) > 10000 ||
    !object(v.attributes) ||
    !Array.isArray(v.equipment) ||
    v.equipment.length > 100
  )
    return false;
  if (
    !['life', 'strength', 'defense', 'wisdom'].every(
      (k) =>
        typeof (v.attributes as Record<string, unknown>)[k] === 'number' &&
        Number.isFinite((v.attributes as Record<string, unknown>)[k]) &&
        Number((v.attributes as Record<string, unknown>)[k]) >= 0 &&
        Number((v.attributes as Record<string, unknown>)[k]) <= 100000,
    )
  )
    return false;
  if (
    !Number.isFinite(v.combatPower) ||
    Number(v.combatPower) < 0 ||
    Number(v.combatPower) > 10000000
  )
    return false;
  if (
    v.arenaProfile !== undefined &&
    !['agile', 'offensive', 'guardian', 'tactical'].includes(
      String(v.arenaProfile),
    )
  )
    return false;
  if (
    v.specialLoadout !== undefined &&
    (!Array.isArray(v.specialLoadout) ||
      v.specialLoadout.length > 4 ||
      v.specialLoadout.some(
        (s) =>
          ![
            'path-strike',
            'steadfast-guard',
            'discernment',
            'pilgrim-step',
          ].includes(String(s)),
      ))
  )
    return false;
  if (v.specialModifiers !== undefined && !object(v.specialModifiers))
    return false;
  return v.equipment.every(
    (e) =>
      object(e) &&
      typeof e.id === 'string' &&
      e.id.length <= 100 &&
      typeof e.name === 'string' &&
      e.name.length <= 100 &&
      Number.isFinite(e.power) &&
      Number(e.power) >= 0 &&
      Number(e.power) <= 100000 &&
      Array.isArray(e.effectIds) &&
      e.effectIds.length <= 6 &&
      e.effectIds.every(
        (x) => typeof x === 'string' && Object.hasOwn(equipmentEffects, x),
      ),
  );
}
function signature(ids: readonly string[], cards: readonly ArenaCard[]) {
  return JSON.stringify(
    ids.map((id) => {
      const c = cards.find((c) => c.id === id);
      if (!c || !isArenaCard(c)) throw fail();
      return {
        id: c.id,
        name: c.name,
        rarity: c.rarity,
        type: c.type,
        action: c.action,
      };
    }),
  );
}
function read(owner: string, traveler: string): Stored {
  if (!owner || !traveler) throw fail();
  const raw = localStorage.getItem(key(owner, traveler));
  if (!raw)
    return { version: 1, owner, traveler, selection: [], journal: null };
  if (raw.length > 256000) throw fail();
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    throw fail();
  }
  if (
    !object(v) ||
    v.version !== 1 ||
    v.owner !== owner ||
    v.traveler !== traveler ||
    !Array.isArray(v.selection) ||
    v.selection.length > 7 ||
    v.selection.some((x) => typeof x !== 'string' || x.length > 100)
  )
    throw fail();
  if (v.journal !== null) {
    const j = v.journal;
    if (
      !object(j) ||
      typeof j.id !== 'string' ||
      j.id.length > 100 ||
      !Number.isSafeInteger(j.seed) ||
      Number(j.seed) < 0 ||
      Number(j.seed) > 4294967295 ||
      !snapshot(j.player) ||
      j.player.id !== traveler ||
      !snapshot(j.opponent) ||
      !Array.isArray(j.ids) ||
      j.ids.length !== 7 ||
      j.ids.some((x) => typeof x !== 'string') ||
      typeof j.signature !== 'string' ||
      j.signature.length > 10000 ||
      typeof j.settlementStarted !== 'boolean' ||
      !Array.isArray(j.actions) ||
      j.actions.length > 30 ||
      j.actions.some((x) => typeof x !== 'string' || x.length > 150)
    )
      throw fail();
  }
  return v as unknown as Stored;
}
function replay(
  j: Journal | null,
  cards: readonly ArenaCard[],
): BattleState | null {
  if (!j) return null;
  let frozen: unknown;
  try {
    frozen = JSON.parse(j.signature);
  } catch {
    throw fail();
  }
  if (
    !Array.isArray(frozen) ||
    frozen.length !== 7 ||
    !frozen.every(isArenaCard) ||
    validateArenaDeck(j.ids, frozen)
  )
    throw fail();
  let state = createArenaDeckBattle(
    j.player,
    j.opponent,
    j.seed,
    j.id,
    j.ids,
    frozen,
  );
  for (const action of j.actions) {
    const next = resolveArenaCommand(state, j.id, state.round, action);
    if (next === state) throw fail();
    state = next;
  }
  // A historical, closed battle may reference cards no longer owned. It cannot
  // act or grant on reload. Active combat must still match the current collection.
  if (
    state.status === 'in_progress' &&
    (validateArenaDeck(j.ids, cards) || signature(j.ids, cards) !== j.signature)
  )
    throw new Error(
      'A coleção ou o catálogo mudou. Esta batalha aguarda validação; suas cartas não foram substituídas.',
    );
  return state;
}
function write(v: Stored) {
  try {
    localStorage.setItem(key(v.owner, v.traveler), JSON.stringify(v));
  } catch {
    throw new Error(
      'Não foi possível salvar a Arena neste navegador. Nenhuma nova ação foi confirmada.',
    );
  }
}
async function lock<T>(
  owner: string,
  traveler: string,
  operation: () => T,
): Promise<T> {
  if (!navigator.locks?.request)
    throw new Error(
      'Este navegador não oferece a coordenação necessária para salvar o treino.',
    );
  return navigator.locks.request(
    key(owner, traveler),
    { mode: 'exclusive' },
    operation,
  );
}
export const arenaDeckStorage = {
  load(
    owner: string,
    traveler: string,
    cards: readonly ArenaCard[],
  ): DeckWorkspace {
    const v = read(owner, traveler);
    return {
      selection: v.selection,
      battle: replay(v.journal, cards),
      settlementStarted: v.journal?.settlementStarted ?? false,
    };
  },
  save(
    owner: string,
    traveler: string,
    cards: readonly ArenaCard[],
    ids: readonly string[],
  ) {
    return lock(owner, traveler, () => {
      const v = read(owner, traveler);
      if (replay(v.journal, cards)?.status === 'in_progress')
        throw new Error('Encerre a batalha antes de alterar o baralho.');
      const error = validateArenaDeck(ids, cards);
      if (error)
        throw new Error(
          'Escolha exatamente sete cartas válidas, possuídas e diferentes.',
        );
      write({ ...v, selection: [...ids] });
    });
  },
  begin(
    owner: string,
    traveler: string,
    cards: readonly ArenaCard[],
    player: BattleParticipantSnapshot,
    opponent: BattleParticipantSnapshot,
  ) {
    return lock(owner, traveler, () => {
      const v = read(owner, traveler);
      if (
        player.id !== traveler ||
        replay(v.journal, cards)?.status === 'in_progress'
      )
        throw new Error('Já existe uma batalha em andamento.');
      if (!snapshot(player) || !snapshot(opponent)) throw fail();
      const j: Journal = {
        id: crypto.randomUUID(),
        seed: crypto.getRandomValues(new Uint32Array(1))[0],
        player,
        opponent,
        ids: [...v.selection],
        signature: signature(v.selection, cards),
        actions: [],
        settlementStarted: false,
      };
      const battle = createArenaDeckBattle(
        player,
        opponent,
        j.seed,
        j.id,
        j.ids,
        cards,
      );
      write({ ...v, journal: j });
      return battle;
    });
  },
  command(
    owner: string,
    traveler: string,
    cards: readonly ArenaCard[],
    id: string,
    round: number,
    action: ArenaAction,
  ) {
    return lock(owner, traveler, () => {
      const v = read(owner, traveler);
      const state = replay(v.journal, cards);
      if (!state || !v.journal) throw fail();
      const next = resolveArenaCommand(state, id, round, action);
      if (next === state)
        throw new Error('Ação indisponível ou rodada já atualizada.');
      write({
        ...v,
        journal: { ...v.journal, actions: [...v.journal.actions, action] },
      });
      return next;
    });
  },
  claimSettlement(
    owner: string,
    traveler: string,
    cards: readonly ArenaCard[],
    id: string,
  ) {
    return lock(owner, traveler, () => {
      const v = read(owner, traveler);
      if (
        !v.journal ||
        v.journal.id !== id ||
        replay(v.journal, cards)?.status !== 'finished' ||
        v.journal.settlementStarted
      )
        return false;
      write({ ...v, journal: { ...v.journal, settlementStarted: true } });
      return true;
    });
  },
};
