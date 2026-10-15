import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { inspectPng } from './body-fit-batch-bake.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(root, 'build/task-0075-body-fit-final-review');
const json = async (p) =>
  JSON.parse(await readFile(path.join(root, p), 'utf8'));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const inventory = await json(
  'build/task-0075-body-fit-final-review/inventory.json',
);
assert.equal(inventory.findings.length, 0);
const previous = await json(
  'build/task-0074-equipment-body-fit-v3/visual-review.json',
);
const reviews = previous.targets.map((r) => ({
  ...r,
  task: 'TASK-0075',
  previousEvidence: r.evidence,
  evidence: `inspection/chromium/${r.id}-390-after.png`,
  humanDecision: 'PENDING',
  productionActive: false,
}));
for (const r of reviews) {
  if (r.id.includes('shield_')) {
    r.visualResult = 'NEEDS_REWORK';
    r.priority = 'P1';
    r.recommendation =
      'A fixação não está demonstrada. Não recomendar aprovação final deste escudo sem resolver a ligação ao braço. Alternativa experimental separada também falhou; não altera o FIT_PASS histórico do original nem autoriza ativação.';
  } else {
    r.visualResult = 'HUMAN_REVIEW_READY';
    r.recommendation +=
      ' Original mantido; nenhuma correção de arte sem defeito comprovado.';
  }
}
const alternatives = [];
const generation = await json('tools/equipment-body-fit-final-prompts.json');
for (const [gender, attempt] of [
  ['female', '01'],
  ['male', '01'],
  ['male', '02'],
  ['male', '03'],
]) {
  const target = inventory.targets.find(
    (t) => t.id === `shield_perseverance_rare_${gender}_v2`,
  );
  const p = `build/task-0075-body-fit-final-review/alternatives/shield_${gender}_mount_attempt${attempt}.png`;
  const bytes = await readFile(path.join(root, p));
  const png = await inspectPng(bytes);
  const original = await sharp(path.join(root, target.staging))
    .raw()
    .toBuffer();
  const candidate = await sharp(bytes).raw().toBuffer();
  const bounds = target.png.alpha128Bounds;
  let originalShieldPixels = 0,
    changedOriginalShieldPixels = 0,
    alphaOutsideExpectedAttachment = 0;
  // The shield itself must stay byte-identical; only a small arm mount may be added.
  for (let y = 0; y < 1536; y++)
    for (let x = 0; x < 1024; x++) {
      const i = (y * 1024 + x) * 4;
      if (original[i + 3] >= 128) {
        originalShieldPixels++;
        if (!original.subarray(i, i + 4).equals(candidate.subarray(i, i + 4)))
          changedOriginalShieldPixels++;
      }
      const inShield =
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.top &&
        y <= bounds.bottom;
      const inMount = x >= 680 && x <= 790 && y >= 535 && y <= 650;
      if (!inShield && !inMount && candidate[i + 3] >= 8)
        alphaOutsideExpectedAttachment++;
    }
  assert(
    changedOriginalShieldPixels > 0 && alphaOutsideExpectedAttachment > 0,
    'Experimental failure must be backed by pixel evidence',
  );
  const v = {
    id: `${target.id}_mount_attempt${attempt}`,
    label: `Fixação experimental ${attempt} — REPROVADA tecnicamente`,
    path: p,
    sha256: hash(bytes),
    originalSha256: target.sha256,
    avatar: target.avatarId,
    avatarSha256: target.avatarSha256,
    technical: 'NEEDS_REWORK',
    human: 'NOT_APPROVED',
    runtime: false,
    png,
    originalShieldPixels,
    changedOriginalShieldPixels,
    alphaOutsideExpectedAttachment,
    defect:
      'Aura fora da silhueta, desenho original alterado e correia deslocada para dentro do torso em vez do antebraço. Não é correção final nem novo FIT_PASS.',
    method:
      'Built-in imagegen, equipment overlay edit; no programmatic pixel editing. Original HD used for inspection and, on attempt01, as generation reference. Attempts male02/03 use equipment-only references.',
    prompt: generation.prompts[gender + attempt],
  };
  target.alternatives ??= [];
  target.alternatives.push(v);
  alternatives.push(v);
}
const images = {};
for (const t of inventory.targets)
  for (const [p, expected] of [
    [t.avatar, t.avatarSha256],
    [t.staging, t.sha256],
    ...(t.alternatives || []).map((v) => [v.path, v.sha256]),
  ]) {
    if (images[p]) continue;
    const bytes = await readFile(path.join(root, p));
    assert.equal(hash(bytes), expected, p);
    images[p] = 'data:image/png;base64,' + bytes.toString('base64');
  }
const payload = {
  task: 'TASK-0075',
  base: inventory.base,
  counts: inventory.counts,
  targets: inventory.targets,
  reviews,
  images,
};
const template = await readFile(
  path.join(root, 'tools/equipment-body-fit-final-review.html'),
  'utf8',
);
const html = template.replace(
  '__BODY_FIT_REVIEW_DATA__',
  JSON.stringify(payload).replaceAll('<', '\\u003c'),
);
await mkdir(path.join(out, 'review'), { recursive: true });
await writeFile(path.join(out, 'review/index.html'), html);
await writeFile(
  path.join(out, 'alternatives.json'),
  JSON.stringify({ alternatives, newFitPass: 0, humanApprovals: 0 }, null, 2),
);
await writeFile(
  path.join(out, 'visual-review.json'),
  JSON.stringify(
    {
      targets: reviews,
      humanDecisionsChanged: 0,
      approvedFemalePreserved: true,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    targets: 16,
    pending: 7,
    images: Object.keys(images).length,
    alternatives: alternatives.length,
    alternativesPassed: 0,
    htmlBytes: Buffer.byteLength(html),
    humanDecisions: 0,
  }),
);
