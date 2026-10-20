# TASK-CONSOLIDATION-002 — Supabase isolado e pacote de instalação

ID: TASK-CONSOLIDATION-002
TITLE: Preparar banco de teste reproduzível e identificar ambiente/custos sem alterações remotas
OBJECTIVE: Viabilizar a preparação técnica do Supabase isolado para a Preview, preservando produção e contratos econômicos.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Branch codex/consolidation-supabase-002, worktree build/task-consolidation-002/checkout, base001 a0c6639791476d167ca48d5bd76a487ed481cfad limpa. Scripts locais de empacotamento/verificação, manifestos/documentos próprios em docs/architecture e docs/security, testes Node/PostgreSQL locais em scripts/database e packages/database/tests, contrato/checklist e prefixo da memória raiz. Orquestrador assume Architect/Database/DevOps/QA/Security, sem subagentes. Leituras remotas autorizadas: lista/metadados de projetos/organizações Supabase, plano/custos/regiões e projeto Vercel rpgjovemcristao-test; schema/config de alvo somente após isolamento confirmado, sem dados reais/segredos.
OUT_OF_SCOPE: Criação de recurso/branch remotos ou cobrados, confirmação de custo para criar, migrations/SQL de escrita remoto, Auth/env/config remota, push/deploy/fetch/merge/main/produção/dados reais, modificação0078/economia/ledger/carteira, registro presumido de proposta no journal, conteúdo/cartas/mídia/overlays/dependências novas, edição de contratos anteriores ou importação das sete pendências0080.
DEPENDENCIES: CONSOLIDATION-001 fechada localmente, runtime e9e74ee1a93d12a1ff44cfbec1f2082a4dc6772e e HEAD a0c6639791476d167ca48d5bd76a487ed481cfad, recibo conferido. Seus102unit/25CI/7PG/21cenários distintos e6rechecksGuilda/EBD não serão repetidos sem mudança relevante. P1 de escrita econômica legado permanece reproduzido/não corrigido.
ASSIGNED_AGENT: Autor assume perfis; QA/Security não independentes.
REQUIRED_CONTEXT: Pedido002 e controle001, governança já lida, skill Supabase/Bootstrap, perfis Database/DevOps/Security/QA selecionados, manifesto13SQL001 e fontes/propostas/planos específicos. Fontes oficiais atuais para custo/plano/configuração, sem confiar em preço histórico.
SECURITY_CONSIDERATIONS: Empacotar não aplica SQL nem autoriza recurso; manter arquivos antigos byte-equivalentes/conteúdo normalizado e hashes verificáveis. O pacote reproduz baseline com risco0078, portanto não é GO remoto. Sem ler secrets/chaves ou tabelas de produção; consultas de inventário remoto não provam isolamento do futuro alvo. Custos precisam de organização escolhida e confirmação explícita antes de qualquer criação futura.
ACCEPTANCE_CRITERIA:
- Fechamento001/HEAD limpo/ancestralidade/correção/preservação confirmados sem repetir gates.
- Pacote13SQL reproduzível com ordem, hash, origem/journal, recuperação e trilha de auditoria; validação primeiro em banco local limpo/descartável.
- Mapa de tabelas/constraints/índices/RPCs/RLS/grants/definers/cutover e isolamento coberto por evidências novas e reutilizadas distinguidas.
- Inventário remoto de metadados Supabase/Vercel e plano/custo/região documentados no alcance autorizado, sem recursos/config/dados reais.
- Plano exato de Auth/env/URL/callbacks/RLS/recuperação/CI e lista de operações remotas para autorização futura.
- Sem P1 ignorado; relatório12itens/checklist/status/memória/commits locais/recibo e preservação.
TEST_PLAN: Testar determinismo/integridade/recusa de fontes alteradas do pacote com Node; aplicar cópias empacotadas em PostgreSQL offline limpo e avaliar autorização/isolamento/constraints/recibos/pendências. Reutilizar cenários001 e casos específicos0080–83 quando fontes idênticas; rodar apenas o necessário para novo pacote. Lint focado nos scripts alterados se afetado; TypeScript/build e browser N/A quando app/TS/env/runtime inalterados, com evidência001 reutilizada.
DEFINITION_OF_DONE: Preparação local completamente validada e metadados/plano/custos com limites verificáveis; publicação não é parte do DONE local. Dependência indispensável ausente mantém BLOCKED com ação concreta. Nenhuma criação/config/migration/publicação remota sem nova autorização específica.

## Contexto mínimo

001 está fechada e limpa, com recibo e hashes preservados. A autorização002 substitui a proibição001 de leitura remota somente no escopo acima. Escopo de arquivos inclui packages/database/reviewed/consolidation-002.lock.json (receita congelada) e consolidation-002.inspect.sql (SELECT estrutural read-only, não migration), sem alteração dos SQL/journal originais.

## SELF VALIDATE / QA / SECURITY / ACCEPTANCE

Preparação local DONE, avanço remoto BLOCKED: não há Supabase RPG de testes, P1 econômico permanece e criação/SQL/Auth/env/publicação não autorizados. Pacote16arquivos/13SQL ID85cf7ba4c743f74f0f1561d6862e953d713b112820c783698e116fda38555591 instalado no PostgreSQL local offline limpo com defaults restritivos. 3testes Node PASS;7nós PG PASS (pai+6cenários); lint focado PASS nos três MJS novos. Catálogo completo32tabelas RLS/227constraints/77índices/39policies/73funções/44grants. ZIP/manifesto/hashes/escopo e preservação no recibo final.

QA e Security necessários por scripts executáveis, autorização/SQL e metadados de ambiente; realizados pelo autor assumindo perfis, sem revisão independente alegada. Três expectativas do ensaio foram corrigidas ao contrato real (start antes de submit; Invite unavailable; gabarito permitido após resposta); um check de diretório do pacote corrigido. Depois acrescentada recusa de junction com teste negativo. Logs iniciais preservados; SQL do produto não alterado. RLS habilitada não elimina ECON-LEGACY. Onze mutations antigas de missões/aulas permanecem revogadas conforme001, sem reabrir hardening0078.

Inventário remoto somente leitura: nenhum Supabase RPG de teste; organização Free. Usuário selecionou CarlosJr30's Org somente para cotação: get_cost retornou valor0 mensal, comunicado e registrado, sem criação. Vercel de teste confirmado por GET/CLI após MCP403, SSO em todos, nenhum deployment/env/Git vinculado. Sem dados/SQL/chaves/Auth de produção, sem mutação remota.

Reutilizados102unit/25CI/7PG/cobertura21casos/6rechecksGuilda-EBD/lint/tipos/build/isolamento001; não repetidos porque app/TS/env/runtime/dependências inalterados. Novo lint apenas scripts adicionados. Editorial bíblico/visual N/A sem conteúdo ou interface alterados. Skills Supabase/Bootstrap/Verification/vercel-cli/Postgres aplicadas no limite autorizado. Modelo recomendado GPT-6/Médio para pacote/SQL/validação; Luna/Leve para documentação, sem afirmar troca real.

Entrega12itens em docs/architecture/TASK-CONSOLIDATION-002-REPORT.md; mapa CONSOLIDATION-002-MIGRATION-PACKAGE.md; ambiente/custos/Auth CONSOLIDATION-002-ENVIRONMENT-AND-AUTH.md e plano JSON; parecer docs/security/CONSOLIDATION-002-SECURITY.md. Próximo passo: autorização específica somente de criação vazia na organização escolhida/sa-east-1/Free/cotação0mensal, sem extras; comprovar isolamento e tratar P1 antes de SQL/API. Sem autorização de criação inferida da consulta de custo.

Fechamento: implementação70aa7e15a9441119b6fcbb68f429d80fc71b3cdd; commit posterior somente documental. Recibo final em build/task-consolidation-002/final-receipt.json da raiz. Memória raiz atualizada por prefixo preservando bytes anteriores, SHA novo75e7bd84c2dd4c82a4c935eca130363e9899973f819baa2faee6174aad604180. Auditoria focada PASS em11arquivos novos, ZIP16entradas equivalentes, inspeção SQL idêntica à consulta executada; root/main/origin/main/001/tarefas anteriores e pendências preservados. Sem push/fetch/merge/main/deploy ou novo serviço/dependência/mídia. Contrato permanece ativo como BLOCKED, pois gates externos indispensáveis não foram executados.
