# RPG-ARENA-VISUAL-004 — seletor e modal de cartas

06/11/2026. **VALIDATING; nenhuma publicação PROD ainda.** Base `f57876b` (VISUAL-003). O seletor reutiliza `BattleCards`: três cartas por página no desktop, uma no celular, com navegação por botões, rolagem e teclado. A prévia existente agora é um modal amplo centralizado, com fundo escurecido, arte e resumo do efeito em destaque; explicação completa fica recolhida. Escape, retorno de foco, animação de 6,5 s, botão Pular, preferência de movimento reduzido e estado `USADA` foram preservados.

- **16 testes direcionados PASS** em `editor.test.tsx` e `battle-actions.test.tsx`, incluindo navegação/seleção e explicação recolhida. ESLint, Prettier, typecheck e `git diff --check` PASS.
- **Build local pendente:** o build Turbopack não resolveu `next` porque o worktree não tem dependências próprias e o junction temporário para outro worktree fica fora da raiz permitida. O ensaio alternativo Webpack parou numa regra CSS Modules preexistente em `journey.module.css`, fora do diff. Ambos os fatos serão preservados; o CI obrigatório fará o build reproduzível com `npm ci`.
- **CI/Preview/PROD pendentes.** Nenhuma migration, compra, batalha, concessão, mudança de Auth/RLS/economia ou alteração de dados.

Próximo gate: CI do SHA exato, Preview READY e conferência visual focada a 320/390/desktop com uma seleção, depois merge/publicação pelo fluxo normal. Sem combate completo ou testes econômicos repetidos.
