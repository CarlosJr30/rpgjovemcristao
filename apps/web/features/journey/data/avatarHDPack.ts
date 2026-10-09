import type { AvatarGender } from './avatarAssets';
import approvedAssets from './avatarHDApproved.json';

export type AvatarHDStatus =
  | 'LEGACY'
  | 'PENDING_HD'
  | 'HD_READY'
  | 'VALIDATED'
  | 'REJECTED'
  | 'HUMAN_VISUAL_APPROVED';
export type AvatarHDAsset = {
  id: string;
  gender: AvatarGender;
  legacy: string;
  source: string;
  width: number;
  height: number;
  status: AvatarHDStatus;
  sha256?: string;
  reviewedBy?: string;
  reviewedAt?: string;
};
// Metadata only: importing the catalog never fetches or preloads its images.
// SHA/provenance verified against native PNGs and explicit human receipts by audit.
export const AVATAR_HD_APPROVED = approvedAssets as readonly AvatarHDAsset[];
export const AVATAR_HD_PILOTS = (['male', 'female'] as const).flatMap(
  (gender) =>
    AVATAR_HD_APPROVED.filter(
      (asset) => asset.id === `${gender}_short_moss_medium`,
    ),
);

export function selectAvatarHDAsset(
  legacy: string,
  assets: readonly AvatarHDAsset[] = AVATAR_HD_APPROVED,
  reviewPilot = false,
) {
  const asset = assets.find((candidate) => candidate.legacy === legacy);
  if (!asset || asset.width !== 1024 || asset.height !== 1536) return undefined;
  // Exact local identity-specific path; never accept arbitrary URL or traversal.
  if (
    !/^(male|female)_(short|long|curly)_(moss|ochre|blue)_(light|medium|dark)$/.test(
      asset.id,
    )
  )
    return undefined;
  if (
    !asset.id.startsWith(`${asset.gender}_`) ||
    asset.legacy !== `/assets/avatar/runtime/${asset.gender}/${asset.id}.png` ||
    asset.source !== `/assets/avatar/hd/${asset.gender}/${asset.id}_hd.png`
  )
    return undefined;
  const devReview =
    process.env.NODE_ENV === 'development' &&
    (reviewPilot || process.env.NEXT_PUBLIC_AVATAR_HD_LAB === '1');
  const approved =
    asset.status === 'HUMAN_VISUAL_APPROVED' &&
    /^[a-f0-9]{64}$/.test(asset.sha256 ?? '') &&
    Boolean(asset.reviewedBy) &&
    Number.isFinite(Date.parse(asset.reviewedAt ?? ''));
  // Retain the isolated lab preview, but never bypass a rejection.
  return approved || (devReview && asset.status === 'HD_READY')
    ? asset
    : undefined;
}
