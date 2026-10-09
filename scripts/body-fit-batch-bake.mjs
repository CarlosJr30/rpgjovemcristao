import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  bakeBytes,
  sha256,
  fitSimilarity,
  projectPoint,
} from './body-fit-bake.mjs';
import { validatePngChunks } from './body-fit-source-audit.mjs';
import { validateTargetMapping } from './body-fit-target-audit.mjs';

export const OUTPUT = 'build/task-0055-body-fit-bake';
export const PILOT = 'armor_traveler_uncommon_female_v2.png';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
export async function inspectPng(bytes) {
  const integrity = validatePngChunks(bytes);
  const meta = await sharp(bytes, {
    failOn: 'warning',
    limitInputPixels: 1024 * 1536,
  }).metadata();
  if (
    meta.format !== 'png' ||
    meta.width !== 1024 ||
    meta.height !== 1536 ||
    meta.channels !== 4 ||
    !meta.hasAlpha
  )
    throw Error('Expected native full-canvas PNG RGBA1024x1536');
  const data = await sharp(bytes, { failOn: 'warning' }).raw().toBuffer();
  const bounds = (threshold) => {
    let left = 1024,
      top = 1536,
      right = -1,
      bottom = -1,
      count = 0;
    for (let y = 0; y < 1536; y++)
      for (let x = 0; x < 1024; x++)
        if (data[(y * 1024 + x) * 4 + 3] >= threshold) {
          count++;
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    return { left, top, right, bottom, count };
  };
  const visible = bounds(128),
    positive = bounds(1);
  if (!visible.count || positive.count === 1024 * 1536)
    throw Error('Real transparency and visible art required');
  return {
    format: 'png',
    width: 1024,
    height: 1536,
    channels: 4,
    hasAlpha: true,
    integrity,
    alpha128Bounds: visible,
    alphaPositiveBoundsDiagnostic: positive,
    transparentPixels: 1024 * 1536 - positive.count,
    sha256: sha256(bytes),
    decode: 'PASS',
  };
}
export function validateBatchSettings(settings, targets) {
  if (
    settings.length !== 15 ||
    new Set(settings.map((s) => s.filename)).size !== 15
  )
    throw Error('Exactly15 distinct remaining targets required');
  for (const s of settings) {
    const target = targets.find((t) => t.filename === s.filename);
    if (
      s.filename === PILOT ||
      !target ||
      !/^[a-z_]+_v2\.png$/.test(s.filename)
    )
      throw Error('Unauthorized target');
    if (Object.keys(s.landmarks).length < 3)
      throw Error('Insufficient slot landmarks');
    const ref = target.referenceAvatar.id;
    if (!ref.startsWith(target.gender + '_'))
      throw Error('Cross-gender reference forbidden');
    fitSimilarity(s.landmarks);
  }
}
export async function bakeBatch() {
  const targets = (
    await json('docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json')
  ).assets;
  const settings = await json(OUTPUT + '/settings.json');
  const sources = (
    await json(
      'build/task-0052b-body-fit-target-validation/target-inventory.json',
    )
  ).assets;
  validateBatchSettings(settings, targets);
  const inventory = [];
  for (const s of settings) {
    const target = targets.find((t) => t.filename === s.filename),
      prior = sources.find((t) => t.filename === s.filename);
    const mapping = validateTargetMapping(s.filename, target, prior);
    if (mapping.status !== 'MAPPED') throw Error('Mapping conflict');
    const id = s.filename.replace('.png', ''),
      dir = OUTPUT + '/' + id;
    const sourcePath = 'assets-source/body-fit-v2-targets/' + s.filename;
    const avatarPath = 'apps/web/public' + target.referenceAvatar.source;
    const source = await readFile(sourcePath),
      avatar = await readFile(avatarPath);
    const sourceInfo = await inspectPng(source);
    if (
      sourceInfo.sha256 !== prior.sha256 ||
      sha256(avatar) !== target.referenceAvatar.sha256
    )
      throw Error('Immutable reference/source hash mismatch');
    // A fresh least-squares solution per item/source/gender; no pilot transform read.
    const transform = fitSimilarity(s.landmarks);
    const baked = await bakeBytes(source, transform),
      bakedInfo = await inspectPng(baked);
    await mkdir(dir, { recursive: true });
    await copyFile(sourcePath, dir + '/source.png');
    await copyFile(avatarPath, dir + '/avatar_base.png');
    await writeFile(dir + '/baked_overlay.png', baked);
    await writeFile(dir + '/' + id + '_baked.png', baked);
    const landmarkResiduals = Object.fromEntries(
      Object.entries(s.landmarks).map(([name, p]) => {
        const projected = projectPoint(p.source, transform),
          delta = projected.map((v, i) => v - p.avatar[i]);
        return [
          name,
          { ...p, projected, delta, distance: Math.hypot(...delta) },
        ];
      }),
    );
    const metadata = {
      task: 'TASK-0055',
      id,
      itemId: target.itemId,
      slot: target.slot,
      gender: target.gender,
      at: new Date().toISOString(),
      source: {
        path: sourcePath,
        ...sourceInfo,
        approval: 'SOURCE_VISUAL_APPROVED (inherited; not body-fit approval)',
      },
      avatar: {
        id: target.referenceAvatar.id,
        path: avatarPath,
        sha256: sha256(avatar),
        immutable: true,
        footBaseline: target.referenceAvatar.footBaseline,
      },
      mapping,
      landmarks: s.landmarks,
      landmarkResiduals,
      landmarkMethod: s.method,
      transform,
      fittingMethod:
        'Per-source weighted least-squares uniform scale + translation; rotation0 preferred. Anatomy points and placement goals identified separately.',
      transformConvention:
        'Native top-left origin; x=tx+scale*x; y=ty+scale*y; offline only',
      pipeline: {
        version: 1,
        implementation:
          'TASK-0054 bakeBytes: inverse sampling / premultiplied-alpha bilinear',
        sharp: sharp.versions.sharp,
        vips: sharp.versions.vips,
        mask: 'NONE',
        warp: 'NONE',
        uniform: true,
      },
      output: { path: dir + '/' + id + '_baked.png', ...bakedInfo },
      runtime: {
        activated: false,
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
      dir + '/fit-metadata.json',
      JSON.stringify(metadata, null, 2) + '\n',
    );
    // Mechanical pipeline cannot infer visual PASS or human approval.
    await writeFile(
      dir + '/fit-report.json',
      JSON.stringify(
        {
          task: 'TASK-0055',
          id,
          outputSha256: bakedInfo.sha256,
          status: 'FIT_VALIDATION_PENDING',
          reviewStatus: 'FIT_VALIDATION_PENDING',
          humanBodyFitApproved: false,
          ready: false,
          runtimeActivated: false,
        },
        null,
        2,
      ) + '\n',
    );
    const canvas = () =>
      sharp({
        create: {
          width: 1024,
          height: 1536,
          channels: 4,
          background: '#d3d3d3',
        },
      });
    await canvas()
      .composite([{ input: avatar }, { input: baked }])
      .png()
      .toFile(dir + '/combined.png');
    await canvas()
      .composite([{ input: avatar }, { input: source }])
      .png()
      .toFile(dir + '/before.png');
    const raw = await sharp(baked).raw().toBuffer();
    for (let k = 3; k < raw.length; k += 4) raw[k] = Math.round(raw[k] * 0.5);
    const half = await sharp(raw, {
      raw: { width: 1024, height: 1536, channels: 4 },
    })
      .png()
      .toBuffer();
    await canvas()
      .composite([{ input: avatar }, { input: half }])
      .png()
      .toFile(dir + '/overlay_50_50.png');
    const marks = Object.entries(landmarkResiduals)
      .map(
        ([name, p]) =>
          `<path d="M${p.avatar.join(' ')} L${p.projected.join(' ')}" stroke="orange" stroke-width="3"/><circle cx="${p.avatar[0]}" cy="${p.avatar[1]}" r="6" fill="cyan"/><circle cx="${p.projected[0]}" cy="${p.projected[1]}" r="5" fill="orange"/><text x="${p.avatar[0] + 8}" y="${p.avatar[1] - 9}">${name}</text>`,
      )
      .join('');
    const svg = Buffer.from(
      `<svg width="1024" height="1536"><g fill="black" font-size="15" font-family="sans-serif">${marks}</g><path d="M0 ${metadata.avatar.footBaseline}H1024" stroke="red" stroke-width="2"/></svg>`,
    );
    await canvas()
      .composite([{ input: avatar }, { input: baked }, { input: svg }])
      .png()
      .toFile(dir + '/alignment_guides.png');
    inventory.push({
      id,
      filename: s.filename,
      itemId: target.itemId,
      gender: target.gender,
      slot: target.slot,
      avatar: metadata.avatar,
      transform,
      sha256: bakedInfo.sha256,
      sourceSha256: sourceInfo.sha256,
      technicalStatus: 'TECHNICALLY_VALIDATED',
      mapping: 'MAPPED',
      fitStatus: 'FIT_VALIDATION_PENDING',
      humanBodyFitApproved: false,
      ready: false,
      runtimeActivated: false,
    });
    console.log(id + ' ' + bakedInfo.sha256.slice(0, 12));
  }
  await writeFile(
    OUTPUT + '/inventory.json',
    JSON.stringify(
      { task: 'TASK-0055', at: new Date().toISOString(), assets: inventory },
      null,
      2,
    ) + '\n',
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await bakeBatch();
