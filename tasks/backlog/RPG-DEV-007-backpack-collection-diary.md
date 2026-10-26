# RPG-DEV-007 — Preparar Mochila, Coleção e Diário

ID: RPG-DEV-007
TITLE: Preparar recuperação limitada de Mochila, Coleção e Diário
OBJECTIVE: Definir um contrato verificável para reutilizar as telas e os dados existentes, começando por consulta sem efeitos econômicos.
PRIORITY: P2 Normal
STATUS: BACKLOG
PREPARATION_STATUS: COMPLETE — contrato e plano preparados; implementação e publicação não iniciadas.
AUTHORIZATION: O pedido atual autoriza preparar RPG-DEV-007 em branch separada depois da revisão de RPG-DEV-006. Não autoriza implementar ou publicar estas três telas nesta etapa.
BRANCH: codex/rpg-dev-007-preparation, criada de origin/main em 1a82d2c058b40b37ae4ae79b82c085bb3488c02b, sem carregar a mutation de equipamentos da PR #12.
SCOPE: Documentação em tasks/backlog/RPG-DEV-007-backpack-collection-diary.md, docs/architecture/RPG-DEV-007-PLAN.md e atualização delimitada de .agent/memory/CURRENT_STATE.md. Inventário de fontes existentes, fronteiras, riscos, sequência e aceite futuro.
OUT_OF_SCOPE: Implementação runtime, migrations, dependências, serviços, abertura de rotas, publicação, nova arte, itens, baús, compras, recompensas, moedas/XP, atributos, escrita de progressão/Diário, reconciliação, Arena, Torre, Loja e ampliação de permissões econômicas. Não operar Teste Chat A ou outros jogadores PROD.
DEPENDENCIES: Decisão explícita sobre a entrega RPG-DEV-006 e baseline vigente antes da futura ativação. A preparação documental é independente do bloqueio de publicação da PR #12; o runtime futuro não pode presumir que ela foi integrada.
ASSIGNED_AGENT: Autor como Architect/QA/Security para esta preparação documental, sem subagentes ou independência alegada. Implementação futura deverá selecionar os perfis necessários e ativar contrato runtime autorizado.
REQUIRED_CONTEXT: .agent/GLOBAL_CONTEXT.md, CURRENT_STATE.md, WORKFLOW.md, RULES.md, SECURITY.md, RELEASE_POLICY.md; plano desta tarefa; fontes mínimas listadas nele; decisão RPG-DEV-006 no commit 61b7177b2ba52a04b955a8306677a0e13dfdeb3c da PR #12.
SECURITY_CONSIDERATIONS: Consulta somente dos dados do dono autenticado e confirmados pelo servidor; nenhuma promoção de cache local a autoridade. Texto do Diário é privado, não confiável e não deve ser copiado para logs/evidências. Links e componentes existentes podem expor baús, Loja ou Arena e precisam de revisão antes de liberar rotas. Não inferir posse histórica nem progresso ausente.

ACCEPTANCE_CRITERIA:
- Preparação em branch/worktree próprios, sem alterações em apps/, packages/, supabase/, assets ou lockfile.
- Plano distingue fontes existentes, fatos observados, lacunas e proposta de consulta sem efeitos econômicos.
- Mochila/Coleção/Diário continuam bloqueados na versão publicada; nenhum teste ou release futuro é anunciado como executado.
- Testes futuros cobrem Auth/RLS, usuário alheio, sessão, persistência de leitura, dados vazios, fronteiras e preservação, sem fabricar inventário PROD.
- Plano mantém separadas consulta e eventual escrita; qualquer escrita necessita contrato e validação próprios.

TEST_PLAN:
- Nesta preparação: revisão estrutural de contrato/plano e links; diff restrito aos três documentos, git diff --check e busca de secrets; confirmar nenhum runtime alterado.
- Na implementação futura: unitários/integrados pertinentes, lint/types/build/CI, QA/Security, Preview real com contas autorizadas, preservação e conferência remota conforme RELEASE_POLICY. Os resultados não existem ainda.

SELF_VALIDATE: Revisão documental pelo autor; campos do contrato e referências locais conferidos; git diff --check e inspeção dos caminhos alterados. Sem código executável alterado, build/lint/typecheck/unit/integration são N/A para esta preparação; não são dispensados na futura implementação.
QA_SECURITY: Revisão documental pelo autor, sem independência. Sem secrets, efeito remoto de dados ou ampliação de acesso; riscos de runtime registrados no plano, sem alegar resolvê-los.
DEFINITION_OF_DONE: A preparação termina com contrato/plano/memória revisados e persistidos na branch própria. A entrega funcional RPG-DEV-007 permanece BACKLOG até autorização de implementação, aceite real e publicação conforme política; não marcar DONE/DEPLOY_COMPLETE agora.
