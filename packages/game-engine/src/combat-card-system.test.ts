import { describe, it, expect } from 'vitest';
import {
  COMBAT_CARDS,
  STARTER_COMBAT_DECK,
  createCardBattle,
  playCombatCard,
  endCardTurn,
  resolveCardEnemyTurn,
  enemyCardIntent,
  cardPlayError,
  cardBattleTranscript,
  replayCardBattle,
  concedeCardBattle,
  type CardBattle,
  type BattleParticipantSnapshot,
  type BattleEffectId,
} from './index';
const player: BattleParticipantSnapshot = {
  id: 'player',
  name: 'Viajante sintético',
  level: 1,
  attributes: { life: 2, strength: 1, defense: 1, wisdom: 1 },
  equipment: [],
  combatPower: 10,
};
const enemy: BattleParticipantSnapshot = {
  ...player,
  id: 'enemy',
  name: 'Treinador fictício',
  arenaProfile: 'agile',
};
function withCard(id: string, p = player, e = enemy): CardBattle {
  for (let seed = 0; seed < 1000; seed++) {
    const state = createCardBattle(p, e, seed, 'test-battle');
    if (state.hand.some((c) => c.cardId === id)) return state;
  }
  throw Error('Card not sampled');
}
const instance = (state: CardBattle, id: string) =>
  state.hand.find((c) => c.cardId === id)!.id;
const nextTurn = (state: CardBattle) =>
  resolveCardEnemyTurn(endCardTurn(state));
const all = (state: CardBattle) => [
  ...state.draw,
  ...state.hand,
  ...state.discard,
];
describe('Card combat V1', () => {
  it('can end a training safely without consuming the permanent deck or replaying a result', () => {
    const initial = createCardBattle(player, enemy, 3, 'concede');
    const ended = concedeCardBattle(initial);
    expect(ended.phase).toBe('finished');
    expect(ended.player.hp).toBe(0);
    expect(ended.winner).toBe('opponent');
    expect(all(ended)).toHaveLength(20);
    expect(concedeCardBattle(ended)).toBe(ended);
    expect(replayCardBattle(cardBattleTranscript(ended), player.id)).toEqual(
      ended,
    );
  });
  it('has 20 distinct instances from 15 action types; deterministic 5-card draw and 3 energy', () => {
    expect(STARTER_COMBAT_DECK).toHaveLength(20);
    expect(COMBAT_CARDS).toHaveLength(15);
    const a = createCardBattle(player, enemy, 4, 'test');
    expect(a.hand).toHaveLength(5);
    expect(a.energy).toBe(3);
    expect(new Set(all(a).map((c) => c.id)).size).toBe(20);
    expect(all(a)).toHaveLength(20);
    expect(a).toEqual(createCardBattle(player, enemy, 4, 'test'));
    expect(a.hand).not.toEqual(createCardBattle(player, enemy, 5, 'test').hand);
  });
  it('pays costs, moves the exact card to discard and rejects stale/duplicate input', () => {
    const a = withCard('quick'),
      id = instance(a, 'quick');
    const b = playCombatCard(a, id, a.revision);
    expect(b.energy).toBe(2);
    expect(b.hand).toHaveLength(4);
    expect(b.discard.some((c) => c.id === id)).toBe(true);
    expect(b.opponent.hp).toBeLessThan(a.opponent.hp);
    expect(playCombatCard(b, id, a.revision)).toBe(b);
    expect(playCombatCard(b, id)).toBe(b);
    expect(a.discard).toHaveLength(0);
  });
  it('rejects insufficient energy/focus and out-of-turn actions without changing state', () => {
    const a = withCard('powerful');
    a.energy = 1;
    expect(cardPlayError(a, instance(a, 'powerful'))).toBe(
      'Energia insuficiente.',
    );
    expect(playCombatCard(a, instance(a, 'powerful'))).toBe(a);
    const special = withCard('heroic');
    expect(cardPlayError(special, instance(special, 'heroic'))).toBe(
      'Foco insuficiente.',
    );
    const ended = endCardTurn(a);
    expect(ended.phase).toBe('enemy');
    expect(playCombatCard(ended, ended.hand[0].id)).toBe(ended);
    expect(endCardTurn(ended)).toBe(ended);
    expect(resolveCardEnemyTurn(a)).toBe(a);
  });
  it('retains unused cards and only replenishes up to five once the enemy has acted', () => {
    const a = withCard('quick'),
      used = playCombatCard(a, instance(a, 'quick'));
    const retained = used.hand.map((c) => c.id);
    const ended = endCardTurn(used);
    expect(ended.hand).toEqual(used.hand);
    const b = resolveCardEnemyTurn(ended);
    expect(b.round).toBe(2);
    expect(b.phase).toBe('player');
    expect(b.energy).toBe(3);
    expect(b.hand).toHaveLength(5);
    expect(b.hand.map((c) => c.id)).toEqual(expect.arrayContaining(retained));
    expect(nextTurn(b).hand.map((c) => c.id)).toEqual(b.hand.map((c) => c.id));
  });
  it('blocks incoming damage, expires block, and counterattacks only when a hit was blocked', () => {
    let a = withCard('firm');
    const raw = enemyCardIntent(a).damage;
    a = playCombatCard(a, instance(a, 'firm'));
    const before = a.player.hp;
    const b = nextTurn(a);
    expect(b.player.hp).toBeGreaterThanOrEqual(before - raw);
    expect(b.lastEvent!.blocked).toBeGreaterThan(0);
    expect(b.player.block).toBe(0);
    let c = withCard('counter');
    c = playCombatCard(c, instance(c, 'counter'));
    const hp = c.opponent.hp;
    c = nextTurn(c);
    expect(c.opponent.hp).toBeLessThan(hp);
  });
  it('cannot counterattack after lethal damage or win with zero Life', () => {
    let battle = withCard('counter', player, {
      ...enemy,
      attributes: { ...enemy.attributes, strength: 20 },
    });
    battle.player.hp = 1;
    battle.opponent.hp = 1;
    battle = playCombatCard(battle, instance(battle, 'counter'));
    const result = nextTurn(battle);
    expect(result.player.hp).toBe(0);
    expect(result.opponent.hp).toBe(1);
    expect(result.phase).toBe('finished');
    expect(result.winner).toBe('opponent');
    expect(result.lastEvent!.countered).toBe(0);
  });
  it('heals with a cap, caps Focus and consumes a prepared attack bonus exactly once', () => {
    let a = withCard('hope');
    a.player.hp -= 3;
    const b = playCombatCard(a, instance(a, 'hope'));
    expect(b.player.hp).toBe(b.player.maxHp);
    a = withCard('recover-focus');
    a.player.focus = 6;
    expect(playCombatCard(a, instance(a, 'recover-focus')).player.focus).toBe(
      6,
    );
    a = withCard('courage');
    a = playCombatCard(a, instance(a, 'courage'));
    expect(a.player.boost).toBe(4);
    while (
      !a.hand.some((c) => combatAttack(c.cardId)) &&
      a.phase !== 'finished'
    )
      a = nextTurn(a);
    const attack = a.hand.find((c) => combatAttack(c.cardId))!;
    if (attack) {
      a.energy = 3;
      a.player.focus = 6;
      expect(playCombatCard(a, attack.id).player.boost).toBe(0);
    }
  });
  it('gives each equipment a supported combat effect without changing snapshots or catalog stats', () => {
    const equipped = {
      ...player,
      equipment: [
        {
          id: 'traveler-boots',
          name: 'Botas',
          power: 1,
          effectIds: ['pilgrim-boots' as const],
        },
        {
          id: 'traveler-shield-rare',
          name: 'Escudo',
          power: 1,
          effectIds: ['steadfast-shield' as const],
        },
      ],
    };
    let a = withCard('firm', equipped);
    expect(a.player.focus).toBe(2);
    a = playCombatCard(a, instance(a, 'firm'));
    expect(a.player.block).toBe(8);
    expect(a.log.at(-1)).toContain('8 de Bloqueio');
    expect(equipped.equipment[0].effectIds).toEqual(['pilgrim-boots']);
    const oneEffect = (id: BattleEffectId): BattleParticipantSnapshot => ({
      ...player,
      equipment: [{ id, name: 'Item sintético', power: 0, effectIds: [id] }],
    });
    const before = structuredClone(player);
    const plainAttack = withCard('quick');
    const sword = withCard('quick', oneEffect('path-sword'));
    expect(
      playCombatCard(sword, instance(sword, 'quick')).lastEvent!.damage,
    ).toBe(
      playCombatCard(plainAttack, instance(plainAttack, 'quick')).lastEvent!
        .damage + 1,
    );
    const armor = withCard('firm', oneEffect('traveler-armor'));
    expect(playCombatCard(armor, instance(armor, 'firm')).player.block).toBe(8);
    const focus = withCard('recover-focus');
    const amulet = withCard('recover-focus', oneEffect('prudence-amulet'));
    expect(
      playCombatCard(amulet, instance(amulet, 'recover-focus')).player.focus,
    ).toBe(
      playCombatCard(focus, instance(focus, 'recover-focus')).player.focus + 1,
    );
    const strongEnemy = {
      ...enemy,
      attributes: { ...enemy.attributes, strength: 8 },
    };
    const bare = withCard('quick', player, strongEnemy);
    const helmet = withCard('quick', oneEffect('traveler-helmet'), strongEnemy);
    expect(enemyCardIntent(helmet).damage).toBe(
      enemyCardIntent(bare).damage - 1,
    );
    expect(player).toEqual(before);
  });
  it('advertises the next enemy action and supports distinct deterministic profiles', () => {
    expect(enemyCardIntent(createCardBattle(player, enemy, 0, 'a')).kind).toBe(
      'light',
    );
    const guardian = createCardBattle(
      player,
      { ...enemy, arenaProfile: 'guardian' },
      0,
      'b',
    );
    expect(enemyCardIntent(guardian).kind).toBe('guard');
    expect(nextTurn(guardian).opponent.block).toBeGreaterThan(0);
    const tactical = createCardBattle(
      player,
      { ...enemy, arenaProfile: 'tactical' },
      0,
      'c',
    );
    expect(enemyCardIntent(tactical).kind).toBe('prepare');
    expect(nextTurn(tactical).opponent.focus).toBe(3);
  });
  it('reshuffles without losing permanent cards and conserves instances across a long battle', () => {
    const tank = {
      ...player,
      attributes: { life: 100, strength: 1, defense: 100, wisdom: 1 },
    };
    let a = createCardBattle(
      tank,
      { ...tank, id: 'enemy', name: 'Tank', arenaProfile: 'guardian' },
      9,
      'long',
    );
    for (let i = 0; i < 150 && a.phase !== 'finished'; i++) {
      const playable = a.hand.find((c) => !cardPlayError(a, c.id));
      a = playable ? playCombatCard(a, playable.id) : nextTurn(a);
      expect(all(a)).toHaveLength(20);
      expect(new Set(all(a).map((c) => c.id)).size).toBe(20);
      expect(a.hand.length).toBeLessThanOrEqual(5);
      expect(a.energy).toBeGreaterThanOrEqual(0);
    }
    expect(a.reshuffles).toBeGreaterThan(0);
  });
  it('finishes on zero HP; no action can change a finished battle; a rematch is new', () => {
    let a = withCard('quick');
    a.opponent.hp = 1;
    a = playCombatCard(a, instance(a, 'quick'));
    expect(a.phase).toBe('finished');
    expect(a.winner).toBe('player');
    expect(playCombatCard(a, a.hand[0].id)).toBe(a);
    expect(endCardTurn(a)).toBe(a);
    let loss = createCardBattle(
      player,
      {
        ...enemy,
        attributes: { life: 10, strength: 30, defense: 2, wisdom: 1 },
      },
      1,
      'loss',
    );
    loss = nextTurn(loss);
    expect(loss.player.hp).toBe(0);
    expect(loss.winner).toBe('opponent');
    const fresh = createCardBattle(player, enemy, 1, 'fresh');
    expect(fresh.player.hp).toBe(fresh.player.maxHp);
    expect(fresh.commands).toEqual([]);
    expect(fresh.id).not.toBe(a.id);
  });
  it('replays accepted commands; rejects foreign ownership, invalid commands and malformed snapshots', () => {
    let a = withCard('quick');
    a = playCombatCard(a, instance(a, 'quick'));
    a = nextTurn(a);
    const transcript = cardBattleTranscript(a);
    expect(replayCardBattle(transcript, player.id)).toEqual(a);
    expect(
      replayCardBattle(
        { ...transcript, hp: 999999, energy: 999, winner: 'player' },
        player.id,
      ),
    ).toEqual(a);
    expect(replayCardBattle(transcript, 'foreign')).toBeNull();
    expect(
      replayCardBattle(
        { ...transcript, commands: [{ kind: 'enemy', revision: 0 }] },
        player.id,
      ),
    ).toBeNull();
    expect(
      replayCardBattle(
        { ...transcript, player: { ...player, attributes: { life: NaN } } },
        player.id,
      ),
    ).toBeNull();
  });
});
function combatAttack(id: string) {
  return Boolean(COMBAT_CARDS.find((c) => c.id === id)?.damage);
}
