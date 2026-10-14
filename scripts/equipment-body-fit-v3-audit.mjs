import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { inspectPng } from './body-fit-batch-bake.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(root, 'build/task-0074-equipment-body-fit-v3');
await mkdir(out, { recursive: true });
const json = async (p) =>
  JSON.parse(await readFile(path.join(root, p), 'utf8'));
const bytes = (p) => readFile(path.join(root, p));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const history = await json(
  'build/task-0059-equipment-recovery/current-targets.json',
);
const bundled = await build({
  stdin: {
    contents: `export * from './apps/web/features/journey/data/equipmentCatalog.ts';export * from './apps/web/features/journey/data/equipmentAssets.ts';`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const data = await import(
  'data:text/javascript;base64,' +
    Buffer.from(bundled.outputFiles[0].text).toString('base64')
);
const findings = [],
  targets = [];
for (const original of history.targets) {
  const t = { ...original };
  const source = await bytes(t.source),
    candidate = await bytes(t.staging),
    avatar = await bytes(t.avatar);
  if (hash(source) !== t.sourceSha256 || hash(candidate) !== t.sha256)
    findings.push(t.id + ':hash-mismatch');
  const image = await inspectPng(candidate),
    base = await inspectPng(avatar);
  t.avatarId = path.basename(t.avatar).replace('_hd.png', '');
  t.avatarSha256 = hash(avatar);
  t.resolution = { width: image.width, height: image.height };
  t.png = image;
  t.avatarPng = base;
  t.name =
    data.EQUIPMENT_CATALOG.find((i) => i.id === t.itemId)?.name ??
    'Definição arquivada — sem item jogável';
  t.registered = data.EQUIPMENT_CATALOG.some((i) => i.id === t.itemId);
  t.layer = { armor: 2, boots: 3, amulet: 4, weapon: 6, shield: 7, helmet: 8 }[
    t.slot
  ];
  t.verifiedHumanApproval = false;
  if (t.approvalReceipt) {
    const receipt = await json(t.approvalReceipt);
    const manifest = await json(
      'docs/architecture/TASK-0054-BAKED-ASSET-MANIFEST.json',
    );
    const entry = manifest.assets.find(
      (a) => a.itemId === t.itemId && a.gender === t.gender,
    );
    const metadata = await bytes(entry.bakeMetadataPath);
    t.verifiedHumanApproval =
      receipt.humanBodyFitApproved === true &&
      receipt.reviewStatus === 'HUMAN_BODY_FIT_APPROVED' &&
      receipt.sha256 === hash(candidate) &&
      receipt.sourceSha256 === hash(source) &&
      receipt.referenceAvatar.sha256 === hash(avatar) &&
      receipt.referenceAvatar.path === t.avatar &&
      receipt.referenceAvatar.id === t.avatarId &&
      receipt.gender === t.gender &&
      receipt.itemId === t.itemId &&
      receipt.bakeMetadataSha256 === hash(metadata) &&
      receipt.reviewedBy === 'Carlos Faustino';
    if (!t.verifiedHumanApproval) findings.push(t.id + ':approval-binding');
    t.approval = {
      reviewedBy: receipt.reviewedBy,
      reviewedAt: receipt.reviewedAt,
      scope: receipt.scope,
      receipt: t.approvalReceipt,
    };
  }
  // Runtime revalidation uses the manifest/resolver, not historical "runtime:false".
  t.runtime =
    data.equipmentVisualForItem(
      { id: t.itemId, slot: t.slot },
      t.gender,
      '/' + t.avatar.replace('apps/web/public/', ''),
    ).layers.length > 0;
  t.human = t.verifiedHumanApproval
    ? 'HUMAN_BODY_FIT_APPROVED'
    : t.technical === 'FIT_PASS'
      ? 'HUMAN_BODY_FIT_REVIEW_PENDING'
      : 'NOT_ELIGIBLE';
  t.integrationEligible =
    t.registered && t.verifiedHumanApproval && t.technical === 'FIT_PASS';
  t.compatibility =
    'Requires current runtime combination/fallback verification; historical reports are reference only';
  t.reviewComposition =
    'Immutable original HD base + exact baked overlay; no derived/erased base or transform';
  targets.push(t);
}
const hdFiles = execFileSync(
  'git',
  ['ls-files', 'apps/web/public/assets/avatar/hd'],
  { cwd: root },
)
  .toString()
  .trim()
  .split('\n')
  .filter((f) => f.endsWith('.png'));
const hd = [];
for (const file of hdFiles) {
  const b = await bytes(file);
  const info = await inspectPng(b);
  hd.push({
    path: file,
    sha256: hash(b),
    bytes: b.length,
    width: info.width,
    height: info.height,
  });
}
const counts = {
  targets: targets.length,
  FIT_PASS: targets.filter((t) => t.technical === 'FIT_PASS').length,
  NEEDS_REWORK: targets.filter((t) => t.technical === 'NEEDS_REWORK').length,
  NEEDS_NEW_ART: targets.filter((t) => t.technical.startsWith('NEEDS_NEW'))
    .length,
  humanApproved: targets.filter((t) => t.verifiedHumanApproval).length,
  humanPending: targets.filter(
    (t) => t.human === 'HUMAN_BODY_FIT_REVIEW_PENDING',
  ).length,
  READY_STAGING: targets.filter((t) => t.ready).length,
  ACTIVE_RUNTIME: targets.filter((t) => t.runtime).length,
  integrationEligible: targets.filter((t) => t.integrationEligible).length,
  hd: hd.length,
  catalogItems: data.EQUIPMENT_CATALOG.length,
};
const save = (p, v) => writeFile(path.join(out, p), JSON.stringify(v, null, 2));
await save('inventory.json', {
  base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root })
    .toString()
    .trim(),
  counts,
  targets,
  hd,
  catalog: data.EQUIPMENT_CATALOG,
  rarities: Object.fromEntries(
    data.RARITIES.map((r) => [
      r,
      data.EQUIPMENT_CATALOG.filter((i) => i.rarity === r).length,
    ]),
  ),
  findings,
});
try {
  await readFile(path.join(out, 'inventory-before.json'));
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  await writeFile(
    path.join(out, 'inventory-before.json'),
    await readFile(path.join(out, 'inventory.json')),
  );
}
const baselinePath = path.join(out, 'preservation-before.json');
let exists = false;
try {
  await readFile(baselinePath);
  exists = true;
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
if (!exists) {
  const hashes = {};
  for (const file of execFileSync('git', ['ls-files', '-z'], { cwd: root })
    .toString()
    .split('\0')
    .filter(Boolean))
    hashes[file] = hash(await bytes(file));
  await save('preservation-before.json', {
    base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root })
      .toString()
      .trim(),
    hashes,
  });
}
console.log(JSON.stringify({ counts, findings }));
if (findings.length) process.exitCode = 1;
