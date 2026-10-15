import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('..', import.meta.url));
const base = 'build/task-0075-body-fit-final-review',
  dir = base + '/continuation';
const json = async (p) =>
  JSON.parse(
    (await readFile(path.join(root, p), 'utf8')).replace(/^\uFEFF/, ''),
  );
const original = await json(base + '/e2e-final-failures.json');
const baseline = await json(base + '/continuation-full-baseline.json');
const final = await json(base + '/continuation-final-verified.json');
const receipt = await json(dir + '/continuation-final-verified-receipt.json');
const pinned = await json(base + '/continuation-pinned-control.json');
const audit = await json(dir + '/security-and-eligibility.json');
const boots = await json(dir + '/footwear/inspection.json');
const proof = await json(dir + '/footwear/proof.json');
const helmets = await json(dir + '/helmets/evidence.json');
const units = await json(dir + '/unit-tests.json');
const smoke = await json(dir + '/local-smoke.json');
assert.equal(receipt.exitCode, 0);
assert.equal(receipt.status, 'PASS');
assert.equal(final.stats.unexpected, 0);
assert.equal(final.stats.flaky, 0);
for (const [p, sha] of Object.entries(receipt.sources))
  assert.equal(
    createHash('sha256')
      .update(await readFile(path.join(root, p)))
      .digest('hex'),
    sha,
    'Test source changed after the final suite: ' + p,
  );
const map = new Map();
function walk(suites) {
  for (const s of suites) {
    for (const spec of s.specs || [])
      for (const t of spec.tests || [])
        map.set(t.projectName + '|' + spec.title, t.results.at(-1)?.status);
    walk(s.suites || []);
  }
}
walk(final.suites);
const failures = original.records.map((f, i) => ({
  index: i + 1,
  file: f.file,
  title: f.title,
  project: f.project,
  originalResult: 'FAIL',
  finalResult: map.get(f.project + '|' + f.title),
  classification:
    f.file === 'arena-v2.spec.ts'
      ? 'HARNESS_PREFETCH_UNLOAD_RACE_OBSERVED'
      : f.project === 'webkit-mobile'
        ? 'SETUP_RACE_OBSERVED_NAVIGATION_ROOT_NOT_SEPARATELY_PROVEN'
        : 'TRANSPORT_TIMEOUT_NOT_REPRODUCED_ROOT_UNCONFIRMED',
  action:
    f.file === 'arena-v2.spec.ts'
      ? 'Intro readiness and network settlement before hard navigation; all pageerror/combate assertions preserved.'
      : f.project === 'webkit-mobile'
        ? 'Intro fixture settlement added; tap/navigation/focus assertions preserved.'
        : 'Production server lifecycle now managed with reuseExistingServer=false; Chrome155 and pinned Chromium153 both passed. No game-code fix or definitive cause claimed.',
}));
assert.equal(failures.length, 14);
assert(failures.every((f) => f.finalResult === 'passed'));
const head = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const summary = {
  task: 'TASK-0075',
  status: 'BLOCKED_FOR_ACTIVATION',
  localWorkHead: head,
  recordedAt: new Date().toISOString(),
  functionalSuite: 'PASS',
  rootCauseInvestigation:
    'PARTIAL: two Arena harness races observed; mobile setup race observed but full navigation cause unproven; eleven desktop transport timeouts not reproduced, exact cause unconfirmed.',
  originalStats: original.stats,
  baselineStats: baseline.stats,
  finalStats: final.stats,
  finalExitCode: receipt.exitCode,
  pinnedControlStats: pinned.stats,
  originalFailuresNowPassed: failures.length,
  failures,
  units: {
    passed: units.numPassedTests,
    failed: units.numFailedTests,
    files: units.testResults.length,
    success: units.success,
  },
  lint: 'PASS',
  typecheck: 'PASS',
  build: 'PASS',
  footwear: {
    structural: 'SHAFT_ONLY_SURFACE_PROOF',
    technical: 'NOT_ELIGIBLE',
    human: 'PENDING',
    baseFilesChanged: 0,
    newGenerations: proof.newImageGenerations,
    newScalesOrOffsets: 0,
    viewports: boots.checks.length,
    pixelChecks: boots.pixelChecks,
  },
  helmets: helmets.results,
  receiptBindings: 16,
  visualDecisionsApproved: 12,
  assetEligibleForIntegrationReview: 4,
  currentRuntimeEligible: 1,
  newRuntimeActivations: 0,
  newTechnicalPasses: 0,
  security: audit.status,
  preserved: audit.protectedChecked,
  privateHashesChecked: audit.privateHashesChecked,
  publicFilesScanned: audit.publicFilesScanned,
  localHttpSmoke: smoke.pass,
  restrictedAudio404: smoke.restrictedAudio404,
  push: false,
  deploy: false,
  remoteSupabaseChanges: false,
  realPlayerDataUsed: false,
  physicalMobileTestPerformed: false,
  liveChatAcceptancePerformed: false,
};
await writeFile(
  path.join(root, dir, 'qa-summary.json'),
  JSON.stringify(summary, null, 2),
);
const cell = (s) => String(s).replaceAll('|', '/').replaceAll('\n', ' ');
const md = `# TASK-0075 — continuação local: testes, botas e revisão humana

Estado: **BLOCKED para ativação/publicação**. A execução funcional atual passou; isso não transforma investigação parcial de causa raiz em conclusão definitiva nem libera artes sem elegibilidade. Trabalho na mesma TASK-0075 e branch feat/body-fit-final-review-0075. HEAD local ao gerar: ${head}.

## Resultado das 14 falhas

Checkpoint antigo: 144 PASS /14 FAIL /10 skips. Nova baseline, antes da correção das fixtures: 157 PASS /1 FAIL /10 skips. Final: **${final.stats.expected} PASS /${final.stats.unexpected} FAIL /${final.stats.skipped} skips**, código real de saída **${receipt.exitCode}**, sem retries ou resultados flaky. Os 10 skips são a matriz Body-Fit redundante do desktop, coberta pelos dois motores mobile; não são testes falhos removidos. Escopo: todos os casos dos sete arquivos definidos para TASK-0075, em Android/Edge, WebKit/iPhone e Chrome desktop. Não é uma afirmação de execução de todos os outros E2E históricos do repositório.

| # | Caso original | Navegador | Atual | Diagnóstico |
|---|---|---|---|---|
${failures.map((f) => `| ${f.index} | ${cell(f.file + ' — ' + f.title)} | ${f.project} | PASS | ${f.classification} |`).join('\n')}

Os traces dos dois testes de Arena mostram erros nativos de Fetch/RSC do WebKit **10–33 ms depois** do goto forçado da fixture; a nova baseline reproduziu um deles cerca de15 ms depois. A fixture aguardava somente a URL da Intro e descarregava o documento com pré-carregamentos ainda iniciando. Agora aguarda o botão da Intro e a estabilização de rede antes dessa navegação de preparação. A asserção de zero pageerror e todas as verificações de combate/fallback continuam. No caso mobile, um erro da mesma assinatura apareceu54 ms depois do goto; a preparação recebeu a mesma correção, mas a causa completa do destino incorreto após o toque não foi isolada separadamente.

**Os 11 timeouts desktop não foram reproduzidos nas suítes completas desta continuação.** Traces antigos mostram requisições de documento/scripts/imagens pendentes, sem pageerror de gameplay. O servidor direto respondeu200 nos diagnósticos. Houve ainda um timeout de carregamento do JavaScript inicial de /auth em uma reprodução pequena, antes de qualquer ação de equipamento. Não houve falha demonstrada de atributos, equipar ou persistência. Isso não prova ausência de um defeito intermitente. Sua causa exata continua **não confirmada**; não atribuir automaticamente a screenshots, clock, CORS, Supabase ou versão do navegador.

Controle Chromium153 previsto pelo Playwright: ${pinned.stats.expected} PASS /${pinned.stats.unexpected} FAIL /${pinned.stats.skipped} skips. Chrome instalado155 também passou: a versão sozinha não ficou demonstrada como causa. Uma comparação sintética de navegação WebKit imediata versus estabilizada não reproduziu o erro; os traces reais, e não esse controle negativo, sustentam o mecanismo observado. Um proxy local de diagnóstico também não reproduziu os travamentos e não foi retido como caminho de teste.

O config agora controla start/stop do build de produção e recusa reutilizar servidor existente. O runner Node grava código real, hashes dos sete testes/config e todo stdout/stderr. PowerShell redirecionando stderr retornava1 até para um processo de controle que executou process.exit(0); esse problema de launcher é separado das14 falhas originais registradas pelo Playwright. A execução interrompida para corrigir esse launcher permanece histórica e não entra no total final. Nenhum timeout foi aumentado, nenhum erro filtrado, nenhuma asserção suprimida e nenhuma proteção desativada.

## Solução estrutural das botas

Causa de composição confirmada: o HD já contém o calçado e o compositor soma outro modelo completo. Apagar o calçado cria lacunas — o experimento0059 deixava5124 pixels sem cobertura. Limitar apenas o contorno também é insuficiente: uma segunda sola ainda pode ser desenhada por dentro da original. Por isso a prova atual preserva **HD completo + biqueiras/calcanhares/solas originais**, acrescentando somente acabamento no cano, dentro de regiões próprias de cada Avatar, até y1394. Não cria base apagada, não modifica anatomia nem arquivos HD e não faz nova geração, escala ou deslocamento.

| Avatar | Diferenças fora da superfície | Diferenças em biqueiras/calcanhares/solas | Pixels alterados no cano | Resultado |
|---|---:|---:|---:|---|
${boots.pixelChecks.map((p) => `| ${p.gender} | ${p.differencesOutsideSurface} | ${p.toeAndSoleDifferences} | ${p.changedInsideSurface} | PASS estrutural |`).join('\n')}

As medições comparam screenshots reais do navegador em1024×1536 contra o HD original renderizado nas mesmas coordenadas; não são apenas uma asserção do algoritmo. A prova passou12 casos Edge/WebKit/resolução, com zoom e sem requisições remotas. **Não é arte final nem FIT_PASS**: a textura antiga recortada pode ter emendas/cortes de motivos e os contornos precisam de revisão. O contrato visual passa a ser acabamento sobre a bota existente; trocar toda a silhueta exigiria uma solução de arte/camadas própria, fora desta prova. Nenhuma máscara foi aplicada à base nem levada ao runtime. Proposta de integração futura deve exigir Avatar/hash exatos, aprovação da superfície e da arte, e fallback que mantenha o HD sem a camada se qualquer registro/asset falhar.

Galeria: http://127.0.0.1:8077/ ou footwear/index.html. Iniciar: node scripts/equipment-body-fit-final-serve.mjs --footwear. Comparar HD, sobreposição aditiva incorreta, acabamento limitado e região. Os modelos anteriores permanecem preservados e não elegíveis.

## Dois elmos para aprovação posterior

Galeria original de correções continua em http://127.0.0.1:8076/, com zoom, corpo inteiro e comparação. Nenhuma decisão nova foi presumida. As imagens abaixo são capturas de revisão, não novos assets do jogo.

${helmets.results
  .map(
    (
      h,
    ) => `### Elmo ${h.gender === 'female' ? 'feminino' : 'masculino'} — tentativa ${h.attempt}

Asset SHA-256: ${h.assetSha256}. Avatar ${h.gender}_short_moss_medium, SHA ${h.avatarSha256}. Humano PENDING, runtime false. ${h.gender === 'male' ? 'Conferir margem das sobrancelhas:105 pixels intersectam o retângulo facial conservador; a inspeção mostra os olhos livres.' : ''}

![Comparação do elmo ${h.gender}](helmets/${h.headComparison})

Corpo inteiro offline: helmets/${h.fullBodyHtml}.
`,
  )
  .join('\n')}

## Elegibilidade separada da aprovação visual

Recibo das12 decisões e os16 vínculos de ID/item/gênero/asset/source/Avatar/SHA revalidados. O recibo feminino0054 e os estados técnicos históricos não mudaram. Quatro versões originais têm FIT_PASS histórico, aprovação exata, item cadastrado e nenhum rework aberto na revisão atual, portanto estão **aptas à revisão de integração**, sem ativação automática:

${audit.eligibility
  .filter((e) => e.assetEligibleForIntegrationReview)
  .map(
    (e) =>
      `- ${e.id}: ${e.currentRuntimeActive ? 'única versão já elegível e ativa no escopo feminino exato' : 'integração/ativação ainda não preparada nem autorizada por esta verificação'}.`,
  )
  .join('\n')}

**Elegibilidade no resolvedor de produção: somente1**, a couraça feminina anterior. Escudos conservam aprovação visual, mas a fixação segue como achado técnico; versões experimentais de escudos não foram aprovadas. Armaduras/espadas raras sem item continuam arquivadas. Medalhões sem FIT_PASS não foram promovidos. Elmos novos e botas da prova continuam não elegíveis. Detalhes dos16 em security-and-eligibility.json. Aprovação visual não foi usada para criar novo FIT_PASS.

## Gates, preservação e segurança

| Verificação | Resultado | Evidência |
|---|---|---|
| Unitários | ${units.numPassedTests} PASS /${units.numFailedTests} FAIL em ${units.testResults.length} arquivos | unit-tests.json |
| Lint / typecheck / build | PASS | lint-final-recheck.log /typecheck-final.log /build.log |
| E2E completo definido para TASK75 | ${final.stats.expected} PASS /0 FAIL /${final.stats.skipped} skips | continuation-final-verified-receipt.json e relatório JSON na pasta anterior |
| RCA das14 falhas | PARCIAL; limite acima preservado | old-trace-summary.json /traces locais históricos |
| Recibo visual | PASS:12 decisões/16 vínculos | security-and-eligibility.json |
| Prova das botas | PASS estrutural; arte/ativação BLOCKED | footwear/proof.json e inspection.json |
| Preservação | ${audit.protectedChecked} arquivos idênticos | security-and-eligibility.json |
| Público/build | ${audit.publicFilesScanned} arquivos /${audit.publicScriptsScanned} JS /${audit.privateHashesChecked} hashes privados; zero achados | security-and-eligibility.json |
| HTTP local | ${smoke.publicRouteChecks} rotas200, ${smoke.restrictedAudio404} áudios404, ${smoke.restrictedSource404} fontes404, ${smoke.dev404} DEV404, ${smoke.privateChecks.length} caminhos privados404 | local-smoke.json |
| Chat real / POCO físico | NÃO executados nesta continuação | Não inferir aceite; somente código/fixtures anteriores preservados |
| Push / deploy / banco remoto | Nenhum | Branch local; sem Vercel/Supabase/configurações remotas alterados |

Nenhum source PNG, Avatar HD, save, economia, câmera/swipe0066, autenticação, chat, dependência ou lockfile do projeto foi alterado. Chromium de controle foi baixado somente no cache de navegadores do Playwright. Segredos, .env, traces/HAR e dados de jogadores não entram no pacote de revisão. QA/Security pelo agente principal; não é revisão independente.

## Pendências e publicação

Permanecem: aprovação humana posterior dos dois elmos exatos, arte/acabamento tecnicamente validado para a estratégia das botas, achados técnicos dos demais itens não elegíveis e a investigação incompleta dos timeouts intermitentes. Nenhum push ou deploy enquanto os gates exigidos pelo usuário estiverem pendentes. A execução funcional atual PASS não encerra esses outros gates. TASK-0075 permanece BLOCKED, sem criar outra tarefa e sem declarar DONE.
`;
await writeFile(path.join(root, dir, 'RELATORIO.md'), md);
const escape = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
await writeFile(
  path.join(root, dir, 'RELATORIO.html'),
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src 'self' file: data:;style-src 'unsafe-inline';base-uri 'none';connect-src 'none'"><title>TASK-0075 — continuação</title><style>body{margin:24px auto;padding:0 16px;max-width:1100px;background:#102e23;color:#fff0c9;font:16px/1.6 system-ui;overflow-wrap:anywhere}img{width:100%;height:auto}pre{white-space:pre-wrap;font:inherit}a{color:#f1ce7e}</style><h1>TASK-0075 — evidências da continuação</h1><p><a href="footwear/index.html">Comparação estrutural das botas</a> · <a href="helmets/female.html">Elmo feminino completo</a> · <a href="helmets/male.html">Elmo masculino completo</a></p><img alt="Elmo feminino antes/depois, decisão pendente" src="helmets/female-comparison.png"><img alt="Elmo masculino antes/depois, decisão pendente" src="helmets/male-comparison.png"><pre>${escape(md)}</pre></html>`,
);
console.log(
  JSON.stringify({
    status: summary.status,
    finalSuite: summary.finalStats,
    exitCode: receipt.exitCode,
    originalFailuresNowPassed: 14,
    rootCause: 'PARTIAL',
    newActivations: 0,
  }),
);
