import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const GEOMETRY_TOLERANCES = {
  left: 6,
  right: 6,
  top: 6,
  bottom: 4,
  width: 12,
  height: 10,
  centerX: 4,
  centerY: 4,
  feetBaseline: 4,
  hairTop: 6,
  maxSilhouetteWidth: 12,
  alphaCentroidX: 4,
  alphaCentroidY: 4,
}; // HD px. Inclusive maxima = logical px ×2. Width/height derived from endpoints.

export function measureAlpha(data, width, height, threshold = 1) {
  let left = width,
    right = -1,
    top = height,
    bottom = -1,
    count = 0,
    sx = 0,
    sy = 0,
    maxWidth = 0;
  for (let y = 0; y < height; y++) {
    let rowLeft = width,
      rowRight = -1;
    for (let x = 0; x < width; x++)
      if (data[(y * width + x) * 4 + 3] >= threshold) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        rowLeft = Math.min(rowLeft, x);
        rowRight = Math.max(rowRight, x);
        count++;
        sx += x + 0.5;
        sy += y + 0.5;
      }
    maxWidth = Math.max(
      maxWidth,
      rowRight >= rowLeft ? rowRight - rowLeft + 1 : 0,
    );
  }
  if (!count) throw new Error('Empty alpha silhouette');
  // Pixel-edge coordinates, right/bottom exclusive; avoids ±1 inconsistencies
  // when comparing a 512 image with the exact two-pixel equivalent in HD.
  right++;
  bottom++;
  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
    feetBaseline: bottom,
    hairTop: top,
    maxSilhouetteWidth: maxWidth,
    alphaCentroidX: sx / count,
    alphaCentroidY: sy / count,
  };
}
export function compareGeometry(legacy, hd) {
  return Object.entries(GEOMETRY_TOLERANCES).map(([metric, toleranceHD]) => {
    const expectedHD = legacy[metric] * 2,
      currentHD = hd[metric],
      delta = currentHD - expectedHD;
    return {
      metric,
      legacy: legacy[metric],
      expectedHD,
      currentHD,
      delta,
      toleranceHD,
      result: Math.abs(delta) <= toleranceHD ? 'PASS' : 'FAIL',
    };
  });
}
async function readPNG(path) {
  const bytes = await readFile(path),
    metadata = await sharp(bytes).metadata();
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    data,
    width: info.width,
    height: info.height,
    bytes: bytes.length,
    hash: createHash('sha256').update(bytes).digest('hex'),
    format: metadata.format,
    hasAlpha: metadata.hasAlpha,
    alphaTotal: measureAlpha(data, info.width, info.height),
    alpha128: measureAlpha(data, info.width, info.height, 128),
  };
}
export async function auditGeometry(
  gender,
  candidatePath,
  output,
  tag = 'current',
  legacyPathOverride,
) {
  await mkdir(output, { recursive: true });
  const legacyPath =
    legacyPathOverride ??
    `apps/web/public/assets/avatar/runtime/${gender}/${gender}_short_moss_medium.png`;
  const legacy = await readPNG(legacyPath),
    hd = await readPNG(candidatePath);
  if (legacy.width !== 512 || legacy.height !== 768)
    throw new Error('Legacy canvas changed');
  const dimensionsValid = hd.width === 1024 && hd.height === 1536;
  const alphaValid =
    hd.hasAlpha && hd.data.some((v, i) => i % 4 === 3 && v === 0);
  const tables = {
    alphaTotal: compareGeometry(legacy.alphaTotal, hd.alphaTotal),
    alpha128: compareGeometry(legacy.alpha128, hd.alpha128),
  };
  let silhouette;
  // Upscaled legacy is exclusively a QA reference. Never copied into public.
  const scaled = await sharp(legacy.data, {
    raw: { width: 512, height: 768, channels: 4 },
  })
    .resize(1024, 1536, { kernel: 'nearest' })
    .raw()
    .toBuffer();
  await sharp(scaled, { raw: { width: 1024, height: 1536, channels: 4 } })
    .png()
    .toFile(`${output}/${gender}-legacy-scaled.png`);
  await writeFile(
    `${output}/${gender}-hd-${tag}.png`,
    await readFile(candidatePath),
  );
  if (dimensionsValid) {
    const overlay = Buffer.alloc(scaled.length),
      diff = Buffer.alloc(scaled.length);
    let intersection = 0,
      union = 0,
      xor = 0;
    for (let i = 0; i < scaled.length; i += 4) {
      const la = scaled[i + 3] / 255,
        ha = hd.data[i + 3] / 255,
        outA = (la + ha) / 2;
      for (let c = 0; c < 3; c++)
        overlay[i + c] = outA
          ? Math.round((scaled[i + c] * la + hd.data[i + c] * ha) / (la + ha))
          : 0;
      overlay[i + 3] = Math.round(outA * 255);
      const l = scaled[i + 3] >= 128,
        h = hd.data[i + 3] >= 128;
      if (l || h) union++;
      if (l && h) intersection++;
      if (l !== h) xor++;
      // Red: legacy-only; cyan: candidate-only; gray: overlap. Black: outside.
      diff[i] = l && !h ? 255 : l && h ? 70 : 0;
      diff[i + 1] = h && !l ? 220 : l && h ? 70 : 0;
      diff[i + 2] = h && !l ? 255 : l && h ? 70 : 0;
      diff[i + 3] = 255;
    }
    const raw = { raw: { width: 1024, height: 1536, channels: 4 } };
    await sharp(overlay, raw)
      .png()
      .toFile(
        `${output}/${gender}-overlay${tag === 'current' ? '' : `-${tag}`}.png`,
      );
    await sharp(diff, raw)
      .png()
      .toFile(
        `${output}/${gender}-alpha-diff${tag === 'current' ? '' : `-${tag}`}.png`,
      );
    silhouette = {
      iou: intersection / union,
      xorPixels: xor,
      unionPixels: union,
      note: 'Diagnostic only. No IoU threshold replaces visual review of anatomy/pose.',
    };
  }
  const strip = (source) => { const copy = { ...source }; delete copy.data; return copy; };
  const result = {
    at: new Date().toISOString(),
    gender,
    tag,
    legacyPath,
    candidatePath,
    legacy: strip(legacy),
    hd: strip(hd),
    tables,
    dimensionsValid,
    alphaValid,
    silhouette,
    geometryThreshold: 128,
    rawAlphaRole: 'DIAGNOSTIC_ONLY; user confirmed 2026-10-06',
    automaticMetricsPass:
      dimensionsValid &&
      alphaValid &&
      tables.alpha128.every((r) => r.result === 'PASS'),
    visualReview: 'PENDING',
    humanReview: 'PENDING',
    approved: false,
  };
  await writeFile(
    `${output}/${gender}-${tag}-metrics.json`,
    JSON.stringify(result, null, 2) + '\n',
  );
  return result;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [
    gender,
    candidatePath,
    output = 'build/task-0048-evidence/geometry',
    tag = 'current',
    legacyPath,
  ] = process.argv.slice(2);
  if (!['male', 'female'].includes(gender) || !candidatePath)
    throw new Error(
      'Usage: node scripts/audit-avatar-geometry.mjs male|female candidate.png [output] [tag]',
    );
  const result = await auditGeometry(
    gender,
    candidatePath,
    output,
    tag,
    legacyPath,
  );
  console.log(
    JSON.stringify(
      {
        gender,
        tag,
        automaticMetricsPass: result.automaticMetricsPass,
        failures: result.tables.alpha128.filter((r) => r.result === 'FAIL'),
        rawAlphaDiagnosticFailures: result.tables.alphaTotal.filter((r) => r.result === 'FAIL'),
        silhouette: result.silhouette,
      },
      null,
      2,
    ),
  );
}
