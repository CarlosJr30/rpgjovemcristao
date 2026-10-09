import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  bakeSwordBytes,
  sha256,
  validateSwordTransform,
} from './body-fit-bake.mjs';
import { inspectPng } from './body-fit-batch-bake.mjs';

export const OUTPUT = 'build/task-0056-sword-downward';
export const IDS = [
  'sword_path_common_female_v2',
  'sword_path_common_male_v2',
  'sword_path_rare_female_v2',
  'sword_path_rare_male_v2',
];
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
export function projectSwordPoint([x, y], value) {
  const t = validateSwordTransform(value),
    a = (t.rotation * Math.PI) / 180;
  return [
    t.translateX + t.scale * (Math.cos(a) * x - Math.sin(a) * y),
    t.translateY + t.scale * (Math.sin(a) * x + Math.cos(a) * y),
  ];
}
export function solveDownward({ grip, root, tip, palm, scale }) {
  if (
    ![...grip, ...root, ...tip, ...palm, scale].every(Number.isFinite) ||
    Math.hypot(tip[0] - root[0], tip[1] - root[1]) < 1
  )
    throw Error('Invalid sword landmarks');
  let rotation =
    ((Math.PI / 2 - Math.atan2(tip[1] - root[1], tip[0] - root[0])) * 180) /
    Math.PI;
  if (rotation > 180) rotation -= 360;
  const angle = (rotation * Math.PI) / 180,
    c = Math.cos(angle),
    s = Math.sin(angle);
  return validateSwordTransform({
    scale,
    rotation,
    translateX: palm[0] - scale * (c * grip[0] - s * grip[1]),
    translateY: palm[1] - scale * (s * grip[0] + c * grip[1]),
  });
}
export async function applyOcclusion(bytes, mask) {
  const rgba = await sharp(bytes).raw().toBuffer(),
    alpha = await sharp(mask).raw().toBuffer();
  if (rgba.length !== 1024 * 1536 * 4 || alpha.length !== rgba.length)
    throw Error('Full-canvas RGBA required');
  let removedPixels = 0;
  for (let k = 3; k < rgba.length; k += 4) {
    if (rgba[k] && alpha[k]) removedPixels++;
    rgba[k] = Math.round(rgba[k] * (1 - alpha[k] / 255));
    if (!rgba[k]) rgba[k - 3] = rgba[k - 2] = rgba[k - 1] = 0;
  }
  return {
    bytes: await sharp(rgba, {
      raw: { width: 1024, height: 1536, channels: 4 },
    })
      .png({ compressionLevel: 9, adaptiveFiltering: false })
      .toBuffer(),
    removedPixels,
  };
}
export async function bakeSwords(run = OUTPUT + '/attempt-02') {
  if (![OUTPUT, OUTPUT + '/attempt-02'].includes(run))
    throw Error('Closed local staging destination required');
  const settings = await json(run + '/settings.json'),
    plan = (await json('docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json'))
      .assets;
  if (
    settings.length !== 4 ||
    new Set(settings.map((s) => s.id)).size !== 4 ||
    settings.some((s) => !IDS.includes(s.id))
  )
    throw Error('Exactly four authorized swords');
  const assets = [];
  for (const s of settings) {
    const target = plan.find((t) => t.filename === s.id + '.png'),
      priorDir = 'build/task-0055-body-fit-bake/' + s.id;
    const prior = await json(priorDir + '/fit-report.json');
    const dir = run + '/' + s.id;
    const sourcePath = 'assets-source/body-fit-v2-targets/' + s.id + '.png',
      avatarPath = 'apps/web/public' + target.referenceAvatar.source;
    const source = await readFile(sourcePath),
      avatar = await readFile(avatarPath),
      oldBaked = await readFile(priorDir + '/baked_overlay.png');
    if (
      sha256(source) !== prior.sourceSha256 ||
      sha256(avatar) !== target.referenceAvatar.sha256 ||
      sha256(oldBaked) !== prior.outputSha256 ||
      prior.status !== 'NEEDS_REWORK'
    )
      throw Error('Source/avatar/previous candidate hash or state mismatch');
    const transform = solveDownward(s),
      baked = await bakeSwordBytes(source, transform);
    // Fail rather than overwrite any previously rendered candidate.
    await mkdir(dir);
    await copyFile(sourcePath, dir + '/source.png');
    await copyFile(avatarPath, dir + '/avatar_base.png');
    await copyFile(priorDir + '/combined.png', dir + '/previous_combined.png');
    await writeFile(dir + '/' + s.id + '_downward_baked.png', baked);
    const polygon = s.frontHandPolygon.map((p) => p.join(',')).join(' ');
    const maskSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><polygon points="${polygon}" fill="white"/></svg>`,
    );
    const mask = await sharp(maskSvg).ensureAlpha().png().toBuffer();
    const diagnostic = await applyOcclusion(baked, mask);
    await writeFile(dir + '/offline_hand_occlusion_mask.png', mask);
    await writeFile(dir + '/masked_overlay_diagnostic.png', diagnostic.bytes);
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
      .composite([{ input: avatar }, { input: diagnostic.bytes }])
      .png()
      .toFile(dir + '/masked_combined_diagnostic.png');
    await copyFile(dir + '/combined.png', dir + '/full_body.png');
    for (const [name, file] of [
      ['hand_zoom', 'combined.png'],
      ['hand_zoom_masked', 'masked_combined_diagnostic.png'],
      ['hand_zoom_base', 'avatar_base.png'],
    ]) {
      await sharp(dir + '/' + file)
        .extract(s.handCrop)
        .resize(s.handCrop.width * 4, s.handCrop.height * 4)
        .png()
        .toFile(dir + '/' + name + '.png');
    }
    const points = Object.fromEntries(
      ['grip', 'root', 'tip'].map((k) => [
        k,
        { source: s[k], projected: projectSwordPoint(s[k], transform) },
      ]),
    );
    const [px, py] = s.palm,
      [tx, ty] = points.tip.projected;
    const guide = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><path d="M${px} 700V1450M${px - 70} ${py}H${px + 70}M0 ${target.referenceAvatar.footBaseline}H1024" stroke="cyan" stroke-width="2" fill="none"/><path d="M${points.root.projected.join(' ')}L${tx} ${ty}" stroke="yellow" stroke-width="3"/><circle cx="${px}" cy="${py}" r="8" fill="none" stroke="red" stroke-width="3"/><polygon points="${polygon}" fill="none" stroke="magenta" stroke-width="2"/></svg>`,
    );
    await canvas()
      .composite([{ input: avatar }, { input: baked }, { input: guide }])
      .png()
      .toFile(dir + '/alignment_guides.png');
    const metadata = {
      task: 'TASK-0056',
      id: s.id,
      gender: target.gender,
      itemId: target.itemId,
      source: { path: sourcePath, ...(await inspectPng(source)) },
      avatar: {
        path: avatarPath,
        sha256: sha256(avatar),
        id: target.referenceAvatar.id,
        immutable: true,
        footBaseline: target.referenceAvatar.footBaseline,
      },
      previous: {
        task: 'TASK-0055',
        path: priorDir + '/baked_overlay.png',
        sha256: prior.outputSha256,
        fitStatus: prior.status,
      },
      transform,
      landmarks: { ...points, palm: s.palm },
      measurementMethod:
        'Manual native-pixel landmarks, approximate +/-12px; exact vertical blade axis by root/tip; exact grip registration to chosen palm proxy. Does not prove a closed grip.',
      pipeline: {
        implementation:
          'Shared TASK-0054 inverse similarity / premultiplied-alpha bilinear; separate TASK-0056 rotation validation',
        uniform: true,
        warp: 'NONE',
        mask: 'NONE on final candidate',
        sharp: sharp.versions.sharp,
      },
      output: {
        path: dir + '/' + s.id + '_downward_baked.png',
        ...(await inspectPng(baked)),
      },
      occlusionExperiment: {
        path: dir + '/masked_overlay_diagnostic.png',
        sha256: sha256(diagnostic.bytes),
        maskPath: dir + '/offline_hand_occlusion_mask.png',
        maskSha256: sha256(mask),
        frontHandPolygon: s.frontHandPolygon,
        handCrop: s.handCrop,
        removedPixels: diagnostic.removedPixels,
        method:
          'Offline alpha subtraction only from sword; no HD pixels edited, added, copied or redrawn',
        selectedAsFinal: false,
        status: 'VISUAL_INSPECTION_PENDING',
      },
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
    assets.push(metadata);
    console.log(
      s.id +
        ' rotation=' +
        transform.rotation.toFixed(3) +
        ' sha=' +
        metadata.output.sha256.slice(0, 12),
    );
  }
  await writeFile(
    run + '/inventory.json',
    JSON.stringify({ task: 'TASK-0056', assets }, null, 2) + '\n',
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await bakeSwords();
