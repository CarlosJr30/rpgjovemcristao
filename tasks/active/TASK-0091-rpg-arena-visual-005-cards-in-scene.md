# TASK-0091 — RPG-ARENA-VISUAL-005: interação de cartas sobre o palco

ID: TASK-0091
TITLE: Manter seletor e apresentação de cartas sobre o cenário da Arena
OBJECTIVE: Reposicionar as ações e o seletor de cartas no palco compartilhado da Arena/Torre, sem expandir o fluxo da página durante seleção e apresentação.
PRIORITY: P2 Normal
STATUS: VALIDATING
SCOPE: `apps/web/features/arena-deck/authoritative-arena.tsx`, CSS Modules de cartas e palco, teste diretamente afetado, relatório e este contrato, na branch/PR #38 existente.
OUT_OF_SCOPE: Motor, IA, regras, tempos de combate, Arena local não autenticada, dados, economia, compras, recompensas, Auth, RLS, SQL/migrations, produção.
DEPENDENCIES: TASK-0090 e CI aprovado do candidato `27352b18c8365c26157b8121748a2d0f2b13f772`.
ASSIGNED_AGENT: Codex.
REQUIRED_CONTEXT: Pedido RPG-ARENA-VISUAL-005; `.agent/WORKFLOW.md`, `.agent/RELEASE_POLICY.md`, `.agent/RULES.md`, `.agent/SECURITY.md`; `AuthoritativeArena`, `ArenaStage`, `ArenaBattleActions`, `BattleCards`, apresentação existente e evidências VISUAL-004.
SECURITY_CONSIDERATIONS: Apresentação visual; manter modal bloqueante, captura/retorno de foco, navegação por teclado, animações e estado canônico. Sem escrita de dados ou economia.
ACCEPTANCE_CRITERIA:

- Seletor e ações estão posicionados dentro dos limites visuais do palco; abrir o seletor não aumenta a altura do documento.
- A apresentação/modal existente e a animação permanecem sobre o palco sem deslocar o fluxo da página.
- Arena e Torre usam a mesma composição compartilhada.
- Mecânicas, estado USADA, acessibilidade e movimento reduzido permanecem inalterados.
- CI obrigatório passa; validação Preview segue o gate de publicação, sem testes de batalha/compras/recompensas.
  TEST_PLAN:
- `authoritative-arena.test.tsx` + `battle-actions.test.tsx`: 13 testes direcionados PASS; composição palco/ações está coberta no fluxo existente. ESLint e Prettier dos arquivos alterados PASS; `git diff --check` PASS.
- Typecheck local não conclusivo: este worktree não contém dependências próprias; a junction temporária ao `node_modules` do repositório principal apontou tipos Next e `@rpg/game-engine` de outra revisão. Falhas foram de dependência/artefato incompatível (`EnsureStatic`, exports antigos), não do diff. O typecheck/build do CI exato ainda é obrigatório.
- Validar 320 px, 390 px e desktop em Preview quando disponível; não repetir combate completo nem qualquer escrita econômica.
- CI obrigatório na cabeça exata. Registrar bloqueio se smoke autenticado exigido não puder ser realizado.
  DEFINITION_OF_DONE:
- Critérios de aceite e checks aplicáveis registrados; PR #38 preservada; Preview/CI/produção apenas conforme gates e evidência; memória atualizada.
