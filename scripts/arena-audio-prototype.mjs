import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Explicitly non-commercial DEV policy. This does not change auditPack's
// production license allowlist or write either APPROVED_* production catalog.
const bindings = [
  ['music', 'arena', 'audio/music/arena_training.ogg'],
  ['effect', 'attack', 'audio/effects/arena_attack.ogg'],
  ['effect', 'defense', 'audio/effects/arena_defense.ogg'],
  ['effect', 'focus', 'audio/effects/arena_focus.ogg'],
  ['effect', 'dodge', 'audio/effects/arena_dodge.ogg'],
  ['effect', 'player_hit', 'audio/effects/player_hit.ogg'],
  ['effect', 'victory', 'audio/effects/victory.ogg'],
  ['effect', 'defeat', 'audio/effects/defeat.ogg'],
];
const license = 'SUNO_FREE_NON_COMMERCIAL';
const scope = 'NON_COMMERCIAL_PROTOTYPE_DEVELOPMENT_ONLY';
const within = (base, candidate) => {
  const relative = path.relative(base, candidate);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};
function probeAudio(file) {
  return JSON.parse(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file],
      {
        encoding: 'utf8',
        timeout: 10_000,
        maxBuffer: 131072,
        windowsHide: true,
      },
    ),
  );
}

export async function auditArenaPrototype(root, approvals, probe = probeAudio) {
  if (
    approvals.version !== 1 ||
    !approvals.files ||
    typeof approvals.files !== 'object'
  )
    throw new Error('Invalid approval schema');
  const base = path.resolve(root, 'apps/web/public/assets');
  const results = [],
    music = {},
    effects = {};
  for (const [kind, key, file] of bindings) {
    try {
      const candidate = path.join(base, file);
      const real = await fs.realpath(candidate);
      if (!within(await fs.realpath(base), real))
        throw new Error('Asset escapes root');
      const stat = await fs.stat(real);
      if (!stat.isFile() || stat.size <= 0 || stat.size > 10 * 1024 * 1024)
        throw new Error('Invalid asset size/type');
      const bytes = await fs.readFile(real);
      const hash = createHash('sha256').update(bytes).digest('hex');
      const review = approvals.files[file];
      if (
        !review ||
        review.sha256 !== hash ||
        review.licenseId !== license ||
        review.usageScope !== scope ||
        review.commercialProductionApproved !== false ||
        review.reviewStatus !== 'APPROVED_FOR_PROTOTYPE' ||
        !review.licenseSource?.trim() ||
        !review.origin?.trim() ||
        !review.reviewedBy?.trim() ||
        !Number.isFinite(Date.parse(review.reviewedAt)) ||
        review.presentationApproved !== true ||
        review.noClippingApproved !== true ||
        review.levelApproved !== true ||
        (kind === 'music' && review.loopApproved !== true)
      )
        throw new Error(
          'Missing hash, non-commercial scope or prototype human approval',
        );
      if (bytes.toString('ascii', 0, 4) !== 'OggS')
        throw new Error('Incorrect OGG signature');
      const metadata = probe(real);
      const stream = metadata.streams?.[0];
      const duration = Number(metadata.format?.duration);
      if (
        metadata.format?.format_name !== 'ogg' ||
        metadata.streams?.length !== 1 ||
        stream.codec_type !== 'audio' ||
        stream.codec_name !== 'vorbis' ||
        Number(stream.sample_rate) !== 48000 ||
        stream.channels !== 2 ||
        stream.disposition?.attached_pic !== 0 ||
        !Number.isFinite(duration) ||
        duration <= 0 ||
        (kind === 'music' ? duration < 60 || duration > 120 : duration > 2)
      )
        throw new Error('Invalid OGG/Vorbis stream, format or duration');
      const asset = {
        src: `/assets/${file}`,
        license: `${license} · ${scope} · COMMERCIAL PRODUCTION NOT APPROVED`,
      };
      (kind === 'music' ? music : effects)[key] = asset;
      results.push({
        file,
        status: 'APPROVED_FOR_PROTOTYPE',
        sha256: hash,
        duration,
      });
    } catch (error) {
      results.push({
        file,
        status: error.code === 'ENOENT' ? 'MISSING' : 'REJECTED',
        reason: error.message,
      });
    }
  }
  const pass =
    results.length === 8 &&
    results.every((result) => result.status === 'APPROVED_FOR_PROTOTYPE');
  // Never expose a partially accepted prototype pack for registration.
  return {
    pass,
    music: pass ? music : {},
    effects: pass ? effects : {},
    results,
  };
}

async function main() {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const text = await fs.readFile(
    path.join(root, 'docs/architecture/audiovisual-pack-approvals.json'),
    'utf8',
  );
  if (text.length > 131072) throw new Error('Approvals exceed limit');
  const result = await auditArenaPrototype(root, JSON.parse(text));
  const output = path.join(root, 'build/task-0042-prototype');
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(
    path.join(output, 'prototype-audit.json'),
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
    if (process.env.NODE_ENV === 'production')
      throw new Error('Prototype catalog generation refused in production');
    const target = path.join(
      root,
      'apps/web/features/journey/dev/prototype-arena-audio-assets.ts',
    );
    await fs.writeFile(
      target,
      `import type { AudioAsset, MusicContext, SoundEffect } from '../audio/audio-assets';\n` +
        `// GENERATED by scripts/arena-audio-prototype.mjs --write. Suno Free, non-commercial DEV only.\n` +
        `// Replace these eight media files and repeat production audit/review before commercial release.\n` +
        `export const PROTOTYPE_ARENA_MUSIC: Readonly<Partial<Record<MusicContext, AudioAsset>>> = process.env.NODE_ENV === 'development' ? ${JSON.stringify(result.music, null, 2)} : {};\n` +
        `export const PROTOTYPE_ARENA_EFFECTS: Readonly<Partial<Record<SoundEffect, AudioAsset>>> = process.env.NODE_ENV === 'development' ? ${JSON.stringify(result.effects, null, 2)} : {};\n`,
    );
    process.stdout.write(
      'WROTE non-commercial DEV catalog only; production catalogs untouched.\n',
    );
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
