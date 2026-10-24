import { NextRequest, NextResponse } from 'next/server';
import { isReleasedPath, unavailableResponse } from './lib/release-scope';
export function proxy(request: NextRequest) {
  if (isReleasedPath(request.nextUrl.pathname)) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/api/'))
    return unavailableResponse();
  return new NextResponse(
    '<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recurso indisponível</title><main><h1>Este recurso ainda não está disponível</h1><p>Continue com sua Guilda e a Escola Bíblica.</p><a href="/journey/guild">Acessar Guilda</a></main></html>',
    {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );
}
export const config = { matcher: ['/journey/:path*', '/api/authority'] };
