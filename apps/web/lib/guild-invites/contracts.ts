export const INVITE_TOKEN = /^[a-f0-9]{64}$/;
export const INVITE_UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export type InviteRecord = {
  id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};
export type CreatedInvite = {
  id: string;
  url: string;
  qr: string;
  expires_at: string;
};
export type ResolvedInvite = { guild_name: string; expires_at: string };

export function inviteBaseURL(
  value: string | undefined,
  production = true,
): string {
  if (!value || value.length > 300)
    throw Error('Invalid configured app origin');
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    production &&
    (local ||
      /\.(?:invalid|test|example|localhost)$/.test(url.hostname) ||
      /(?:^|\.)example\.(?:com|net|org)$/.test(url.hostname))
  )
    throw Error('A real production domain is required');
  if (
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && local && !production)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw Error('Invalid configured app origin');
  return url.origin;
}
