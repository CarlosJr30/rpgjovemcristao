export type SupabasePublicConfig = Readonly<{
  url: string;
  publishableKey: string;
}>;

type SupabasePublicEnv = Readonly<{
  url?: string;
  publishableKey?: string;
}>;

export const validateSupabasePublicEnv = ({
  url,
  publishableKey,
}: SupabasePublicEnv): SupabasePublicConfig => {
  const normalizedUrl = url?.trim();
  const normalizedKey = publishableKey?.trim();

  if (!normalizedUrl || !normalizedKey) {
    throw new Error('Supabase environment variables are missing');
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    throw new Error('Supabase URL is invalid');
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('Supabase URL is invalid');
  }

  const isLocalHttp =
    parsedUrl.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname);

  if (
    (parsedUrl.protocol === 'http:' && !isLocalHttp) ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new Error('Supabase URL is invalid');
  }

  return {
    url: normalizedUrl.replace(/\/$/, ''),
    publishableKey: normalizedKey,
  };
};

export const getSupabasePublicConfig = (): SupabasePublicConfig =>
  validateSupabasePublicEnv({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
