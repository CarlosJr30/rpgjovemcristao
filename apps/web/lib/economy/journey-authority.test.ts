import { describe, expect, test } from 'vitest';
import { initialJourneyState, transitionJourney } from './journey-authority';
import { journeyActions, winningSnakeProof } from './testing/journey-fixtures';
import { verifySnakeProof } from '../../features/journey/data/snake-replay';

describe('legacy journey authoritative contract', () => {
  test.each(['constructor','__proto__','toString'])('rejects inherited property names as objective IDs: %s',id=>{
    const state=transitionJourney(initialJourneyState(),{type:'advance',step:'explore'}).state;
    expect(()=>transitionJourney(state,{type:'fragment',id,answers:[]})).toThrow();
    expect(()=>transitionJourney(state,{type:'fragment',id})).toThrow();
    expect(state.progress.gardenFragments).toBe(0);
  });
  test('replays a real synthetic Snake route and completes the unchanged reward path', () => {
    const proof = winningSnakeProof();
    expect(verifySnakeProof(proof)).toBe(true);
    let state = initialJourneyState();
    const keys: string[] = [];
    for (const action of journeyActions(proof)) {
      const r = transitionJourney(state, action);
      state = r.state;
      if (r.rewardKey) keys.push(r.rewardKey);
    }
    expect(state.progress).toMatchObject({
      gardenCompleted: true,
      gardenRewardGranted: true,
      gardenFragments: 3,
      devotionalCompleted: true,
    });
    expect(keys).toEqual([
      'wind-pattern',
      'coins-grove',
      'coins-river',
      'chest-path',
      'chest-hidden',
      'hidden-corner',
      'garden-equipment',
      'phase:garden-choice',
    ]);
    expect(transitionJourney(state, { type: 'complete' }).rewardKey).toBeNull();
  });
  test.each([
    { type: 'complete' },
    { type: 'collect', id: 'invented' },
    { type: 'collect', id: 'chest-hidden' },
    { type: 'fragment', id: 'wind', answers: ['pedras'] },
    {
      type: 'fragment',
      id: 'stones',
      answers: ['limite', 'liberdade', 'orientacao'],
    },
    { type: 'reading', chapter: 'genesis2', action: 'confirm' },
    { type: 'devotional', reflection: 'abc' },
    { type: 'complete', xp: 999999 },
    { type: 'advance', step: 'reward' },
  ])('rejects forged evidence/order: %j', (action) => {
    const state = initialJourneyState();
    expect(() => transitionJourney(state, action)).toThrow();
    expect(state).toEqual(initialJourneyState());
  });
  test('does not accept a winning flag, fabricated coordinates or invalid assistance', () => {
    expect(verifySnakeProof({ frames: [], losses: [], victory: true })).toBe(
      false,
    );
    expect(
      verifySnakeProof({
        frames: [[0.033, 9999, 0, false, true, false]],
        losses: [],
      }),
    ).toBe(false);
    expect(
      verifySnakeProof({
        frames: [[0.033, 1, 0, false, true, true]],
        losses: [],
      }),
    ).toBe(false);
  });
  test('collectible and wind rewards are single entitlements, not amounts from the browser', () => {
    const a = { type: 'collect', id: 'coins-grove' };
    const first = transitionJourney(
      transitionJourney(initialJourneyState(), {
        type: 'advance',
        step: 'explore',
      }).state,
      a,
    );
    expect(first.rewardKey).toBe('coins-grove');
    expect(transitionJourney(first.state, a).rewardKey).toBeNull();
    expect(() =>
      transitionJourney(first.state, { ...a, coins: 999 }),
    ).toThrow();
  });
});
