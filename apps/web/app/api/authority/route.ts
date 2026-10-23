import { createAuthorityPort } from '../../../lib/authority/server';
import { handleAuthority } from '../../../lib/authority/service';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    return await handleAuthority(request, createAuthorityPort());
  } catch {
    return Response.json(
      { error: 'Servidor oficial indisponível.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
