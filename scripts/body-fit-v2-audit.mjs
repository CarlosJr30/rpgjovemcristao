import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import sharp from 'sharp';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const out = 'build/task-0051-evidence';
fs.mkdirSync(out, { recursive: true });
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = (p) =>
  crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write = (p, data) =>
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, entries: [] },
  appType: 'custom',
});
try {
  const {
    EQUIPMENT_ASSET_MANIFEST: manifest,
    resolveEquipmentDefinition,
    resolveEquipmentVisual,
    EQUIPMENT_COMPOSITION_LAYERS: layers,
  } = await server.ssrLoadModule(
    '/apps/web/features/journey/data/equipmentAssets.ts',
  );
  const { BODY_FIT_V2_TARGETS: targets } = await server.ssrLoadModule(
    '/apps/web/features/journey/data/bodyFitV2Plan.ts',
  );
  const { EQUIPMENT_CATALOG: catalog } = await server.ssrLoadModule(
    '/apps/web/features/journey/data/equipmentCatalog.ts',
  );
  const approved = read('apps/web/features/journey/data/avatarHDApproved.json');
  const metrics = [];
  for (const ref of approved) {
    const path = 'apps/web/public' + ref.source;
    assert.equal(hash(path), ref.sha256);
    const { data, info } = await sharp(path)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 1024);
    assert.equal(info.height, 1536);
    let left = info.width,
      top = info.height,
      right = -1,
      bottom = -1,
      transparent = 0;
    const alphaPositiveBounds = {
      left: info.width,
      top: info.height,
      right: -1,
      bottom: -1,
    };
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        const alpha = data[(y * info.width + x) * 4 + 3];
        if (alpha === 0) transparent++;
        if (alpha > 0) {
          alphaPositiveBounds.left = Math.min(alphaPositiveBounds.left, x);
          alphaPositiveBounds.right = Math.max(alphaPositiveBounds.right, x);
          alphaPositiveBounds.top = Math.min(alphaPositiveBounds.top, y);
          alphaPositiveBounds.bottom = Math.max(alphaPositiveBounds.bottom, y);
        }
        if (alpha >= 128) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    assert(transparent > 0 && right >= left);
    metrics.push({
      id: ref.id,
      source: ref.source,
      sha256: ref.sha256,
      alphaThreshold: 128,
      bounds: { left, top, right, bottom },
      footBaseline: bottom,
      alphaPositiveBoundsDiagnostic: alphaPositiveBounds,
    });
  }
  const sourceFor = (source, gender) =>
    typeof source === 'string' ? source : source?.[gender];
  const state = targets.map((target) => {
    const def = resolveEquipmentDefinition(target.itemId);
    const overlayV1 = [
      sourceFor(def.overlayAsset, target.gender),
      ...(def.additionalOverlays ?? []).map((piece) =>
        sourceFor(piece.overlayAsset, target.gender),
      ),
    ].filter(Boolean);
    const overlayV2 = '/assets/equipment/overlays/v2/' + target.filename;
    return {
      itemId: target.itemId,
      slot: target.slot,
      overlayV1,
      overlayV2,
      v2Exists: fs.existsSync('apps/web/public' + overlayV2),
      currentStatus: def.visualQuality,
      gender: target.gender,
      runtimeUsage: resolveEquipmentVisual(def, target.gender).layers.length
        ? 'BODY'
        : target.equipable
          ? 'MECHANICS_UI_CINEMATIC_ONLY'
          : 'ARCHIVED_DEFINITION',
      issue: target.reason,
    };
  });
  const needs = targets.map((target) => ({
    ...target,
    resolution: { width: 1024, height: 1536 },
    format: 'PNG',
    alpha: 'REAL_TRANSPARENCY_REQUIRED',
    referenceAvatar: metrics.find((ref) => ref.id === target.referenceAvatar),
    landmarkStatus: 'ASSET_MISSING_NOT_MEASURED',
    validation: {
      correction: 'NONE: inset 0; no offsets/crop/warp',
      geometry: 'HD alpha ≥128 contour; alpha >0 diagnostic',
      requiredReview:
        'Same gender; all short/long/curly, outfits and skin variants before general compatibility',
      gripHairlineShouldersAnkles:
        'Measure on approved HD; historical anchors are guides, not validated HD anatomy',
    },
  }));
  const baselinePath = out + '/protected-baseline.json';
  const baseline = fs.existsSync(baselinePath) ? read(baselinePath) : null;
  if (baseline)
    for (const file of baseline.files)
      assert.equal(
        hash(file.path),
        file.sha256,
        'Protected change: ' + file.path,
      );
  const audit = {
    at: new Date().toISOString(),
    result: 'PASS',
    readyDefinitions: Object.values(manifest).filter(
      (d) => d.visualQuality === 'READY',
    ).length,
    needsDefinitions: Object.values(manifest).filter(
      (d) => d.visualQuality === 'NEEDS_NEW_OVERLAY',
    ).length,
    equipableItems: catalog.length,
    archivedDefinitions: Object.keys(manifest).filter(
      (id) => !catalog.some((i) => i.id === id),
    ),
    v2FilesPresent: state.filter((s) => s.v2Exists).length,
    hdIdentitiesHashVerified: metrics.length,
    protectedFiles: baseline?.files.length ?? null,
    preservation: baseline ? 'PASS' : 'NO_BASELINE_IN_CLEAN_CHECKOUT',
    layers,
    visualAlignment: 'BLOCKED_MISSING_ASSETS',
    generation: 'NOT_PERFORMED',
  };
  write(out + '/body-fit-audit.json', audit);
  if (process.argv.includes('--write-docs')) {
    write('docs/architecture/BODY_FIT_CURRENT_STATE.json', {
      at: audit.at,
      audit,
      items: state,
    });
    write('docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.json', {
      at: audit.at,
      status: 'ASSET_GENERATION_REQUIRED',
      assets: needs,
    });
    write(
      'apps/web/features/journey/dev/body-fit-reference-metrics.json',
      metrics,
    );
    fs.writeFileSync(
      'docs/architecture/BODY_FIT_CURRENT_STATE.md',
      '# BODY_FIT_CURRENT_STATE\n\nSnapshot TASK-0051: ' +
        audit.at +
        '\n\n| itemId | slot | overlayV1 | overlayV2 | currentStatus | gender | runtimeUsage | issue |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n' +
        state
          .map(
            (s) =>
              `| ${s.itemId} | ${s.slot} | ${s.overlayV1.join('<br>')} | ${s.overlayV2} (absent) | ${s.currentStatus} | ${s.gender} | ${s.runtimeUsage} | ${s.issue} |`,
          )
          .join('\n') +
        '\n',
    );
    fs.writeFileSync(
      'docs/architecture/NEEDS_NEW_BODY_FIT_ASSET.md',
      '# NEEDS_NEW_BODY_FIT_ASSET\n\nNenhuma geração autorizada nesta tarefa. Todos os 16 alvos estão NEEDS_NEW_OVERLAY. P0: quatro protótipos femininos; P1: quatro masculinos; P2: escudo/medalhão em ambos; P3: definições raras arquivadas, somente após aceite dos protótipos e novo escopo. Não copiar entre gêneros.\n\nTodos: PNG 1024×1536, alpha real, canvas integral, sem offsets/crop/warp. JSON companheiro contém referência HD com hash/baseline real e landmarks exigidos por asset. Compatibilidade deve ser revisada nas 27 identidades por gênero; não está aprovada agora.\n\n| filename | itemId | gender | slot | reference avatar | priority | expected landmarks | reason |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n' +
        targets
          .map(
            (t) =>
              `| ${t.filename} | ${t.itemId} | ${t.gender} | ${t.slot} | ${t.referenceAvatar} | ${t.priority} | ${t.expectedLandmarks.join('; ')} | ${t.reason} |`,
          )
          .join('\n') +
        '\n',
    );
  }
  console.log(JSON.stringify(audit, null, 2));
} finally {
  await server.close();
}
