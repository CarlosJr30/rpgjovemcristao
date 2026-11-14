# COMMUNITY-043B-IMPL-1 — criação controlada

STATUS: VALIDATING
OBJECTIVE: preparar criação de Guilda própria por conta elegível em branch isolada.
SCOPE: autoridade local, cliente/formulário reutilizado, quotas preparadas, testes isolados, PR Draft e CI.
OUT_OF_SCOPE: merges, migrations remotas, Preview, PROD, diretório, contato ou economia.
DEPENDENCIES: PR53 para migrations remotas; contratos B1/B2 no SHA95e6196; retenção jurídica para rollout.
ASSIGNED_AGENT: autor, perfis Database/Frontend/Security; revisão sem independência.
SECURITY_CONSIDERATIONS: ownership/sessão revalidados, trava compartilhada de governança, atomicidade, idempotência por conta, default fechado/TEST, grants mínimos.
ACCEPTANCE_CRITERIA: conta elegível cria uma única Guilda/líder/auditoria; nenhum privilégio global ou recurso econômico; legado preservado; não publicar.
TEST_PLAN: 35 cenários PostgreSQL isolados PASS e 14 unitários direcionados anteriores preservados. Esta revisão adiciona 9 checks PostgreSQL ao harness existente: quota agregada, janela móvel, cancelamento/rejeição, cooldown, replay, concorrência, revalidação de elegibilidade, revogação de link e negação de colíder sem delegação. `node --check`/`git diff --check` PASS. PostgreSQL local indisponível neste worktree (sem pacote `pg` ou binário preinstalado); não instalar dependências. CI exato do novo SHA deve confirmar SQL, testes, lint, TypeScript e build.
DEFINITION_OF_DONE: aplicar semânticas aprovadas nos pedidos, preservar quotas/links anteriores, atualizar PR55 Draft e obter CI exato. Não executar merge, migration remota, Preview ou PROD. PR53/#54 seguem dependências; retenção jurídica bloqueia rollout; poderes de colíder ficam negados até haver lista explícita de operações delegáveis.

Estado/evidências e limitações: [relatório](../../docs/architecture/RPG-COMMUNITY-043B-IMPL-1-REPORT.md).

## 14/11/2026 — fechamento local das quotas

Adicionada migration local/teste com enforcement privado dos pedidos (5/conta/24h, cooldown 24h/avatar-Guilda, replay pendente sem consumo e revalidação no aceite). Harness estendido com nove verificações novas; execução local do PostgreSQL indisponível sem `pg`/binário instalado. Não instalar. Reportar somente após CI do SHA final. PR55 continua Draft; #53/#54 permanecem dependências; zero migration remota, Preview, merge ou PROD.
## 14/11/2026 — quota audit checkpoint

PR #55 remains Draft. CI success for push `43533144941` and PR `43533138363` on SHA `bd8703173b8aa9bf00c2b7cc9e7eb9cef16ab19a`; tests/lint/types/build, PostgreSQL and RSC/mobile pass; conditional Preview skipped. The 35 previously approved isolated PostgreSQL cases were reused. The new focused regression for request approval at 50 members passed in CI; local execution was blocked before startup because this worktree lacks `pg` and the execution policy rejected a temporary dependency junction.

Audit: current link invite RPC has the 10-active limit, seven-day new-link expiry and versioned 50-use successful-membership cap; historical links remain unchanged with legacy cap. Five active memberships/avatar and 50 active members/Guild are protected by the shared private trigger, including approval insert; one pending request/avatar/Guild already uses partial uniqueness. No recipient-specific Guild invite or Guild rename RPC exists. Five requests/account/day and 24-hour rejection cooldown remain proposals pending explicit semantics confirmation. Lifetime marker retention after Auth deletion/recovery remains a legal/policy blocker. PR53/54 still open; no remote DDL, Preview, merge, or deploy.

Quota audit and CI checkpoint are recorded in the report. Do not mark IMPLEMENTED_LOCAL complete or proceed to TEST until the documented product/legal decisions are resolved.
