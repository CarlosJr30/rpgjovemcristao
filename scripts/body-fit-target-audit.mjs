import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { validatePngChunks } from './body-fit-source-audit.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'build/task-0052b-body-fit-target-validation');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

export function validateTargetMapping(filename, target, manifestEntry) {
  const errors = [];
  if (filename !== target.filename) errors.push('filename');
  if (!filename.endsWith(`_${target.gender}_v2.png`))
    errors.push('filename gender');
  if (
    manifestEntry?.filename !== undefined &&
    manifestEntry.filename !== filename
  )
    errors.push('manifest filename');
  for (const field of ['itemId', 'gender', 'slot'])
    if (
      manifestEntry?.[field] !== undefined &&
      manifestEntry[field] !== target[field]
    )
      errors.push(field);
  if (
    manifestEntry?.targetFilename !== undefined &&
    manifestEntry.targetFilename !== target.filename
  )
    errors.push('targetFilename');
  if (
    manifestEntry?.target !== undefined &&
    manifestEntry.target !== target.filename
  )
    errors.push('target');
  return {
    status: errors.length ? 'MAPPING_ERROR' : 'MAPPED',
    errors,
    targetFilename: target.filename,
    itemId: target.itemId,
    gender: target.gender,
    slot: target.slot,
  };
}

export function readyEligibility({
  technical,
  mapping,
  fit,
  humanBodyFitApproved,
}) {
  return (
    technical === 'TECHNICALLY_VALIDATED' &&
    mapping === 'MAPPED' &&
    fit === 'FIT_PASS' &&
    humanBodyFitApproved === true
  );
}

async function main() {
  await mkdir(path.join(output, 'review/references'), { recursive: true });
  const at = new Date().toISOString();
  const plan = (
    await readJson(
      path.join(root, 'docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json'),
    )
  ).assets;
  if (
    plan.length !== 16 ||
    new Set(plan.map((target) => target.filename)).size !== 16
  )
    throw new Error('Target plan must contain 16 distinct filenames');
  const sourceDir = path.join(root, 'assets-source/body-fit-v2-targets');
  let files = [];
  let sourceDirectoryExists = true;
  try {
    files = (await readdir(sourceDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /\.png$/i.test(entry.name))
      .map((entry) => entry.name);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    sourceDirectoryExists = false;
  }
  let manifest = null,
    manifestPath = null;
  for (const candidate of [
    'assets-source/body-fit-v2-targets/manifest.json',
    'manifest.json',
  ]) {
    try {
      manifest = await readJson(path.join(root, candidate));
      manifestPath = candidate;
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const entries = manifest?.assets ?? [];
  const assets = [];
  for (const target of plan) {
    const id = target.filename.replace(/\.png$/, '');
    await mkdir(path.join(output, id), { recursive: true });
    const exists = files.includes(target.filename);
    const record = {
      filename: target.filename,
      itemId: target.itemId,
      gender: target.gender,
      slot: target.slot,
      sourcePath: 'assets-source/body-fit-v2-targets/' + target.filename,
      exists,
      sourceApproval: {
        declaredBy: 'Carlos Faustino',
        declaration: 'SOURCE_VISUAL_APPROVED',
        boundToFileHash: false,
      },
      technicalStatus: 'BLOCKED_SOURCE_MISSING',
      mapping: { status: 'NOT_EVALUATED_SOURCE_MISSING', errors: [] },
      fitStatus: 'FIT_VALIDATION_PENDING',
      humanBodyFitApproved: false,
      runtimeReady: false,
      knownCorrectiveEditing: 'NOT_VERIFIABLE_WITHOUT_SOURCE_AND_PROVENANCE',
      referenceAvatar: target.referenceAvatar,
      expectedLandmarks: target.expectedLandmarks,
      evidenceLimit:
        'No source: no overlay/combined/50-50/fit evidence can be claimed',
    };
    if (exists) {
      record.knownCorrectiveEditing =
        'Prior resize/crop not established by metadata; no corrective processing performed by this task';
      const bytes = await readFile(path.join(sourceDir, target.filename));
      record.sha256 = sha(bytes);
      try {
        record.integrity = validatePngChunks(bytes);
        const metadata = await sharp(bytes, { failOn: 'warning' }).metadata();
        const { data, info } = await sharp(bytes, { failOn: 'warning' })
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        let transparent = 0,
          visible = 0;
        for (let i = info.channels - 1; i < data.length; i += info.channels) {
          if (data[i] === 0) transparent++;
          if (data[i] >= 128) visible++;
        }
        const boundEntries = entries.filter(
          (entry) =>
            entry.filename === target.filename ||
            entry.target === target.filename,
        );
        record.mapping = validateTargetMapping(
          target.filename,
          target,
          boundEntries[0],
        );
        if (boundEntries.length > 1)
          record.mapping = {
            ...record.mapping,
            status: 'MAPPING_ERROR',
            errors: [...record.mapping.errors, 'duplicate manifest entries'],
          };
        record.manifestHash = boundEntries[0]?.sha256 ?? null;
        record.manifestHashMatches =
          !record.manifestHash || record.manifestHash === record.sha256;
        const valid =
          metadata.format === 'png' &&
          metadata.width === 1024 &&
          metadata.height === 1536 &&
          metadata.hasAlpha &&
          transparent > 0 &&
          visible > 0 &&
          record.manifestHashMatches;
        record.technicalStatus = valid
          ? 'TECHNICALLY_VALIDATED'
          : 'TECHNICAL_FAIL';
        record.metadata = {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          hasAlpha: metadata.hasAlpha,
          transparentPixels: transparent,
          alpha128Pixels: visible,
          fullNativeCanvas: metadata.width === 1024 && metadata.height === 1536,
          decode: 'PASS',
        };
        record.sourceApproval.boundToFileHash = true;
        record.evidenceLimit =
          'Technical/mapping checks do not establish fit; visual lab review required';
      } catch (error) {
        record.technicalStatus = 'TECHNICAL_FAIL';
        record.technicalError = error.message;
      }
    }
    // No validator is allowed to derive human approval or READY from filenames or dimensions.
    record.readyEligible = readyEligibility({
      technical: record.technicalStatus,
      mapping: record.mapping.status,
      fit: record.fitStatus,
      humanBodyFitApproved: record.humanBodyFitApproved,
    });
    assets.push(record);
    await writeFile(
      path.join(output, id, 'fit-report.json'),
      JSON.stringify({ at, ...record }, null, 2) + '\n',
    );
    const referenceBytes = await readFile(
      path.join(root, 'apps/web/public', target.referenceAvatar.source),
    );
    if (sha(referenceBytes) !== target.referenceAvatar.sha256)
      throw new Error('Reference hash mismatch: ' + target.referenceAvatar.id);
    await copyFile(
      path.join(root, 'apps/web/public', target.referenceAvatar.source),
      path.join(
        output,
        'review/references',
        target.referenceAvatar.id + '.png',
      ),
    );
  }
  const counts = {
    expected: 16,
    found: assets.filter((asset) => asset.exists).length,
    technicalValidated: assets.filter(
      (asset) => asset.technicalStatus === 'TECHNICALLY_VALIDATED',
    ).length,
    mapped: assets.filter((asset) => asset.mapping.status === 'MAPPED').length,
    mappingErrors: assets.filter(
      (asset) => asset.mapping.status === 'MAPPING_ERROR',
    ).length,
    missing: assets.filter((asset) => !asset.exists).length,
    FIT_PASS: 0,
    FIT_FAIL: 0,
    NEEDS_REWORK: 0,
    FIT_VALIDATION_PENDING: 16,
    HUMAN_BODY_FIT_REVIEW_PENDING: 0,
    HUMAN_BODY_FIT_APPROVED: 0,
    READY: 0,
  };
  const result = {
    at,
    sourceDirectoryExists,
    sourceDirectory: 'assets-source/body-fit-v2-targets',
    manifestPath,
    manifestSha256: manifestPath
      ? sha(await readFile(path.join(root, manifestPath)))
      : null,
    manifestTargetEntries: entries.filter((entry) =>
      plan.some(
        (target) =>
          target.filename === entry.filename ||
          target.filename === entry.target,
      ),
    ).length,
    status: counts.missing
      ? 'BLOCKED_SOURCE_TARGET_FILES_NOT_LOCATED'
      : 'FIT_VALIDATION_PENDING',
    counts,
    assets,
    unexpectedPngs: files.filter(
      (file) => !plan.some((target) => target.filename === file),
    ),
    missingFiles: assets
      .filter((asset) => !asset.exists)
      .map((asset) => asset.filename),
    readyPolicy:
      'No READY promotion in this task; even future FIT_PASS needs explicit human Body-Fit approval',
    userApprovalDoesNotProveFileDelivery: true,
  };
  for (const file of [
    'target-inventory.json',
    'ASSET-MAPPING-VALIDATION.json',
    'BODY-FIT-VALIDATION.json',
  ])
    await writeFile(
      path.join(output, file),
      JSON.stringify(result, null, 2) + '\n',
    );
  const data = JSON.stringify(result).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0052B · targets</title>
<style>body{margin:16px;background:#f4f2e9;color:#19372c;font:16px system-ui}label{display:inline-block;margin:8px}select{font:inherit;padding:7px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px}article{padding:14px;background:white;border:1px solid #aaa;border-radius:8px;overflow-wrap:anywhere}h2{font-size:18px}.base{width:100%;max-width:256px;aspect-ratio:2/3;background:repeating-conic-gradient(#ddd 0 25%,#f5f5f5 0 50%) 0/16px 16px}.base img{width:100%;height:100%;object-fit:contain}p{max-width:100ch;overflow-wrap:anywhere}[hidden]{display:none!important}</style>
<h1>TASK-0052B · review local dos 16 targets</h1><p>${result.status}: ${counts.found}/16 fontes encontradas, ${counts.missing} ausentes. Bases HD são reais. Combined/50-50/guides/fit/zoom de candidato dependem das fontes e inspeção real. Nenhum FIT_PASS/FIT_FAIL/NEEDS_REWORK ou READY inferido. Fontes antigas não são substitutas.</p>
<label>Gênero <select id="gender"><option value="">Todos</option><option value="female">Feminino</option><option value="male">Masculino</option></select></label>
<label>Slot <select id="slot"><option value="">Todos</option><option>armor</option><option>helmet</option><option>boots</option><option>weapon</option><option>shield</option><option>amulet</option></select></label>
<p><a href="../target-inventory.json">Inventário e lista exata de ausências</a></p><main></main>
<script type="application/json" id="data">${data}</script><script>
const data=JSON.parse(document.getElementById('data').textContent),main=document.querySelector('main');
for(const asset of data.assets){const card=document.createElement('article');card.dataset.gender=asset.gender;card.dataset.slot=asset.slot;
const title=document.createElement('h2');title.textContent=asset.filename;card.append(title);
const state=document.createElement('p');state.textContent=asset.technicalStatus+' · '+asset.mapping.status+' · '+asset.fitStatus;card.append(state);
const info=document.createElement('p');info.textContent=asset.itemId+' · '+asset.gender+' · '+asset.slot;card.append(info);
const frame=document.createElement('div');frame.className='base';const image=document.createElement('img');image.src='references/'+asset.referenceAvatar.id+'.png';image.alt='Avatar HD de referência '+asset.referenceAvatar.id+'; sem overlay candidato';frame.append(image);card.append(frame);
const note=document.createElement('p');note.textContent=asset.evidenceLimit+'. A imagem acima é somente o avatar base.';card.append(note);
const link=document.createElement('a');link.href='../'+asset.filename.replace(/\\.png$/,'')+'/fit-report.json';link.textContent='Fit report de bloqueio';card.append(link);main.append(card);}
function filter(){for(const card of main.children)card.hidden=(document.getElementById('gender').value&&card.dataset.gender!==document.getElementById('gender').value)||(document.getElementById('slot').value&&card.dataset.slot!==document.getElementById('slot').value)}
document.getElementById('gender').addEventListener('change',filter);document.getElementById('slot').addEventListener('change',filter);
</script></html>`;
  await writeFile(path.join(output, 'review/index.html'), html);
  console.log(
    JSON.stringify({
      status: result.status,
      counts,
      manifestPath,
      sourceDirectoryExists,
    }),
  );
  if (counts.missing) process.exitCode = 2;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
