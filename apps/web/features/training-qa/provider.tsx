'use client';
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useCanonicalJourney } from '../journey/state/use-journey';
import { useAuth } from '../../lib/supabase/auth-context';
import { getOnlineSessionRevision } from '../../lib/supabase/online-sync';
import { readTraining } from '../../lib/training-qa/client';
import {
  trainingSnapshot,
  emptyTrainingSnapshot,
  subscribeTraining,
  setTraining,
  trainingRoute,
} from '../../lib/training-qa/store';
import { trainingTraveler } from './overlay';
import { TrainingTravelerContext } from './context';
export function TrainingQAProvider({ children }: { children: ReactNode }) {
  const auth = useAuth(),
    journey = useCanonicalJourney(),
    path = usePathname();
  const binding = useSyncExternalStore(
    subscribeTraining,
    trainingSnapshot,
    emptyTrainingSnapshot,
  );
  const actor = journey.status === 'ready' ? journey.traveler.id : null,
    owner = auth.status === 'signedIn' ? auth.user.id : null;
  const enabled =
    process.env.NEXT_PUBLIC_ECONOMY_QA002 === '1' && trainingRoute(path);
  useEffect(() => {
    let live = true;
    if (!enabled || !actor || !owner) {
      setTraining(null);
      return;
    }
    const session = getOnlineSessionRevision();
    readTraining(actor)
      .then((state) => {
        if (!live) return;
        const old = trainingSnapshot();
        setTraining(
          state
            ? {
                owner,
                actor,
                session,
                state:
                  old?.actor === actor && old.state.revision > state.revision
                    ? old.state
                    : state,
                selected: !!(
                  old?.owner === owner &&
                  old.actor === actor &&
                  old.session === session &&
                  old.selected
                ),
              }
            : null,
        );
      })
      .catch(() => {
        if (live) setTraining(null);
      });
    return () => {
      live = false;
    };
  }, [actor, owner, path, enabled]);
  useEffect(() => {
    if (!binding) return;
    const delay = Date.parse(binding.state.expiresAt) - Date.now();
    const timer = setTimeout(
      () => setTraining(null),
      Math.max(0, Math.min(delay, 2147483647)),
    );
    return () => clearTimeout(timer);
  }, [binding]);
  const overlay = useMemo(
    () =>
      enabled &&
      binding?.selected &&
      binding.actor === actor &&
      binding.owner === owner &&
      binding.session === getOnlineSessionRevision() &&
      journey.status === 'ready'
        ? trainingTraveler(journey.traveler, binding.state)
        : null,
    [enabled, binding, actor, owner, journey],
  );
  return (
    <TrainingTravelerContext.Provider value={overlay}>
      <Fragment key={overlay ? binding?.state.activation : 'canonical'}>
        {children}
      </Fragment>
    </TrainingTravelerContext.Provider>
  );
}
export function TrainingQAControls() {
  const binding = useSyncExternalStore(
      subscribeTraining,
      trainingSnapshot,
      emptyTrainingSnapshot,
    ),
    path = usePathname(),
    [error, setError] = useState('');
  if (!binding || !trainingRoute(path)) return null;
  const toggle = async () => {
    try {
      if (binding.selected) {
        setTraining({ ...binding, selected: false });
        return;
      }
      const state = await readTraining(binding.actor);
      if (!state || trainingSnapshot() !== binding)
        throw Error('Treino indisponível.');
      setTraining({ ...binding, state, selected: true });
      setError('');
    } catch {
      setError('Treino indisponível. Retome sua conta.');
    }
  };
  return (
    <aside role="note">
      <strong>
        {binding.selected
          ? 'TREINO — saldo e itens QA'
          : 'Treino isolado disponível'}
      </strong>
      <p>
        {binding.selected
          ? `${binding.state.coins} moedas QA. Itens e saldo oficiais preservados.`
          : 'Orçamento privado, sem alteração do saldo legado.'}
      </p>
      <p>
        Validade: {new Date(binding.state.expiresAt).toLocaleString('pt-BR')}
      </p>
      <button onClick={() => void toggle()}>
        {binding.selected ? 'Sair do treino isolado' : 'Ativar treino isolado'}
      </button>
      {error && <p role="status">{error}</p>}
    </aside>
  );
}
