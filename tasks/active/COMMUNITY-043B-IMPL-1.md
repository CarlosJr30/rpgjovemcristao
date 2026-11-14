# COMMUNITY-043B-IMPL-1 — criação controlada

STATUS: VALIDATING
OBJECTIVE: preparar criação de Guilda própria por conta elegível em branch isolada.
SCOPE: autoridade local, cliente/formulário reutilizado, quotas preparadas, testes isolados, PR Draft e CI.
OUT_OF_SCOPE: merges, migrations remotas, Preview, PROD, diretório, contato ou economia.
DEPENDENCIES: PR53 para migrations remotas; contratos B1/B2 no SHA95e6196; retenção jurídica para rollout.
ASSIGNED_AGENT: autor, perfis Database/Frontend/Security; revisão sem independência.
SECURITY_CONSIDERATIONS: ownership/sessão revalidados, trava compartilhada de governança, atomicidade, idempotência por conta, default fechado/TEST, grants mínimos.
ACCEPTANCE_CRITERIA: conta elegível cria uma única Guilda/líder/auditoria; nenhum privilégio global ou recurso econômico; legado preservado; não publicar.
TEST_PLAN: 35 cenários PostgreSQL isolados PASS (25 anteriores + 10 de quotas, compatibilidade, ACL e concorrência); 14 unitários direcionados anteriores preservados; ESLint/Prettier afetados PASS; TypeScript completo PASS com aliases temporários para os workspaces deste checkout, depois restaurados. Build local tentado, Turbopack bloqueado antes da compilação pelo node_modules junction externo; novo CI deve confirmar o build. CI 43515907322 pertence ao candidato 740315a e não valida o novo SHA.
DEFINITION_OF_DONE: quotas inequívocas cobertas; atualizar PR55 Draft e obter CI exato. Não executar merge, migration remota, Preview ou PROD. PR53 continua dependência para migrações remotas; retenção jurídica e semânticas de solicitação ainda pendentes.

Estado/evidências e limitações: [relatório](../../docs/architecture/RPG-COMMUNITY-043B-IMPL-1-REPORT.md).
## 14/11/2026 — quota audit checkpoint

PR #55 remains Draft. Reconfirmed CI success for push `43531289827` and PR `43531296844` on SHA `28b3435685fa2bfb98fc787060fb8fd6b758683b`. The 35 previously approved isolated PostgreSQL cases are reused. Added a focused regression for request approval at 50 members; local execution was blocked before startup because this worktree lacks `pg` and the execution policy rejected a temporary dependency junction. Run that new case through the next exact-SHA CI.

Audit: current link invite RPC has the 10-active limit, seven-day new-link expiry and versioned 50-use successful-membership cap; historical links remain unchanged with legacy cap. Five active memberships/avatar and 50 active members/Guild are protected by the shared private trigger, including approval insert; one pending request/avatar/Guild already uses partial uniqueness. No recipient-specific Guild invite or Guild rename RPC exists. Five requests/account/day and 24-hour rejection cooldown remain proposals pending explicit semantics confirmation. Lifetime marker retention after Auth deletion/recovery remains a legal/policy blocker. PR53/54 still open; no remote DDL, Preview, merge, or deploy.

New test/report work is pending commit, push, and exact-SHA CI. Do not mark IMPLEMENTED_LOCAL complete or proceed to TEST until CI and the documented product/legal decisions are resolved.
