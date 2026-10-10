import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(ROOT, 'build/task-0062-mobile-experience');
const before = JSON.parse(
  await readFile(path.join(OUT, 'before/metrics.json')),
);
const after = JSON.parse(await readFile(path.join(OUT, 'after/metrics.json')));
assert.equal(before.samples.length, 200);
assert.equal(after.samples.length, 200);
assert.equal(after.partial, undefined);
assert.deepEqual(after.errors, []);
const mobile = after.samples.filter((s) => s.width <= 1024);
for (const sample of after.samples) {
  assert(
    sample.scrollWidth <= sample.innerWidth + 1,
    `${sample.name}/${sample.width}: overflow`,
  );
  assert(sample.hdRequests.length <= 2, `${sample.name}: excess HD requests`);
  for (const image of sample.images) {
    assert(image.loaded, `${sample.name}: HD failed to load`);
    assert.equal(image.fit, 'contain');
  }
}
for (const sample of mobile)
  assert.equal(
    sample.targetsBelow44.length,
    0,
    `${sample.name}/${sample.width}: small touch target`,
  );
const rows = [...new Set(before.samples.map((s) => s.width))].map((width) => {
  const sum = (data, key) =>
    data.samples
      .filter((s) => s.width === width)
      .reduce((n, s) => n + s[key].length, 0);
  return {
    width,
    smallBefore: sum(before, 'textBelow14'),
    smallAfter: sum(after, 'textBelow14'),
    touchBefore: sum(before, 'targetsBelow44'),
    touchAfter: sum(after, 'targetsBelow44'),
  };
});
const desktop = after.samples.filter(
  (s) => s.width >= 1440 && s.name !== 'create',
);
for (const sample of desktop) {
  const previous = before.samples.find(
    (s) => s.name === sample.name && s.width === sample.width,
  );
  assert.equal(
    sample.mainWidth,
    previous.mainWidth,
    `${sample.name}: desktop main width changed`,
  );
  assert.deepEqual(
    sample.textBelow14,
    previous.textBelow14,
    `${sample.name}: desktop typography changed`,
  );
}
await writeFile(
  path.join(OUT, 'comparison.json'),
  JSON.stringify(
    {
      result: 'PASS',
      rows,
      samplesPerRun: 200,
      physicalDevice: false,
      desktopTypographyPreserved: true,
    },
    null,
    2,
  ) + '\n',
);
await mkdir(path.join(OUT, 'review'), { recursive: true });
const names = after.samples.filter((s) => s.width === 390).map((s) => s.name);
let cards = names
  .map(
    (name) =>
      `<section id="${name}"><h2>${name}</h2><div class="pair"><figure><figcaption>Antes · 390×844 · dev</figcaption><a href="../before/${name}-390x844.png"><img loading="lazy" src="../before/${name}-390x844.png" alt="${name} antes da correção"></a></figure><figure><figcaption>Depois · 390×844 · build local</figcaption><a href="../after/${name}-390x844.png"><img loading="lazy" src="../after/${name}-390x844.png" alt="${name} após a correção"></a></figure></div><a href="../before/${name}-1440x900.png">Desktop antes</a> · <a href="../after/${name}-1440x900.png">Desktop depois</a></section>`,
  )
  .join('\n');
cards +=
  '<p>Capturas adicionais após as correções: <a href="../after/traveler-selection-390x844.png">Seleção de Viajante</a> · <a href="../after/traveler-modal-390x844.png">Modal de troca</a>. Estas duas capturas não têm par anterior.</p>';
const table = rows
  .map(
    (r) =>
      `<tr><th>${r.width}px</th><td>${r.smallBefore} → ${r.smallAfter}</td><td>${r.touchBefore} → ${r.touchAfter}</td></tr>`,
  )
  .join('');
await writeFile(
  path.join(OUT, 'review/index.html'),
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0062 · comparação mobile</title><style>body{margin:0;background:#eee8d6;color:#17382b;font:16px/1.5 system-ui}main{max-width:1000px;margin:auto;padding:20px}nav{display:flex;flex-wrap:wrap;gap:8px}a{color:#244a37;min-height:44px;display:inline-flex;align-items:center}nav a{padding:0 12px;border:1px solid #73856b;border-radius:8px}section{margin:32px 0;padding:16px;background:#fffdf6;border-radius:16px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;min-width:0}img{width:100%;height:auto}th,td{padding:8px;text-align:left;border-bottom:1px solid #aaa}@media(max-width:600px){.pair{grid-template-columns:1fr}}</style><main><h1>TASK-0062 · antes/depois</h1><p>Capturas em navegador Edge. Sem teste físico. O indicador “N” nas capturas anteriores pertence ao servidor de desenvolvimento; as posteriores usam build local de produção. Fixtures descartáveis, sem conta remota.</p><nav>${names.map((n) => `<a href="#${n}">${n}</a>`).join('')}</nav><h2>Medições por resolução</h2><p>Contagens somadas nas 20 telas/estados. Texto: ocorrências abaixo de 14px. Toque: alvos abaixo de 44px. Nenhum overflow nos 200 casos após correção.</p><table><tr><th>Largura</th><th>Texto</th><th>Toque</th></tr>${table}</table>${cards}</main></html>`,
);
console.log(
  JSON.stringify(
    {
      result: 'PASS',
      rows,
      gallery: 'build/task-0062-mobile-experience/review/index.html',
    },
    null,
    2,
  ),
);
