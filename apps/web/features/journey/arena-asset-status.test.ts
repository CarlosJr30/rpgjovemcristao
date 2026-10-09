import { expect, test } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { readArenaAssetStatus } from './dev/arena-asset-status';
test('seis slots refletem arquivos físicos; status não escreve receipts/catálogo nem omite mobile', async () => {
  const receipt = path.resolve(
    'docs/architecture/audiovisual-pack-approvals.json',
  );
  const before = await fs.readFile(receipt);
  const statuses = await readArenaAssetStatus(process.cwd());
  expect(statuses).toHaveLength(6);
  for (const status of statuses) {
    const exists = await fs
      .stat(path.join('apps/web/public/assets', status.file))
      .then(
        () => true,
        () => false,
      );
    if (!exists) expect(status.status).toBe('MISSING');
    else expect(['REJECTED', 'APPROVED', 'READY']).toContain(status.status);
  }
  expect(statuses.find((s) => s.key === 'arenaBackgroundMobile')?.width).toBe(
    960,
  );
  expect(await fs.readFile(receipt)).toEqual(before);
});
test('arquivo sintético fora do runtime só passa de REJECTED para APPROVED após audit; nunca READY sem catálogo', async () => {
  const parent = path.resolve('build/task-0041-fixtures');
  await fs.mkdir(parent, { recursive: true });
  const root = await fs.mkdtemp(path.join(parent, 'status-'));
  const file = 'characters/arena/dev_placeholder.png';
  try {
    await fs.mkdir(path.join(root, 'docs/architecture'), { recursive: true });
    await fs.mkdir(path.join(root, 'apps/web/public/assets/characters/arena'), {
      recursive: true,
    });
    const bytes = await sharp({
      create: {
        width: 2,
        height: 3,
        channels: 4,
        background: { r: 1, g: 1, b: 1, alpha: 0 },
      },
    })
      .png()
      .toBuffer();
    await fs.writeFile(path.join(root, 'apps/web/public/assets', file), bytes);
    await fs.writeFile(
      path.join(root, 'docs/architecture/audiovisual-pack-v1.json'),
      JSON.stringify({
        version: 1,
        items: [
          {
            kind: 'visual',
            key: 'arenaDavi',
            file,
            width: 2,
            height: 3,
            transparent: true,
          },
        ],
      }),
    );
    const receipt = path.join(
      root,
      'docs/architecture/audiovisual-pack-approvals.json',
    );
    await fs.writeFile(receipt, JSON.stringify({ version: 1, files: {} }));
    expect((await readArenaAssetStatus(root))[0].status).toBe('REJECTED');
    await fs.writeFile(
      receipt,
      JSON.stringify({
        version: 1,
        files: {
          [file]: {
            sha256: createHash('sha256').update(bytes).digest('hex'),
            licenseId: 'original',
            licenseSource: 'SYNTHETIC TEST ONLY',
            author: 'TEST FIXTURE',
            reviewedBy: 'TEST FIXTURE ONLY; NOT HUMAN APPROVAL',
            reviewedAt: '2026-10-05T12:00:00.000Z',
            presentationApproved: true,
          },
        },
      }),
    );
    expect((await readArenaAssetStatus(root))[0].status).toBe('APPROVED');
  } finally {
    const resolved = path.resolve(root);
    if (!resolved.startsWith(parent + path.sep))
      throw new Error('Unsafe fixture cleanup');
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
