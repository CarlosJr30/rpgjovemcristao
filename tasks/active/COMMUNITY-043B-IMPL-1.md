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
