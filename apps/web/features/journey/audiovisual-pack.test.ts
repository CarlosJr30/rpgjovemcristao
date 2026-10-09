import { afterEach, expect, test } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { auditPack } from '../../../../scripts/audiovisual-pack.mjs';
import { MUSIC_ASSETS, SOUND_ASSETS } from './audio/audio-assets';
import { VISUAL_ASSETS } from './data/audiovisualAssets';
const roots: string[] = [];
afterEach(async () => {
  for (const root of roots) {
    const base = path.resolve('build/task-0038-fixtures');
    const target = path.resolve(root);
    if (!target.startsWith(base + path.sep))
      throw new Error('Unsafe fixture cleanup');
    await fs.rm(target, { recursive: true, force: true });
  }
  roots.length = 0;
});
const manifest = {
  version: 1,
  items: [
    { kind: 'music', key: 'arena', file: 'audio/music/arena_training.ogg' },
  ],
};
test('catálogos reais correspondem apenas a arquivos aprovados presentes', async () => {
  const root = process.cwd();
  const read = async (name: string) =>
    JSON.parse(
      await fs.readFile(path.join(root, 'docs/architecture', name), 'utf8'),
    );
  const audit = await auditPack(
    root,
    await read('audiovisual-pack-v1.json'),
    await read('audiovisual-pack-approvals.json'),
  );
  // Delivered-but-unreviewed files must fail the pack audit without entering
  // any runtime catalog. Pack approval is separate from this safety invariant.
  const registered = [
    ...Object.values(MUSIC_ASSETS),
    ...Object.values(SOUND_ASSETS),
    ...Object.values(VISUAL_ASSETS),
  ].flatMap((asset) =>
    asset
      ? [
          asset.src,
          ...('fallbackSrc' in asset && asset.fallbackSrc
            ? [asset.fallbackSrc]
            : []),
          ...('mobileSrc' in asset && asset.mobileSrc ? [asset.mobileSrc] : []),
        ]
      : [],
  );
  for (const rejected of audit.results.filter(
    (result) => result.status === 'REJECTED',
  ))
    expect(registered).not.toContain(`/assets/${rejected.file}`);
  expect(MUSIC_ASSETS).toEqual(audit.music);
  expect(SOUND_ASSETS).toEqual(audit.effects);
  expect(VISUAL_ASSETS).toEqual(audit.visual);
});
test('arquivo ausente não registra URL; traversal e duplicação são rejeitados', async () => {
  const parent = path.resolve('build/task-0038-fixtures');
  await fs.mkdir(parent, { recursive: true });
  const root = await fs.mkdtemp(path.join(parent, 'missing-'));
  roots.push(root);
  const audit = await auditPack(root, manifest, {
    version: 1,
    files: {},
  });
  expect(audit.music).toEqual({});
  expect(audit.results[0].status).toBe('MISSING');
  const unsafe = await auditPack(
    root,
    {
      version: 1,
      items: [
        { ...manifest.items[0], file: 'audio/music/../../secret.ogg' },
        ...manifest.items,
        ...manifest.items,
      ],
    },
    { version: 1, files: {} },
  );
  expect(unsafe.pass).toBe(false);
});
test('mídia entregue exige hash, licença, audição e metadados; fallback também', async () => {
  const parent = path.resolve('build/task-0038-fixtures');
  await fs.mkdir(parent, { recursive: true });
  const root = await fs.mkdtemp(path.join(parent, 'pack-'));
  roots.push(root);
  const file = path.join(
    root,
    'apps/web/public/assets',
    manifest.items[0].file,
  );
  await fs.mkdir(path.dirname(file), { recursive: true });
  const bytes = Buffer.from('OggS synthetic fixture; never runtime');
  await fs.writeFile(file, bytes);
  const review = {
    sha256: createHash('sha256').update(bytes).digest('hex'),
    licenseId: 'original',
    licenseSource: 'Synthetic unit fixture',
    author: 'test',
    reviewedBy: 'test',
    reviewedAt: '2026-10-05T00:00:00Z',
    presentationApproved: true,
    loopApproved: true,
    noClippingApproved: true,
    levelApproved: true,
  };
  const approvals = { version: 1, files: { [manifest.items[0].file]: review } };
  const probe = () => ({ sampleRate: 48000, channels: 2, duration: 90 });
  expect(
    (await auditPack(root, manifest, { version: 1, files: {} }, probe)).pass,
  ).toBe(false);
  expect(
    (
      await auditPack(root, manifest, approvals, () => ({
        ...probe(),
        duration: 3,
      }))
    ).pass,
  ).toBe(false);
  const valid = await auditPack(root, manifest, approvals, probe);
  expect(valid.music).toEqual({
    arena: {
      src: '/assets/audio/music/arena_training.ogg',
      license: expect.any(String),
    },
  });
  // Technical presence/metadata and a named reviewer cannot substitute for
  // license provenance or any mandatory human audio approval.
  for (const pending of [
    { licenseId: 'PENDING_HUMAN_CONFIRMATION' },
    { author: undefined },
    { reviewedAt: undefined },
    { presentationApproved: false },
    { noClippingApproved: false },
    { levelApproved: false },
    { loopApproved: false },
  ]) {
    const audit = await auditPack(
      root,
      manifest,
      {
        version: 1,
        files: { [manifest.items[0].file]: { ...review, ...pending } },
      },
      probe,
    );
    expect(audit.pass).toBe(false);
    expect(audit.music).toEqual({});
  }
  await fs.writeFile(file, Buffer.from('OggS changed'));
  expect((await auditPack(root, manifest, approvals, probe)).pass).toBe(false);
});
