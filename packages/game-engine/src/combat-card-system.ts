import {
  calculateDamage,
  calculateMaxHp,
  type BattleParticipantSnapshot,
  type BattleEffectId,
} from './index';

export type CombatCardCategory =
  'attack' | 'defense' | 'faith' | 'tactic' | 'special';
export type CardMotion =
  | 'strike'
  | 'heavy'
  | 'precise'
  | 'block'
  | 'counter'
  | 'rally'
  | 'heal'
  | 'focus'
  | 'special'
  | 'charge';
export type CombatCard = Readonly<{
  id: string;
  name: string;
  category: CombatCardCategory;
  cost: number;
  focusCost: number;
  description: string;
  glyph: string;
  motion: CardMotion;
  damage?: number;
  block?: number;
  heal?: number;
  focus?: number;
  draw?: number;
  boost?: number;
  weaken?: number;
  counter?: number;
  precise?: boolean;
}>;
export const COMBAT_CARDS: readonly CombatCard[] = Object.freeze([
  {
    id: 'quick',
    name: 'Golpe Rápido',
    category: 'attack',
    cost: 1,
    focusCost: 0,
    damage: 3,
    glyph: '↗',
    motion: 'strike',
    description: 'Ataque ágil com dano baseado na sua Força.',
  },
  {
    id: 'powerful',
    name: 'Golpe Poderoso',
    category: 'attack',
    cost: 2,
    focusCost: 0,
    damage: 8,
    glyph: '⚔',
    motion: 'heavy',
    description: 'Golpe forte; combina com preparação.',
  },
  {
    id: 'precise',
    name: 'Ataque Preciso',
    category: 'attack',
    cost: 1,
    focusCost: 0,
    damage: 2,
    precise: true,
    glyph: '◎',
    motion: 'precise',
    description: 'Ignora a Defesa do adversário, mas respeita seu Bloqueio.',
  },
  {
    id: 'firm',
    name: 'Defesa Firme',
    category: 'defense',
    cost: 1,
    focusCost: 0,
    block: 7,
    glyph: '◇',
    motion: 'block',
    description: 'Ganha 7 de Bloqueio até o início do próximo turno.',
  },
  {
    id: 'protective',
    name: 'Postura Protetora',
    category: 'defense',
    cost: 2,
    focusCost: 0,
    block: 8,
    weaken: 1,
    glyph: '⬡',
    motion: 'block',
    description: '8 de Bloqueio e enfraquece a próxima ação adversária.',
  },
  {
    id: 'counter',
    name: 'Contra-ataque',
    category: 'defense',
    cost: 1,
    focusCost: 0,
    block: 4,
    counter: 4,
    glyph: '↶',
    motion: 'counter',
    description: '4 de Bloqueio; ao bloquear um golpe, devolve até 4 de dano.',
  },
  {
    id: 'courage',
    name: 'Coragem',
    category: 'faith',
    cost: 1,
    focusCost: 0,
    boost: 4,
    glyph: '✦',
    motion: 'rally',
    description: 'Atitude de treino: +4 de dano no próximo ataque.',
  },
  {
    id: 'hope',
    name: 'Esperança',
    category: 'faith',
    cost: 1,
    focusCost: 0,
    heal: 5,
    glyph: '✧',
    motion: 'heal',
    description:
      'Pausa para se recompor: recupera até 5 de Vida, mais Sabedoria.',
  },
  {
    id: 'perseverance',
    name: 'Perseverança',
    category: 'faith',
    cost: 1,
    focusCost: 0,
    block: 3,
    focus: 1,
    glyph: '∞',
    motion: 'rally',
    description:
      '3 de Bloqueio e 1 de Foco. Virtude representada como ficção de treino.',
  },
  {
    id: 'preparation',
    name: 'Preparação',
    category: 'tactic',
    cost: 1,
    focusCost: 0,
    draw: 1,
    boost: 2,
    glyph: '⌁',
    motion: 'focus',
    description:
      'Compra uma carta, respeitando o limite de 5; próximo ataque +2.',
  },
  {
    id: 'concentration',
    name: 'Concentração',
    category: 'tactic',
    cost: 1,
    focusCost: 0,
    focus: 2,
    boost: 1,
    glyph: '◉',
    motion: 'focus',
    description: '+2 de Foco e +1 no próximo ataque.',
  },
  {
    id: 'recover-focus',
    name: 'Recuperação de Foco',
    category: 'tactic',
    cost: 0,
    focusCost: 0,
    focus: 2,
    glyph: '◈',
    motion: 'focus',
    description:
      '+2 de Foco. Vai ao descarte; não gera energia nem compra cartas.',
  },
  {
    id: 'heroic',
    name: 'Golpe Heroico',
    category: 'special',
    cost: 2,
    focusCost: 3,
    damage: 15,
    glyph: '✹',
    motion: 'special',
    description: 'Consome 3 de Foco em um golpe de treinamento intenso.',
  },
  {
    id: 'radiant',
    name: 'Proteção Radiante',
    category: 'special',
    cost: 2,
    focusCost: 2,
    block: 15,
    glyph: '☼',
    motion: 'special',
    description:
      '15 de Bloqueio. Brilho simbólico; não representa milagre controlável.',
  },
  {
    id: 'charge',
    name: 'Investida do Viajante',
    category: 'special',
    cost: 2,
    focusCost: 1,
    damage: 7,
    block: 4,
    glyph: '➶',
    motion: 'charge',
    description: 'Avança com ataque e 4 de Bloqueio, usando 1 de Foco.',
  },
]);
export const STARTER_COMBAT_DECK = Object.freeze([
  'quick',
  'quick',
  'quick',
  'powerful',
  'powerful',
  'precise',
  'precise',
  'firm',
  'firm',
  'protective',
  'counter',
  'courage',
  'hope',
  'perseverance',
  'preparation',
  'concentration',
  'recover-focus',
  'heroic',
  'radiant',
  'charge',
]);
export const CARD_COMBAT_RULES = Object.freeze({
  deckSize: 20,
  handSize: 5,
  energy: 3,
  maximumFocus: 6,
  maximumCommands: 2000,
});
export type CardInstance = Readonly<{ id: string; cardId: string }>;
export type CardFighter = {
  snapshot: BattleParticipantSnapshot;
  hp: number;
  maxHp: number;
  block: number;
  focus: number;
  boost: number;
  weak: number;
  counter: number;
  damageDealt: number;
  damageTaken: number;
  cardsPlayed: number;
};
export type CardCommand = Readonly<
  | { kind: 'play'; instanceId: string; revision: number }
  | { kind: 'end' | 'enemy' | 'concede'; revision: number }
>;
export type CardEvent = Readonly<{
  revision: number;
  actor: 'player' | 'opponent';
  motion: CardMotion;
  label: string;
  damage: number;
  blocked: number;
  healed: number;
  countered?: number;
}>;
export type CardBattle = {
  version: 1;
  id: string;
  seed: number;
  rng: number;
  revision: number;
  round: number;
  phase: 'player' | 'enemy' | 'finished';
  winner: 'player' | 'opponent' | null;
  energy: number;
  player: CardFighter;
  opponent: CardFighter;
  draw: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  reshuffles: number;
  log: string[];
  lastEvent: CardEvent | null;
  commands: CardCommand[];
};
export type EnemyIntent = Readonly<{
  kind: 'light' | 'heavy' | 'guard' | 'prepare' | 'special';
  label: string;
  damage: number;
  block: number;
}>;
const bounded = (value: number, max = 1000) =>
  Math.max(0, Math.min(max, Math.floor(Number.isFinite(value) ? value : 0)));
const effect = (fighter: CardFighter, id: BattleEffectId) =>
  fighter.snapshot.equipment.some((item) => item.effectIds.includes(id));
export const combatCard = (id: string) =>
  COMBAT_CARDS.find((card) => card.id === id);
const clone = (battle: CardBattle): CardBattle => structuredClone(battle);
const note = (battle: CardBattle, message: string) => {
  battle.log = [...battle.log, message].slice(-12);
};

function validParticipant(value: unknown): value is BattleParticipantSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as BattleParticipantSnapshot;
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    v.id.length <= 100 &&
    typeof v.name === 'string' &&
    v.name.length > 0 &&
    v.name.length <= 80 &&
    Number.isInteger(v.level) &&
    v.level >= 1 &&
    v.level <= 50 &&
    Number.isFinite(v.combatPower) &&
    v.combatPower >= 0 &&
    !!v.attributes &&
    ['life', 'strength', 'defense', 'wisdom'].every((key) => {
      const n = v.attributes[key as keyof typeof v.attributes];
      return Number.isInteger(n) && n >= 0 && n <= 1000;
    }) &&
    Array.isArray(v.equipment) &&
    v.equipment.length <= 9 &&
    v.equipment.every(
      (item) =>
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        Number.isInteger(item.power) &&
        item.power >= 0 &&
        item.power <= 1000 &&
        Array.isArray(item.effectIds) &&
        item.effectIds.every(
          (id: unknown) =>
            typeof id === 'string' &&
            [
              'path-sword',
              'steadfast-shield',
              'pilgrim-boots',
              'prudence-amulet',
              'traveler-helmet',
              'traveler-armor',
            ].includes(id),
        ),
    )
  );
}
function fighter(snapshot: BattleParticipantSnapshot): CardFighter {
  return {
    snapshot: structuredClone(snapshot),
    hp: calculateMaxHp(snapshot.attributes),
    maxHp: calculateMaxHp(snapshot.attributes),
    block: 0,
    focus: 1,
    boost: 0,
    weak: 0,
    counter: 0,
    damageDealt: 0,
    damageTaken: 0,
    cardsPlayed: 0,
  };
}
function random(battle: CardBattle) {
  battle.rng = (Math.imul(battle.rng, 1664525) + 1013904223) >>> 0;
  return battle.rng / 4294967296;
}
function shuffled(cards: CardInstance[], battle: CardBattle) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random(battle) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function drawCards(battle: CardBattle, count: number) {
  for (
    let i = 0;
    i < count && battle.hand.length < CARD_COMBAT_RULES.handSize;
    i++
  ) {
    if (!battle.draw.length) {
      if (!battle.discard.length) break;
      battle.draw = shuffled(battle.discard, battle);
      battle.discard = [];
      battle.reshuffles++;
      note(battle, 'O descarte foi reembaralhado; nenhuma carta foi perdida.');
    }
    battle.hand.push(battle.draw.shift()!);
  }
}
function finish(battle: CardBattle) {
  if (battle.opponent.hp <= 0 || battle.player.hp <= 0) {
    battle.phase = 'finished';
    battle.winner = battle.opponent.hp <= 0 ? 'player' : 'opponent';
    note(
      battle,
      battle.winner === 'player'
        ? 'Vitória no treinamento.'
        : 'Treino encerrado. Reorganize sua estratégia e tente novamente.',
    );
  }
}
export function createCardBattle(
  player: BattleParticipantSnapshot,
  opponent: BattleParticipantSnapshot,
  seed: number,
  id: string,
): CardBattle {
  if (
    !validParticipant(player) ||
    !validParticipant(opponent) ||
    player.id === opponent.id ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff ||
    typeof id !== 'string' ||
    !id.length ||
    id.length > 100
  )
    throw new Error('Invalid combat setup');
  const battle: CardBattle = {
    version: 1,
    id,
    seed,
    rng: seed >>> 0,
    revision: 0,
    round: 1,
    phase: 'player',
    winner: null,
    energy: 3,
    player: fighter(player),
    opponent: fighter(opponent),
    draw: [],
    hand: [],
    discard: [],
    reshuffles: 0,
    log: [],
    lastEvent: null,
    commands: [],
  };
  if (effect(battle.player, 'pilgrim-boots')) battle.player.focus++;
  battle.draw = shuffled(
    STARTER_COMBAT_DECK.map((cardId, index) => ({
      id: `${id}:${index}`,
      cardId,
    })),
    battle,
  );
  drawCards(battle, 5);
  note(battle, 'Turno 1: 3 de Energia. Observe a intenção do adversário.');
  return battle;
}
export function cardPlayError(
  battle: CardBattle,
  instanceId: string,
): string | null {
  if (battle.phase !== 'player') return 'Aguarde seu turno.';
  const instance = battle.hand.find((card) => card.id === instanceId),
    card = instance && combatCard(instance.cardId);
  if (!card) return 'Carta indisponível.';
  if (battle.energy < card.cost) return 'Energia insuficiente.';
  if (battle.player.focus < card.focusCost) return 'Foco insuficiente.';
  if (battle.commands.length >= CARD_COMBAT_RULES.maximumCommands - 2)
    return 'Limite de ações do treino alcançado; encerre este treino sem recompensa e inicie outro.';
  return null;
}
function damage(target: CardFighter, actor: CardFighter, amount: number) {
  const raw = bounded(amount),
    blocked = Math.min(target.block, raw);
  target.block -= blocked;
  const hit = Math.min(target.hp, Math.max(0, raw - blocked));
  target.hp -= hit;
  actor.damageDealt += hit;
  target.damageTaken += hit;
  return { damage: hit, blocked };
}
export function playCombatCard(
  current: CardBattle,
  instanceId: string,
  expectedRevision = current.revision,
): CardBattle {
  if (
    current.revision !== expectedRevision ||
    cardPlayError(current, instanceId)
  )
    return current;
  const battle = clone(current),
    index = battle.hand.findIndex((card) => card.id === instanceId);
  const instance = battle.hand.splice(index, 1)[0],
    card = combatCard(instance.cardId)!;
  battle.energy -= card.cost;
  battle.player.focus -= card.focusCost;
  battle.player.cardsPlayed++;
  let hit = { damage: 0, blocked: 0 };
  if (card.damage) {
    const target = card.precise
      ? {
          ...battle.opponent.snapshot,
          attributes: { ...battle.opponent.snapshot.attributes, defense: 0 },
        }
      : battle.opponent.snapshot;
    hit = damage(
      battle.opponent,
      battle.player,
      calculateDamage(battle.player.snapshot, target) +
        card.damage -
        3 +
        battle.player.boost +
        (effect(battle.player, 'path-sword') ? 1 : 0),
    );
    battle.player.boost = 0;
  }
  const previousBlock = battle.player.block;
  const previousFocus = battle.player.focus;
  if (card.block)
    battle.player.block = Math.min(
      99,
      battle.player.block +
        card.block +
        (effect(battle.player, 'steadfast-shield') ? 1 : 0) +
        (effect(battle.player, 'traveler-armor') ? 1 : 0),
    );
  const healed = Math.min(
    battle.player.maxHp - battle.player.hp,
    card.heal
      ? card.heal + Math.floor(battle.player.snapshot.attributes.wisdom / 3)
      : 0,
  );
  battle.player.hp += healed;
  if (card.focus)
    battle.player.focus = Math.min(
      6,
      battle.player.focus +
        card.focus +
        (effect(battle.player, 'prudence-amulet') ? 1 : 0),
    );
  battle.player.boost = Math.min(20, battle.player.boost + (card.boost ?? 0));
  battle.opponent.weak = Math.max(battle.opponent.weak, card.weaken ?? 0);
  battle.player.counter = Math.max(battle.player.counter, card.counter ?? 0);
  battle.discard.push(instance);
  if (card.draw) drawCards(battle, card.draw);
  battle.commands.push({
    kind: 'play',
    instanceId,
    revision: current.revision,
  });
  battle.revision++;
  battle.lastEvent = {
    revision: battle.revision,
    actor: 'player',
    motion: card.motion,
    label: card.name,
    ...hit,
    healed,
  };
  note(
    battle,
    `${card.name}: ${hit.damage ? `${hit.damage} de dano. ` : ''}${card.block ? `${battle.player.block - previousBlock} de Bloqueio. ` : ''}${healed ? `+${healed} Vida. ` : ''}${card.focus ? `+${battle.player.focus - previousFocus} Foco.` : ''}`,
  );
  finish(battle);
  return battle;
}
export function endCardTurn(
  current: CardBattle,
  expectedRevision = current.revision,
): CardBattle {
  if (
    current.phase !== 'player' ||
    expectedRevision !== current.revision ||
    current.commands.length >= 1998
  )
    return current;
  const battle = clone(current);
  battle.phase = 'enemy';
  battle.energy = 0;
  battle.commands.push({ kind: 'end', revision: current.revision });
  battle.revision++;
  note(
    battle,
    `${battle.hand.length} cartas não usadas permanecem na mão. Turno do adversário.`,
  );
  return battle;
}
export function enemyCardIntent(battle: CardBattle): EnemyIntent {
  const patterns: Record<string, EnemyIntent['kind'][]> = {
    agile: ['light', 'light', 'guard', 'heavy', 'prepare', 'special'],
    offensive: ['light', 'prepare', 'heavy', 'guard', 'special'],
    guardian: ['guard', 'light', 'prepare', 'heavy', 'special'],
    tactical: ['prepare', 'guard', 'special', 'light', 'heavy'],
  };
  const pattern =
    patterns[battle.opponent.snapshot.arenaProfile ?? 'agile'] ??
    patterns.agile;
  let kind = pattern[(battle.round - 1) % pattern.length];
  if (kind === 'special' && battle.opponent.focus < 2) kind = 'prepare';
  const base = calculateDamage(
    battle.opponent.snapshot,
    battle.player.snapshot,
  );
  const raw =
    kind === 'light'
      ? base
      : kind === 'heavy'
        ? base + 5 + battle.opponent.focus
        : kind === 'special'
          ? base + 8 + battle.opponent.focus
          : 0;
  return {
    kind,
    label: {
      light: 'Ataque leve',
      heavy: 'Ataque pesado',
      guard: 'Defesa',
      prepare: 'Preparação',
      special: 'Habilidade especial',
    }[kind],
    damage: raw
      ? Math.max(
          1,
          raw +
            Math.floor(battle.round / 10) -
            (battle.opponent.weak ? 3 : 0) -
            (effect(battle.player, 'traveler-helmet') ? 1 : 0),
        )
      : 0,
    block:
      kind === 'guard' ? 5 + battle.opponent.snapshot.attributes.defense : 0,
  };
}
export function resolveCardEnemyTurn(
  current: CardBattle,
  expectedRevision = current.revision,
): CardBattle {
  if (
    current.phase !== 'enemy' ||
    current.revision !== expectedRevision ||
    current.commands.length >= 2000
  )
    return current;
  const battle = clone(current),
    intent = enemyCardIntent(battle);
  battle.opponent.block = 0;
  let hit = { damage: 0, blocked: 0 };
  let countered = 0;
  if (intent.damage) {
    hit = damage(battle.player, battle.opponent, intent.damage);
    if (hit.blocked && battle.player.counter && battle.player.hp > 0) {
      const returned = damage(
        battle.opponent,
        battle.player,
        Math.min(hit.blocked, battle.player.counter),
      );
      countered = returned.damage;
      note(battle, `Contra-ataque: ${returned.damage} de dano devolvido.`);
    }
    if (intent.kind === 'special' || intent.kind === 'heavy')
      battle.opponent.focus = 0;
  } else if (intent.kind === 'guard') battle.opponent.block = intent.block;
  else battle.opponent.focus = Math.min(6, battle.opponent.focus + 2);
  battle.opponent.weak = Math.max(0, battle.opponent.weak - 1);
  battle.commands.push({ kind: 'enemy', revision: current.revision });
  battle.revision++;
  battle.lastEvent = {
    revision: battle.revision,
    actor: 'opponent',
    motion:
      intent.kind === 'guard'
        ? 'block'
        : intent.kind === 'prepare'
          ? 'focus'
          : intent.kind === 'heavy'
            ? 'heavy'
            : intent.kind === 'special'
              ? 'special'
              : 'strike',
    label: intent.label,
    ...hit,
    healed: 0,
    countered,
  };
  note(
    battle,
    `${battle.opponent.snapshot.name}: ${intent.label}. ${hit.damage} de dano, ${hit.blocked} bloqueado.`,
  );
  finish(battle);
  if (battle.phase !== 'finished') {
    battle.round++;
    battle.phase = 'player';
    battle.energy = 3;
    battle.player.block = 0;
    battle.player.counter = 0;
    battle.player.focus = Math.min(6, battle.player.focus + 1);
    drawCards(battle, 5 - battle.hand.length);
    note(
      battle,
      `Turno ${battle.round}: Energia 3; mão completada até 5 cartas.`,
    );
  }
  return battle;
}
export function concedeCardBattle(
  current: CardBattle,
  expectedRevision = current.revision,
): CardBattle {
  if (
    current.phase === 'finished' ||
    current.revision !== expectedRevision ||
    current.commands.length >= 2000
  )
    return current;
  const battle = clone(current);
  battle.player.hp = 0;
  battle.commands.push({ kind: 'concede', revision: current.revision });
  battle.revision++;
  finish(battle);
  note(battle, 'Treino encerrado pelo Viajante, sem recompensa.');
  return battle;
}
/** Rebuild from commands; never accept stored HP, damage, energy or a winner as authority. */
export function replayCardBattle(
  value: unknown,
  playerId: string,
): CardBattle | null {
  try {
    if (!value || typeof value !== 'object') return null;
    const v = value as {
      version: number;
      id: string;
      seed: number;
      player: BattleParticipantSnapshot;
      opponent: BattleParticipantSnapshot;
      commands: CardCommand[];
    };
    if (
      v.version !== 1 ||
      !validParticipant(v.player) ||
      v.player.id !== playerId ||
      !validParticipant(v.opponent) ||
      !Array.isArray(v.commands) ||
      v.commands.length > 2000
    )
      return null;
    let battle = createCardBattle(v.player, v.opponent, v.seed, v.id);
    for (const action of v.commands) {
      if (!action || action.revision !== battle.revision) return null;
      const next =
        action.kind === 'play' && typeof action.instanceId === 'string'
          ? playCombatCard(battle, action.instanceId, action.revision)
          : action.kind === 'end'
            ? endCardTurn(battle, action.revision)
            : action.kind === 'enemy'
              ? resolveCardEnemyTurn(battle, action.revision)
              : action.kind === 'concede'
                ? concedeCardBattle(battle, action.revision)
                : battle;
      if (next === battle) return null;
      battle = next;
    }
    return battle;
  } catch {
    return null;
  }
}
export function cardBattleTranscript(battle: CardBattle) {
  return {
    version: 1,
    id: battle.id,
    seed: battle.seed,
    player: battle.player.snapshot,
    opponent: battle.opponent.snapshot,
    commands: battle.commands,
  };
}
