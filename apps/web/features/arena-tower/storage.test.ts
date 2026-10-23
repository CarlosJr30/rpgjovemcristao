// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest';
import { arenaDeckStorage } from '../arena-deck/storage';
import { cards, ids, player } from '../../../../tests/fixtures/arena-deck';
import { TOWER_FLOORS } from './config';
import {
  finishTower,
  loadTower,
  recoverTower,
  towerArenaSession,
} from './storage';
beforeEach(() => {
  localStorage.clear();
  const queues = new Map<string, Promise<unknown>>();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (key: string, _o: object, fn: () => unknown) => {
        const result = (queues.get(key) ?? Promise.resolve()).then(fn);
        queues.set(
          key,
          result.catch(() => undefined),
        );
        return result;
      },
    },
  });
});
const hero = {
  ...player,
  attributes: { life: 40, strength: 50, defense: 30, wisdom: 20 },
};
async function prepare(owner = 'owner', traveler = 'player') {
  await arenaDeckStorage.save(owner, traveler, cards, ids);
}
async function start(floor = 0, p = hero) {
  return towerArenaSession(floor).begin(
    'owner',
    'player',
    cards,
    p,
    TOWER_FLOORS[floor].snapshot,
  );
}
async function end(floor: number, b: Awaited<ReturnType<typeof start>>) {
  while (b.status === 'in_progress')
    b = await towerArenaSession(floor).command(
      'owner',
      'player',
      cards,
      b.id,
      b.round,
      'attack',
    );
  return b;
}
test('empty product gate, order, owner/Traveler segregation and direct special gate', async () => {
  expect(loadTower('owner', 'player', []).progress.wins).toEqual([]);
  await expect(
    towerArenaSession(0).begin(
      'owner',
      'player',
      [],
      hero,
      TOWER_FLOORS[0].snapshot,
    ),
  ).rejects.toThrow(/sete/);
  await prepare();
  await expect(start(1)).rejects.toThrow(/bloqueado/);
  const b = await start();
  await expect(
    towerArenaSession(0).command(
      'owner',
      'player',
      cards,
      b.id,
      b.round,
      'special:path-strike' as never,
    ),
  ).rejects.toThrow(/indisponível/);
  expect(loadTower('other', 'player', cards).battle).toBeNull();
  expect(loadTower('owner', 'other', cards).progress.wins).toEqual([]);
  await expect(
    towerArenaSession(0).begin(
      'owner',
      'other',
      cards,
      hero,
      TOWER_FLOORS[0].snapshot,
    ),
  ).rejects.toThrow();
});
test('all seven wins in order, distinct identities, fresh card use per floor, no economic claims', async () => {
  await prepare();
  const identities = new Set<string>();
  for (let i = 0; i < 7; i++) {
    let b = await start(i);
    expect(identities.has(b.id)).toBe(false);
    identities.add(b.id);
    expect(b.deck?.cards.map((c) => c.id)).toEqual(ids);
    expect(b.deck?.usedIds).toEqual([]);
    b = await towerArenaSession(i).command(
      'owner',
      'player',
      cards,
      b.id,
      b.round,
      `card:${ids[0]}`,
    );
    expect(b.deck?.usedIds).toEqual([ids[0]]);
    if (b.status === 'in_progress')
      await expect(
        towerArenaSession(i).command(
          'owner',
          'player',
          cards,
          b.id,
          b.round,
          `card:${ids[0]}`,
        ),
      ).rejects.toThrow();
    b = await end(i, b);
    expect(b.winnerId).toBe('player');
    expect(loadTower('owner', 'player', cards).progress.wins).toHaveLength(i);
    const v = await finishTower('owner', 'player', cards, b.id);
    expect(v.wins).toHaveLength(i + 1);
    expect(v.authority).toBe('local-demo');
    const raw = Object.values(localStorage).join('');
    expect(await finishTower('owner', 'player', cards, b.id)).toEqual(v);
    expect(Object.values(localStorage).join('')).toBe(raw);
    expect(
      await towerArenaSession(i).claimSettlement(
        'owner',
        'player',
        cards,
        b.id,
      ),
    ).toBe(false);
  }
  expect(identities.size).toBe(7);
  expect(loadTower('owner', 'player', cards).battle).toBeNull();
  await expect(start(6)).rejects.toThrow();
  expect(
    Object.keys(localStorage).every(
      (k) =>
        k.startsWith('rpg-jovem-cristao:arena-deck:') ||
        k.startsWith('rpg-jovem-cristao:arena-tower'),
    ),
  ).toBe(true);
});
test('defeat stays on floor, does not consume collection or previous wins, retry uses new identity', async () => {
  await prepare();
  const first = await end(0, await start());
  await finishTower('owner', 'player', cards, first.id);
  const weak = {
    ...player,
    attributes: { life: 0, strength: 0, defense: 0, wisdom: 0 },
  };
  const b = await end(1, await start(1, weak));
  expect(b.winnerId).not.toBe('player');
  const v = await finishTower('owner', 'player', cards, b.id);
  expect(v.wins).toHaveLength(1);
  expect(v.last?.outcome).toBe('defeat');
  const retry = await start(1);
  expect(retry.id).not.toBe(b.id);
  expect(retry.deck?.usedIds).toEqual([]);
  expect(cards).toHaveLength(40);
});
test('reload never auto-confirms a result, future floor/unfinished/fake ID cannot complete', async () => {
  await prepare();
  let b = await start();
  await expect(finishTower('owner', 'player', cards, b.id)).rejects.toThrow(
    /pendente/,
  );
  b = await end(0, b);
  const before = Object.values(localStorage).join('');
  const loaded = loadTower('owner', 'player', cards);
  expect(loaded.battle?.id).toBe(b.id);
  expect(loaded.progress.wins).toEqual([]);
  expect(Object.values(localStorage).join('')).toBe(before);
  await expect(
    finishTower('owner', 'player', cards, 'invented-victory'),
  ).rejects.toThrow();
  await expect(start(1)).rejects.toThrow();
});
test('concurrent commands and duplicate finishes have exactly one transition per round/result', async () => {
  await prepare();
  let b = await start();
  const session = towerArenaSession(0);
  const results = await Promise.allSettled([
    session.command('owner', 'player', cards, b.id, b.round, 'defend'),
    session.command('owner', 'player', cards, b.id, b.round, 'attack'),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  b = loadTower('owner', 'player', cards).battle!;
  b = await end(0, b);
  const results2 = await Promise.all([
    finishTower('owner', 'player', cards, b.id),
    finishTower('owner', 'player', cards, b.id),
  ]);
  expect(results2[0]).toEqual(results2[1]);
  expect(loadTower('owner', 'player', cards).progress.wins).toHaveLength(1);
});
test('partial begin write is preserved and recovered explicitly without a win', async () => {
  await prepare();
  const original = Storage.prototype.setItem;
  const spy = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(function (this: Storage, k, v) {
      if (k.startsWith('rpg-jovem-cristao:arena-tower:v1:'))
        throw new Error('quota');
      original.call(this, k, v);
    });
  await expect(start()).rejects.toThrow(/pendente/);
  spy.mockRestore();
  const view = loadTower('owner', 'player', cards);
  expect(view.recovery).toBe(true);
  expect(view.progress.wins).toEqual([]);
  await expect(start()).rejects.toThrow();
  await recoverTower('owner', 'player', cards);
  const resumed = loadTower('owner', 'player', cards);
  expect(resumed.battle?.id).toBe(view.battle?.id);
  expect(resumed.recovery).toBe(false);
  expect(resumed.progress.wins).toEqual([]);
});
test('corrupt or changed checkpoints fail explicitly without deleting data or granting results', async () => {
  await prepare();
  await start();
  const key = Object.keys(localStorage).find((k) =>
    k.startsWith('rpg-jovem-cristao:arena-tower:v1:'),
  )!;
  const original = localStorage.getItem(key)!;
  const changed = JSON.parse(original);
  changed.active.floorId = 'tower-floor-7';
  localStorage.setItem(key, JSON.stringify(changed));
  const bad = localStorage.getItem(key);
  expect(() => loadTower('owner', 'player', cards)).toThrow(/preservados/);
  expect(localStorage.getItem(key)).toBe(bad);
  localStorage.setItem(key, original);
  expect(() => loadTower('owner', 'player', cards.slice(1))).toThrow(/coleção/);
  expect(localStorage.getItem(key)).toBe(original);
});
