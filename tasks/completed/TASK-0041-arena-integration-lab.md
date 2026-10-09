# TASK-0041 → Arena Integration Lab & Polish Prep
ID: TASK-0041
TITLE: Arena Integration Lab & Polish Prep
OBJECTIVE: Preparar composição, FX e inspeção local antes da chegada das seis artes reais.
PRIORITY: P2 Normal
STATUS: DONE
SCOPE: Apresentação Arena em apps/web, servidor DEV isolado com Vite já instalado e leitura local do auditor existente, tokens, fixtures, CSS/SVG, testes colocalizados e tests/e2e, scripts/arena-lab.mjs, declaração de tipos do auditor, tools/arena-lab/index.html, configuração dirigida Playwright/tsconfig, docs/architecture, docs/security, contrato e memória; evidências em build. Extensão explícita dos perfis Frontend/QA/Security para esses caminhos, dentro do pedido autorizado pelo usuário em 2026-10-05.
OUT_OF_SCOPE: Motor/fórmulas/balanceamento/IA/níveis/custos/equipamentos/progressão/rewards/persistência/Auth/Supabase/Guilda/Fuga/Jornada; mídia nova/remota/downloads; escrever approvals/receipts/catálogos; push/deploy/Git destrutivo.
DEPENDENCIES: TASK-0040 DONE; TASK-0039 BLOCKED por mídia, sem impedir preparação independente.
ASSIGNED_AGENT: Autor assume Frontend, QA e Security localmente; sem subagentes ou revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, TOKEN_POLICY, ORCHESTRATOR; perfis/skills Frontend/QA/Security; apps/web/AGENTS.md e guias Next instalados; Arena V2 e auditor TASK-0038.
SECURITY_CONSIDERATIONS: Servidor DEV recusa NODE_ENV production, entrada fora do grafo Next e bind 127.0.0.1; endpoint somente GET sem paths fornecidos pelo cliente; sem Auth/store/settlement no Lab; aprovação exclusivamente pelo processo humano existente.
ACCEPTANCE_CRITERIA:
- Lab local seleciona quatro adversários, estados, habilidades, preview responsivo e motion; nenhuma mutação persistida.
- Composição/layers/facing/escala/grounding/timing/cinematic centralizados e usados pela Arena normal e Lab.
- FX reutilizáveis, turnos/Foco/especiais/resultados/unlock acessíveis, reduced motion e cleanup.
- Seis estados de mídia derivados do manifesto, auditor e catálogo existentes; fallback sem requests de mídia ausente.
- Matriz representativa de cinco viewports, teclado/touch/overflow/pointer/save/proteção produção validada.
- Documentação e handoff exatos da TASK-0039, que continua BLOCKED até aprovação humana/receipts das artes recebidas.
TEST_PLAN:
- Unit comportamental, E2E DEV dirigido e regressão Arena produção; lint, typecheck, build; capturas e revisão visual; hashes de preservação.
DEFINITION_OF_DONE:
- Gates aplicáveis PASS, QA/Security pelo autor registradas, critérios comprovados, memória atualizada e contrato único movido para completed.

EXECUTION:
- Baseline 192 arquivos preexistentes capturada antes do runtime, incluindo alterações não commitadas; sem reset/commit/push/deploy ou mídia nova.
- Perfil Frontend assumido localmente; QA/Security pelo autor, sem independência. Guias Next instalados lidos; escolha Vite isolado evita inicializar provider global de Auth.
- Palco/FX/unlock compartilhados com Arena normal; tokens por viewport/perfil, cancelamento/replay de fixtures, medidor/turnos/teclado/contraste e status baseado no auditor existente.
- TASK-0039 permanece BLOCKED, 6 arquivos MISSING e approvals/catálogo intactos.
- Durante a validação final os seis arquivos reais foram adicionados externamente ao workspace. Não foram criados por esta tarefa nem alterados/aprovados pelo autor. Approvals continua vazio; auditor os rejeita e catálogos continuam vazios. TASK-0039 continua BLOCKED, agora por revisão humana/proveniência/receipts. Handoff autoriza atualizar somente esse registro documental do blocker.
REWORK:
- Declaração de tipos do auditor inicialmente incompleta e efeito de fetch apontado pelo lint: corrigidos.
- HUD overlap detectado por geometria e corrigido em área segura/line-height, sem relaxar checks.
- Colisão ENOENT entre traces Playwright concorrentes: outputDir separado por suíte, execuções falhas não contadas como PASS.
- Consulta DEV do auditor pendente durante outras validações: resolução SSR antecipada, scan limitado à entrada Lab e exclusão de build/evidências do watcher; loading explícito.
- Preset mobile ligado ao alias de altura errado: corrigido, teste comportamental mede 390 px no preset.
- Capturas aguardam término real das animações, sem sleeps arbitrários; revisão visual corrigiu contraste do unlock e force NORMAL supera apenas no Lab o global reduced motion.
EVIDENCE:
- Documento/relatório 22 itens: docs/architecture/ARENA-VISUAL-INTEGRATION-LAB-V1.md.
- Security: docs/security/ARENA-VISUAL-INTEGRATION-LAB-V1-REVIEW.md.
- Capturas/matriz: build/task-0041-evidence/screenshots; outputs distintos lab-test-results/production-test-results.
- Gates finais: unit 53 arquivos/324 PASS; Lab E2E 2 PASS; Arena/produção 25 PASS/1 skip preexistente; lint/typecheck/build PASS. Matriz 55 + buffs =56 capturas. Preservação: build/task-0041-evidence/preservation.json.
- QA visual e Security pelo autor PASS no escopo; nenhum achado alto/crítico. Todos os critérios de preparação comprovados. Atualização factual do blocker TASK-0039 e memória concluídas; contrato único movido para completed.
- REWORK final: rodapé de buffs fluido e snapshot sem eventos; unit do catálogo exige exclusão de mídia REJECTED, mantendo audit CLI FAIL até receipts reais.

Preservação final comprovada: baseline 192 arquivos, 180 intactos e 12 alterações autorizadas; zero divergências inesperadas. Os seis arquivos recebidos mantêm os hashes medidos. next-env restaurado byte a byte.
