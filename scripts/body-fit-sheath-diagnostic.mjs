import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { bakeSwordBytes, sha256 } from './body-fit-bake.mjs';
import { inspectPng } from './body-fit-batch-bake.mjs';
import { solveDownward, projectSwordPoint } from './body-fit-sword-bake.mjs';
export const OUTPUT = 'build/task-0057-sword-sheath';
export const PLANS = [
  {
    id: 'sword_path_common_female_v2',
    gender: 'female',
    guard: [269, 403],
    grip: [205, 300],
    root: [337, 559],
    tip: [940, 1490],
    scale: 0.4,
    hipProxy: [313, 666],
    beltPoint: [376, 592],
    beltBox: [350, 558, 650, 610],
  },
  {
    id: 'sword_path_common_male_v2',
    gender: 'male',
    guard: [333, 1115],
    grip: [265, 1235],
    root: [469, 919],
    tip: [985, 46],
    scale: 0.415,
    hipProxy: [302, 696],
    beltPoint: [348, 622],
    beltBox: [325, 592, 645, 645],
  },
  {
    id: 'sword_path_rare_female_v2',
    gender: 'female',
    guard: [513, 350],
    grip: [513, 250],
    root: [513, 580],
    tip: [513, 1515],
    scale: 0.345,
    hipProxy: [317, 678],
    beltPoint: [377, 590],
    beltBox: [350, 558, 650, 610],
  },
  {
    id: 'sword_path_rare_male_v2',
    gender: 'male',
    guard: [512, 393],
    grip: [511, 275],
    root: [512, 622],
    tip: [510, 1518],
    scale: 0.355,
    hipProxy: [305, 699],
    beltPoint: [347, 620],
    beltBox: [325, 592, 645, 645],
  },
];
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
export function diagnosticTransform(plan) {
  if (!PLANS.some((p) => p.id === plan.id && p.gender === plan.gender))
    throw Error('Unauthorized sword target');
  // Guard-to-hip proxy only; no physical attachment or sheath is inferred.
  return solveDownward({
    grip: plan.guard,
    root: plan.root,
    tip: plan.tip,
    palm: plan.hipProxy,
    scale: plan.scale,
  });
}
export function sheathState({
  sheathPresent,
  supportPresent,
  fitReviewed,
  issues = [],
}) {
  if (!sheathPresent || !supportPresent) return 'NEEDS_NEW_SHEATH_ART';
  if (!fitReviewed || issues.length) return 'NEEDS_REWORK';
  return 'FIT_PASS';
}
export async function createDiagnostics() {
  const previous = await json(
      'docs/architecture/TASK-0056-BAKED-ASSET-MANIFEST.json',
    ),
    assets = [];
  for (const s of PLANS) {
    const old = previous.assets.find((a) => a.id === s.id),
      source = await readFile(old.source.path),
      avatar = await readFile(old.avatar.path),
      prevBytes = await readFile(old.output.path);
    if (
      sha256(source) !== old.source.sha256 ||
      sha256(avatar) !== old.avatar.sha256 ||
      sha256(prevBytes) !== old.output.sha256
    )
      throw Error('Historical hash mismatch');
    const transform = diagnosticTransform(s),
      baked = await bakeSwordBytes(source, transform),
      info = await inspectPng(baked),
      dir = OUTPUT + '/' + s.id;
    await mkdir(dir); // Existing candidates/evidence must never be overwritten.
    await copyFile(old.source.path, dir + '/source_original.png');
    await copyFile(old.avatar.path, dir + '/avatar_base.png');
    await copyFile(old.output.path, dir + '/task0056_candidate.png');
    const beforeDir = old.output.path.substring(
      0,
      old.output.path.lastIndexOf('/'),
    );
    await copyFile(beforeDir + '/combined.png', dir + '/task0056_combined.png');
    await writeFile(dir + '/diagnostic_unsheathed_hip.png', baked);
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
      .toFile(dir + '/diagnostic_composition.png');
    await copyFile(
      dir + '/diagnostic_composition.png',
      dir + '/full_body_diagnostic.png',
    );
    const [bx1, by1, bx2, by2] = s.beltBox,
      projected = Object.fromEntries(
        ['guard', 'grip', 'root', 'tip'].map((k) => [
          k,
          { source: s[k], projected: projectSwordPoint(s[k], transform) },
        ]),
      );
    const guide = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect x="${bx1}" y="${by1}" width="${bx2 - bx1}" height="${by2 - by1}" fill="none" stroke="cyan" stroke-width="3"/><path d="M${s.beltPoint.join(' ')} L${s.hipProxy.join(' ')}" stroke="magenta" stroke-dasharray="8 8" stroke-width="4"/><circle cx="${s.beltPoint[0]}" cy="${s.beltPoint[1]}" r="8" fill="cyan"/><circle cx="${s.hipProxy[0]}" cy="${s.hipProxy[1]}" r="8" fill="magenta"/><path d="M${projected.root.projected.join(' ')}L${projected.tip.projected.join(' ')}M0 ${old.avatar.footBaseline}H1024" fill="none" stroke="yellow" stroke-width="3"/><text x="30" y="50" font-size="27" fill="#a00000">DIAGNOSTICO: SEM BAINHA / SEM FIXACAO</text></svg>`,
    );
    await canvas()
      .composite([{ input: avatar }, { input: baked }, { input: guide }])
      .png()
      .toFile(dir + '/alignment_guides.png');
    await canvas()
      .composite([{ input: avatar }, { input: guide }])
      .png()
      .toFile(dir + '/base_alignment_guides.png');
    for (const [f, target] of [
      ['diagnostic_composition.png', 'waist_zoom_diagnostic.png'],
      ['avatar_base.png', 'waist_zoom_base.png'],
      ['alignment_guides.png', 'waist_zoom_guides.png'],
    ])
      await sharp(dir + '/' + f)
        .extract({ left: 180, top: 500, width: 540, height: 380 })
        .flatten({ background: '#d3d3d3' })
        .resize(1080, 760)
        .png()
        .toFile(dir + '/' + target);
    const metadata = {
      task: 'TASK-0057',
      id: s.id,
      gender: s.gender,
      itemId: old.itemId,
      source: {
        path: old.source.path,
        ...(await inspectPng(source)),
        sheathPresent: false,
        supportPresent: false,
      },
      avatar: old.avatar,
      previousCandidate: old.output,
      belt: {
        measuredBox: s.beltBox,
        attachmentProposal: s.beltPoint,
        approximation: '+/-12px visual measurement; no holder exists',
      },
      hip: {
        guardProxy: s.hipProxy,
        fixationVerified: false,
        supportArt: null,
      },
      diagnostic: {
        kind: 'UNSHEATHED_HIP_PLACEMENT_ONLY',
        output: { path: dir + '/diagnostic_unsheathed_hip.png', ...info },
        transform,
        landmarks: projected,
        render: {
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: 'none',
        },
        intendedDepth:
          'Future sheath behind belt/pouch and clear of arm/hand; diagnostic foreground only, depth not validated',
        occlusion: 'NONE; no mask or copied HD pixels',
      },
      finalSheathedOutput: null,
      finalSheathedSha256: null,
      finalSheathedTransform: null,
      pipeline: {
        implementation:
          'Existing TASK-0054/0056 inverse similarity sampler, premultiplied-alpha bilinear',
        uniformScale: true,
        offlineOnly: true,
        mask: 'NONE',
        sharp: sharp.versions.sharp,
      },
      status: sheathState({
        sheathPresent: false,
        supportPresent: false,
        fitReviewed: false,
      }),
      runtimeActivated: false,
      runtimePath: null,
      ready: false,
      humanBodyFitApproved: false,
    };
    await writeFile(
      dir + '/bake-metadata.json',
      JSON.stringify(metadata, null, 2) + '\n',
    );
    assets.push(metadata);
    console.log(
      s.id +
        ' diagnostic=' +
        info.sha256.slice(0, 12) +
        ' NEEDS_NEW_SHEATH_ART',
    );
  }
  await writeFile(
    OUTPUT + '/diagnostic-inventory.json',
    JSON.stringify({ task: 'TASK-0057', assets }, null, 2) + '\n',
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await createDiagnostics();
