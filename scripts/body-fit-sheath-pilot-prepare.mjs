import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import sharp from 'sharp';
import { sha256, bakeSwordBytes } from './body-fit-bake.mjs';
const out = 'build/task-0058-sword-sheath-pilot';
await mkdir(out, { recursive: true });
for (const d of ['source', 'baked', 'review']) await mkdir(out + '/' + d, { recursive: true });
const prev = JSON.parse(await readFile('build/task-0057-sword-sheath/preservation-before.json', 'utf8'));
const paths = new Set(prev.files.map(f => f.path));
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) await walk(p); else paths.add(p);
  }
}
for (const dir of ['build/task-0057-sword-sheath', 'scripts', 'tests', 'apps/web/app', 'apps/web/features', 'apps/web/lib']) await walk(dir);
for (const p of ['docs/architecture/TASK-0057-SWORD-SHEATH-REPORT.md', 'docs/architecture/TASK-0057-SHEATH-ASSET-MANIFEST.json', 'docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json', 'playwright.task-0057-lab.config.mjs', 'playwright.task-0057-portal.config.mjs']) paths.add(p);
const files = [];
for (const p of paths) files.push({ path: p, sha256: sha256(await readFile(p)) });
await writeFile(out + '/preservation-before.json', JSON.stringify({ files }, null, 2), { flag: 'wx' });
const source = 'assets-source/body-fit-v2-targets/sword_path_common_female_v2.png';
const avatar = 'apps/web/public/assets/avatar/hd/female/female_short_moss_medium_hd.png';
const prevMeta = JSON.parse(await readFile('build/task-0057-sword-sheath/sword_path_common_female_v2/reviewed-metadata.json', 'utf8'));
const rotation = prevMeta.diagnostic.transform.rotation - 12, scale = .4;
const angle = rotation * Math.PI / 180;
const transform = { scale, rotation, translateX: 700 - scale * (Math.cos(angle) * 269 - Math.sin(angle) * 403), translateY: 690 - scale * (Math.sin(angle) * 269 + Math.cos(angle) * 403) };
const sword = await bakeSwordBytes(await readFile(source), transform);
await writeFile(out + '/source/exact-sword-position-study.png', sword, { flag: 'wx' });
await sharp({ create: { width: 1024, height: 1536, channels: 4, background: '#d3d3d3' } }).composite([{ input: await readFile(avatar) }, { input: sword }]).png().toFile(out + '/source/structural-reference-study.png');
await writeFile(out + '/audit.json', JSON.stringify({ task: 'TASK-0058', target: 'sword_path_common_female_v2', source: prevMeta.source, avatar: prevMeta.avatar, previous0056: prevMeta.previousCandidate, previous0057: prevMeta.diagnostic, inventory: 'build/task-0057-sword-sheath/local-art-inventory.json', existingSheathComponents: 0, beltBox: [410, 558, 655, 615], proposedAnchors: [[620, 582], [640, 603]], newGuard: [700, 690], swordStudyTransform: transform, note: 'Study only: exposed blade/foreground arm conflict. New sheath/support and localized foreground arm occlusion required. Screen-right hip avoids screen-left pouch.' }, null, 2));
console.log(JSON.stringify({ protectedFiles: files.length, transform }));
