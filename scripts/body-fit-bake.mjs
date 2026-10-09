import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { validatePngChunks } from './body-fit-source-audit.mjs';

export const PILOT_SOURCE =
  'assets-source/body-fit-v2-targets/armor_traveler_uncommon_female_v2.png';
export const PILOT_AVATAR =
  'apps/web/public/assets/avatar/hd/female/female_short_moss_medium_hd.png';
export const OUTPUT = 'build/task-0054-body-fit-bake';
export const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');

export function fitStateForOutput(previous, output) {
  if (previous?.output?.sha256 === output.sha256)
    return { ...previous, humanBodyFitApproved: false, ready: false };
  return {
    task: 'TASK-0054',
    status: 'FIT_VALIDATION_PENDING',
    reason:
      'Output hash changed or no assessment exists; fresh fit review required',
    output,
    humanBodyFitApproved: false,
    ready: false,
    devOnly: true,
  };
}

export function validateTransform(value) {
  const keys = ['translateX', 'translateY', 'scale', 'rotation'];
  if (
    !value ||
    Object.keys(value).some((key) => !keys.includes(key)) ||
    keys.some((key) => !Number.isFinite(value[key]))
  )
    throw Error(
      'Only finite translateX/translateY/uniform scale/rotation allowed',
    );
  if (
    value.scale < 0.1 ||
    value.scale > 2 ||
    Math.abs(value.rotation) > 5 ||
    Math.abs(value.translateX) > 2048 ||
    Math.abs(value.translateY) > 3072
  )
    throw Error('Transform outside offline pilot limits');
  return { ...value };
}

export function projectPoint([x, y], value) {
  const t = validateTransform(value),
    angle = (t.rotation * Math.PI) / 180;
  return [
    t.translateX + t.scale * (Math.cos(angle) * x - Math.sin(angle) * y),
    t.translateY + t.scale * (Math.sin(angle) * x + Math.cos(angle) * y),
  ];
}

// Least-squares uniform scale + translation. Rotation stays zero by preference.
export function fitSimilarity(landmarks) {
  const points = Object.values(landmarks);
  if (points.length < 2)
    throw Error('At least two correspondence points required');
  let weight = 0,
    sx = 0,
    sy = 0,
    tx = 0,
    ty = 0;
  for (const p of points) {
    const w = p.weight ?? 1;
    if (
      !Number.isFinite(w) ||
      w <= 0 ||
      ![...p.source, ...p.avatar].every(Number.isFinite)
    )
      throw Error('Invalid landmark');
    weight += w;
    sx += w * p.source[0];
    sy += w * p.source[1];
    tx += w * p.avatar[0];
    ty += w * p.avatar[1];
  }
  sx /= weight;
  sy /= weight;
  tx /= weight;
  ty /= weight;
  let numerator = 0,
    denominator = 0;
  for (const p of points) {
    const w = p.weight ?? 1;
    const x = p.source[0] - sx,
      y = p.source[1] - sy;
    numerator += w * (x * (p.avatar[0] - tx) + y * (p.avatar[1] - ty));
    denominator += w * (x * x + y * y);
  }
  if (denominator <= 0) throw Error('Degenerate landmark geometry');
  const scale = numerator / denominator;
  return validateTransform({
    translateX: tx - scale * sx,
    translateY: ty - scale * sy,
    scale,
    rotation: 0,
  });
}

export async function bakeBytes(source, transform) {
  const t = validateTransform(transform);
  return sampleSimilarityBytes(source, t);
}

// TASK-0056 only: downward swords require a large offline rotation.
// Existing pilot/batch entry points retain their original <=5 degree contract.
export function validateSwordTransform(transform) {
  if (
    !Number.isFinite(transform?.rotation) ||
    Math.abs(transform.rotation) > 180
  )
    throw Error('Sword rotation must be finite and within +/-180 degrees');
  const validated = validateTransform({ ...transform, rotation: 0 });
  return { ...validated, rotation: transform.rotation };
}

export async function bakeSwordBytes(source, transform) {
  return sampleSimilarityBytes(source, validateSwordTransform(transform));
}

async function sampleSimilarityBytes(source, t) {
  validatePngChunks(source);
  const meta = await sharp(source, {
    failOn: 'warning',
    limitInputPixels: 1024 * 1536,
  }).metadata();
  if (meta.width !== 1024 || meta.height !== 1536 || !meta.hasAlpha)
    throw Error('Source must be native1024x1536 with alpha');
  const { data, info } = await sharp(source, { failOn: 'warning' })
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const result = Buffer.alloc(1024 * 1536 * 4),
    angle = (t.rotation * Math.PI) / 180,
    c = Math.cos(angle),
    s = Math.sin(angle);
  // Inverse sampling in fixed destination canvas; alpha-premultiplied bilinear.
  // No separate X/Y scales, perspective, anatomy warp, region removal or avatar alpha.
  for (let y = 0; y < 1536; y++)
    for (let x = 0; x < 1024; x++) {
      const dx = x + 0.5 - t.translateX,
        dy = y + 0.5 - t.translateY;
      const u = (c * dx + s * dy) / t.scale - 0.5,
        v = (-s * dx + c * dy) / t.scale - 0.5;
      if (u < -1 || v < -1 || u >= info.width || v >= info.height) continue;
      const ix = Math.floor(u),
        iy = Math.floor(v),
        fx = u - ix,
        fy = v - iy;
      let alpha = 0,
        red = 0,
        green = 0,
        blue = 0;
      for (let by = 0; by < 2; by++)
        for (let bx = 0; bx < 2; bx++) {
          const px = ix + bx,
            py = iy + by;
          if (px < 0 || py < 0 || px >= info.width || py >= info.height)
            continue;
          const k = (py * info.width + px) * 4,
            w = (bx ? fx : 1 - fx) * (by ? fy : 1 - fy),
            a = (data[k + 3] / 255) * w;
          alpha += a;
          red += data[k] * a;
          green += data[k + 1] * a;
          blue += data[k + 2] * a;
        }
      const k = (y * 1024 + x) * 4,
        a = Math.round(alpha * 255);
      if (a) {
        result[k] = Math.round(red / alpha);
        result[k + 1] = Math.round(green / alpha);
        result[k + 2] = Math.round(blue / alpha);
        result[k + 3] = a;
      }
    }
  return sharp(result, { raw: { width: 1024, height: 1536, channels: 4 } })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: false,
      palette: false,
      progressive: false,
    })
    .toBuffer();
}

export async function bakePilot(metadata) {
  if (
    metadata.itemId !== 'traveler-armor-uncommon' ||
    metadata.gender !== 'female' ||
    metadata.source.path !== PILOT_SOURCE ||
    metadata.avatar.path !== PILOT_AVATAR
  )
    throw Error('Metadata must bind only the authorized pilot');
  const source = await readFile(PILOT_SOURCE),
    avatar = await readFile(PILOT_AVATAR);
  if (
    sha256(source) !== metadata.source.sha256 ||
    sha256(avatar) !== metadata.avatar.sha256
  )
    throw Error('Reference hash mismatch');
  const bytes = await bakeBytes(source, metadata.transform);
  const directory = path.resolve(OUTPUT + '/pilot'),
    destination = path.join(
      directory,
      'armor_traveler_uncommon_female_v2_baked.png',
    );
  await mkdir(directory, { recursive: true });
  await writeFile(destination, bytes);
  await copyFile(destination, OUTPUT + '/baked_overlay.png');
  if (sha256(await readFile(PILOT_SOURCE)) !== metadata.source.sha256)
    throw Error('Original source changed');
  const residuals = Object.fromEntries(
    Object.entries(metadata.landmarks).map(([name, p]) => {
      const actual = projectPoint(p.source, metadata.transform),
        delta = actual.map((n, i) => n - p.avatar[i]);
      return [
        name,
        { ...p, projected: actual, delta, distance: Math.hypot(...delta) },
      ];
    }),
  );
  const receipt = {
    ...metadata,
    validatedAt: new Date().toISOString(),
    transform: validateTransform(metadata.transform),
    landmarkResiduals: residuals,
    output: {
      path: destination.replaceAll('\\', '/'),
      width: 1024,
      height: 1536,
      format: 'png',
      channels: 4,
      sha256: sha256(bytes),
    },
    pipeline: {
      implementation:
        'inverse similarity, premultiplied-alpha bilinear; fixed transparent destination canvas',
      version: 1,
      sharp: sharp.versions.sharp,
      vips: sharp.versions.vips,
      mask: 'NONE',
      uniform: true,
    },
    runtime: {
      activated: false,
      correctiveTransforms: false,
      render: {
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'none',
      },
    },
    humanBodyFitApproved: false,
    ready: false,
  };
  await writeFile(
    OUTPUT + '/fit-metadata.json',
    JSON.stringify(receipt, null, 2) + '\n',
  );
  let previous = null;
  try {
    previous = JSON.parse(await readFile(OUTPUT + '/fit-report.json', 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeFile(
    OUTPUT + '/fit-report.json',
    JSON.stringify(fitStateForOutput(previous, receipt.output), null, 2) + '\n',
  );
  return receipt;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const metadata = JSON.parse(
    await readFile(process.argv[2] ?? OUTPUT + '/pilot-settings.json', 'utf8'),
  );
  const result = await bakePilot(metadata);
  console.log(
    JSON.stringify({ output: result.output, transform: result.transform }),
  );
}
