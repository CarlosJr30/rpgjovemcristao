# TASK-0097 — MOCHILA-040 organização visual
ID: TASK-0097
TITLE: RPG-EXPANSION-040 / Mochila organizada em Equipamentos, Baús e Cartas
PRIORITY: P2 Normal
STATUS: VALIDATING
OBJECTIVE: Organizar a Mochila existente em três abas sem alterar autoridades, inventário, economia ou regras; apresentar a implementação para revisão visual antes de qualquer publicação.
SCOPE: Rota ativa `apps/web/app/journey/backpack/page.tsx` e apresentação `apps/web/features/release-ebd/archive-screens.tsx`, CSS/teste diretamente afetados da Mochila; relatório `docs/architecture/RPG-MOCHILA-040-REPORT.md`; registro desta tarefa e memória atual; commit/PR/Preview TEST para revisão visual do proprietário.
OUT_OF_SCOPE: Novos itens/cartas, nova coleção, autoridade/persistência, SQL/migrations, compras/aberturas econômicas, mudança da Loja/Arena/Torre/baralho, publicação/alteração PROD, mescla de PRs pendentes.
DEPENDENCIES: Base `origin/main` no merge `ca19484c344ed668cee51513dca98755bbbd7884`; funcionalidades da Mochila e baús em `RPG-LOJA-FIX-011`.
ASSIGNED_AGENT: Autor (Frontend/QA/Security quando aplicável; sem revisão independente alegada).
REQUIRED_CONTEXT: `AGENTS.md`, `.agent/GLOBAL_CONTEXT.md`, `.agent/memory/CURRENT_STATE.md`, `.agent/WORKFLOW.md`, `.agent/RULES.md`, `.agent/SECURITY.md`, `.agent/RELEASE_POLICY.md`; perfil Frontend e testes pertinentes.
SECURITY_CONSIDERATIONS: Somente apresentação de leituras próprias existentes. Reutilizar `inventory-repository`, coleção oficial e APIs/repos já usados; nenhum ID de cliente vira autoridade. Não mudar Auth, RLS, rotinas, dados ou economia.
ACCEPTANCE_CRITERIA:
- Navegação simples com Equipamentos, Baús e Cartas, contagens de itens realmente possuídos e estados vazios.
- Equipar/desequipar e abrir baú usam os controles existentes; baús pagos continuam com abertura automática via Loja; cartas apontam a Meu Baralho para edição do deck de sete.
- Grade responsiva preparada para maiores coleções sem criar catálogo novo; usar filtros/paginação apenas se os dados/componentes existentes suportarem sem complexidade desnecessária.
- Apresentação visual enxuta em 320 px, 390 px e desktop, sem alterar regras nem funcionalidade econômica.
- Relatório curto apresenta componentes reutilizados, testes e pendências; aguarda revisão visual do proprietário antes de publicação.
TEST_PLAN:
- Alternância/contagens/links: teste direcionado `archive.test.tsx`, 7/7 PASS.
- ESLint dos TSX afetados, Prettier dos arquivos alterados e TypeScript PASS.
- Build obrigatório e gates de artefato PASS; Next Turbopack usa raiz temporária apenas para resolver o `node_modules` reutilizado em outro worktree. Configuração temporária foi removida; build é apenas validação local.
- Aguardar CI no SHA exato da PR e revisão visual das três abas na Preview TEST; sem operações econômicas.
DEFINITION_OF_DONE:
- Diff restrito revisado; nenhum SQL/migration ou mudança em dados.
- CI exato e Preview TEST READY conferidos; revisão visual do proprietário registrada antes de qualquer discussão de PROD.
- Relatório e memória atualizados. PROD permanece fora desta execução.
