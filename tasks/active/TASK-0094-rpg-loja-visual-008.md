# TASK-0094 — RPG-LOJA-VISUAL-008: vitrine medieval da Loja
ID: TASK-0094
TITLE: Transformar visualmente a Loja reutilizando os produtos existentes
OBJECTIVE: Apresentar os seis equipamentos e cinco tipos de baú existentes em uma vitrine medieval responsiva, preservando preços, fontes, transações e bloqueios publicados.
PRIORITY: P2 Normal
STATUS: VALIDATING
SCOPE: `apps/web/features/journey/screens/shop.tsx`, `shop.module.css`, testes direcionados da tela e relatório/memória desta tarefa.
OUT_OF_SCOPE: Auth, RLS, SQL, migrations, catálogo/valores econômicos, saldos, XP, inventários, recibos, loot, probabilidades, Arena, Torre, contas/dados, novas artes/produtos, produção antes de gates e aceite visual.
DEPENDENCIES: Main remoto `151e698c7569339dc83c95ba926e14e8d305b5b3`; catálogos e regras publicados em LOJA-CATALOGO-001 / ECONOMY-001C.2.
ASSIGNED_AGENT: Frontend (autor)
REQUIRED_CONTEXT: `.agent/GLOBAL_CONTEXT.md`, `.agent/memory/CURRENT_STATE.md`, `.agent/WORKFLOW.md`, `.agent/RULES.md`, `.agent/SECURITY.md`, `.agent/RELEASE_POLICY.md`, `docs/architecture/LOJA-CATALOGO-001-REPORT.md`, `docs/architecture/ECONOMY-CONTENT-001-REPORT.md`.
SECURITY_CONSIDERATIONS: Somente apresentação de dados/catálogo existentes. Preservar confirmação/servidor e ausência de botão para itens não aprovados. Nenhuma escrita econômica ou configuração remota.
ACCEPTANCE_CRITERIA:
- Loja medieval com artes existentes ampliadas, categorias legíveis e layout responsivo.
- Exibe seis equipamentos e cinco baús sem duplicar a arte do Baú Comum, com fontes/status dos itens não vendáveis.
- Compra continua disponível somente para baú comum40, Espada35, Couraça65 e Escudo115; nenhuma outra oferta aparece.
- Mochila e fluxo de compra/recibo/confirmação existentes continuam conectados; animação de abertura existente preservada.
- Nenhuma regra, preço, estado persistido ou dado econômico alterado.
TEST_PLAN:
- Executar teste(s) direcionado(s) da tela Shop para preços, catálogo, bloqueios e ausência de transação nos estados visuais.
- Conferir renderização/layout em desktop e móvel sem transações reais.
- Executar CI obrigatório para o SHA candidato.
- Criar Preview protegida; obter aceite visual antes de publicar.
DEFINITION_OF_DONE:
- Critérios aceitos; diff sem alteração fora do escopo/sem segredo; testes direcionados e CI obrigatório PASS, SKIP não contado como PASS.
- PR mergeada pelo fluxo normal e Vercel READY no SHA de merge após aceite visual e gates.
- Relatório curto, evidências aplicáveis e memória atualizados; contrato movido para `tasks/completed/`.
