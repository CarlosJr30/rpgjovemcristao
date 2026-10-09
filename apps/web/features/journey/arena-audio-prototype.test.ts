import { afterEach, expect, test, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { auditArenaPrototype } from '../../../../scripts/arena-audio-prototype.mjs';
import { auditPack } from '../../../../scripts/audiovisual-pack.mjs';

const parent = path.resolve('build/task-0042-prototype/fixtures');
const roots: string[] = [];
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  for (const root of roots) {
    if (!path.resolve(root).startsWith(parent + path.sep))
      throw new Error('Unsafe fixture cleanup');
    await fs.rm(root, { recursive: true, force: true });
  }
  roots.length = 0;
});
const probe = (file: string) => ({
  format: {
    format_name: 'ogg',
    duration: file.endsWith('arena_training.ogg') ? 74.8 : 1,
  },
  streams: [
    {
      codec_type: 'audio',
      codec_name: 'vorbis',
      sample_rate: 48000,
      channels: 2,
      disposition: { attached_pic: 0 },
    },
  ],
});
async function fixture() {
  await fs.mkdir(parent, { recursive: true });
  const root = await fs.mkdtemp(path.join(parent, 'pack-'));
  roots.push(root);
  const actual = JSON.parse(
    await fs.readFile(
      'docs/architecture/audiovisual-pack-approvals.json',
      'utf8',
    ),
  );
  const files: Record<string, Record<string, unknown>> = {};
  for (const file of Object.keys(actual.files).filter((file) =>
    file.startsWith('audio/'),
  )) {
    const bytes = Buffer.from(
      'OggS synthetic prototype unit fixture; never runtime',
    );
    const target = path.join(root, 'apps/web/public/assets', file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
    files[file] = {
      ...actual.files[file],
      sha256: createHash('sha256').update(bytes).digest('hex'),
      reviewedBy: 'Synthetic test reviewer',
      reviewedAt: '2026-10-05T00:00:00Z',
    };
  }
  return { root, approvals: { version: 1, files } };
}

test('Suno Free prototype receipts pass DEV audit and remain rejected by unchanged production policy', async () => {
  const approvals = JSON.parse(
    await fs.readFile(
      'docs/architecture/audiovisual-pack-approvals.json',
      'utf8',
    ),
  );
  const actual = await auditArenaPrototype(process.cwd(), approvals);
  expect(actual.pass).toBe(true);
  expect(Object.keys(actual.music)).toEqual(['arena']);
  expect(Object.keys(actual.effects)).toHaveLength(7);
  const manifest = JSON.parse(
    await fs.readFile('docs/architecture/audiovisual-pack-v1.json', 'utf8'),
  );
  const production = await auditPack(process.cwd(), manifest, approvals);
  expect(production.pass).toBe(false);
  expect(production.music).toEqual({});
  expect(production.effects).toEqual({});
  expect(
    production.results.filter((result) => result.status === 'REJECTED'),
  ).toHaveLength(8);
});

test('a pending approval, changed hash, commercial scope or incomplete pack never registers prototype audio', async () => {
  const { root, approvals } = await fixture();
  const musicFile = 'audio/music/arena_training.ogg';
  expect((await auditArenaPrototype(root, approvals, probe)).pass).toBe(true);
  for (const rejected of [
    { licenseId: 'original' },
    { usageScope: 'COMMERCIAL' },
    { commercialProductionApproved: true },
    { reviewStatus: 'PENDING_HUMAN_AUDIO_APPROVAL' },
    { presentationApproved: false },
    { noClippingApproved: false },
    { levelApproved: false },
    { loopApproved: false },
    { reviewedBy: '' },
    { reviewedAt: 'not a date' },
    { sha256: '0'.repeat(64) },
  ]) {
    const changed = {
      ...approvals,
      files: {
        ...approvals.files,
        [musicFile]: { ...approvals.files[musicFile], ...rejected },
      },
    };
    const audit = await auditArenaPrototype(root, changed, probe);
    expect(audit.pass).toBe(false);
    expect(audit.music).toEqual({});
    expect(audit.effects).toEqual({});
  }
  const missing = { ...approvals, files: { ...approvals.files } };
  delete missing.files['audio/effects/arena_attack.ogg'];
  expect((await auditArenaPrototype(root, missing, probe)).pass).toBe(false);
});

test('prototype validation rejects foreign codecs, video/cover streams and out-of-range duration', async () => {
  const { root, approvals } = await fixture();
  for (const invalid of [
    (file: string) => ({
      ...probe(file),
      streams: [{ ...probe(file).streams[0], codec_name: 'opus' }],
    }),
    (file: string) => ({
      ...probe(file),
      streams: [
        ...probe(file).streams,
        { ...probe(file).streams[0], codec_type: 'video' },
      ],
    }),
    (file: string) => ({
      ...probe(file),
      streams: [
        { ...probe(file).streams[0], disposition: { attached_pic: 1 } },
      ],
    }),
    (file: string) => ({
      ...probe(file),
      format: {
        format_name: 'ogg',
        duration: file.endsWith('arena_training.ogg') ? 20 : 3,
      },
    }),
  ]) {
    const audit = await auditArenaPrototype(root, approvals, invalid);
    expect(audit.pass).toBe(false);
    expect(audit.music).toEqual({});
    expect(audit.effects).toEqual({});
  }
});

test.each(['production', 'test', ''])(
  'prototype catalogs are empty when NODE_ENV=%s',
  async (environment) => {
    vi.stubEnv('NODE_ENV', environment);
    vi.resetModules();
    const catalogs = await import('./dev/prototype-arena-audio-assets');
    const selected = await import('./audio/audio-assets');
    expect(catalogs.PROTOTYPE_ARENA_MUSIC).toEqual({});
    expect(catalogs.PROTOTYPE_ARENA_EFFECTS).toEqual({});
    expect(selected.MUSIC_ASSETS).toEqual({});
    expect(selected.SOUND_ASSETS).toEqual({});
  },
);

test('development selects prototype Arena media using the singleton implementation, preserving other contexts', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.resetModules();
  const { AudioManager } = await import('./audio/audio-manager');
  const selected = await import('./audio/audio-assets');
  expect(Object.keys(selected.MUSIC_ASSETS)).toEqual(['arena']);
  expect(selected.SOUND_ASSETS).toEqual({});
  expect(Object.keys(selected.ARENA_PROTOTYPE_EFFECTS)).toHaveLength(7);
  const factory = vi.fn((src: string) => ({
    src,
    volume: 0,
    loop: false,
    currentTime: 0,
    preload: 'none' as HTMLAudioElement['preload'],
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
  }));
  const manager = new AudioManager(undefined, factory);
  try {
    manager.updatePreferences({ effects: true });
    manager.unlock();
    manager.playEffect('player_hit');
    expect(factory).not.toHaveBeenCalled();
    manager.setContext('arena');
    manager.playEffect('player_hit');
    expect(factory).toHaveBeenCalledExactlyOnceWith(
      '/assets/audio/effects/player_hit.ogg',
    );
    manager.setContext('snake');
    manager.playEffect('player_hit');
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory.mock.results[0].value.pause).toHaveBeenCalled();
  } finally {
    manager.dispose();
  }
});
