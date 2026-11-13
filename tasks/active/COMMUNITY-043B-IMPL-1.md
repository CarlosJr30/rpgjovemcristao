# COMMUNITY-043B-IMPL-1 — criação controlada

STATUS: VALIDATING
OBJECTIVE: preparar criação de Guilda própria por conta elegível em branch isolada.
SCOPE: autoridade local, cliente/formulário reutilizado, quotas preparadas, testes isolados, PR Draft e CI.
OUT_OF_SCOPE: merges, migrations remotas, Preview, PROD, diretório, contato ou economia.
DEPENDENCIES: PR53 para migrations remotas; contratos B1/B2 no SHA95e6196; retenção jurídica para rollout.
ASSIGNED_AGENT: autor, perfis Database/Frontend/Security; revisão sem independência.
SECURITY_CONSIDERATIONS: ownership/sessão revalidados, trava compartilhada de governança, atomicidade, idempotência por conta, default fechado/TEST, grants mínimos.
ACCEPTANCE_CRITERIA: conta elegível cria uma única Guilda/líder/auditoria; nenhum privilégio global ou recurso econômico; legado preservado; não publicar.
TEST_PLAN: 25 cenários PostgreSQL e 14 unitários direcionados PASS; lint/tipos/build PASS; CI do candidato final pendente. PR55 Draft.
DEFINITION_OF_DONE: cumprir quotas restantes, recuperação/migration revisadas e checks exatos antes de concluir incremento; gates remotos permanecem separados/bloqueados.

Estado/evidências e limitações: [relatório](../../docs/architecture/RPG-COMMUNITY-043B-IMPL-1-REPORT.md).
