export const MEMBER_INVITE_PATH = '/guilda/participar';
export const MEMBER_INVITE_COOKIE = 'rpg_member_invite';
export type MemberInvitePreview = {
  guildName: string;
  className: string | null;
  expiresAt: string;
};
export type MemberInvite = {
  id: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number;
  uses: number;
  revokedAt: string | null;
};
export type IssuedMemberInvite = {
  id: string;
  expiresAt: string;
  replayed: boolean;
  url?: string;
  qr?: string;
};
