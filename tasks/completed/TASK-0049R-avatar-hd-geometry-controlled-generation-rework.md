# TASK-0049R — Avatar HD Geometry-Controlled Generation Rework

ID: TASK-0049R
STATUS: DONE
PRIORITY: P2 Normal
OBJECTIVE: Validar novo método estrutural de geração nativa somente para male_curly_blue_light, sem alterar geometria após geração.
SCOPE: análise de prompts/receipts da TASK-0048 e TASK-0049; guia estrutural QA 2×; máximo quatro novas tentativas do único asset; PNG/alpha/geometria/evidências/review DEV; documentação/memória e validadores pertinentes.
OUT_OF_SCOPE: outros51, alterações em PNG final para passar, alpha transplantado, runtime/renderer/anchors/IDs/saves/Body-Fit/jogo normal/produção, pilotos/mídias legadas, push/deploy/serviços remotos/instalação.
DEPENDENCIES: TASK-0048 PILOT_COMPLETE; TASK-0049 BLOCKED_PATTERN
ASSIGNED_AGENT: principal assume Frontend/QA; revisão pelo autor, não independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE; WORKFLOW/RULES/SECURITY; prompts e métricas das duas tasks; imagegen skill; auditor Geometry Lock.
SECURITY_CONSIDERATIONS: imagens locais e review DEV, sem secrets/auth/serviços de dados reais; nenhum PNG público novo nem mudança de gate.
ACCEPTANCE_CRITERIA:
- Documentar ROOT_CAUSE_HYPOTHESIS e PILOT_RECIPE_ANALYSIS antes de gerar.
- Legado individual primário e guia2× apenas controle/QA; pilotos apenas acabamento, sem copiar sua geometria/combinação.
- PNG nativo1024×1536, alpha real; bytes gerados preservados sem transformação.
- Todas13métricas alpha≥128 do auditor existente PASS; alpha>0 diagnóstico. Mesmas tolerâncias, incluindo centroides.
- Máximo4tentativas novas. Parar no primeiro PASS; duas falhas novas praticamente idênticas → BLOCKED_PATTERN_V2; sem PASS → BLOCKED_GEOMETRY_GENERATION.
- Após PASS: GEOMETRY_METHOD_VALIDATED e VISUAL_REVIEW_PENDING até revisão de Carlos. A confirmação humana explícita recebida nesta conclusão autoriza registrar HUMAN_VISUAL_APPROVED, sem escalar o lote.
TEST_PLAN: validators geometry/asset; lab DEV/review local; lint/types somente código afetado; hashes antes/depois das163mídias+2pilotos+fontes runtime/saves/anchors; sem suites globais.
DEFINITION_OF_DONE: método geométrico comprovado e evidências aguardando revisão humana ou blocker técnico demonstrado; nunca pack completo/produção aprovada nesta fase.

## Execução

- Solicitação vigente substitui o método bloqueado para somente este item, com até quatro tentativas.
- Evidências: build/task-0049r-evidence. Análises: docs/architecture/task-0049r.

## SELF VALIDATE / QA / ACCEPTANCE

- GEOMETRY_METHOD_VALIDATED em duas novas tentativas; tentativa2GEOMETRY_PASS13/13. Tentativa1REJECTED_GEOMETRY2falhas. Geração encerrada noPASS.
- HUMAN_VISUAL_APPROVED por Carlos Faustino, após confirmação explícita de identidade visual, cabelo, pose, silhueta, proporções, linha dos pés, enquadramento e aparência geral em relação ao legado. Candidato permanece somente na evidência local.
- Geometry unit5PASS; asset2PASS; labDEVreview6viewportsPASS; ESLintPASS. Typecheck/buildN/A: nenhum TS/runtime alterado; somenteJSQA e documentos.
- Preservação452baselinePASS:163mídias+2pilotos; renderer/anchors/IDs/saves intactos. QA peloautor; SecurityN/A sem novo gatilho.
- Aceite geométrico PASS; aceite humano PASS. Método aprovado como referência visual para futura retomada da TASK-0049. Relatório: docs/architecture/TASK-0049R-GEOMETRY-CONTROLLED-GENERATION-REPORT.md.
- Registro humano: docs/architecture/task-0049r/HUMAN-VISUAL-APPROVAL.json, com Carlos Faustino, timestamp real do registro e hash do candidato aprovado.
- Esta confirmação altera apenas documentação e metadados de revisão. QA: revisão estrutural e consistência dos registros pelo autor; sem revisão independente. Testes de runtime, lint, typecheck e build N/A nesta confirmação, pois nenhum código foi alterado. Resultados da geração permanecem como evidências históricas.
- TASK-0049R DONE no escopo do método e candidato. TASK-0049 continua incompleta, aguardando instrução explícita para retomada dos 51 restantes. Sem alterações Body-Fit, ativação HD em produção, push ou deploy.
