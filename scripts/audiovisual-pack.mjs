import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const keys = {
  music: [
    'journey',
    'exploration',
    'snake',
    'arena',
    'guild',
    'devotional',
    'quiz',
  ],
  effect: [
    'ui',
    'attack',
    'defense',
    'focus',
    'dodge',
    'reward',
    'levelUp',
    'chest',
    'equipment',
    'objective',
    'guildApproval',
    'serpent_near',
    'serpent_attack',
    'player_hit',
    'pickup_light',
    'pickup_fragment',
    'pickup_powerup',
    'portal_open',
    'victory',
    'defeat',
  ],
  visual: [
    'arenaBackground',
    'arenaDavi',
    'arenaElias',
    'arenaMara',
    'arenaNoemi',
    'guildPortal',
    'equipmentPortal',
    'diaryPortal',
    'guildHall',
    'guildBanner',
    'guildMissionParchment',
    'guildLeaderTable',
    'guildRewardChest',
  ],
};
const within = (base, candidate) => {
  const relative = path.relative(base, candidate);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};
function probeAudio(file) {
  const output = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file],
    { encoding: 'utf8', timeout: 10_000, maxBuffer: 131072, windowsHide: true },
  );
  const data = JSON.parse(output);
  const stream = data.streams.find((value) => value.codec_type === 'audio');
  return {
    sampleRate: Number(stream?.sample_rate),
    channels: stream?.channels,
    duration: Number(data.format.duration),
  };
}

/** Pending media never enters catalogs. Validated files require matching per-file approval. */
export async function auditPack(root, manifest, approvals, probe = probeAudio) {
  const base = path.resolve(root, 'apps/web/public/assets');
  const results = [],
    music = {},
    effects = {},
    visual = {};
  const seen = new Set();
  if (
    manifest.version !== 1 ||
    !Array.isArray(manifest.items) ||
    manifest.items.length > 64 ||
    approvals.version !== 1 ||
    !approvals.files ||
    typeof approvals.files !== 'object'
  )
    throw new Error('Invalid pack manifest/approval schema');
  const inspect = async (file, item, width, height) => {
    if (
      typeof file !== 'string' ||
      !/^(audio\/(music|effects)|world|characters)\/[a-zA-Z0-9/_-]{1,180}\.(ogg|mp3|png|webp)$/.test(
        file,
      ) ||
      file.includes('..')
    )
      throw new Error('Invalid local asset filename');
    const candidate = path.resolve(base, file);
    if (!within(base, candidate)) throw new Error('Asset escapes local root');
    let bytes;
    try {
      const real = await fs.realpath(candidate);
      if (!within(await fs.realpath(base), real))
        throw new Error('Asset symlink escapes root');
      const stat = await fs.stat(real);
      if (!stat.isFile() || stat.size === 0 || stat.size > 10 * 1024 * 1024)
        throw new Error('Invalid file or size (>10 MiB)');
      bytes = await fs.readFile(real);
    } catch (error) {
      if (error.code === 'ENOENT') {
        results.push({ file, status: 'MISSING' });
        return null;
      }
      throw error;
    }
    const review = approvals.files[file];
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (
      !review ||
      review.sha256 !== hash ||
      !['original', 'CC0-1.0', 'CC-BY-4.0'].includes(review.licenseId) ||
      !review.licenseSource?.trim() ||
      !review.author?.trim() ||
      !review.reviewedBy?.trim() ||
      !Number.isFinite(Date.parse(review.reviewedAt)) ||
      review.presentationApproved !== true
    )
      throw new Error(
        'Missing/mismatched hash, license provenance or human review',
      );
    if (item.kind === 'visual') {
      const metadata = await sharp(bytes).metadata();
      if (
        metadata.width !== width ||
        metadata.height !== height ||
        !['png', 'webp'].includes(metadata.format)
      )
        throw new Error('Incorrect image dimensions/format');
      if (
        item.transparent &&
        (!metadata.hasAlpha || (await sharp(bytes).stats()).isOpaque)
      )
        throw new Error('Portrait requires actual transparency');
    } else {
      if (
        file.endsWith('.ogg')
          ? bytes.toString('ascii', 0, 4) !== 'OggS'
          : !(
              bytes.toString('ascii', 0, 3) === 'ID3' ||
              (bytes[0] === 255 && (bytes[1] & 224) === 224)
            )
      )
        throw new Error('Incorrect audio container signature');
      const metadata = probe(candidate);
      if (
        ![44100, 48000].includes(metadata.sampleRate) ||
        !Number.isFinite(metadata.duration) ||
        metadata.duration <= 0 ||
        ![1, 2].includes(metadata.channels)
      )
        throw new Error('Incorrect audio stream metadata');
      if (
        item.kind === 'music' &&
        (metadata.channels !== 2 ||
          metadata.duration < 60 ||
          metadata.duration > 120 ||
          review.loopApproved !== true)
      )
        throw new Error('Music requires stereo, 60–120 s and reviewed loop');
      if (item.kind === 'effect' && metadata.duration > 2)
        throw new Error('Effect exceeds 2 s');
      if (review.noClippingApproved !== true || review.levelApproved !== true)
        throw new Error('Audio requires audition: clipping and levels');
    }
    results.push({ file, status: 'VALIDATED', sha256: hash });
    return {
      src: `/assets/${file}`,
      license: `${review.licenseId} · ${review.author} · ${review.licenseSource}`,
    };
  };
  for (const item of manifest.items) {
    try {
      if (
        !keys[item.kind]?.includes(item.key) ||
        seen.has(`${item.kind}:${item.key}`)
      )
        throw new Error('Unknown or duplicate binding');
      seen.add(`${item.kind}:${item.key}`);
      if (
        (item.kind === 'visual') !== /\.(png|webp)$/.test(item.file) ||
        (item.kind === 'visual'
          ? !/^(world|characters)\//.test(item.file)
          : !item.file.startsWith(
              `audio/${item.kind === 'music' ? 'music' : 'effects'}/`,
            ))
      )
        throw new Error('Wrong asset category');
      const approved = await inspect(item.file, item, item.width, item.height);
      if (!approved) continue;
      if (item.kind === 'visual') {
        const mobile = item.mobileFile
          ? await inspect(
              item.mobileFile,
              item,
              item.mobileWidth,
              item.mobileHeight,
            )
          : null;
        visual[item.key] = {
          ...approved,
          ...(mobile ? { mobileSrc: mobile.src } : {}),
        };
      } else {
        const fallbackFile = item.file.replace(/\.ogg$/, '.mp3');
        const fallback =
          fallbackFile !== item.file ? await inspect(fallbackFile, item) : null;
        (item.kind === 'music' ? music : effects)[item.key] = {
          ...approved,
          ...(fallback ? { fallbackSrc: fallback.src } : {}),
        };
      }
    } catch (error) {
      results.push({
        file: item.file,
        status: 'REJECTED',
        reason:
          error.code === 'ENOENT' ? 'Media decoder unavailable' : error.message,
      });
    }
  }
  return {
    music,
    effects,
    visual,
    results,
    pass: !results.some((item) => item.status === 'REJECTED'),
  };
}

async function main() {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const read = async (file) => {
    const text = await fs.readFile(path.join(root, file), 'utf8');
    if (text.length > 131072) throw new Error('Manifest exceeds 128 KiB');
    return JSON.parse(text);
  };
  const visualOnly = process.argv.includes('--visual-only');
  const manifest = await read('docs/architecture/audiovisual-pack-v1.json');
  const result = await auditPack(
    root,
    visualOnly
      ? {
          ...manifest,
          items: manifest.items.filter((item) => item.kind === 'visual'),
        }
      : manifest,
    await read('docs/architecture/audiovisual-pack-approvals.json'),
  );
  const output = path.join(root, 'build/task-0038-evidence');
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(
    path.join(output, visualOnly ? 'visual-audit.json' : 'asset-audit.json'),
    JSON.stringify(result, null, 2) + '\n',
  );
  for (const item of result.results)
    process.stdout.write(
      `${item.status} ${item.file}${item.reason ? ` — ${item.reason}` : ''}\n`,
    );
  if (!result.pass) {
    process.exitCode = 1;
    return;
  }
  if (process.argv.includes('--write')) {
    if (!visualOnly) {
      await fs.writeFile(
        path.join(
          root,
          'apps/web/features/journey/audio/approved-audio-assets.ts',
        ),
        `import type { AudioAsset, MusicContext, SoundEffect } from './audio-assets';\n// Validated local pack; rerun the validator after any media change.\nexport const APPROVED_MUSIC: Readonly<Partial<Record<MusicContext, AudioAsset>>> = ${JSON.stringify(result.music, null, 2)};\nexport const APPROVED_EFFECTS: Readonly<Partial<Record<SoundEffect, AudioAsset>>> = ${JSON.stringify(result.effects, null, 2)};\n`,
      );
    }
    await fs.writeFile(
      path.join(
        root,
        'apps/web/features/journey/data/approved-visual-assets.ts',
      ),
      `import type { VisualAsset, VisualSlot } from './audiovisualAssets';\n// Validated local pack. Does not approve body overlays.\nexport const APPROVED_VISUAL_ASSETS: Readonly<Partial<Record<VisualSlot, VisualAsset>>> = ${JSON.stringify(result.visual, null, 2)};\n`,
    );
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(() => {
    process.stderr.write(
      'Pack validation failed; catalogs were not intentionally regenerated.\n',
    );
    process.exitCode = 1;
  });
}
