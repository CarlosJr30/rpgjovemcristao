'use client';
import { useEffect, useState } from 'react';
import { readShopPurchases } from '../../lib/qa-shop/client';
import { SHOP_OFFERS } from '../journey/data/equipmentCatalog';
export function ShopPurchaseHistory({
  actor,
  revision,
}: {
  actor: string;
  revision: number;
}) {
  const [rows, setRows] = useState<
      Awaited<ReturnType<typeof readShopPurchases>>
    >([]),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    readShopPurchases(actor)
      .then((r) => {
        if (live) {
          setRows(r);
          setError('');
        }
      })
      .catch(() => {
        if (live) setError('Histórico temporariamente indisponível.');
      });
    return () => {
      live = false;
    };
  }, [actor, revision]);
  return (
    <section aria-label="Histórico de compras">
      <h2>Compras confirmadas</h2>
      {error ? (
        <p role="status">{error}</p>
      ) : rows.length ? (
        <ul>
          {rows.map((r) => {
            const item =
              r.rewards &&
              typeof r.rewards === 'object' &&
              !Array.isArray(r.rewards)
                ? r.rewards.itemId
                : null;
            return (
              <li key={r.id}>
                {r.operation_type === 'purchase'
                  ? 'Baú comum'
                  : (SHOP_OFFERS.find((o) => o.equipment.id === item)?.equipment
                      .name ?? 'Equipamento')}{' '}
                · {r.price_paid} moedas ·{' '}
                {new Date(r.created_at).toLocaleString('pt-BR')}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>Nenhuma compra confirmada.</p>
      )}
    </section>
  );
}
