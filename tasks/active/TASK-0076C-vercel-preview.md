# TASK-0076C — Vercel Preview isolada da Arena
ID: TASK-0076C
TITLE: Demonstração HTTPS para POCO X7
OBJECTIVE: Publicar Preview READY verificável com combate fictício em memória e sem recompensas ou banco.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: rota demo, componentes de apresentação compartilhados, isolamento Preview em Providers/proxy/config, testes direcionados e documentação; branch/commit/push exclusivamente Preview e implantação Vercel Preview.
OUT_OF_SCOPE: Production/domínios, SQL/RLS/migrations remotas, credenciais, contas reais, economia/progressão, auditoria completa e suíte E2E inteira.
DEPENDENCIES: 0076/0076A/0076B preservadas; bloqueio remoto de economia não impede demo sem banco.
ASSIGNED_AGENT: autor nos perfis Frontend/DevOps/QA/Security; sem subagentes, autorrevisão identificada.
REQUIRED_CONTEXT: Arena/Providers/build, estado Git, metadados Vercel e relatório 0076B.
SECURITY_CONSIDERATIONS: Preview sem AuthProvider, rede restrita, APIs inacessíveis, estado só em memória; nenhuma credencial nova/configurada/exposta.
ACCEPTANCE_CRITERIA:
- Branch/commit separados de main, Preview HTTPS READY comprovada, Production e domínio intactos.
- Toque, cinco cartas, personagens completos, HP, energia, animações, rotação e diálogos de vitória/derrota funcionais.
- Nenhuma escrita em storage, conta/economia/API/banco; reload perde sessão fictícia.
TEST_PLAN: build/lint/types/testes direcionados de isolamento e fluxo; reusar provas 0076B sem mudanças; verificar deployment e rota HTTPS.
DEFINITION_OF_DONE: evidências locais/remotas e memória atualizadas; READY apenas com URL funcionando. Falta de acesso ou isolamento => BLOCKED, sem publicação insegura.

## Autorização e ownership
Pedido atual autoriza branch/commit e publicação somente Preview, superando proibições anteriores dessas ações para esta TASK. Orquestrador assume os perfis acima e estende ownership à apresentação compartilhada, controles fail-closed de Preview, testes/config e documentação. CLI Vercel efêmera via cache npm autorizada como ferramenta necessária se MCP falhar; nenhuma dependência de aplicação nova. Não fazer login automático nem manipular credenciais. Não alterar ambiente Production.

## Gates pré-publicação
Build/lint/typecheck PASS; cinco unitários de isolamento e doze E2E dirigidos PASS. Security/QA autorrevistos: sem portas econômicas na demo, proxy/CSP bloqueiam persistência/rede, Providers fora da árvore cliente demo, sem novos segredos. Ver docs/architecture/TASK-0076C-VERCEL-PREVIEW.md. Publicação remota ainda PENDING; não declarar READY.
