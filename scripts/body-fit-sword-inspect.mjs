import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { sha256 } from './body-fit-bake.mjs';
export const OUTPUT = 'build/task-0056-sword-downward';
export const IDS = [
  'sword_path_common_female_v2',
  'sword_path_common_male_v2',
  'sword_path_rare_female_v2',
  'sword_path_rare_male_v2',
];
await mkdir(OUTPUT, { recursive: true });
const old = JSON.parse(
  await readFile(
    'build/task-0055-body-fit-bake/preservation-before.json',
    'utf8',
  ),
);
const paths = new Set(old.files.map((f) => f.path));
async function walk(dir, add) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) {
      if (!['node_modules', '.git', '.next'].includes(e.name) && p !== OUTPUT)
        await walk(p, add);
    } else add(p);
  }
}
for (const dir of [
  'build/task-0054-body-fit-bake',
  'build/task-0055-body-fit-bake',
  'scripts',
  'apps/web/features/journey',
  'packages/game-engine',
  'assets-source/body-fit-v2-targets',
])
  await walk(dir, (p) => paths.add(p));
for (const p of [
  'docs/architecture/TASK-0054-BAKED-ASSET-MANIFEST.json',
  'docs/architecture/TASK-0055-BAKED-ASSET-MANIFEST.json',
])
  paths.add(p);
const files = [];
for (const p of paths)
  files.push({ path: p, sha256: sha256(await readFile(p)) });
await writeFile(
  OUTPUT + '/preservation-before.json',
  JSON.stringify({ files }, null, 2),
  { flag: 'wx' },
);
const pngs = [];
await walk('.', (p) => {
  if (p.toLowerCase().endsWith('.png')) pngs.push(p);
});
// All physically present workspace PNGs, including ignored build artifacts. Hash duplicates remain explicit.
const images = [];
for (const p of pngs)
  images.push({ path: p, sha256: sha256(await readFile(p)) });
await writeFile(
  OUTPUT + '/physical-png-inventory.json',
  JSON.stringify({ count: images.length, images }, null, 2),
);
const tiles = [];
for (let i = 0; i < IDS.length; i++) {
  const d = 'build/task-0055-body-fit-bake/' + IDS[i];
  tiles.push({
    input: await sharp(d + '/combined.png')
      .resize(256, 384)
      .toBuffer(),
    left: i * 256,
    top: 0,
  });
  tiles.push({
    input: await sharp(d + '/source.png')
      .flatten({ background: '#ddd' })
      .resize(256, 384)
      .toBuffer(),
    left: i * 256,
    top: 384,
  });
  await sharp(d + '/avatar_base.png')
    .extract({ left: 155, top: 735, width: 150, height: 165 })
    .flatten({ background: '#ddd' })
    .resize(600, 660)
    .toFile(OUTPUT + '/hand_' + IDS[i] + '.png');
}
await sharp({
  create: { width: 1024, height: 768, channels: 4, background: '#ddd' },
})
  .composite(tiles)
  .png()
  .toFile(OUTPUT + '/previous-and-sources.png');
console.log(JSON.stringify({ protected: files.length, pngs: images.length }));
