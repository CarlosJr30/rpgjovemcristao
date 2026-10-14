import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(root, 'build/task-0064-mobile-game-mode');
const read = async (file) =>
  JSON.parse(await readFile(path.join(out, file), 'utf8'));
if (process.argv.includes('--http-only')) {
  const audio = [
    'music/arena_training.ogg',
    'effects/arena_attack.ogg',
    'effects/arena_defense.ogg',
    'effects/arena_focus.ogg',
    'effects/arena_dodge.ogg',
    'effects/player_hit.ogg',
    'effects/victory.ogg',
    'effects/defeat.ogg',
  ];
  const urls = audio.flatMap((file) => [
    `/assets/audio/${file}`,
    `/assets-source/arena-audio-prototype/audio/${file}`,
  ]);
  urls.push(
    '/tools/arena-lab/',
    '/build/task-0059-equipment-recovery/review/index.html',
    '/build/task-0062-mobile-experience/review/index.html',
    '/build/task-0064-mobile-game-mode/review/index.html',
    '/assets-source/body-fit-v2-targets/armor_traveler_uncommon_female_v2.png',
  );
  const results = [];
  for (const url of urls)
    results.push({
      url,
      expected: 404,
      actual: (await fetch('http://127.0.0.1:3165' + url)).status,
    });
  for (const url of ['/', '/auth', '/journey/equipment', '/journey/arena'])
    results.push({
      url,
      expected: 200,
      actual: (await fetch('http://127.0.0.1:3165' + url)).status,
    });
  await writeFile(
    path.join(out, 'production-http.json'),
    JSON.stringify(
      {
        results,
        pass: results.every((r) => r.actual === r.expected),
        environment: 'Local production fixture, not deployed site',
      },
      null,
      2,
    ),
  );
  assert(results.every((r) => r.actual === r.expected));
  console.log(JSON.stringify({ pass: true, checks: results.length }));
  process.exit(0);
}
const baseline = await read('preservation-before.json');
const allowed = new Set([
  '.agent/memory/CURRENT_STATE.md',
  'docs/architecture/EQUIPMENT-MASTER-CHECKLIST-V1.md',
  'tasks/active/TASK-0064-mobile-game-mode-v1.md',
  'scripts/mobile-game-mode-bootstrap.mjs',
  'tests/e2e/equipment-portal.spec.ts',
  'tests/e2e/snake-playthrough.spec.ts',
  'tests/e2e/diary-experience.spec.ts',
  'tests/e2e/guild-experience-v2.spec.ts',
  'apps/web/features/auth/auth.module.css',
  'apps/web/features/journey/components/arena-stage.module.css',
  'apps/web/features/journey/components/diary-experience.module.css',
  'apps/web/features/journey/components/equipment-portal.module.css',
  'apps/web/features/journey/components/guild-experience.module.css',
  'apps/web/features/journey/components/guild-artwork.tsx',
  'apps/web/features/journey/components/shell.tsx',
  'apps/web/features/journey/components/snake-chase-game.tsx',
  'apps/web/features/journey/journey.module.css',
  'apps/web/features/journey/screens/arena.tsx',
  'apps/web/features/journey/screens/create.tsx',
  'apps/web/features/journey/screens/equipment.tsx',
  'apps/web/features/journey/screens/home.tsx',
  'apps/web/features/journey/screens/phase.tsx',
]);
const changed = [],
  unchanged = [],
  missing = [],
  authorizedMoves = [];
for (const [file, hash] of Object.entries(baseline.hashes)) {
  try {
    const current = createHash('sha256')
      .update(await readFile(path.join(root, file)))
      .digest('hex');
    (current === hash ? unchanged : changed).push(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if (file === 'tasks/active/TASK-0064-mobile-game-mode-v1.md') {
      const target = 'tasks/completed/TASK-0064-mobile-game-mode-v1.md';
      const contract = await readFile(path.join(root, target), 'utf8');
      assert(
        contract.includes('ID: TASK-0064\n') &&
          contract.includes('STATUS: DONE\n'),
      );
      authorizedMoves.push({
        from: file,
        to: target,
        scope: 'Local acceptance only',
      });
      continue;
    }
    missing.push(file);
  }
}
const unexpected = changed.filter((file) => !allowed.has(file));
const preservation = {
  commit: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(),
  baselineCommit: baseline.commit,
  baselineFiles: Object.keys(baseline.hashes).length,
  unchangedCount: unchanged.length,
  changed,
  authorizedMoves,
  missing,
  unexpected,
  pass: missing.length === 0 && unexpected.length === 0,
};
await writeFile(
  path.join(out, 'preservation-final.json'),
  JSON.stringify(preservation, null, 2),
);
assert(preservation.pass, JSON.stringify({ missing, unexpected }));
assert.equal(
  preservation.commit,
  baseline.commit,
  'No commit was authorized for TASK-0064.',
);
if (process.argv.includes('--preservation-only')) {
  console.log(JSON.stringify(preservation));
  process.exit(0);
}
const before = await read('baseline-verified/before/metrics.json');
const matrices = [];
for (const engine of ['chromium', 'webkit']) {
  const data = await read(
    `${engine === 'webkit' ? 'webkit-fresh-verified' : 'chromium-final'}/after/metrics.json`,
  );
  if (engine === 'chromium') {
    const followup = await read('chromium-followup/after/metrics.json');
    assert.equal(followup.samples.length, 44);
    assert.equal(followup.errors.length, 0);
    const key = (sample) => `${sample.name}-${sample.width}x${sample.height}`;
    const updates = new Map(
      followup.samples.map((sample) => [key(sample), sample]),
    );
    data.samples = data.samples.map(
      (sample) => updates.get(key(sample)) ?? sample,
    );
    const guild = await read('chromium-guild-followup/after/metrics.json');
    assert.equal(guild.samples.length, 11);
    assert.equal(guild.errors.length, 0);
    const guildUpdates = new Map(
      guild.samples.map((sample) => [key(sample), sample]),
    );
    data.samples = data.samples.map(
      (sample) => guildUpdates.get(key(sample)) ?? sample,
    );
  }
  const equipmentFinal = await read(
    `${engine}-equipment-icons/after/metrics.json`,
  );
  assert.equal(equipmentFinal.samples.length, 11);
  assert.equal(equipmentFinal.errors.length, 0);
  data.samples = data.samples.map((sample) =>
    sample.name === 'equipment'
      ? equipmentFinal.samples.find(
          (update) =>
            update.width === sample.width && update.height === sample.height,
        )
      : sample,
  );
  assert.equal(data.partial, undefined);
  assert.equal(data.samples.length, 231);
  assert.equal(data.errors.length, 0);
  assert(
    data.samples.every(
      (s) => s.scrollWidth <= s.innerWidth + 1 && s.overflow.length === 0,
    ),
    `${engine}: overflow`,
  );
  assert(
    data.samples
      .filter((s) => s.width <= 1024)
      .every((s) => s.hudOcclusion.every((h) => !h || h.overlapArea === 0)),
    `${engine}: HUD/actor intersection`,
  );
  const primary = data.samples.filter(
    (s) => s.name === 'home' || s.name === 'arena-battle',
  );
  for (const sample of primary.filter((s) => s.width <= 430)) {
    const control = sample.controls.find((c) =>
      /^(Continuar jornada|ATACAR)/.test(c.name),
    );
    assert(
      control && control.y + control.height <= sample.unobscuredBottom + 1,
      `${engine}: primary action ${sample.name} ${sample.width}`,
    );
  }
  matrices.push({
    engine,
    samples: data.samples.length,
    errors: data.errors,
    maxOverflow: Math.max(
      ...data.samples.map((s) => s.scrollWidth - s.innerWidth),
    ),
    maxCLS: data.samples.some((s) => Number.isFinite(s.performance.cls))
      ? Math.max(
          ...data.samples.map((s) => s.performance.cls).filter(Number.isFinite),
        )
      : null,
    uniqueHDSourcesMax: Math.max(
      ...data.samples.map((s) => new Set(s.hdRequests).size),
    ),
    viewportCount: new Set(data.samples.map((s) => `${s.width}x${s.height}`))
      .size,
    data,
  });
}
const after = matrices[0].data;
const visibleArea = (r, width, bottom) =>
  r
    ? Math.max(0, Math.min(r.x + r.width, width) - Math.max(r.x, 0)) *
      Math.max(0, Math.min(r.y + r.height, bottom) - Math.max(r.y, 0))
    : 0;
const comparison = before.samples
  .filter((s) => s.width === 390)
  .map((b) => {
    const a = after.samples.find(
      (s) => s.name === b.name && s.width === b.width && s.height === b.height,
    );
    const action = (sample) =>
      sample.controls.find((c) =>
        /^(Continuar jornada|ATACAR|Começar perseguição)/.test(c.name),
      );
    const summarize = (sample) => ({
      avatar: sample.avatars[0] ?? null,
      field: sample.field,
      fieldVisibleArea: visibleArea(
        sample.field,
        sample.width,
        sample.unobscuredBottom ?? sample.height,
      ),
      primaryAction: action(sample) ?? null,
      mainTop: sample.root.find((r) => r.selector === 'main').y,
    });
    return {
      screen: b.name,
      viewport: '390x844',
      before: summarize(b),
      after: summarize(a),
    };
  });
await writeFile(
  path.join(out, 'qa-layout-summary.json'),
  JSON.stringify(
    {
      matrices: matrices.map((matrix) => ({ ...matrix, data: undefined })),
      comparison,
      physicalDevice: false,
      preservation: {
        pass: preservation.pass,
        unchangedCount: preservation.unchangedCount,
      },
    },
    null,
    2,
  ),
);
await mkdir(path.join(out, 'review'), { recursive: true });
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;');
const sections = [];
for (const size of ['390x844', '1440x900']) {
  for (const name of ['home', 'equipment', 'arena', 'arena-battle', 'snake']) {
    sections.push(
      `<section><h2>${escape(name)} · ${size}</h2><div class="pair"><figure><figcaption>Antes · release 90aa0fc</figcaption><img loading="lazy" src="../baseline-verified/before/${name}-${size}.png" alt="${name} antes" /></figure><figure><figcaption>Depois · local TASK-0064</figcaption><img loading="lazy" src="../${name === 'equipment' ? 'chromium-equipment-icons' : ['arena', 'arena-battle'].includes(name) ? 'chromium-followup' : 'chromium-final'}/after/${name}-${size}.png" alt="${name} depois" /></figure></div></section>`,
    );
  }
}
for (const engine of ['chromium', 'webkit']) {
  const folder =
    engine === 'webkit' ? 'webkit-fresh-verified' : 'chromium-final';
  const files = (await readdir(path.join(out, `${folder}/after`))).filter((f) =>
    f.endsWith('.png'),
  );
  sections.push(
    `<section><h2>Matriz ${engine}</h2><div class="links">${files.map((f) => `<a href="../${/^equipment-/.test(f) ? engine + '-equipment-icons' : engine === 'chromium' && /^guild-/.test(f) ? 'chromium-guild-followup' : engine === 'chromium' && /^(arena|explore)-/.test(f) ? 'chromium-followup' : folder}/after/${escape(f)}">${escape(f)}</a>`).join('')}</div></section>`,
  );
}
for (const folder of [
  'equipment-icons-followup-artifacts',
  'webkit-guild-capture-followup-artifacts',
  'android-snake-artifacts',
  'android-playthrough-followup-artifacts',
  'webkit-snake-geometry-artifacts',
]) {
  const files = (
    await readdir(path.join(out, folder), { recursive: true })
  ).filter((file) => file.endsWith('.png'));
  sections.push(
    `<section><h2>Interações · ${escape(folder)}</h2><div class="links">${files.map((file) => `<a href="../${escape(folder)}/${escape(file.replaceAll('\\', '/'))}">${escape(path.basename(file))}</a>`).join('')}</div></section>`,
  );
}
await writeFile(
  path.join(out, 'review/index.html'),
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0064 · antes/depois</title><style>body{margin:0;padding:24px;background:#151a20;color:#faf2de;font:16px system-ui}h1{font-size:28px}section{margin:32px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0}figcaption{padding:12px}img{display:block;width:100%;max-height:900px;object-fit:contain;object-position:top;background:#242b35}a{color:#f5d495;padding:12px;display:block}.links{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}@media(max-width:600px){body{padding:12px}.pair{grid-template-columns:1fr}}</style><h1>Mobile Game Mode V1 · comparação local</h1><p>Baseline publicado TASK-0063 versus build local TASK-0064. Emulação não equivale a teste físico. Os arquivos desta galeria ficam fora de public.</p>${sections.join('')}</html>`,
);
console.log(
  JSON.stringify({
    pass: true,
    matrices: matrices.map((matrix) => ({ ...matrix, data: undefined })),
    preservation: preservation.pass,
    gallery: 'build/task-0064-mobile-game-mode/review/index.html',
  }),
);
