# TASK-0034 → Equipment Body-fit V2

ID: TASK-0034
TITLE: Preparar overlays corporais full-canvas após reprovação visual V1
OBJECTIVE: Preservar V1 e preparar código/contrato V2, sem produzir arte.
PRIORITY: P1 High
STATUS: DONE (preparação técnica; arte/aprovação humana futuras)
SCOPE: Autorização explícita do usuário em 2026-10-02, continuação do escopo Avatar/equipamentos da TASK-0031: resolver, composição, configuração corporal, animação de equipar, testes pertinentes, documentação e memória. Registrar rejeição V1 e aprovação visual humana obrigatória por corpo antes de READY.
OUT_OF_SCOPE: Produção/edição de arte; Supabase, Auth, Guilda, Jornada como mecânica, Arena, Baús, economia, stats, Fuga, instalação e serviços externos.
DEPENDENCIES: TASK-0033 (entrega técnica histórica; visual V1 reprovado pelo usuário).
ASSIGNED_AGENT: Perfil frontend exercido pelo autor local, sem subagentes.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, frontend/coding/testing, resolver e renderer de equipamentos.
SECURITY_CONSIDERATIONS: Fontes locais validadas; sem credenciais, dependências ou infraestrutura. QA e revisão pelo autor, sem alegar independência.
ACCEPTANCE_CRITERIA:

- Oito entradas V1 deixam READY corporal; 14 PNGs e ícones preservados.
- Suporte explícito full-canvas, PNG transparente 1024×1536 sobre canvas lógico 512×768; inset 0, 100%, sem calibração x/y/scale.
- Compatibilidade cropped/anchors, camadas centralizadas e fallback seguro preservados.
- Aprovação humana por corpo obrigatória no resolver; ausência de variante/configuração mantém equipabilidade e atributos.
- V2 usa efeito de chegada, sem voo de canvas vazio; quatro protótipos femininos apenas especificados.
- Documento V2, testes pertinentes, lint/typecheck/build, memória e preservação com evidências.
  TEST_PLAN:
- Resolver legado/V2, aprovação, corpo ausente, configuração inválida, UI e atributos.
- Renderer full-canvas e animação com fixtures sintéticas; E2E real verifica fallback V1 nos dois corpos/viewports/DPRs.
- Unit, lint, typecheck, build e E2E; hashes preexistentes e PNGs.
  DEFINITION_OF_DONE: Preparação técnica aceita pelos checks; produção e aprovação humana dos protótipos são etapa futura. Nenhum V2 real READY nesta tarefa.


## Evidências finais — 2026-10-02

Reenvio do mesmo anexo conferido: sem novo escopo. Corrigida a codificação dos trechos documentais desta entrega e identificado o estado anterior como histórico. Revisão estrutural documental pelo autor; nenhum runtime/asset alterado nesse ajuste e nenhuma suíte reexecutada. Resultados abaixo pertencem à implementação já validada.

- SELF VALIDATE / QA pelo autor: resolver e renderer inspecionados; contrato por corpo validado, sem afirmação de revisão independente. V1 passa de READY para NEEDS_NEW_OVERLAY em todos os oito IDs; modos legados e calibrações mantidos, 14 arquivos físicos preservados. Inspecionadas capturas reais female/male 390px DPR3 com composição rejeitada ausente.
- UNIT / INTEGRATION: PASS — `npm test`, 38 arquivos / 224 testes. Cobertura de gate humano por corpo, full-canvas sem anchors/transformações, tamanho declarado inválido, variantes ausentes, botas combinadas, conjuntos incompletos, UI, stats e modo cropped/voo legado. Fixtures aprovadas são exclusivamente sintéticas, sem aprovação de PNG real.
- E2E: PASS — `npm run test:e2e -- tests/e2e/hero-overlays.spec.ts tests/e2e/equipment-v1-hd.spec.ts tests/e2e/avatar-hd.spec.ts tests/e2e/equipment-v1-calibration.spec.ts`: 6 PASS / 6 skips intencionais. Quatro prévias V1 desativadas por reprovação humana; duas duplicações mobile omitidas porque testes DPR criam contextos próprios. Fallback em 120 combinações corpo/variante/tela/viewport/DPR, nenhum request corporal V1; auditoria base mantém 60 medidas. Equipar, trocar, desequipar, recarregar, bônus, UI e nó base preservados nos dois corpos/desktop/mobile.
- Evidência local ignorada pelo Git: `test-results/equipment-v1-hd-Rejected-V-0b9dc-five-viewports-and-DPR1-2-3-desktop/v1-rejected-body-fallback-audit.json`; capturas no mesmo diretório e hero-overlays. Não são aceite visual V2.
- LINT: PASS — `npm run lint` final, sem warnings.
- TYPECHECK: PASS — `npm run typecheck` final, todos os workspaces e raiz.
- BUILD: PASS — `npm run build`, compilação e 20 páginas. Spawn EPERM bloqueou inócio do Vitest e worker TypeScript do build no sandbox; execuções autorizadas fora do sandbox passaram. Nenhuma dependência instalada.
- SECURITY: revisão local pelo autor PASS para fontes/configuração do escopo. Sem auth, dados pessoais, entrada remota, credenciais, dependências, serviços ou permissões alteradas; gate humano é editorial. NO SECRETS PASS no conteúdo adicionado. Revisão especializada independente N/A, não exigida por esse contrato.
- PRESERVAÇÃO: baseline de 115 arquivos preexistentes modificado somente em 16 arquivos autorizados (runtime/testes/documentação/memória). 99 hashes externos às edições inalterados, incluindo todos os 14 PNGs V1; next-env restaurado ao SHA256 original apàs typegen/build. Sem reset/checkout/clean/commit, sem alteração nas áreas excluídas.
- DOCUMENTATION / ACCEPTANCE / NO KNOWN CRITICAL REGRESSIONS: PASS para preparar arquitetura, retirar READY reprovado e especificar protótipos. Documentos V1/TASK-0033 mantidos como históricos com aviso de reprovação; memória atualizada.
- Limitação explícita: não há quatro fontes V2 reais; dimensões/alpha/encaixe fàsico V2 e avaliação humana são futuros. A conferência do resolver usa metadados de dimensão; integração futura exige verificar arquivo presente, alpha/dimensões reais, desenho sobre a base e aceite visual humano por corpo. Sem esse aceite, manter fallback e nunca READY.
