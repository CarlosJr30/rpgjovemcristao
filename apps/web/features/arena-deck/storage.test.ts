// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest';
import { arenaDeckStorage as storage } from './storage';
import {
  cards,
  ids,
  player,
  opponent,
} from '../../../../tests/fixtures/arena-deck';
beforeEach(() => {
  localStorage.clear();
  let tail = Promise.resolve<unknown>(undefined);
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (_name: string, _opts: object, fn: () => unknown) => {
        const result = tail.then(fn);
        tail = result.catch(() => undefined);
        return result;
      },
    },
  });
});
const save = () => storage.save('owner', 'player', cards, ids);
const begin = () => storage.begin('owner', 'player', cards, player, opponent);
test('saved deck is isolated by both account and Traveler', async () => {
  await save();
  expect(storage.load('owner', 'player', cards).selection).toEqual(ids);
  expect(storage.load('other', 'player', cards).selection).toEqual([]);
  expect(storage.load('owner', 'other', cards).selection).toEqual([]);
  await expect(
    storage.begin('owner', 'other', cards, player, opponent),
  ).rejects.toThrow();
});
test('ownership, duplicate and incomplete deck saves fail without changing previous valid state', async () => {
  await save();
  for (const bad of [
    ids.slice(0, 6),
    [...ids.slice(0, 6), ids[0]],
    [...ids.slice(0, 6), 'foreign'],
  ])
    await expect(storage.save('owner', 'player', cards, bad)).rejects.toThrow();
  expect(storage.load('owner', 'player', cards).selection).toEqual(ids);
});
test('active deck is locked; reload replays the committed turn and keeps consumed cards', async () => {
  await save();
  const b = await begin();
  await storage.command(
    'owner',
    'player',
    cards,
    b.id,
    b.round,
    `card:${ids[0]}`,
  );
  const resumed = storage.load('owner', 'player', cards).battle!;
  expect(resumed.id).toBe(b.id);
  expect(resumed.round).toBe(b.round + 1);
  expect(resumed.deck?.usedIds).toEqual([ids[0]]);
  await expect(
    storage.save(
      'owner',
      'player',
      cards,
      cards.slice(2, 9).map((c) => c.id),
    ),
  ).rejects.toThrow(/batalha/);
  await expect(begin()).rejects.toThrow(/andamento/);
});
test('two simultaneous tabs/commands have one winner and one stale rejection', async () => {
  await save();
  const b = await begin();
  const results = await Promise.allSettled([
    storage.command('owner', 'player', cards, b.id, b.round, `card:${ids[0]}`),
    storage.command('owner', 'player', cards, b.id, b.round, `card:${ids[1]}`),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(
    storage.load('owner', 'player', cards).battle?.deck?.usedIds,
  ).toHaveLength(1);
});
test('finished state cannot act; settlement is at most once; rematch has a new ID and fresh cards', async () => {
  await save();
  let b = await begin();
  b = await storage.command(
    'owner',
    'player',
    cards,
    b.id,
    b.round,
    `card:${ids[0]}`,
  );
  while (b.status === 'in_progress')
    b = await storage.command(
      'owner',
      'player',
      cards,
      b.id,
      b.round,
      'attack',
    );
  expect(storage.load('owner', 'player', cards).battle?.status).toBe(
    'finished',
  );
  await expect(
    storage.command('owner', 'player', cards, b.id, b.round, 'attack'),
  ).rejects.toThrow();
  const claims = await Promise.all([
    storage.claimSettlement('owner', 'player', cards, b.id),
    storage.claimSettlement('owner', 'player', cards, b.id),
  ]);
  expect(claims.filter(Boolean)).toHaveLength(1);
  await storage.save('owner', 'player', cards, ids);
  const next = await begin();
  expect(next.id).not.toBe(b.id);
  expect(next.deck?.usedIds).toEqual([]);
});
test('corruption, invalid transcript and changed collection never silently reset active combat', async () => {
  await save();
  await begin();
  const k = Object.keys(localStorage)[0];
  const original = localStorage.getItem(k)!;
  const parsed = JSON.parse(original);
  parsed.journal.actions = ['card:foreign'];
  localStorage.setItem(k, JSON.stringify(parsed));
  expect(() => storage.load('owner', 'player', cards)).toThrow();
  localStorage.setItem(k, original);
  expect(() => storage.load('owner', 'player', cards.slice(1))).toThrow(
    /coleção/,
  );
  expect(localStorage.getItem(k)).toBe(original);
});
test('unavailable storage or cross-tab coordination blocks writes', async () => {
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: undefined,
  });
  await expect(save()).rejects.toThrow(/coordenação/);
});
test('storage write failure does not confirm a new round', async () => {
  await save();
  const b = await begin();
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  await expect(
    storage.command('owner', 'player', cards, b.id, b.round, 'attack'),
  ).rejects.toThrow(/salvar/);
  spy.mockRestore();
  expect(storage.load('owner', 'player', cards).battle?.round).toBe(b.round);
});
test('after a battle closes, an unavailable old card can be replaced without rewriting history', async () => {
  await save();
  let b = await begin();
  while (b.status === 'in_progress')
    b = await storage.command(
      'owner',
      'player',
      cards,
      b.id,
      b.round,
      'attack',
    );
  const current = cards.slice(1);
  expect(storage.load('owner', 'player', current).battle?.status).toBe(
    'finished',
  );
  const replacement = cards.slice(1, 8).map((c) => c.id);
  await storage.save('owner', 'player', current, replacement);
  const next = await storage.begin(
    'owner',
    'player',
    current,
    player,
    opponent,
  );
  expect(next.deck?.cards.map((c) => c.id)).toEqual(replacement);
  expect(next.id).not.toBe(b.id);
});
test('old basic/card journals remain byte-preserved on load and continue with their original identity', async () => {
  await save();
  const b = await begin();
  await storage.command(
    'owner',
    'player',
    cards,
    b.id,
    b.round,
    `card:${ids[0]}`,
  );
  const k = Object.keys(localStorage)[0];
  const original = localStorage.getItem(k)!;
  const resumed = storage.load('owner', 'player', cards).battle!;
  expect(resumed.id).toBe(b.id);
  expect(resumed.deck?.usedIds).toEqual([ids[0]]);
  expect(localStorage.getItem(k)).toBe(original);
  await storage.command(
    'owner',
    'player',
    cards,
    resumed.id,
    resumed.round,
    'defend',
  );
  expect(storage.load('owner', 'player', cards).battle?.id).toBe(b.id);
});
test('old direct-special transcript explicitly blocks every operation without deleting saved bytes', async () => {
  await save();
  const b = await begin();
  const k = Object.keys(localStorage)[0];
  const parsed = JSON.parse(localStorage.getItem(k)!);
  parsed.journal.actions = ['attack', 'defend', 'special:path-strike'];
  const old = JSON.stringify(parsed);
  localStorage.setItem(k, old);
  expect(() => storage.load('owner', 'player', cards)).toThrow(
    /versão anterior.*bloqueada.*preservado/,
  );
  for (const operation of [
    save,
    begin,
    () => storage.command('owner', 'player', cards, b.id, 4, 'attack'),
    () => storage.claimSettlement('owner', 'player', cards, b.id),
  ]) {
    await expect(operation()).rejects.toThrow(/migração/);
    expect(localStorage.getItem(k)).toBe(old);
  }
});
test('direct-special client command is denied before persistence without consuming anything', async () => {
  await save();
  let b = await begin();
  b = await storage.command('owner', 'player', cards, b.id, b.round, 'attack');
  b = await storage.command('owner', 'player', cards, b.id, b.round, 'defend');
  const k = Object.keys(localStorage)[0];
  const original = localStorage.getItem(k)!;
  await expect(
    storage.command(
      'owner',
      'player',
      cards,
      b.id,
      b.round,
      'special:path-strike' as never,
    ),
  ).rejects.toThrow(/indisponível/);
  expect(localStorage.getItem(k)).toBe(original);
  expect(storage.load('owner', 'player', cards).battle?.deck?.usedIds).toEqual(
    [],
  );
});
