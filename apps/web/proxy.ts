import { NextResponse, type NextRequest } from 'next/server';
import { isArenaPreview } from './lib/arena-preview';

export function proxy(request: NextRequest) {
  if (!isArenaPreview()) return NextResponse.next();
  const pathname = request.nextUrl.pathname;
  let response: NextResponse;
  if (
    !['GET', 'HEAD'].includes(request.method) ||
    pathname.startsWith('/api/')
  ) {
    response = NextResponse.json(
      { error: 'Operações persistentes indisponíveis nesta demonstração.' },
      { status: 403 },
    );
  } else if (
    pathname === '/arena-demo' ||
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/assets/') ||
    pathname === '/favicon.ico'
  ) {
    response = NextResponse.next();
  } else {
    response = NextResponse.redirect(new URL('/arena-demo', request.url));
  }
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self'; connect-src 'self'; form-action 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  );
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('X-Arena-Demo', 'memory-only');
  return response;
}
