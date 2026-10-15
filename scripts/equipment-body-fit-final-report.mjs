import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  readdir,
} from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('..', import.meta.url));
const dir = path.join(root, 'build/task-0075-body-fit-final-review');
const json = async (p) =>
  JSON.parse(
    (await readFile(path.join(dir, p), 'utf8')).replace(/^\uFEFF/, ''),
  );
const inv = await json('inventory.json'),
  visual = await json('visual-review.json'),
  alt = await json('alternatives.json'),
  combos = await json('combinations/results.json');
const unit = await json('unit-tests.json'),
  e2e = await json('e2e-final.json'),
  preservation = await json('preservation-final.json');
const webkitRecheck = await json('webkit-failures-recheck.json');
e2e.stats.interrupted ??= 0;
const chromium = await json('inspection/chromium/results.json'),
  webkit = await json('inspection/webkit/results.json');
const local = await json('local-smoke.json'),
  production = await json('production-smoke.json'),
  deployment = await json('production-deployment.json');
assert(inv.counts.targets === 16 && combos.results.length === 24);
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root })
  .toString()
  .trim();
const checks = [
  [
    'Inventário e hashes originais',
    'PASS',
    'inventory.json',
    '16 candidatos; 8 FIT_PASS, 1 NEEDS_REWORK e 7 NEEDS_NEW_ART. 7 pendentes humanos; 1 aprovação e runtime exatos.',
    'Preservar o histórico.',
    'P1',
  ],
  [
    'WebKit: navegação e prefetch',
    'FAIL',
    'e2e-final-failures.json; webkit-failures-recheck.json',
    `Três casos da rodada completa falharam: dois registraram erros de access control em prefetch RSC; outro não chegou ao Arsenal. Recheck focal: ${webkitRecheck.stats.expected} PASS / ${webkitRecheck.stats.unexpected} FAIL, sem mudança de código; não apaga as falhas da rodada completa.`,
    'Investigar o contexto/navegação sem desativar CORS, auth ou outras proteções. Não tratar hipótese de automação como causa raiz demonstrada.',
    'P1',
  ],
  [
    'PNG, CRC, RGBA, alpha, registro',
    'PASS',
    'inventory.json; alternatives.json',
    '16 originais e 4 derivados decodificáveis em canvas 1024×1536. PNG válido não comprova fit visual.',
    'Não transformar PNG válido em aprovação visual.',
    'P1',
  ],
  [
    'Couraça masculina e espadas',
    'PASS',
    'visual-review.json; captures/',
    'Sem defeito grosseiro novo isolado; originais mantidos. Pochete masculina parcialmente ocluída pelo equipamento, sem edição da base.',
    'Revisão humana dos hashes e das suspensões nas combinações.',
    'P1',
  ],
  [
    'Couraças raras arquivadas',
    'PASS',
    'visual-review.json',
    'Gola, ombros, cintura e tabardo inspecionados; continuam sem item jogável.',
    'Aprovação visual documental somente, sem catálogo/runtime.',
    'P2',
  ],
  [
    'Fixação dos dois escudos originais',
    'FAIL',
    'visual-review.json; combinations/',
    'Mão e punho ocultos, sem demonstração convincente da pega/correia posterior.',
    'Resolver fixação ao braço; aprovação bloqueada na galeria.',
    'P1',
  ],
  [
    'Quatro alternativas de fixação',
    'FAIL',
    'alternatives.json; generation-prompts.json; combinations/',
    'Cuff fora do antebraço, aura e alterações além da fixação. Nenhuma alternativa é FIT_PASS.',
    'Novo trabalho de arte precisa preservar registro e vincular a correia ao braço real; não aceitar estes experimentos.',
    'P1',
  ],
  [
    'Renderização de armadura + espada + escudo',
    'PASS',
    'combinations/results.json',
    '4 trios originais e 8 trios experimentais únicos, em 390 e 1440 px: 24 montagens, 104 capturas. Ordem 2/6/7 e Avatar exato.',
    'Montagem em camadas não aprova coerência anatômica.',
    'P1',
  ],
  [
    'Aceite visual das combinações',
    'BLOCKED',
    'combinations/results.json',
    'A fixação do escudo permanece problemática. Suspensão/oclusão da espada e tabardo documentados.',
    'Rework dos escudos e revisão humana da combinação exata.',
    'P1',
  ],
  [
    'Galeria mobile, zoom e acessibilidade',
    chromium.pass && webkit.pass ? 'PASS' : 'FAIL',
    'inspection/chromium/results.json; inspection/webkit/results.json',
    '22 combinações engine/viewport; 16 candidatos e 4 alternativas; zero requests remotos, erros e decisões automáticas.',
    'Teste físico no POCO não executado.',
    'P2',
  ],
  [
    'Testes unitários',
    'PASS',
    'unit-tests.json',
    `${unit.numPassedTests} testes; ${unit.testResults.length} arquivos; zero falhas.`,
    'Nenhuma correção de domínio necessária.',
    'P1',
  ],
  [
    'E2E jogo, equipamentos, atributos e persistência',
    e2e.stats.unexpected === 0 && e2e.stats.interrupted === 0 ? 'PASS' : 'FAIL',
    'e2e-summary.json',
    `${e2e.stats.expected} PASS; ${e2e.stats.skipped} skips previstos; ${e2e.stats.unexpected} falhas. Home/Arena/Portal/Serpente/painel/mobile e fallback.`,
    'Somente perfis sintéticos isolados; sem dados de jogadores.',
    'P1',
  ],
  [
    'Recarga automatizada desktop',
    'FAIL',
    'reload-screenshot-diagnostic.log; reload-chrome-diagnostic.log; e2e-initial-failures.json',
    'Timeouts em Edge e Chrome desktop. Um controle inicial sem screenshot passou, mas a hipótese de causa exclusiva da captura NÃO se confirmou: Chrome também falhou sem captura. Interceptação/prefetch e tracing isoladamente não resolveram. Causa raiz ainda não demonstrada.',
    'Não ocultar falhas nem remover capturas/assertions para forçar PASS. Confirmar em navegador normal e isolar as requisições pendentes. Os testes originais foram restaurados; apenas a ativação por teclado dos dois casos WebKit foi corrigida.',
    'P1',
  ],
  [
    'Lint / Typecheck / Build de produção local',
    'PASS',
    'lint.log; typecheck.log; build.log',
    'Build otimizado de 20 rotas; gates de mídia e do único asset aprovado passam. Primeiro build falhou por junction local externa e foi corrigido sem alterar código runtime.',
    'Vínculos npm locais apontam para este worktree.',
    'P1',
  ],
  [
    'Preservação e segurança pública',
    preservation.pass ? 'PASS' : 'FAIL',
    'preservation-final.json; local-smoke.json; production-smoke.json',
    `${preservation.preservedFiles} arquivos existentes preservados; ${preservation.authorizedDocumentationChanges.length} mudanças documentais e ${preservation.authorizedTestHarnessChanges.length} ajustes QA autorizados; 54 HD, 16 fontes e 16 bakes intactos. Zero experimento em public/.next/static.`,
    'Sem edição de Supabase, auth, câmera, swipe, saves ou recibos.',
    'P1',
  ],
  [
    'Mídia restrita e rotas privadas',
    local.pass && production.pass ? 'PASS' : 'FAIL',
    'local-smoke.json; production-smoke.json',
    `Local/produção: 7 rotas 200; 8 áudios, 8 fontes, 5 DEV e ${production.privateChecks.length} caminhos privados 404; frontend sem service role identificada.`,
    'Preservar as barreiras de publicação.',
    'P1',
  ],
  [
    'Aprovação humana dos sete',
    'BLOCKED',
    'visual-review.json',
    'Zero nova aprovação. Cinco candidatos prontos para revisão humana; dois escudos exigem rework.',
    'Carlos decide pelos IDs/SHA/Avatares exatos; não inferir aceite por silêncio ou FIT_PASS.',
    'P1',
  ],
  [
    'Ativação ou novo deployment',
    'BLOCKED',
    'production-deployment.json',
    'Nenhum candidato pendente ativado. Produção anterior permanece READY. Não há mudança runtime aprovada nesta tarefa.',
    'Não fazer push que dispare preview/deploy só de arte privada/relatório.',
    'P1',
  ],
  [
    'Chat real com duas contas / dispositivo físico',
    'BLOCKED',
    'production-smoke.json',
    'Bundle do chat preservado e presente; transporte Auth/Realtime de duas contas e POCO físico não foram testados nesta tarefa.',
    'Aceite real do chat continua na TASK-0072B; não declarar aprovado.',
    'P2',
  ],
];
const summary = {
  task: 'TASK-0075',
  status: 'BLOCKED',
  localAudit: 'COMPLETE_WITH_DEFECTS',
  humanReviewReady: 5,
  shieldVisualRework: 2,
  originalCounts: inv.counts,
  experimentalAlternatives: 4,
  newFitPass: 0,
  humanApprovalsCreated: 0,
  localCommit: commit,
  push: false,
  newDeployment: false,
  production: deployment,
  unit: { passed: unit.numPassedTests, files: unit.testResults.length },
  e2e: e2e.stats,
  galleryViewports: 22,
  tripleCaptures: 104,
  physicalDevice: false,
  reviewAuthor: 'Main agent; self QA/security, no independent review',
  checks,
};
await writeFile(
  path.join(dir, 'qa-summary.json'),
  JSON.stringify(summary, null, 2),
);
await writeFile(
  path.join(dir, 'e2e-summary.json'),
  JSON.stringify(
    {
      stats: e2e.stats,
      projects: e2e.config.projects.map((p) => p.name),
      syntheticOnly: true,
    },
    null,
    2,
  ),
);
const rows = checks.map(
  (c) => '| ' + c.map((v) => String(v).replaceAll('|', '/')).join(' | ') + ' |',
);
let md = `# TASK-0075 — revisão final privada\n\nStatus: BLOCKED. Auditoria local completa; cinco candidatos para decisão humana, dois escudos em rework. Nenhuma aprovação/ativação criada.\n\nBase pública: ${inv.base}. Commit local da revisão: ${commit}. Sem push e sem novo deploy: mudanças restritas a ferramentas, documentação e experimentos privados.\n\nProdução existente: https://rpgjovemcristao-web-inky.vercel.app/ — ${deployment.state}, SHA ${deployment.sha}, ${deployment.id}. Consulta somente leitura em ${deployment.inspectedAt}.\n\nAbrir review/index.html offline ou http://127.0.0.1:8075/ neste computador. Há 16 referências, mas apenas os sete pendentes são objeto desta revisão. Decisões são rascunhos locais não verificados; nada altera o jogo. Os escudos e alternativas com defeitos têm Aprovar desabilitado.\n\nAntes padrão = HD sem candidato; Depois = HD + PNG exato. No seletor Antes mostra, escolha candidato original para comparar com um derivado. Use os dois seletores de companheiros ou Combinar armadura + espada + escudo. O zoom altera somente a visualização. Para os cinco originais preservados, hash original e hash final são idênticos, sem nova arte.\n\n## Critérios\n\n| Teste | Resultado | Evidência | Defeito/limite | Correção recomendada | Prioridade |\n| --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\n## Candidatos\n`;
for (const r of visual.targets) {
  const t = inv.targets.find((t) => t.id === r.id),
    variants = alt.alternatives.filter((v) => v.originalSha256 === t.sha256);
  md += `\n### ${t.id}\n\nAvatar: ${t.avatarId}; SHA ${t.avatarSha256}.\n\nFonte original SHA: ${t.sourceSha256}. Baked original/final preservado SHA: ${t.sha256}. PNG técnico histórico: ${t.technical}; visual: ${r.visualResult}; humano: PENDING; ativação: false. Item jogável: ${t.registered ? 'sim' : 'não, definição arquivada'}.\n\n${r.observations}\n\n${r.recommendation}\n\n`;
  for (const v of variants)
    md += `Derivado ${v.id}: SHA ${v.sha256}, ${v.technical}; pixels de material original alterados ${v.changedOriginalShieldPixels}/${v.originalShieldPixels}; alpha>=8 fora das regiões de escudo/montagem ${v.alphaOutsideExpectedAttachment}. ${v.defect}\n\n`;
  if (!variants.length)
    md +=
      'Derivado: nenhum; arte original preservada por ausência de defeito comprovado que justificasse alteração.\n\n';
}
md +=
  '\n## Limites e próximos passos\n\nA avaliação do agente é técnica/visual e não constitui aprovação humana nem revisão independente. Os oito FIT_PASS são históricos dos originais; os quatro experimentos não acrescentam nenhum FIT_PASS. As duas couraças raras permanecem arquivadas mesmo após eventual aprovação documental. O escudo oculta a guarda da espada nos trios; a bainha inferior continua visível. A correia experimental não demonstra ligação ao antebraço e não deve ser ativada. Não mascarar isso deformando o HD ou movendo a pose.\n\nCarlos pode revisar os cinco candidatos sem defeito novo comprovado e solicitar correção/reprovar os escudos, com observações exatas de fixação. Mudança de método de arte ou direção visual pode ser decidida após a comparação concreta; nenhum experimento atual é recomendado para ativação. Após correção, repetir validação do novo hash/Avatar e as combinações. Não há autorização inferida para publicar arte pendente.\n\nA primeira execução de build falhou por link npm apontando para outro worktree. Corrigido com junctions apenas locais para packages deste checkout; build final PASS, sem dependências ou lockfile alterados. E2E utiliza build otimizado local, perfis novos e dados sintéticos; não escreve em contas reais. Os skips redundantes de desktop não equivalem a falhas mobile.\n\nOs prompts exatos e o método built-in imagegen estão em generation-prompts.json. Os quatro PNGs gerados foram copiados para alternatives/ neste worktree e permanecem privados; a galeria incorpora os mesmos bytes. Não foram editados programaticamente. Nenhuma cópia dos outros 52 Avatares HD foi incluída no pacote.\n';
await writeFile(path.join(dir, 'RELATORIO.md'), md);
const pack = path.join(dir, 'review-package');
await mkdir(path.join(pack, 'captures'), { recursive: true });
await mkdir(path.join(pack, 'combinations'), { recursive: true });
await mkdir(path.join(pack, 'review'), { recursive: true });
const copy = async (p, dest = p) => {
  await mkdir(path.dirname(path.join(pack, dest)), { recursive: true });
  await copyFile(path.join(dir, p), path.join(pack, dest));
};
const captures = [];
for (const r of visual.targets) {
  const regions = r.id.startsWith('armor')
    ? ['head', 'left-hand', 'right-hand', 'waist']
    : r.id.startsWith('sword')
      ? ['right-hand', 'waist', 'feet']
      : ['right-hand', 'waist'];
  for (const suffix of [
    '390-before',
    '390-after',
    ...regions.map((p) => '390-zoom-' + p),
    '1440-after',
  ]) {
    const name = r.id + '-' + suffix + '.png';
    await copy('inspection/chromium/' + name, 'captures/' + name);
    captures.push(name);
  }
}
const comboNames = new Set(combos.results.flatMap((r) => r.captures));
for (const v of alt.alternatives)
  for (const w of [390, 1440])
    comboNames.add(`${v.id}-${w}-original-vs-derived.png`);
for (const name of comboNames) await copy('combinations/' + name);
for (const p of [
  'RELATORIO.md',
  'inventory.json',
  'alternatives.json',
  'visual-review.json',
  'qa-summary.json',
  'e2e-summary.json',
  'unit-tests.json',
  'e2e-final.json',
  'e2e-initial-failures.json',
  'e2e-final-failures.json',
  'webkit-failures-recheck.json',
  'reload-screenshot-diagnostic.log',
  'reload-chrome-diagnostic.log',
  'preservation-final.json',
  'production-deployment.json',
  'local-smoke.json',
  'production-smoke.json',
  'review/index.html',
  'inspection/chromium/results.json',
  'inspection/webkit/results.json',
  'combinations/results.json',
  'lint.log',
  'typecheck.log',
  'build.log',
])
  await copy(p);
await copyFile(
  path.join(root, 'tools/equipment-body-fit-final-prompts.json'),
  path.join(pack, 'generation-prompts.json'),
);
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const table =
  '<div class="table"><table><thead><tr>' +
  [
    'Teste',
    'Resultado',
    'Evidência',
    'Defeito/limite',
    'Correção',
    'Prioridade',
  ]
    .map((s) => '<th>' + s + '</th>')
    .join('') +
  '</tr></thead><tbody>' +
  checks
    .map(
      (c) =>
        '<tr>' + c.map((s) => '<td>' + esc(s) + '</td>').join('') + '</tr>',
    )
    .join('') +
  '</tbody></table></div>';
const articles = visual.targets
  .map((r) => {
    const t = inv.targets.find((t) => t.id === r.id);
    const variants = alt.alternatives.filter(
      (v) => v.originalSha256 === t.sha256,
    );
    return `<article><h2>${esc(t.id)}</h2><p>${esc(t.avatarId)} · ${esc(r.visualResult)} · decisão humana PENDENTE · runtime inativo</p><p>Avatar SHA: <code>${t.avatarSha256}</code><br>Fonte SHA: <code>${t.sourceSha256}</code><br>Original e final preservado SHA: <code>${t.sha256}</code></p><p>${esc(r.observations)}</p><p>${esc(r.recommendation)}</p><div class="images"><figure><img loading="lazy" src="captures/${t.id}-390-before.png" alt="Antes, Avatar original sem candidato"><figcaption>Antes: HD original</figcaption></figure><figure><img loading="lazy" src="captures/${t.id}-390-after.png" alt="Depois, composição com candidato original"><figcaption>Depois: candidato original preservado</figcaption></figure></div><p><a href="captures/${t.id}-1440-after.png">Corpo inteiro desktop</a> · <a href="captures/${t.id}-390-zoom-waist.png">Zoom cintura</a> · <a href="captures/${t.id}-390-zoom-right-hand.png">Zoom braço e mão</a></p>${variants.map((v) => `<p>Derivado ${esc(v.id)} · ${v.technical}<br>SHA <code>${v.sha256}</code><br>${esc(v.defect)}</p><a href="combinations/${v.id}-390-original-vs-derived.png">Comparar original/derivado mobile</a>`).join('')}</article>`;
  })
  .join('');
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file: data:; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>TASK-0075 — relatório privado</title><style>*{box-sizing:border-box}body{margin:auto;max-width:1200px;padding:16px;background:#102c22;color:#fff8dd;font:16px/1.5 system-ui;overflow-wrap:anywhere}h1,h2{color:#efd493}a{color:#fff0a8}article{padding:16px;border:1px solid #cfbc82;border-radius:12px;margin:24px 0}.table{overflow:auto}table{border-collapse:collapse;min-width:900px}th,td{padding:10px;border:1px solid #53735f;text-align:left;vertical-align:top}code{overflow-wrap:anywhere}.images{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}figure{margin:0}img{max-width:100%;height:auto}a:focus-visible{outline:3px solid #fff0a8}@media(max-width:600px){.images{grid-template-columns:1fr}}</style></head><body><h1>TASK-0075 — revisão final privada</h1><p><strong>BLOCKED: cinco candidatos para revisão humana; dois escudos em rework.</strong> Zero aprovação automática, zero ativação nova.</p><p><a href="review/index.html">Abrir galeria interativa privada</a> · <a href="RELATORIO.md">Relatório completo</a> · <a href="generation-prompts.json">Prompts exatos</a> · <a href="qa-summary.json">Resultados</a></p><p>Commit local ${commit}; sem push/deploy novo. Produção existente ${deployment.state}, SHA ${deployment.sha}. ${unit.numPassedTests} unitários e ${e2e.stats.expected} E2E passaram; ${e2e.stats.skipped} skips previstos; ${e2e.stats.unexpected} falhas; ${e2e.stats.interrupted} interrompidos. Testes sintéticos em build otimizado local; nenhum aceite físico ou Realtime de contas reais inferido.</p><p>Armaduras e espadas originais preservadas. FIT_PASS histórico não é aprovação humana. Escudos e experimentos com defeito têm Aprovar bloqueado. Couraças raras continuam arquivadas, sem catálogo/runtime. Somente a Couraça feminina já aprovada permanece ativa no Avatar exato.</p>${table}${articles}<p>Camadas dos trios: armadura 2, espada 6, escudo 7. <a href="combinations/results.json">24 montagens e 104 capturas</a>. Originais, HD, recibos, câmera/swipe e dados preservados. QA e Security pelo próprio agente, sem alegação de independência.</p></body></html>`;
await writeFile(path.join(pack, 'RELATORIO.html'), html);
const files = {};
const walk = async (d) => {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name !== 'SHA256.json')
      files[path.relative(pack, p).replaceAll('\\', '/')] = createHash('sha256')
        .update(await readFile(p))
        .digest('hex');
  }
};
await walk(pack);
await writeFile(
  path.join(pack, 'SHA256.json'),
  JSON.stringify(
    {
      task: 'TASK-0075',
      files,
      excludes: 'SHA256.json itself',
      secretsIncluded: false,
      rawHdCopies: 0,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    status: 'BLOCKED',
    files: Object.keys(files).length,
    candidateCaptures: captures.length,
    tripleCaptures: comboNames.size,
    localCommit: commit,
    humanApprovals: 0,
    push: false,
    newDeployment: false,
  }),
);
