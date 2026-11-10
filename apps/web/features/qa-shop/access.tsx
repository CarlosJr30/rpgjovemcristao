'use client';
import {
  Fragment,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useJourney } from '../journey/state/use-journey';
import {
  initializeShopEconomy,
  readQAShop,
  type ShopState,
} from '../../lib/qa-shop/client';
import { subscribeTraining, trainingEpoch } from '../../lib/training-qa/store';
import { isShopTestPreview, isShopRelease } from '../../lib/release-scope';
import { ShopScreen } from '../journey/screens/shop';
import { EquipmentScreen } from '../journey/screens/equipment';
import { Shell } from '../journey/components/shell';
export function QAShopAccess({ equipment = false }: { equipment?: boolean }) {
  const journey = useJourney();
  if (!isShopTestPreview() && !isShopRelease())
    return <p>Loja e equipamentos ainda indisponíveis neste ambiente.</p>;
  return journey.status === 'ready' ? (
    <Access
      key={journey.traveler.id}
      actor={journey.traveler.id}
      catalog={!equipment}
    >
      {(state, initialize) =>
        equipment ? (
          <EquipmentScreen />
        ) : (
          <ShopScreen
            qa={{
              actor: journey.traveler.id,
              production: isShopRelease(),
              ...state,
              initialize,
            }}
          />
        )
      }
    </Access>
  ) : (
    <Shell>
      <p>Retome seu avatar pelo fluxo normal.</p>
    </Shell>
  );
}
function Access({
  actor,
  catalog,
  children,
}: {
  actor: string;
  catalog: boolean;
  children: (state: ShopState, initialize: () => Promise<void>) => ReactNode;
}) {
  const epoch = useSyncExternalStore(subscribeTraining, trainingEpoch, () => 0);
  const [resolved, setResolved] = useState<{
    epoch: number;
    value: ShopState;
  } | null>(null);
  const [failure, setFailure] = useState<{
    epoch: number;
    message: string;
  } | null>(null);
  const state = resolved?.epoch === epoch ? resolved.value : null;
  const error = failure?.epoch === epoch ? failure.message : '';
  useEffect(() => {
    let live = true;
    readQAShop(actor)
      .then((v) => {
        if (live) setResolved({ epoch, value: v });
      })
      .catch(() => {
        if (live)
          setFailure({ epoch, message: 'Acesso à Loja não confirmado.' });
      });
    return () => {
      live = false;
    };
  }, [actor, epoch]);
  const initialize = async () => {
    const next = await initializeShopEconomy(actor);
    if (trainingEpoch() !== epoch) return;
    setResolved({ epoch, value: next });
    setFailure(null);
  };
  return catalog ? (
    <Fragment key={epoch}>
      {children(
        state ?? {
          enabled: false,
          balanceVerified: false,
          coins: 0,
          reason: error ? 'unavailable' : 'loading',
        },
        initialize,
      )}
    </Fragment>
  ) : state?.enabled && state.balanceVerified ? (
    children(state, initialize)
  ) : (
    <Shell>
      <p>
        {error ||
          (!state
            ? 'Consultando a Loja…'
            : isShopRelease()
              ? state.reason === 'legacy-reconciliation-required'
                ? 'Este avatar aguarda reconciliação econômica. Seus saldos, cartas e equipamentos foram preservados.'
                : 'Operações da Loja aguardam revisão ou ativação. Seu inventário foi preservado.'
              : 'Loja TEST reservada ao avatar QA Loja autorizado.')}
      </p>
    </Shell>
  );
}
