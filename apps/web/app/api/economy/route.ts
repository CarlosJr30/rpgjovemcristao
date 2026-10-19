import { handleEconomy } from '../../../lib/economy/authority';
import { createEconomyPort } from '../../../lib/economy/server';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    return await handleEconomy(request, createEconomyPort());
  } catch {
    return Response.json(
      { error: 'Operação econômica indisponível.' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
