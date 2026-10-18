# TASK-CLOUD-001 — Migração segura para GitHub
ID: TASK-CLOUD-001
TITLE: Consolidar fontes aprovadas para desenvolvimento Cloud
OBJECTIVE: Branch cloud/rpg-jovem-cristao-migration disponível com histórico e fontes0076/A/B/C/D/E, sem dados privados ou perda local.
PRIORITY: P1 High
STATUS: DONE
SCOPE: inventário Git seletivo, scan de segurança, documentação de uso isolado, fechamento0076E, testes unitários essenciais/lint/types; commit organizado e push somente branch Cloud; confirmar refs e integridade de arquivos remotos.
OUT_OF_SCOPE: runtime novo, balanceamento, SQL aplicado, Supabase/dados reais, main/Production, merge/rebase/forcepush, segredos, configuração de contas Cloud/Vercel.
DEPENDENCIES: 40e843c e ancestrais aprovados; fechamento local0076E preservado.
ASSIGNED_AGENT: autor DevOps/QA/Security, autorrevisão sem subagentes.
REQUIRED_CONTEXT: CURRENT_STATE, workflow/rules/security, manifestos Git, relatórios0076A/D/E e package.json.
SECURITY_CONSIDERATIONS: não enviar .env, tokens, backups, caches/node_modules/builds privados; exemplos vazios; allowlist do novo commit; revisar arquivos herdados e histórico exclusivo das branches de Preview. SQL é somente código, nunca execução.
ACCEPTANCE_CRITERIA:
- Branch Cloud descendente de40e843c, preserva fontes/assets/tests/SQL e histórico.
- Arquivos necessários versionados, nenhum segredo detectado; exclusões justificadas e dados locais preservados.
- Unitários essenciais/lint/typecheck PASS; build/E2E reutilizados somente com identidade runtime comprovada.
- Push apenas branch autorizada, refs remotas e arquivos conferidos; main/Production intactos.
TEST_PLAN: manifestos/hash e clone Git descartável sem checkout por defeito; scanner sem imprimir valores; unitários focados, lint/types; build anterior reutilizado se nenhuma fonte runtime mudar. Leitura Vercel para comparar deployment/aliases/proteção antes/depois; nenhuma publicação manual.
DEFINITION_OF_DONE: GITHUB_MIGRATION_READY apenas após verificação remota; fechamento posterior local documentado.

## Origem e ownership
Branch Cloud inexistente em refs locais e consulta remota inicial. Criada de preview/task-0076e-integrated-arena em40e843c1cf7defb661294bac0b646b09d8c4bf81, sem partir de main. Duas commits de runtime aprovados já remotos (3616f49 e40e843c); somente consolidação documental adicional necessária. Orquestrador assume DevOps/QA/Security e autoriza scripts de evidência em build ignorado e docs/memória/contratos dentro do pedido. Nenhum arquivo do usuário será descartado.

## Aceite — 2026-10-17

GITHUB_MIGRATION_READY. Primeiro push7ee918f verificado por clone independente GitHub:2572 arquivos/caminhos/modos/hashes iguais e14 blobs críticos recuperados. Histórico40e843c preservado; somente documentação nova. 32unit/lint/typecheck PASS, build/E2E0076E reutilizados com746 arquivos runtime/config/testes idênticos. Scanner direcionado sem achados, exemplos vazios; SQL0009/0010 completos, sem execução. QA/Security por autorrevisão; não independente. Main/Production/aliases/proteção e branch Preview iguais ao baseline; zero Supabase/dados reais/deploy manual. Fechamento documental em segundo commit na mesma branch, seguido de conferência final do SHA/árvore/ref. Nenhum código importante local identificado: cópias SQL duplicadas e artefatos privados ficam locais intencionalmente. Relatório docs/architecture/TASK-CLOUD-001-GITHUB-MIGRATION.md; guia CODEX-CLOUD-WORKSPACE.md; prova final build/task-cloud-001/acceptance.json. Conta/ambiente Cloud, QA Linux/POCO e implantação econômica0076A continuam fora do aceite.
