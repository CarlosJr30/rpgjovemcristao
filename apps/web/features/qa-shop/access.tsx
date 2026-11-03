'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useJourney } from '../journey/state/use-journey';
import { readQAShop, type ShopState } from '../../lib/qa-shop/client';
import { isShopTestPreview, isShopRelease } from '../../lib/release-scope';
import { ShopScreen } from '../journey/screens/shop';
import { EquipmentScreen } from '../journey/screens/equipment';
import { Shell } from '../journey/components/shell';
export function QAShopAccess({ equipment = false }: { equipment?: boolean }) {
  const journey = useJourney();
  if (!isShopTestPreview() && !isShopRelease())
    return <p>Loja e equipamentos ainda indisponíveis neste ambiente.</p>;
  return journey.status === 'ready' ? (
    <Access key={journey.traveler.id} actor={journey.traveler.id}>
      {(state) =>
        equipment ? (
          <EquipmentScreen />
        ) : (
          <ShopScreen
            qa={{
              actor: journey.traveler.id,
              production: isShopRelease(),
              ...state,
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
  children,
}: {
  actor: string;
  children: (state: ShopState) => ReactNode;
}) {
  const [state, setState] = useState<ShopState | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    readQAShop(actor)
      .then((v) => {
        if (live) setState(v);
      })
      .catch(() => {
        if (live) setError('Acesso à Loja não confirmado.');
      });
    return () => {
      live = false;
    };
  }, [actor]);
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
