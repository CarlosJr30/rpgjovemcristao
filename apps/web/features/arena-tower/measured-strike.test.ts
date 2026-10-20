// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest';
import { arenaDeckStorage } from '../arena-deck/storage';
import { TOWER_FLOORS } from './config';
import { finishTower, loadTower, towerArenaSession } from './storage';
import {
  MEASURED_CARD_ID,
  measuredHero,
  measuredOpponent,
  syntheticSevenCards,
} from '../../../../tests/fixtures/measured-strike';
const owner = '003a-fixture-account';
const cards = syntheticSevenCards(),
  ids = cards.map((card) => card.id);
beforeEach(() => {
  localStorage.clear();
  const queues = new Map<string, Promise<unknown>>();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (key: string, _options: object, action: () => unknown) => {
        const next = (queues.get(key) ?? Promise.resolve()).then(action);
        queues.set(
          key,
          next.catch(() => undefined),
        );
        return next;
      },
    },
  });
});

test('training reload preserves used candidate and stale concurrent commands accept only one effect', async () => {
  await arenaDeckStorage.save(owner, measuredHero.id, cards, ids);
  let b = await arenaDeckStorage.begin(
    owner,
    measuredHero.id,
    cards,
    measuredHero,
    measuredOpponent,
  );
  b = await arenaDeckStorage.command(
    owner,
    measuredHero.id,
    cards,
    b.id,
    b.round,
    'defend',
  );
  const commands = await Promise.allSettled(
    [1, 2].map(() =>
      arenaDeckStorage.command(
        owner,
        measuredHero.id,
        cards,
        b.id,
        b.round,
        `card:${MEASURED_CARD_ID}`,
      ),
    ),
  );
  expect(
    commands.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  const reloaded = arenaDeckStorage.load(owner, measuredHero.id, cards).battle!;
  expect(reloaded.deck?.usedIds).toEqual([MEASURED_CARD_ID]);
  expect(reloaded.round).toBe(b.round + 1);
  await expect(
    arenaDeckStorage.command(
      owner,
      measuredHero.id,
      cards,
      reloaded.id,
      reloaded.round,
      `card:${MEASURED_CARD_ID}`,
    ),
  ).rejects.toThrow();
  expect(
    arenaDeckStorage.load('foreign', measuredHero.id, cards).battle,
  ).toBeNull();
  expect(arenaDeckStorage.load(owner, 'foreign', cards).battle).toBeNull();
});

test('first two Tower floors restore candidate in the next battle and never settle training rewards', async () => {
  const hero = {
    ...measuredHero,
    attributes: { life: 100, strength: 80, defense: 30, wisdom: 30 },
  };
  await arenaDeckStorage.save(owner, hero.id, cards, ids);
  for (const floor of [0, 1]) {
    const session = towerArenaSession(floor);
    let b = await session.begin(
      owner,
      hero.id,
      cards,
      hero,
      TOWER_FLOORS[floor].snapshot,
    );
    expect(b.deck?.usedIds).toEqual([]);
    await expect(
      session.command(
        owner,
        hero.id,
        cards,
        b.id,
        b.round,
        `card:${MEASURED_CARD_ID}`,
      ),
    ).rejects.toThrow();
    b = await session.command(owner, hero.id, cards, b.id, b.round, 'defend');
    b = await session.command(
      owner,
      hero.id,
      cards,
      b.id,
      b.round,
      `card:${MEASURED_CARD_ID}`,
    );
    expect(b.deck?.usedIds).toEqual([MEASURED_CARD_ID]);
    expect(loadTower(owner, hero.id, cards).battle?.deck?.usedIds).toEqual([
      MEASURED_CARD_ID,
    ]);
    expect(b.status).toBe('finished');
    expect(b.winnerId).toBe(hero.id);
    expect(await session.claimSettlement(owner, hero.id, cards, b.id)).toBe(
      false,
    );
    await finishTower(owner, hero.id, cards, b.id);
    expect(loadTower(owner, hero.id, cards).progress.wins).toHaveLength(
      floor + 1,
    );
  }
  const keys = Array.from({ length: localStorage.length }, (_, index) =>
    localStorage.key(index)!,
  );
  expect(keys.every((key) => key.startsWith('rpg-jovem-cristao:arena-'))).toBe(
    true,
  );
});

test('defeat does not advance or grant; NPC parameters and synthetic collection stay unchanged', async () => {
  const beforeNpc = JSON.stringify(TOWER_FLOORS),
    beforeCards = JSON.stringify(cards);
  const weak = {
    ...measuredHero,
    level: 1,
    attributes: { life: 1, strength: 0, defense: 0, wisdom: 0 },
  };
  await arenaDeckStorage.save(owner, weak.id, cards, ids);
  const session = towerArenaSession(0);
  let b = await session.begin(
    owner,
    weak.id,
    cards,
    weak,
    TOWER_FLOORS[0].snapshot,
  );
  for (let turn = 0; turn < 50 && b.status === 'in_progress'; turn++)
    b = await session.command(owner, weak.id, cards, b.id, b.round, 'defend');
  expect(b.status).toBe('finished');
  expect(b.winnerId).not.toBe(weak.id);
  await finishTower(owner, weak.id, cards, b.id);
  expect(loadTower(owner, weak.id, cards).progress.wins).toEqual([]);
  expect(await session.claimSettlement(owner, weak.id, cards, b.id)).toBe(
    false,
  );
  expect(JSON.stringify(TOWER_FLOORS)).toBe(beforeNpc);
  expect(JSON.stringify(cards)).toBe(beforeCards);
});
