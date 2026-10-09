import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { sha256 } from './body-fit-bake.mjs';
const out = 'build/task-0057-sword-sheath';
await mkdir(out, { recursive: true });
const previous = JSON.parse(
  await readFile(
    'build/task-0056-sword-downward/preservation-before.json',
    'utf8',
  ),
);
const paths = new Set(previous.files.map((f) => f.path));
async function walk(dir, add) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) await walk(p, add);
    else add(p);
  }
}
for (const dir of [
  'build/task-0056-sword-downward',
  'assets-source',
  'apps/web/public/assets/equipment',
  'scripts',
])
  await walk(dir, (p) => paths.add(p));
for (const p of [
  'docs/architecture/TASK-0056-BAKED-ASSET-MANIFEST.json',
  'docs/architecture/TASK-0056-SWORD-DOWNWARD-REPORT.md',
  'docs/architecture/TASK-0056-FINAL-CHECKS.json',
  'tasks/active/TASK-0056-body-fit-sword-downward.md',
])
  paths.add(p);
const files = [];
for (const p of paths)
  files.push({ path: p, sha256: sha256(await readFile(p)) });
await writeFile(
  out + '/preservation-before.json',
  JSON.stringify({ files }, null, 2) + '\n',
  { flag: 'wx' },
);
const inventory = [];
for (const dir of ['assets-source', 'apps/web/public/assets/equipment'])
  await walk(dir, (p) => {
    if (/\.(png|webp|svg)$/i.test(p)) inventory.push({ path: p });
  });
for (const f of inventory) f.sha256 = sha256(await readFile(f.path));
const named = inventory.filter((f) =>
  /sheath|scabbard|bainha|embainh|sheathed|correia/i.test(f.path),
);
await writeFile(
  out + '/local-art-inventory.json',
  JSON.stringify(
    {
      inventory,
      namedSheathOrSupportMatches: named,
      visualSwordFindings:
        'All four targets, two legacy sword sources, two V1 overlays and runtime icon are exposed blades; no usable sheath/support component identified.',
    },
    null,
    2,
  ) + '\n',
);
const sheet = [];
for (let i = 0; i < inventory.length; i++) {
  const f = inventory[i];
  const label = Buffer.from(
    `<svg width="180" height="28"><text x="4" y="19" font-size="11" fill="black">${f.path.split('/').at(-1).slice(0, 25)}</text></svg>`,
  );
  sheet.push({
    input: await sharp(await readFile(f.path))
      .resize(180, 230, { fit: 'contain', background: '#ddd' })
      .flatten({ background: '#ddd' })
      .png()
      .toBuffer(),
    left: (i % 8) * 180,
    top: Math.floor(i / 8) * 258,
  });
  sheet.push({
    input: label,
    left: (i % 8) * 180,
    top: Math.floor(i / 8) * 258 + 230,
  });
}
await sharp({
  create: {
    width: 1440,
    height: Math.ceil(inventory.length / 8) * 258,
    channels: 4,
    background: '#ddd',
  },
})
  .composite(sheet)
  .png()
  .toFile(out + '/local-equipment-contact-sheet.png');
for (const gender of ['female', 'male']) {
  const base = `apps/web/public/assets/avatar/hd/${gender}/${gender}_short_moss_medium_hd.png`;
  await sharp(base)
    .extract({ left: 280, top: 510, width: 430, height: 300 })
    .flatten({ background: '#ddd' })
    .resize(860, 600)
    .png()
    .toFile(out + '/belt-hip-' + gender + '.png');
}
console.log(
  JSON.stringify({
    protectedFiles: files.length,
    localArtFiles: inventory.length,
    namedSheathMatches: named.length,
  }),
);
