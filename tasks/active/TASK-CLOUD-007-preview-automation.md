# TASK-CLOUD-007 — Concluir automação do preview após CI

ID: TASK-CLOUD-007
TITLE: Concluir ligação GitHub Actions → Deploy Hook Vercel
OBJECTIVE: Na branch cloud/preview-release-gate-007, falha de CI não cria deployment; sucesso publica uma única Preview depois dos testes.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: Workflows de qualidade/preview, apps/web/vercel.json, documentação e memória desta tarefa; variável RPG_PREVIEW_HOOK_ENABLED do repositório existente; push normal somente para cloud/preview-release-gate-007. Orquestrador assume DEVOPS/QA/SECURITY e amplia o perfil somente a esses caminhos, conforme o pedido vigente de continuar a automação. Permite canário temporário de teste para comprovar o bloqueio e sua remoção subsequente.
OUT_OF_SCOPE: main, merge dos PRs 2/3, produção, funcionalidades/visual/balanceamento, Supabase/migrations/dados reais, novos secrets, alteração de proteções ou outros hooks/branches. Não ler valores de secrets.
DEPENDENCIES: Hook existente Preview após testes confirmado para a branch; secret VERCEL_PREVIEW_DEPLOY_HOOK existente; CI anterior aprovado em 9f35f28.
ASSIGNED_AGENT: Orquestrador assumindo DEVOPS/QA/SECURITY; revisão pelo próprio autor, sem revisão independente.
REQUIRED_CONTEXT: TASK-CLOUD-007-RELEASE-GATE.md; TASK-CLOUD-006-PREVIEW-GATE.md; WORKFLOW/RULES/SECURITY; skill vercel:deployments-cicd.
SECURITY_CONSIDERATIONS: Bloquear push→Vercel direto apenas nesta branch; secret somente no job posterior ao CI, sem checkout/instalação; validar destino HTTPS/projeto do hook; não repetir POST automaticamente; cancelamento e rechecagem de SHA; Preview existente é demonstração memory-only, sem Providers/API persistente.
ACCEPTANCE_CRITERIA:
- Projeto/equipe/root/branch/hook confirmados sem divulgar URL secreta.
- Secret existe e variável de liberação é configurada somente após revisão local.
- Canário de falha prova job de deploy skipped e zero deployments para seu SHA.
- Commit final passa testes/lint/types/build no GitHub e gera exatamente uma Preview READY após validate.
- SHA/target/rotas/CSP/isolamento da demonstração conferidos; produção e main preservadas.
- Limites do hook por branch, reexecução e testes físicos documentados com evidências reais.
TEST_PLAN:
- Revisão YAML/JSON, ações fixadas por SHA, diff permitido/sem secrets.
- Canário temporário de falha via Vitest, seguido de remoção; acompanhar runs push e PR separadamente.
- Consultar deployments por SHA, horários/jobs/READY e smoke HTTP de demonstração sem gravar dados.
DEFINITION_OF_DONE: Critérios comprovados e relatório/memória atualizados; falha exige REWORK/BLOCKED, sem declarar sucesso da automação.

## Inspeção inicial — 2026-10-18

Origem 9f35f28b5bf25ee89042372eaf726e93dc17607b. Worktree isolado build/task-cloud-007-preview-automation/checkout, branch local codex/preview-hook-gate. Hook confirmado pelo CLI autenticado, root apps/web, productionBranch main. Secret presente; nenhuma variável Actions configurada. Run 39100060401: validate PASS, hook SKIPPED. Deployment direto anterior dpl_BNZRAfmeX4X2L6c7sV2BrXveT9ax READY confirma caminho antecipado ainda ativo. Conector Vercel403; CLI existente permite leitura. Alterações de outras tarefas na raiz preservadas.
