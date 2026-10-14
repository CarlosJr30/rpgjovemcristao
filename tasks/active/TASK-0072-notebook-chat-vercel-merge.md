# TASK-0072 — Conciliar notebook, chat local e Vercel
ID: TASK-0072
TITLE: Conciliar notebook, chat local e Vercel
OBJECTIVE: Integrar os commits publicados pelo notebook ao trabalho local da TASK-0071 e alinhar o código/resultados ao projeto Vercel correto.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: Auditoria Git/GitHub/Vercel; backup do trabalho local; merge preservando alterações de ambos os ambientes; correções específicas de integração; testes/build; documentação/memória. Pedido de 2026-10-14 autoriza conciliação. Publicação só com destino/commit verificados e dentro da autorização aplicável; nenhum force push.
OUT_OF_SCOPE: Apagar dados, descartar alterações, reescrever histórico, desabilitar segurança, promover assets aguardando aceite, implementar novos sistemas do roadmap ou alterar Supabase fora de conflitos diretamente relacionados e explicitamente autorizados.
DEPENDENCIES: TASK-0071 (chat entregue tecnicamente, aceite real pendente); commits do notebook e projeto Vercel existente.
ASSIGNED_AGENT: Orquestrador assumindo DEVOPS/QA/SECURITY localmente; sem subagentes ou revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE; WORKFLOW/ORCHESTRATOR/TOKEN_POLICY/RULES/SECURITY; perfil DEVOPS; skills deployments-cicd/vercel-cli; diffs pertinentes.
SECURITY_CONSIDERATIONS: Backup antes do merge; secrets fora do Git/logs; menor privilégio; verificar repo/team/project/commit/ambiente antes de publicação; preservar RLS, Auth e gates humanos.
ACCEPTANCE_CRITERIA:
- Alterações do notebook e do chat preservadas em árvore integrada, com conflitos resolvidos e rastreáveis.
- Lint/typecheck/test/build e checks pertinentes aprovados; nenhum segredo versionado.
- Origem do deploy Vercel identificada; resultado da conciliação e publicação/pendências registrado sem inventar PASS.
- TASK-0071 mantém seus gates reais ainda não comprovados.
TEST_PLAN:
- Comparar base/branches/arquivos, hashes do backup e merge diff; revisar conflitos semânticos.
- Checks da stack e regressão pertinente; conferir deployment e commit quando houver publicação autorizada.
DEFINITION_OF_DONE:
- Aceite demonstrado, memória/relatório atualizados; bloqueios externos explicitamente registrados.
