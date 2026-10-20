export type RevealPhase =
  | 'ready'
  | 'opening'
  | 'rising'
  | 'holding'
  | 'flipping'
  | 'details'
  | 'summary';
export const REVEAL_TIMING = {
  opening: 650,
  rising: 1000,
  holding: 2000,
  flipping: 550,
} as const;
export type RevealState = {
  phase: RevealPhase;
  index: number;
  seen: number;
  revision: number;
};
export type RevealEvent = {
  type: 'start' | 'tick' | 'skip' | 'next';
  revision: number;
  count: number;
  static?: boolean;
};
export function revealTransition(
  state: RevealState,
  event: RevealEvent,
): RevealState {
  if (
    event.revision !== state.revision ||
    event.count < 1 ||
    state.phase === 'summary'
  )
    return state;
  const revision = state.revision + 1;
  const detail = () => ({
    ...state,
    phase: 'details' as const,
    seen: Math.max(state.seen, state.index + 1),
    revision,
  });
  if (event.type === 'skip' && state.phase !== 'details') return detail();
  if (event.type === 'start' && state.phase === 'ready')
    return event.static ? detail() : { ...state, phase: 'opening', revision };
  if (event.type === 'tick') {
    const phases = {
      opening: 'rising',
      rising: 'holding',
      holding: 'flipping',
    } as const;
    if (state.phase === 'flipping') return detail();
    if (state.phase in phases)
      return {
        ...state,
        phase: phases[state.phase as keyof typeof phases],
        revision,
      };
  }
  if (event.type === 'next' && state.phase === 'details') {
    if (state.index + 1 === event.count)
      return { ...state, phase: 'summary', revision };
    return {
      ...state,
      index: state.index + 1,
      phase: event.static ? 'details' : 'rising',
      seen: event.static ? state.index + 2 : state.seen,
      revision,
    };
  }
  return state;
}
