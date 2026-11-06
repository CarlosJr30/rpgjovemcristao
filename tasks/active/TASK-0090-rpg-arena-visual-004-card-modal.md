# TASK-0090 — RPG-ARENA-VISUAL-004: seletor e modal
ID: TASK-0090
TITLE: Ampliar seletor visual de cartas da Arena
OBJECTIVE: Exibir cartas legíveis em grupos responsivos e transformar a prévia existente em modal de destaque.
PRIORITY: P2 Normal
STATUS: VALIDATING
SCOPE: `apps/web/features/arena-deck/editor.tsx`, `battle-actions.tsx`, `cards.module.css`, testes diretamente afetados e este contrato/relatório.
OUT_OF_SCOPE: Motor/IA/regras/custos/atributos/economia/Auth/RLS/dados, animação cinematográfica de 6,5 s, Torre e fluxos de compra.
DEPENDENCIES: Nenhuma; base `f57876b5a64d5eaba93ad7805d05ac3c980f4722`.
ASSIGNED_AGENT: Codex.
REQUIRED_CONTEXT: `.agent/WORKFLOW.md`, `.agent/RELEASE_POLICY.md`, `.agent/RULES.md`, `.agent/SECURITY.md`, `RPG-ARENA-VISUAL-003`.
SECURITY_CONSIDERATIONS: UI apenas; preservar foco, teclado, seleção e bloqueios existentes. Sem Auth/RLS/dados/economia.
ACCEPTANCE_CRITERIA:
- Desktop exibe até três cartas grandes por página; mobile exibe uma por vez com navegação acessível.
- Prévia existente é modal centralizado com backdrop, arte e dados canônicos destacados; explicação longa recolhida.
- Navegação por teclado, Escape, foco, animação, pular e movimento reduzido permanecem.
- Nenhuma regra de combate/economia muda.
- CI obrigatório e publicação normal após validação responsiva focada.
TEST_PLAN:
- Teste unitário focal de navegação/seleção e modal.
- Conferir uma vez 320 px, 390 px e desktop, uma seleção; sem combate completo ou escrita econômica.
- Executar lint, TypeScript, build e CI obrigatório do SHA candidato.
- 17 testes direcionados em 3 arquivos PASS (inclui regressão canônica apontada pelo CI); ESLint, Prettier e typecheck PASS. CI inicial falhou porque a linha canônica de custo/nível tinha sido removida; restaurada e teste afetado passou localmente.
- Build local não concluiu por resolução de dependências via junction fora da raiz Turbopack; build alternativo Webpack parou numa regra CSS Modules preexistente fora do diff. Confirmar build padrão no CI.
DEFINITION_OF_DONE:
- Aceite visual e gates aplicáveis registrados; Preview/produção READY e SHA confirmados; memória atualizada.
