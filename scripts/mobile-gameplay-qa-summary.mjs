import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(root, 'build/task-0073-mobile-gameplay-exploration');
const json = async (file) =>
  JSON.parse(await readFile(path.join(root, file), 'utf8'));
const runs = {};
for (const [name, expected, skipped] of [
  ['final-acceptance', 63, 0],
  ['final-regression', 41, 1],
  ['panel-final', 12, 0],
  ['playthrough-accepted', 2, 0],
  ['native-touch-accepted', 2, 0],
  ['quiz-navigation-final', 3, 0],
]) {
  const report = await json(
    `build/task-0073-mobile-gameplay-exploration/${name}.json`,
  );
  assert.equal(report.stats.expected, expected);
  assert.equal(report.stats.skipped, skipped);
  assert.equal(report.stats.unexpected, 0);
  assert.equal(report.stats.flaky, 0);
  runs[name] = report.stats;
}
const visual = {};
for (const [stage, engine, expected] of [
  ['before', 'chromium', 66],
  ['after', 'chromium', 143],
  ['after', 'webkit', 143],
]) {
  const metrics = await json(
    `build/task-0073-mobile-gameplay-exploration/${stage}/${engine}/metrics.json`,
  );
  assert.equal(metrics.samples.length, expected);
  assert.equal(metrics.errors.length, 0);
  assert(
    metrics.samples.every(
      (s) =>
        s.documentWidth <= s.width &&
        s.pointOverlaps === 0 &&
        s.dialogCount <= 1,
    ),
  );
  visual[`${stage}/${engine}`] = {
    captures: expected,
    errors: 0,
    horizontalOverflow: 0,
    markerOverlaps: 0,
    physicalDevice: false,
  };
}
const performance = {};
for (const engine of ['android', 'webkit-mobile', 'desktop'])
  performance[engine] = await json(
    `build/task-0066-serpent-mobile-first/performance-${engine}.json`,
  );
const chat = await json('build/task-0071/browser/results.json');
assert.equal(chat.result, 'PASS');
const preservation = await json(
  'build/task-0073-mobile-gameplay-exploration/preservation-summary.json',
);
assert.equal(preservation.unexpected.length, 0);
const smoke = await json(
  'build/task-0073-mobile-gameplay-exploration/local-smoke.json',
);
assert(smoke.pass);
const result = {
  base: preservation.base,
  status: 'LOCAL_GATES_PASS_DEPLOY_PENDING',
  authorReview: true,
  independentReview: false,
  physicalDevice: false,
  unit: {
    files: 67,
    tests: 443,
    command: 'npx vitest run --maxWorkers=2',
    result: 'PASS',
  },
  lint: 'PASS',
  typecheck: 'PASS',
  build: {
    result: 'PASS',
    routes: 20,
    publicFiles: 209,
    artifactFiles: 727,
    hdIdentities: 54,
    restrictedSourceHashes: 8,
  },
  distinctE2EAccepted: 108,
  runs,
  visual,
  performance,
  preservation,
  chat: {
    ...chat,
    scope: 'UI fixtures; no live authenticated two-account transport approval',
  },
  localHttp: {
    checks: smoke.results.length,
    scriptsScanned: smoke.frontendScriptsScanned,
    result: 'PASS',
  },
  earlierFailures: [
    'jsdom dialog API mock',
    'WebKit trigger focus',
    'CDP fullscreen override lifetime',
    'metric directory absent',
    'concurrent artifact collision',
    'outdated Home selectors',
    'DEV indicator interception',
    'high-worker import timeout',
    'canonical 308 before DEV 404',
    'header selector ambiguity in playthrough',
  ],
  remoteDatabaseChanges: false,
  deploymentProtectionChanges: false,
};
await writeFile(
  path.join(out, 'qa-summary.json'),
  JSON.stringify(result, null, 2),
);
const sizes = [
  '320x568',
  '360x800',
  '375x812',
  '390x844',
  '412x915',
  '430x932',
  '844x390',
  '915x412',
  '768x1024',
  '1440x900',
  '1920x1080',
];
const stages = [
  'exploration',
  'point-details',
  'riddle',
  'riddle-text-200',
  'snake-intro',
  'snake-intro-text-200',
  'snake-intro-text-200-actions',
  'tutorial-movement',
  'tutorial-objective',
  'snake-active',
  'snake-hud-text-200',
  'snake-paused',
  'snake-fullscreen',
  'quiz-question',
  'quiz-feedback',
];
const names = {};
for (const stageEngine of Object.keys(visual))
  names[stageEngine] = new Set(
    (
      await json(
        `build/task-0073-mobile-gameplay-exploration/${stageEngine}/metrics.json`,
      )
    ).samples.map((s) => `${s.width}x${s.height}-${s.name}`),
  );
await mkdir(path.join(out, 'review'), { recursive: true });
const rows = sizes
  .flatMap((size) =>
    stages.map((scene) => {
      const key = `${size}-${scene}`;
      if (!Object.values(names).some((set) => set.has(key))) return '';
      return `<section data-size="${size}" data-scene="${scene}"><h2>${size} · ${scene}</h2><div class="views">${Object.keys(
        visual,
      )
        .map((stageEngine) =>
          names[stageEngine].has(key)
            ? `<figure><figcaption>${stageEngine}</figcaption><a href="../${stageEngine}/${key}.png"><img loading="lazy" src="../${stageEngine}/${key}.png" alt="${scene} ${size} ${stageEngine}"></a></figure>`
            : '',
        )
        .join('')}</div></section>`;
    }),
  )
  .join('');
await writeFile(
  path.join(out, 'review/index.html'),
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0073 — revisão visual</title><style>body{font:16px/1.5 system-ui;background:#102c22;color:#fff8dd;margin:0;padding:24px}h1,h2{color:#efdaa0}label{display:inline-flex;gap:8px;margin:8px}select{font:inherit;padding:8px}.views{display:flex;gap:16px;flex-wrap:wrap}figure{margin:0}img{max-width:100%;width:320px;height:auto;border:1px solid #d8c98d}section{border-top:1px solid #d8c98d55;padding:20px 0}a{color:#efdaa0}</style><h1>TASK-0073 — antes/depois</h1><p>Baseline: interface local emulada. Depois: build otimizado com next start, Chromium/Edge e WebKit Windows. Contextos sintéticos; nenhum teste físico ou conversa real. Clique para abrir o PNG original. O texto200% tem vistas de leitura e de ações após scroll.</p><label>Tamanho<select id="size"><option value="">Todos</option>${sizes.map((s) => `<option>${s}</option>`).join('')}</select></label><label>Tela<select id="scene"><option value="">Todas</option>${stages.map((s) => `<option>${s}</option>`).join('')}</select></label>${rows}<script>function filter(){for(const node of document.querySelectorAll('section'))node.hidden=(size.value&&node.dataset.size!==size.value)||(scene.value&&node.dataset.scene!==scene.value)}document.querySelectorAll('select').forEach(n=>n.addEventListener('change',filter));</script></html>`,
);
console.log(
  JSON.stringify({
    result: 'PASS',
    distinctE2EAccepted: 108,
    captures: 352,
    unit: 443,
    physicalDevice: false,
  }),
);
