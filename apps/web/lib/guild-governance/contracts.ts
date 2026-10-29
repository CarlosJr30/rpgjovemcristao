export const GOVERNANCE_PERMISSIONS = [
  'admins.manage',
  'leadership.manage',
  'guilds.read',
  'audit.read',
] as const;
export type GovernancePermission = (typeof GOVERNANCE_PERMISSIONS)[number];
export const LEADERSHIP_PATH = '/guilda/lideranca/convite';
export const GOVERNANCE_PATH = '/journey/guild/administration';
export const LEADERSHIP_COOKIE = 'rpg_leadership_invite';
export type GovernanceStatus = {
  version: 1 | 2;
  administrator: boolean;
  permissions: GovernancePermission[];
  leadership: 'none' | 'active' | 'revoked';
  multiGuildReady: boolean;
  canCreateAdditionalGuilds: boolean;
  writesEnabled?: boolean;
  economicRewardsEnabled: false;
};
export type GovernanceWorkspace = {
  version: 1;
  guilds: {
    id: string;
    name: string;
    status: string;
    leader_alias: string;
    members: number;
  }[];
  invitations: {
    id: string;
    created_at: string;
    expires_at: string;
    revoked_at: string | null;
    consumed_at: string | null;
  }[];
};
export type GovernanceHistory = {
  id: number;
  action: string;
  reason: string;
  created_at: string;
  resource_id: string;
}[];
export type LeadershipPreview = {
  id: string;
  kind: 'leadership';
  expiresAt: string;
};
export type IssuedLeadershipInvite = LeadershipPreview & {
  url?: string;
  qr?: string;
  replayed?: boolean;
};

export function parseGovernanceStatus(value: unknown): GovernanceStatus {
  if (!value || typeof value !== 'object')
    throw Error('Invalid governance response');
  const x = value as Record<string, unknown>;
  if (
    (x.version !== 1 && x.version !== 2) ||
    typeof x.administrator !== 'boolean' ||
    !Array.isArray(x.permissions) ||
    !x.permissions.every((p) => GOVERNANCE_PERMISSIONS.includes(p)) ||
    new Set(x.permissions).size !== x.permissions.length ||
    x.administrator !== x.permissions.length > 0 ||
    !['none', 'active', 'revoked'].includes(String(x.leadership)) ||
    typeof x.multiGuildReady !== 'boolean' ||
    typeof x.canCreateAdditionalGuilds !== 'boolean' ||
    (x.version === 1 &&
      (x.multiGuildReady !== false || x.canCreateAdditionalGuilds !== false)) ||
    (x.version === 2 &&
      (x.multiGuildReady !== true || typeof x.writesEnabled !== 'boolean')) ||
    (x.canCreateAdditionalGuilds === true &&
      (x.leadership !== 'active' || x.writesEnabled !== true)) ||
    x.economicRewardsEnabled !== false
  )
    throw Error('Invalid governance response');
  return x as GovernanceStatus;
}
