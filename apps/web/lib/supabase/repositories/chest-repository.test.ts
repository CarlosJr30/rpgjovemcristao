import { beforeEach, describe, expect, test, vi } from 'vitest';

const { client, rpc } = vi.hoisted(() => {
  const rpc = vi.fn();
  return { client: { rpc, from: vi.fn() }, rpc };
});
vi.mock('../client', () => ({ getSupabaseBrowserClient: () => client }));

import { chestRepository } from './chest-repository';

beforeEach(() => rpc.mockReset());

describe('chest repository', () => {
  test('receipt lookup is read-only, scoped to Traveler, open type and exact operation key', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const chain = { select: vi.fn(), eq: vi.fn(), maybeSingle };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    client.from.mockReturnValue(chain);
    expect(
      await chestRepository.operation('traveler-1', 'open:operation-2'),
    ).toBeNull();
    expect(client.from).toHaveBeenCalledWith('chest_operations');
    expect(chain.eq.mock.calls).toEqual([
      ['traveler_id', 'traveler-1'],
      ['operation_type', 'open'],
      ['operation_key', 'open:operation-2'],
    ]);
    expect(rpc).not.toHaveBeenCalled();
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'private database detail' },
    });
    await expect(
      chestRepository.operation('traveler-1', 'open:operation-2'),
    ).rejects.toThrow(
      'Não foi possível confirmar a abertura. Consulte novamente sem abrir outro Baú.',
    );
  });
  test('purchase sends only traveler, tier and operation id', async () => {
    rpc.mockResolvedValue({
      data: {
        chestType: 'common',
        quantityAdded: 1,
        coins: 60,
        pricePaid: 40,
        duplicate: false,
      },
      error: null,
    });
    await chestRepository.purchase('traveler-1', 'common', 'operation-1');
    expect(rpc).toHaveBeenCalledWith('purchase_chest', {
      p_traveler_id: 'traveler-1',
      p_chest_type: 'common',
      p_operation_id: 'operation-1',
    });
    expect(JSON.stringify(rpc.mock.calls[0][1])).not.toMatch(/reward|price/i);
  });

  test('opening never sends RNG or reward from the browser', async () => {
    rpc.mockResolvedValue({
      data: {
        chestType: 'rare',
        coins: 105,
        itemId: null,
        itemName: null,
        source: 'mission',
        remainingQuantity: 0,
        duplicate: false,
      },
      error: null,
    });
    await chestRepository.open('traveler-1', 'rare', 'operation-2');
    expect(rpc).toHaveBeenCalledWith('open_chest', {
      p_traveler_id: 'traveler-1',
      p_chest_type: 'rare',
      p_operation_id: 'operation-2',
    });
    expect(JSON.stringify(rpc.mock.calls[0][1])).not.toMatch(
      /random|roll|coin|item/i,
    );
  });
});
