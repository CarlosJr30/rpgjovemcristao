import type { BrowserContext } from '@playwright/test';

/** Test transport only: retain the response, including CORS and redirects. */
export async function authenticateProtectedPreview(
  context: BrowserContext,
  origin: string,
  token: string,
) {
  const target = new URL(origin);
  if (
    target.protocol !== 'https:' ||
    target.origin !== origin ||
    !target.hostname.endsWith('.vercel.app') ||
    target.hostname === 'rpgjovemcristao-web-inky.vercel.app' ||
    !token
  ) {
    throw new Error(
      'An explicit HTTPS Preview origin and OIDC token are required',
    );
  }
  // A predicate avoids wildcard matching against another origin or query string.
  await context.route(
    (url) => url.origin === target.origin,
    async (route) => {
      const response = await route.fetch({
        headers: {
          ...route.request().headers(),
          'x-vercel-trusted-oidc-idp-token': token,
        },
        // Never send this deployment's token to a redirect destination.
        maxRedirects: 0,
      });
      await route.fulfill({ response });
    },
  );
}
