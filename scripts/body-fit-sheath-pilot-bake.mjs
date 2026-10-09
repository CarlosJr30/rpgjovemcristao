import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { bakeSwordBytes, sha256, PILOT_AVATAR } from './body-fit-bake.mjs';
import { inspectPng } from './body-fit-batch-bake.mjs';
export const OUTPUT = 'build/task-0058-sword-sheath-pilot';
export const SWORD =
  'assets-source/body-fit-v2-targets/sword_path_common_female_v2.png';
export const AVATAR = PILOT_AVATAR;
export function validatePilotSettings(settings) {
  if (!/^attempt-\d{2}$/.test(settings?.attempt ?? ''))
    throw Error('Unsafe attempt directory');
  if (
    !/^build\/task-0058-sword-sheath-pilot\/source\/sheath-generated-v\d+\.png$/.test(
      settings?.sheathSource ?? '',
    )
  )
    throw Error('Only this pilot staging source allowed');
  if (
    ![settings.rotation, settings.swordRotation ?? 20.93075306356095].every(
      (r) => Number.isFinite(r) && Math.abs(r) <= 25,
    )
  )
    throw Error('Moderate pilot rotation required');
  if (
    !Number.isFinite(settings.scale) ||
    settings.scale < 0.1 ||
    settings.scale > 2
  )
    throw Error('Uniform finite scale required');
  for (const p of [
    settings.guard,
    settings.throatSource,
    settings.throatDestination,
    settings.tipSource,
    ...(settings.anchorsSource ?? []),
  ])
    if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite))
      throw Error('Finite two-dimensional landmarks required');
  if (
    !['manual-polygon', 'localized-avatar-colour-refinement'].includes(
      settings.maskMethod ?? 'manual-polygon',
    )
  )
    throw Error('Unsupported occlusion method');
  return settings;
}
export function anchoredTransform(source, destination, scale, rotation) {
  if (Math.abs(rotation) > 25)
    throw Error('Pilot moderate rotation limit 25 degrees');
  const a = (rotation * Math.PI) / 180;
  return {
    scale,
    rotation,
    translateX:
      destination[0] -
      scale * (Math.cos(a) * source[0] - Math.sin(a) * source[1]),
    translateY:
      destination[1] -
      scale * (Math.sin(a) * source[0] + Math.cos(a) * source[1]),
  };
}
export function point(p, t) {
  const a = (t.rotation * Math.PI) / 180;
  return [
    t.translateX + t.scale * (Math.cos(a) * p[0] - Math.sin(a) * p[1]),
    t.translateY + t.scale * (Math.sin(a) * p[0] + Math.cos(a) * p[1]),
  ];
}
export async function retainHilt(bytes, guard, rotation, limit = 65) {
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const a = ((32.93075306356095 - rotation) * Math.PI) / 180;
  const removed = [];
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      // Cut hidden beneath throat; retains source pommel/grip/guard, never generated sword pixels.
      if ((x - guard[0]) * Math.sin(a) + (y - guard[1]) * Math.cos(a) > limit) {
        const k = (y * info.width + x) * 4;
        if (data[k + 3]) removed.push(k);
        data.fill(0, k, k + 4);
      }
    }
  return {
    bytes: await sharp(data, { raw: info }).png().toBuffer(),
    removedPixels: removed.length,
  };
}
export const ARM_POLYGON =
  '659,539 671,550 684,568 696,589 706,611 715,641 724,669 734,698 741,718 751,742 759,764 757,781 752,800 747,819 751,835 764,851 790,842 807,818 818,796 812,773 799,742 789,713 781,683 773,654 765,623 748,593 736,566 732,541 712,518';
export async function occludeArm(bytes, avatar, method = 'manual-polygon') {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><polygon points="${ARM_POLYGON}" fill="white"/></svg>`,
  );
  let mask = await sharp(svg).png().toBuffer();
  if (method === 'localized-avatar-colour-refinement') {
    // Constrain an existing manual ROI to its warm foreground pixels.
    // Cloak is green; never erase equipment merely because a coarse trace covered it.
    const { data, info } = await sharp(mask)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const base = await sharp(avatar).ensureAlpha().raw().toBuffer();
    for (let y = 690; y < 765; y++)
      for (let x = 720; x < 825; x++) {
        const k = (y * 1024 + x) * 4;
        if (base[k] < base[k + 1] + 10) data[k + 3] = 0;
      }
    mask = await sharp(data, { raw: info }).png().toBuffer();
  }
  const result = await sharp(bytes)
    .composite([{ input: mask, blend: 'dest-out' }])
    .png()
    .toBuffer();
  return { bytes: result, mask };
}
export async function makePilot(settings) {
  validatePilotSettings(settings);
  const dir = OUTPUT + '/baked/' + settings.attempt;
  await mkdir(dir); // Never overwrite a previous attempt.
  const audit = JSON.parse(await readFile(OUTPUT + '/audit.json', 'utf8'));
  const original = await readFile(SWORD),
    avatar = await readFile(AVATAR),
    sheath = await readFile(settings.sheathSource);
  if (
    sha256(original) !== audit.source.sha256 ||
    sha256(avatar) !== audit.avatar.sha256
  )
    throw Error('Immutable reference hash changed');
  await inspectPng(sheath);
  const swordT = anchoredTransform(
    [269, 403],
    settings.guard,
    0.4,
    settings.swordRotation ?? 20.93075306356095,
  );
  const sheathT = anchoredTransform(
    settings.throatSource,
    settings.throatDestination,
    settings.scale,
    settings.rotation,
  );
  const fullSword = await bakeSwordBytes(original, swordT);
  const hilt = await retainHilt(
    fullSword,
    settings.guard,
    swordT.rotation,
    settings.hiltLimit ?? 65,
  );
  const leather = await bakeSwordBytes(sheath, sheathT);
  const raw = await sharp(leather)
    .composite([{ input: hilt.bytes }])
    .png()
    .toBuffer();
  const occluded = await occludeArm(raw, avatar, settings.maskMethod);
  const files = {
    'hilt-original-pixels.png': hilt.bytes,
    'sheath-positioned.png': leather,
    'unoccluded-equipment.png': raw,
    'foreground-arm-mask.png': occluded.mask,
    'sword_path_common_female_v2_sheathed_baked.png': occluded.bytes,
  };
  for (const [name, bytes] of Object.entries(files))
    await writeFile(dir + '/' + name, bytes, { flag: 'wx' });
  const composite = await sharp({
    create: { width: 1024, height: 1536, channels: 4, background: '#d3d3d3' },
  })
    .composite([{ input: avatar }, { input: occluded.bytes }])
    .png()
    .toBuffer();
  await writeFile(dir + '/final-composition.png', composite, { flag: 'wx' });
  for (const [name, box] of Object.entries({
    'waist-zoom.png': { left: 540, top: 530, width: 320, height: 380 },
    'support-zoom.png': { left: 550, top: 540, width: 190, height: 260 },
    'arm-zoom.png': { left: 630, top: 520, width: 210, height: 360 },
  }))
    await sharp(composite)
      .extract(box)
      .resize(box.width * 3, box.height * 3)
      .png()
      .toFile(dir + '/' + name);
  const landmarks = {
    throat: point(settings.throatSource, sheathT),
    sheathTip: point(settings.tipSource, sheathT),
    beltLoops: settings.anchorsSource.map((p) => point(p, sheathT)),
    swordGrip: point([205, 300], swordT),
    swordTipHidden: point([940, 1490], swordT),
  };
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect x="410" y="558" width="245" height="57" fill="none" stroke="cyan" stroke-width="3"/><path d="M${landmarks.throat.join(' ')}L${landmarks.sheathTip.join(' ')}" fill="none" stroke="yellow" stroke-width="2"/>${landmarks.beltLoops.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="8" fill="none" stroke="magenta" stroke-width="3"/>`).join('')}<polygon points="${ARM_POLYGON}" fill="none" stroke="orange" stroke-width="2"/></svg>`,
  );
  await sharp(composite)
    .composite([{ input: svg }])
    .png()
    .toFile(dir + '/alignment-guides.png');
  const output = await inspectPng(occluded.bytes);
  const metadata = {
    task: 'TASK-0058',
    id: 'sword_path_common_female_v2',
    attempt: settings.attempt,
    status: 'FIT_VALIDATION_PENDING',
    settings,
    originalSword: audit.source,
    avatar: audit.avatar,
    sheathSource: {
      path: settings.sheathSource,
      ...(await inspectPng(sheath)),
    },
    transforms: { sword: swordT, sheath: sheathT },
    landmarks,
    beltBox: [410, 558, 655, 615],
    output: {
      path: dir + '/sword_path_common_female_v2_sheathed_baked.png',
      ...output,
    },
    mask: {
      path: dir + '/foreground-arm-mask.png',
      sha256: sha256(occluded.mask),
      polygon: ARM_POLYGON,
      intent:
        'Equipment behind precomposed foreground arm/hand; zero Avatar pixels copied or modified; author manual trace needs visual validation',
    },
    hilt: {
      path: dir + '/hilt-original-pixels.png',
      sha256: sha256(hilt.bytes),
      removedBladePixels: hilt.removedPixels,
      cutAxialLimit: settings.hiltLimit ?? 65,
      sourceOnly: true,
    },
    pipeline:
      'Unmodified TASK0054/0056 inverse uniform similarity, premultiplied bilinear; localized equipment alpha subtraction; no anatomy warp',
    runtime: { activated: false, path: null, transform: 'none' },
    ready: false,
    humanBodyFitApproved: false,
  };
  await writeFile(
    dir + '/bake-metadata.json',
    JSON.stringify(metadata, null, 2),
    { flag: 'wx' },
  );
  return metadata;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const m = await makePilot(
    JSON.parse(await readFile(process.argv[2], 'utf8')),
  );
  console.log(JSON.stringify({ output: m.output, landmarks: m.landmarks }));
}
