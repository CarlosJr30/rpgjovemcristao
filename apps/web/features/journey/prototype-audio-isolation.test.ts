import { afterEach, expect, test, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  assertPrototypeSources,
  assertProductionPublic,
  assertProductionArtifact,
  readPrototypePolicy,
} from '../../../../scripts/prototype-audio-isolation.mjs';
import { prototypeResponse } from '../../../../scripts/prototype-audio-dev.mjs';

const parent = path.resolve('build/task-0063-deployment-audit/fixtures');
const roots: string[] = [];
afterEach(async () => {
  vi.unstubAllEnvs();
  for (const root of roots) {
    if (!path.resolve(root).startsWith(parent + path.sep))
      throw Error('Unsafe fixture cleanup');
    await fs.rm(root, { recursive: true, force: true });
  }
  roots.length = 0;
});
async function fixture() {
  await fs.mkdir(parent, { recursive: true });
  const root = await fs.mkdtemp(path.join(parent, 'isolation-'));
  roots.push(root);
  const policy = await readPrototypePolicy();
  for (const file of [
    'docs/architecture/PROTOTYPE-AUDIO-ISOLATION-V1.json',
    'docs/architecture/audiovisual-pack-approvals.json',
    ...policy.items.map((item) => item.sourcePath),
  ]) {
    const target = path.join(root, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(file, target);
  }
  await fs.mkdir(path.join(root, 'apps/web/.next/server'), { recursive: true });
  await fs.writeFile(
    path.join(root, 'apps/web/.next/BUILD_ID'),
    'synthetic-build',
  );
  return { root, policy };
}

test('all eight originals retain receipt hashes outside public, with no distributable media', async () => {
  const policy = await assertPrototypeSources();
  expect(policy.items).toHaveLength(8);
  expect((await assertProductionPublic()).pass).toBe(true);
  for (const item of policy.items)
    await expect(fs.access(item.originalPath)).rejects.toThrow();
});

test('public gate rejects a renamed original and mutated OGG without trusting extensions', async () => {
  const { root, policy } = await fixture();
  const target = path.join(root, 'apps/web/public/innocent.dat');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(path.join(root, policy.items[0].sourcePath), target);
  await expect(assertProductionPublic(root)).rejects.toThrow(
    'RESTRICTED_PROTOTYPE_MEDIA',
  );
  await fs.writeFile(
    target,
    'OggS synthetic unlicensed audio under a foreign filename',
  );
  await expect(assertProductionPublic(root)).rejects.toThrow(
    'AUDIO_WITHOUT_COMMERCIAL_RECEIPT',
  );
  await fs.unlink(target);
  expect((await assertProductionPublic(root)).pass).toBe(true);
});

test('artifact gate rejects renamed static copies, private-source traces and concrete prototype URLs', async () => {
  vi.stubEnv('RPG_MOBILE_E2E', '');
  const { root, policy } = await fixture();
  const server = path.join(root, 'apps/web/.next/server');
  const target = path.join(server, 'disguised.png');
  await fs.copyFile(path.join(root, policy.items[0].sourcePath), target);
  await expect(assertProductionArtifact(root)).rejects.toThrow(
    'RESTRICTED_PROTOTYPE_MEDIA',
  );
  await fs.unlink(target);
  const trace = path.join(server, 'route.js.nft.json');
  await fs.writeFile(
    trace,
    JSON.stringify({
      files: [
        path.relative(server, path.join(root, policy.items[0].sourcePath)),
      ],
    }),
  );
  await expect(assertProductionArtifact(root)).rejects.toThrow(
    'PROTOTYPE_SOURCE_IN_DEPLOY_TRACE',
  );
  await fs.unlink(trace);
  await fs.writeFile(
    path.join(server, 'route.js'),
    `const url = '/assets/${policy.items[0].receiptKey}';`,
  );
  await expect(assertProductionArtifact(root)).rejects.toThrow(
    'PRODUCTION_RUNTIME_REFERENCES_PROTOTYPE_URL',
  );
  await fs.unlink(path.join(server, 'route.js'));
  expect((await assertProductionArtifact(root)).sourceHashesPreserved).toBe(8);
});

test('DEV serves only reviewed sources, byte ranges and HEAD, and fails closed for modified bytes', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  const { root, policy } = await fixture();
  for (const item of policy.items) {
    const response = await prototypeResponse(
      new Request(`http://localhost/assets/${item.receiptKey}`),
      policy,
      root,
    );
    expect(response.status).toBe(200);
    expect(
      createHash('sha256')
        .update(Buffer.from(await response.arrayBuffer()))
        .digest('hex'),
    ).toBe(item.sha256);
  }
  const url = `http://localhost/assets/${policy.items[0].receiptKey}`;
  const range = await prototypeResponse(
    new Request(url, { headers: { Range: 'bytes=0-3' } }),
    policy,
    root,
  );
  expect(range.status).toBe(206);
  expect(await range.text()).toBe('OggS');
  expect(
    (
      await prototypeResponse(
        new Request(url, { method: 'HEAD' }),
        policy,
        root,
      )
    ).body,
  ).toBeNull();
  expect(
    (
      await prototypeResponse(
        new Request(url, { headers: { Range: 'bytes=99999999-' } }),
        policy,
        root,
      )
    ).status,
  ).toBe(416);
  expect(
    (
      await prototypeResponse(
        new Request('http://localhost/assets/audio/unknown.ogg'),
        policy,
        root,
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await prototypeResponse(
        new Request(url, { method: 'POST' }),
        policy,
        root,
      )
    ).status,
  ).toBe(405);
  await fs.writeFile(
    path.join(root, policy.items[0].sourcePath),
    'changed source',
  );
  expect((await prototypeResponse(new Request(url), policy, root)).status).toBe(
    404,
  );
});

test('production cannot serve or launch the prototype server even if DEV configuration is supplied', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  const policy = await readPrototypePolicy();
  for (const item of policy.items)
    expect(
      (
        await prototypeResponse(
          new Request(`http://localhost/assets/${item.receiptKey}`),
          policy,
        )
      ).status,
    ).toBe(404);
  const child = spawnSync(
    process.execPath,
    ['scripts/prototype-audio-dev.mjs'],
    {
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, NODE_ENV: 'production' },
    },
  );
  expect(child.status).toBe(1);
  expect(child.stderr).toContain('development-only');
});
