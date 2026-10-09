# TASK-0030 → Painel do Líder V2
ID: TASK-0030
TITLE: Redesign, aulas e agenda da Guilda
OBJECTIVE: Entregar o Painel do Líder como uma central limpa e mobile, com missões, aprovações, aulas e agenda persistidas com autorização da Guilda.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Painel autenticado, experiência de aulas do membro, repositórios da Guilda, schema e migration 0005, testes e documentação específicos.
OUT_OF_SCOPE: Auth, Travelers, economia de Baús, loot, Arena, Fuga, Avatar, equipamentos, desbloqueio da Jornada e aplicação da migration no Supabase real.
DEPENDENCIES: Migrações 0000–0004 aplicadas, conforme informado pelo usuário. Aceite remoto de 0005 depende da aplicação manual posterior.
ASSIGNED_AGENT: Orquestrador, assumindo perfis Frontend, Database, QA e Security localmente.
REQUIRED_CONTEXT: Pedido anexo Painel do Líder V2; TASK-0016; `online-guild-hub.tsx`; repositórios e migrations 0001–0004.
SECURITY_CONSIDERATIONS: RLS por Guilda, escrita apenas por líder verificado no banco, campos de aula sem dados devocionais privados, URLs validadas, rewards derivados do catálogo, nenhuma migration aplicada automaticamente.
ACCEPTANCE_CRITERIA:
- Home responde atenção, esta semana e próxima ação com resumo compacto e até cinco eventos recentes.
- Navegação compacta inclui conteúdo, aprovações, membros, agenda e histórico sem sete abas apertadas no mobile.
- Missões têm filtro, card enxuto, detalhe com ações, criação em etapas e modelos sem alterar regras econômicas.
- Aprovações funcionam como fila com detalhe, recompensa explícita e avanço; membros e pedidos ficam separados.
- Líder cria, edita e publica aulas; membros da Guilda leem apenas aulas publicadas; outra Guilda não tem acesso.
- Agenda deriva datas de missões e aulas; histórico mantém páginas de 20 com filtros.
- Layout e ações têm foco visível, contraste, labels, touch targets e funcionam nos cinco viewports pedidos.
TEST_PLAN:
- Testes unitários de domínio e repositórios, integração de componentes para fluxos críticos, lint/typecheck/build, E2E responsivo nos cinco viewports, revisão SQL/RLS e diff.
DEFINITION_OF_DONE:
- Critérios comprovados localmente; migration e rollback entregues sem aplicação real; limitações de aceite remoto documentadas; memória atualizada.

## Estado inicial

- O repositório já contém trabalho local não commitado da TASK-0015/0016 e outras tarefas. Preservar essas alterações.
- O Painel V1 reúne métricas repetidas, cinco abas, filtros e ações diretas nos cards; a Home exibe contadores grandes e histórico, mas não prioriza pendências nem agenda.
- `guild_missions` já contém `starts_at`/`due_at`; `guild_activity_log` pagina 20 por consulta. Aulas novas requerem persistência e RLS próprias.

## Entrega local 2026-09-30

- Painel V2 implementado com Home compacta, navegação responsiva, Conteúdo, Aprovações, Membros, Agenda e Histórico. Missões têm filtros, detalhes, modelos e criação em etapas; aulas têm criação em etapas, edição de rascunho, publicação, leitura do membro e alteração de status.
- Migration incremental 0005 e rollback entregues. RLS restringe rascunhos ao líder e aulas publicadas aos membros ativos; escritas e perfil público usam RPCs com verificação de ownership e Guilda. A agenda deriva de missões e aulas.
- Revisão de segurança: `docs/security/GUILD-LEADER-V2-REVIEW.md`. Operação e roteiro remoto: `docs/architecture/GUILD-LEADER-V2.md`.
- QA local: 36 arquivos / 192 testes PASS; typecheck PASS; lint PASS; build PASS; `git diff --check` PASS. A inspeção visual E2E nas cinco larguras e a prova RLS de duas contas dependem do ambiente remoto autenticado após 0005.
- Estado: BLOCKED para aceite integral remoto. Não aplicar 0005 automaticamente. Após aplicação manual, executar o roteiro de duas contas e a validação visual nas cinco larguras; então atualizar o status para DONE se comprovado.
