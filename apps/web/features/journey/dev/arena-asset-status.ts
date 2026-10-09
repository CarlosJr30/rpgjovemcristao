import fs from 'node:fs/promises';
import path from 'node:path';
import { auditPack } from '../../../../../scripts/audiovisual-pack.mjs';
import { APPROVED_VISUAL_ASSETS } from '../data/approved-visual-assets';
import type { VisualSlot } from '../data/audiovisualAssets';

type Item = {
  kind: string;
  key: VisualSlot;
  file: string;
  width: number;
  height: number;
  transparent?: boolean;
  mobileFile?: string;
  mobileWidth?: number;
  mobileHeight?: number;
};
export type ArenaAssetStatus = {
  key: string;
  label: string;
  file: string;
  width: number;
  height: number;
  status: 'MISSING' | 'REJECTED' | 'APPROVED' | 'READY';
  reason?: string;
};
// Same manifest, receipts and auditor as the CLI; no parallel approval implementation.
export async function readArenaAssetStatus(
  root: string,
): Promise<ArenaAssetStatus[]> {
  const read = async (file: string) => {
    const text = await fs.readFile(
      path.join(root, 'docs/architecture', file),
      'utf8',
    );
    if (text.length > 131072) throw new Error('Manifest exceeds limit');
    return JSON.parse(text);
  };
  const manifest = await read('audiovisual-pack-v1.json');
  const approvals = await read('audiovisual-pack-approvals.json');
  const items = (manifest.items as Item[]).filter(
    (item) => item.kind === 'visual' && item.key.startsWith('arena'),
  );
  const statuses: ArenaAssetStatus[] = [];
  for (const item of items) {
    const variants = [
      { ...item, mobileFile: undefined },
      ...(item.mobileFile
        ? [
            {
              ...item,
              file: item.mobileFile,
              width: item.mobileWidth!,
              height: item.mobileHeight!,
              mobileFile: undefined,
            },
          ]
        : []),
    ];
    for (const [index, variant] of variants.entries()) {
      const audit = await auditPack(
        root,
        { ...manifest, items: [variant] },
        approvals,
      );
      const result = audit.results.find(
        (result) => result.file === variant.file,
      );
      const asset = APPROVED_VISUAL_ASSETS[item.key];
      const generatedSrc = index === 1 ? asset?.mobileSrc : asset?.src;
      const audited = audit.visual[item.key];
      const ready =
        audited &&
        generatedSrc === audited.src &&
        asset?.license === audited.license;
      statuses.push({
        key: `${item.key}${index ? 'Mobile' : ''}`,
        label:
          item.key === 'arenaBackground'
            ? index
              ? 'ARENA MOBILE BACKGROUND'
              : 'ARENA BACKGROUND'
            : item.key.replace('arena', '').toUpperCase(),
        file: variant.file,
        width: variant.width,
        height: variant.height,
        status:
          result?.status === 'VALIDATED'
            ? ready
              ? 'READY'
              : 'APPROVED'
            : result?.status === 'MISSING'
              ? 'MISSING'
              : 'REJECTED',
        reason: result?.reason,
      });
    }
  }
  return statuses;
}
