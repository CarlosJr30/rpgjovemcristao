# RPG-DEV-010 — Guilda, Células e EBD 2.0

ID: RPG-DEV-010
TITLE: Evoluir Guilda/EBD existentes em etapas independentes
STATUS: ACTIVE
PRIORITY: P1 High
OBJECTIVE: Executar a especificação autorizada pelo usuário em 28/10/2026, preservando dados, interface medieval e sistemas publicados; não habilitar economia antes da homologação.
SCOPE: Auditar fontes locais/remotas e implementar010A administração protegida, autorização/convites individuais de liderança e múltiplas Guildas. Preparar010B convites/classes/EBD,010C atividades/eventos,010D contratos econômicos isolados e010E comunicação/gestão em PRs próprias, respeitando dependências. Perfis Database/Backend/Frontend/QA/Security/DevOps assumidos pelo autor, sem delegação ou independência alegada. Orquestração autoriza apps/web, packages/database, supabase/migrations, testes pertinentes, scripts/CI estritamente necessários, docs/architecture e registros de tarefa/memória no limite do pedido.
SOURCE: Pedido anexado RPG-DEV-010 — Guilda, Células e EBD 2.0; RELEASE_POLICY; relatórios RELEASE-EBD-001/007/008/009.
BASE: main remota c14fd5e560f6e4930e18a1e493a901dea2ba0ed0 confirmada; branch codex/rpg-dev-010a-administration criada diretamente dessa base. PR12 e PR18 abertas/draft/não integradas; não incorporar suas migrations/runtime.
OUT_OF_SCOPE: Recursos pagos, reset/remoção de dados, reconstruir RPG/arte/engine, mensagens privadas livres, dados públicos de adolescentes, inferir administrador por nome/e-mail/avatar/nível, conceder XP/moedas/baús/equipamentos/cartas antes de controles/catálogos homologados, liberar Arena/Torre/Loja ou progresso009.
SECURITY: Admin inicial somente por concessão protegida explicitamente autorizada e identidade verificada. Não atribuir por conveniência de teste. Convites com destinatário vinculado, tokens fortes sem logs, hash no servidor, expiração/revogação/consumo atômico e replay negado; permissões por conta/Guilda/classe, não user_metadata. Motivo e histórico de intervenções; preservar Auth/RLS/economia e reflexões privadas. Novas operações não podem contornar APIs legadas.
ACCEPTANCE_CRITERIA:
- Matriz EXISTENTE/REUTILIZAR/ADAPTAR/NOVO/BLOQUEADO com caminhos e diferenças comprovadas.
- Administrador Geral/leader authorization não derivados de dados editáveis pelo cliente.
- Não transferir/remover vínculos existentes ao suportar múltiplas Guildas/classes.
- Migrations mínimas, compatíveis e recuperação verificada antes de aplicação remota.
- Cada etapa com CI exato, Preview TEST, Auth/RLS/API/browser real e preservação antes de qualquer publicação PROD; falha crítica mantém versão atual.
- Economia010D apenas contratos/testes isolados até homologação explícita dos controles e catálogo; especificação aprovada não autoriza créditos imediatos.
- Relatório geral e relatórios010A–E distinguem implementação/testes/publicação/bloqueios, sem converter SKIP/fixtures em prova hospedada.
TEST_PLAN: Unitários/integridade PostgreSQL isolado, privilégios/isolamento/autorização/revogação/concorrência/idempotência/replay; validações específicas por etapa; Chromium/WebKit e móvel emulado identificado; regressões das funcionalidades publicadas; lint/types/build/protocolo/CI; snapshots de estrutura/ACLs e hashes/contagens antes/depois.
DEFINITION_OF_DONE: Aceite comprovado por etapa, documentação/memória e evidências atualizadas; somente marcar DEPLOY_COMPLETE com ambiente produtivo remoto confirmado. Ausência de Admin inicial/autenticação ou gates dependentes bloqueia apenas a etapa afetada; prosseguir isoladamente sem fabricar privilégios ou dados.

## Preparação28/10/2026

Main e PR12/18 reconfirmadas; CI do último fechamento009 fd6f149 push40667834183/PR40667841973 success. TEST scope hero-equipment-006/28 migrations/43 tabelas; PROD guild-ebd-001/8 migrations/38 tabelas. Sem Administrador Geral comprovado na API existente. Solicitado método para concessão inicial, mantendo-a vazia até resposta válida. Nenhuma migration/deploy/concessão010 executados neste checkpoint. Worktrees anteriores preservados.

Resposta humana posterior: **designar somente a conta TEST por login normal**. Autoriza a concessão inicial TEST após confirmar UID pela sessão Auth real e concluir gates técnicos/recuperação. Não autoriza Admin PROD nem inferência pelo nome/avatar/nível; nunca conceder sem sessão verificada ou a conta diferente por conveniência.

## Checkpoint hospedado010A.1

Candidato9120754/PR19draft: CI push40762121024/PR40762162771 success,894unit/74SKIP e45PG. Migration TEST20261028202642 aplicada somente após preflight/recuperação;29migrations/47tabelas. UID da sessão normal confirmado; Admin inicial TEST explicitamente designado concedido/auditado pelo caminho privado protegido.12API prégrant+38UI/API semgrant+55UI/API comgrant PASS; quatro contextos da mesma sessão, WebKit móvel emulado. Emissão/aceite/revogação normal na própria conta TEST, sem alterar Guildas legadas/economia.43conjuntos originais TEST/38PROD e estrutura anterior idênticos. REWORK visual: título sobre arte corrigido com moldura existente,6unit/qualidade PASS; CI/Preview do novo candidato e regressões pendentes. Não há Admin/DDL/deploy010PROD. A.2 multiguild/autoridades legadas ainda obrigatória antes de declarar010A concluída. Relatório/evidência010A distinguem resultados e falhas reais.
