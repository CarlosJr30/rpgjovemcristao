import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import sharp from 'sharp';
import { sha256 } from './body-fit-bake.mjs';
import { inspectPng } from './body-fit-batch-bake.mjs';
export const OUTPUT = 'build/task-0059-equipment-recovery';
await mkdir(OUTPUT);
await mkdir(OUTPUT + '/checkpoints');
await mkdir(OUTPUT + '/review');
const write = async (p, v) => writeFile(p, JSON.stringify(v, null, 2) + '\n', { flag: 'wx' });
const json = async p => JSON.parse(await readFile(p, 'utf8'));
const paths = new Set();
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', '.npm-cache', 'task-0059-equipment-recovery'].includes(e.name)) continue;
    const p = dir + '/' + e.name;
    if (e.isDirectory()) await walk(p); else paths.add(p);
  }
}
for (const dir of ['assets-source', 'apps/web/public', 'apps/web/app', 'apps/web/features', 'apps/web/lib', 'packages', 'scripts', 'tests', 'build', 'tools']) await walk(dir);
for (const f of await readdir('docs/architecture')) if (/TASK-005[1-8]/.test(f)) paths.add('docs/architecture/' + f);
const files = [], art = [];
for (const p of [...paths].sort()) {
  const bytes = await readFile(p), hash = sha256(bytes);
  files.push({ path: p, sha256: hash });
  if (/\.(png|svg|webp|jpe?g)$/i.test(p)) art.push({ path: p, sha256: hash, bytes: bytes.length, role: p.startsWith('assets-source/') ? 'SOURCE_ART' : p.startsWith('apps/web/public/') ? 'PUBLIC_ASSET' : 'DEV_OR_HISTORICAL_EVIDENCE' });
}
await write(OUTPUT + '/preservation-before.json', { files });
await write(OUTPUT + '/all-art-inventory.json', { count: art.length, uniqueHashes: new Set(art.map(a => a.sha256)).size, art, note: 'Every physical art file in source/public/build/tools inventoried. Historical screenshots/copies distinguished from sources; no filename is evidence of approval.' });
const bundle = await build({ stdin: { contents: `export * from './apps/web/features/journey/data/equipmentCatalog.ts'; export * from './apps/web/features/journey/data/equipmentAssets.ts'; export * from './apps/web/features/journey/data/equipmentBible.ts';`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
const data = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const runtime = data.EQUIPMENT_CATALOG, manifest = data.EQUIPMENT_ASSET_MANIFEST;
await write(OUTPUT + '/runtime-catalog-snapshot.json', { items: runtime, offers: data.SHOP_OFFERS, rarities: data.RARITIES, assets: manifest, bible: data.EQUIPMENT_BIBLE, layers: data.EQUIPMENT_COMPOSITION_LAYERS });
const reports = [];
for (const f of await readdir('docs/architecture')) if (/^TASK-005[1-8].*\.(md|json)$/.test(f)) {
  const raw = await readFile('docs/architecture/' + f, 'utf8');
  const parsed = f.endsWith('.json') ? JSON.parse(raw) : null;
  reports.push({ path: 'docs/architecture/' + f, sha256: sha256(Buffer.from(raw)), status: parsed?.status ?? raw.split('\n').filter(l => /status|FIT_PASS|REWORK|READY|BLOCKED/i.test(l)).slice(0, 8), counts: parsed?.counts });
}
await write(OUTPUT + '/history-audit.json', { reports });
const batch = await json('docs/architecture/TASK-0055-BAKED-ASSET-MANIFEST.json');
const pilot = (await json('docs/architecture/TASK-0054-BAKED-ASSET-MANIFEST.json')).assets[0];
const sword = await json('docs/architecture/TASK-0058-SHEATH-PILOT-MANIFEST.json');
const approval = await json('docs/architecture/TASK-0054-HUMAN-BODY-FIT-APPROVAL.json');
const targets = [{ id: 'armor_traveler_uncommon_female_v2', itemId: pilot.itemId, gender: 'female', slot: 'armor', source: pilot.sourcePath, sourceSha256: pilot.sourceSha256, staging: pilot.stagingPath.replace('D:/rpg-jovem-cristao/', ''), sha256: pilot.sha256, technical: 'FIT_PASS', human: 'HUMAN_BODY_FIT_APPROVED', ready: true, runtime: false, avatar: pilot.referenceAvatar.path, approvalReceipt: pilot.approvalReceipt }];
for (const a of batch.assets) {
  let technical = a.fitStatus, staging = `build/task-0055-body-fit-bake/${a.id}/${a.id}_baked.png`, hash = a.sha256;
  if (a.id === sword.metadata.id) { technical = 'FIT_PASS'; staging = sword.metadata.output.path; hash = sword.metadata.output.sha256; }
  else if (a.slot === 'weapon') technical = 'NEEDS_NEW_SHEATH_ART';
  targets.push({ id: a.id, itemId: a.itemId, gender: a.gender, slot: a.slot, source: `assets-source/body-fit-v2-targets/${a.id}.png`, sourceSha256: a.sourceSha256, staging, sha256: hash, technical, human: technical === 'FIT_PASS' ? 'HUMAN_BODY_FIT_REVIEW_PENDING' : 'NOT_ELIGIBLE', ready: false, runtime: false, avatar: a.avatar.path, historicalFitReport: `build/task-0055-body-fit-bake/${a.id}/fit-report.json` });
}
for (const t of targets) {
  if (sha256(await readFile(t.source)) !== t.sourceSha256) throw Error('Source hash mismatch: ' + t.id);
  const check = await inspectPng(await readFile(t.staging));
  if (check.sha256 !== t.sha256) throw Error('Staging hash mismatch: ' + t.id);
  t.pngIntegrity = check.integrity.status;
  t.registered = runtime.some(i => i.id === t.itemId);
  t.rarity = runtime.find(i => i.id === t.itemId)?.rarity ?? 'raro';
  t.category = t.registered ? 'BODY_FIT_FOR_REGISTERED_ITEM' : 'BODY_FIT_FOR_ARCHIVED_DEFINITION';
  t.dependency = t.ready ? null : t.technical === 'FIT_PASS' ? 'EXPLICIT_HUMAN_REVIEW' : t.technical;
  t.nextAction = t.ready ? 'Preserve staging; no runtime activation' : t.technical === 'FIT_PASS' ? 'Carlos reviews exact Avatar/hash' : 'Local recovery and evidence; new art brief if not viable';
}
if (!approval.humanBodyFitApproved || approval.sha256 !== pilot.sha256) throw Error('Piloted human approval binding invalid');
const counts = { targets: targets.length, FIT_PASS: targets.filter(t => t.technical === 'FIT_PASS').length, NEEDS_REWORK: targets.filter(t => t.technical === 'NEEDS_REWORK').length, NEEDS_NEW_SHEATH_ART: targets.filter(t => t.technical === 'NEEDS_NEW_SHEATH_ART').length, humanPending: targets.filter(t => t.human === 'HUMAN_BODY_FIT_REVIEW_PENDING').length, humanApproved: 1, READY_STAGING: 1, ACTIVE_RUNTIME_V2: 0 };
await write(OUTPUT + '/initial-targets.json', { targets, counts });
await write(OUTPUT + '/checkpoints/phase-01.json', { phase: 1, status: 'COMPLETE', counts, runtimeItems: runtime.length, actualSlots: [...new Set(runtime.map(i => i.slot))], registeredRarities: Object.fromEntries(data.RARITIES.map(r => [r, runtime.filter(i => i.rarity === r).length])), protectedFiles: files.length, allArtFiles: art.length, inspection: 'Source/public art inventoried, decoded current16 sources/staging; reports0051–0058 read, newest target assessments supersede historical failures. Visual contact sheets and failed-region inspection follow before rework.' });
const relevant = art.filter(a => /^(assets-source\/|apps\/web\/public\/assets\/equipment\/)/.test(a.path));
relevant.push(...art.filter(a => /task-0058.*source\/sheath-generated-v2\.png$/.test(a.path)));
const tiles = [];
for (let i = 0; i < relevant.length; i++) {
  tiles.push({ input: await sharp(await readFile(relevant[i].path)).resize(160, 230, { fit: 'contain', background: '#ddd' }).flatten({ background: '#ddd' }).png().toBuffer(), left: i % 8 * 160, top: Math.floor(i / 8) * 256 });
  tiles.push({ input: Buffer.from(`<svg width="160" height="26"><text x="4" y="18" font-size="10">${path.basename(relevant[i].path).slice(0, 27)}</text></svg>`), left: i % 8 * 160, top: Math.floor(i / 8) * 256 + 230 });
}
await sharp({ create: { width: 1280, height: Math.ceil(relevant.length / 8) * 256, channels: 4, background: '#ddd' } }).composite(tiles).png().toFile(OUTPUT + '/all-equipment-contact-sheet.png');
console.log(JSON.stringify({ counts, runtimeItems: runtime.length, protectedFiles: files.length, artFiles: art.length, distinctArt: new Set(art.map(a => a.sha256)).size }));
