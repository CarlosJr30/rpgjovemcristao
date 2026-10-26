# RPG-DEV-007 — Preparar Mochila, Coleção e Diário

ID: RPG-DEV-007
TITLE: Preparar recuperação limitada de Mochila, Coleção e Diário
OBJECTIVE: Definir um contrato verificável para reutilizar as telas e os dados existentes, começando por consulta sem efeitos econômicos.
PRIORITY: P2 Normal
STATUS: VALIDATING
PREPARATION_STATUS: COMPLETE — contrato e plano preparados; implementação e publicação não iniciadas.
AUTHORIZATION: Novo pedido explícito autoriza implementar e publicar somente consultas de Mochila, cartas adquiridas e Diário persistido, seguindo RELEASE_POLICY. PR #12 permanece separada, aberta e sem merge automático. Preparação anterior preservada no commit 8c9c0c0.
BRANCH: codex/rpg-dev-007-preparation, criada de origin/main em 1a82d2c058b40b37ae4ae79b82c085bb3488c02b, sem carregar a mutation de equipamentos da PR #12.
SCOPE: apps/web telas/componentes de consulta, leituras Supabase e fronteiras de release; testes locais/CI/Preview real, documentação/memória e publicação normal quando gates aprovados. Uma migration mínima de leitura de cartas é necessária porque a fonte existente está em schema privado e a autoridade de combate não será liberada; sem DML ou permissões de mutação. npm ci apenas para dependências já fixadas, sem novas dependências ou recursos pagos. Autor assume Frontend/Backend/Database/QA/Security/DevOps nestes caminhos autorizados.
OUT_OF_SCOPE: Equipar/desequipar, alterações de inventário, novas artes/cartas, aquisições, baús, transferências, vendas, compras, recompensas, moedas/XP, atributos base, escrita de progressão/Diário, reconciliação, Arena, Torre, Loja, Jornada e ampliação de permissões econômicas. Não operar Teste Chat A ou outros jogadores PROD para fabricar testes.
DEPENDENCIES: Base main/produção 1a82d2c; independente da PR #12. Leitura de cartas deve conferir posse e recibo existentes sem depender do catálogo proposto local. Catálogo PROD vazio é estado vazio, não autorização para concessões.
ASSIGNED_AGENT: Autor como Frontend/Backend/Database/QA/Security/DevOps, sem subagentes ou independência alegada.
REQUIRED_CONTEXT: .agent/GLOBAL_CONTEXT.md, CURRENT_STATE.md, WORKFLOW.md, RULES.md, SECURITY.md, RELEASE_POLICY.md; plano desta tarefa; fontes mínimas listadas nele; decisão RPG-DEV-006 no commit 61b7177b2ba52a04b955a8306677a0e13dfdeb3c da PR #12.
SECURITY_CONSIDERATIONS: Consulta somente dos dados do dono autenticado e confirmados pelo servidor; nenhuma promoção de cache local a autoridade. Texto do Diário é privado, não confiável e não deve ser copiado para logs/evidências. Links e componentes existentes podem expor baús, Loja ou Arena e precisam de revisão antes de liberar rotas. Não inferir posse histórica nem progresso ausente.

ACCEPTANCE_CRITERIA:
- Mochila exibe nome, quantidade, raridade, descrição e indicação de equipamento pertencente ao avatar autenticado.
- Coleção exibe somente cartas adquiridas e confirmadas pelo servidor, descrições, atributos e efeitos existentes, sem adquirir/usar/abrir baú.
- Diário apresenta registros, referências e progresso persistidos do dono; sem fallback para histórico local e sem escrita ou recompensa por leitura.
- Visual medieval e onze opções preservados; somente estes três módulos liberados além de Herói/Guilda/EBD, com Equipamentos/Jornada/Arena/Torre/Loja bloqueados.
- Auth/RLS, sessão e leitura alheia negados; inventários, atributos, XP, moedas, Guilda/EBD e dados existentes preservados.
- Testes/CI, Preview TEST real, Security, recuperação de eventual DDL e conferência produtiva comprovados antes de DONE/DEPLOY_COMPLETE.

TEST_PLAN:
- Nesta preparação: revisão estrutural de contrato/plano e links; diff restrito aos três documentos, git diff --check e busca de secrets; confirmar nenhum runtime alterado.
- Na implementação futura: unitários/integrados pertinentes, lint/types/build/CI, QA/Security, Preview real com contas autorizadas, preservação e conferência remota conforme RELEASE_POLICY. Os resultados não existem ainda.

SELF_VALIDATE: 825 unitários PASS/74 SKIP; 18 PostgreSQL isolados PASS; lint/typecheck/build e protocolo 25 PASS. Gates hospedados/CI/publicação pendentes, sem PASS inferido. Rework inicial de datas, menu e coletor isolado registrado no relatório. Nenhum dado remoto alterado nesta etapa.
QA_SECURITY: Autor, sem independência. Leitura fresca, sem fallback de histórico local; resposta de sessão antiga descartada; endpoints de leitura STABLE, propriedade/conta/recibo preservados. Mutação econômica continua negada. Recuperação isolada comprovada sem regravar dados. Revisão final e remota ainda pendentes.
USER_STEERING: Usuário não tem acesso confirmado às contas TEST antigas; preservar contas/dados. Usar conta Herói TEST Equipamentos para coleção vazia; positivos de cartas por fixtures já autorizadas somente em PostgreSQL isolado. Não conceder cartas hospedadas; registrar positivo hospedado antigo como pendente, sem solicitar senhas/tokens. Continuar módulos independentes e publicar somente os validados.
DEFINITION_OF_DONE: Critérios do escopo comprovados, relatório RPG-DEV-007-REPORT.md com testes/commits/CI/ambientes/limitações, publicação pelo fluxo normal e conferência remota. Bloqueio crítico impede produção; continuar trabalhos independentes e registrar causa. Registros de preparação acima são históricos, não resultados de runtime.
