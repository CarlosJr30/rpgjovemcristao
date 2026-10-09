import { APPROVED_VISUAL_ASSETS } from './approved-visual-assets';
export type VisualSlot =
  | 'arenaBackground'
  | 'arenaDavi'
  | 'arenaElias'
  | 'arenaMara'
  | 'arenaNoemi'
  | 'guildPortal'
  | 'equipmentPortal'
  | 'diaryPortal'
  | 'guildHall'
  | 'guildBanner'
  | 'guildMissionParchment'
  | 'guildLeaderTable'
  | 'guildRewardChest';
export type VisualAsset = Readonly<{
  src: string;
  mobileSrc?: string;
  license: string;
}>;
export const VISUAL_ASSETS = APPROVED_VISUAL_ASSETS;
export function isApprovedVisualAsset(asset: VisualAsset) {
  const local = (src: string) =>
    /^\/assets\/(world|characters)\/[a-zA-Z0-9/_-]{1,180}\.(png|webp)$/.test(
      src,
    );
  return (
    local(asset.src) &&
    (!asset.mobileSrc || local(asset.mobileSrc)) &&
    asset.license.trim().length > 0
  );
}
export function trainingPortraitSlot(id?: string): VisualSlot | undefined {
  return (
    {
      'training-apprentice': 'arenaDavi',
      'training-balanced': 'arenaElias',
      'training-guardian': 'arenaMara',
      'training-tactician': 'arenaNoemi',
    } as Record<string, VisualSlot>
  )[id ?? ''];
}
