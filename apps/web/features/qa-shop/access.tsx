'use client';
import {
  Fragment,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useJourney } from '../journey/state/use-journey';
import { readQAShop, type ShopState } from '../../lib/qa-shop/client';
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
      {(state) =>
        equipment ? (
          <EquipmentScreen />
        ) : (
          <ShopScreen
            qa={{
              actor: journey.traveler.id,
              production: isShopRelease(),
              ...(state ?? {
                enabled: false,
                balanceVerified: false,
                coins: 0,
                reason: 'loading',
              }),
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
  children: (state: ShopState) => ReactNode;
}) {
  const epoch = useSyncExternalStore(subscribeTraining, trainingEpoch, () => 0);
  const currentEpoch = catalog ? epoch : 0;
  const [resolved, setResolved] = useState<{
    epoch: number;
    value: ShopState;
  } | null>(null);
  const [failedEpoch, setFailedEpoch] = useState<number | null>(null);
  const state = resolved?.epoch === currentEpoch ? resolved.value : null;
  const error = failedEpoch === currentEpoch;
  useEffect(() => {
    let live = true;
    readQAShop(actor)
      .then((v) => {
        if (live) setResolved({ epoch: currentEpoch, value: v });
      })
      .catch(() => {
        if (live) setFailedEpoch(currentEpoch);
      });
    return () => {
      live = false;
    };
  }, [actor, currentEpoch]);
  const visibleState: ShopState = error
    ? {
        enabled: false,
        coins: 0,
        balanceVerified: false,
        reason: 'unavailable',
      }
    : (state ?? {
        enabled: false,
        coins: 0,
        balanceVerified: false,
        reason: 'loading',
      });
  if (catalog)
    return <Fragment key={currentEpoch}>{children(visibleState)}</Fragment>;
  return state?.enabled && state.balanceVerified ? (
    children(state)
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
