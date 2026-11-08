# RPG-MOCHILA-040 — organização da Mochila

08/11/2026. **Validação local concluída; preparando PR e Preview TEST.** Branch `codex/rpg-mochila-040`, baseada em `origin/main` `ca19484c344ed668cee51513dca98755bbbd7884`. Checkout principal, outras branches/PRs, dados e backup aprovado foram preservados; `backup/arena-visual-006-aprovada-2026-11-07` continua em `cdd4dcf06319e9cdadccdd818c78caaa7e96014b`.

- A rota ativa usa `ArchiveBackpack`/`ArchiveAccess`; a tela antiga em `journey/screens/backpack.tsx` não foi reconstruída. A Mochila agora organiza **Equipamentos, Baús e Cartas** em abas acessíveis, com contagens, filtros de raridade e grade adaptável.
- Equipamentos vêm somente do inventário possuído e do catálogo existente; arte, bônus, raridade, estado e ação encaminham à tela existente de Equipamentos. Cartas usam a leitura autenticada `readOwnedCards`, artes aprovadas, dados canônicos e link para Meu Baralho. Estados vazios usam ícones existentes.
- Baús continuam em `CommunityChests`/`ChestPanel`, preservando origem, posse, recuperação, abertura e revelação existentes. Nenhuma transação foi executada ou alterada.
- **Checks locais:** teste afetado `archive.test.tsx` **7/7 PASS**; ESLint dos TSX afetados, Prettier dos arquivos alterados, TypeScript, `git diff --check`, build Turbopack e gates de artefatos PASS. Dependências reutilizadas de um worktree irmão com lockfile/hash igual, Next 16.4.2 e workspaces compartilhados iguais à base; nada instalado. Para o build local, `turbopack.root` apontou temporariamente ao diretório pai para permitir resolução do junction; a configuração foi removida, o patch do Next restaurado e o junction apagado. Tentativa alternativa com Webpack falhou numa regra `:global` preexistente e inalterada; não foi contabilizada como o build obrigatório.
- **Git/CI/Preview:** commit, PR e Preview TEST em preparação. CI exato e estado READY da Preview ainda pendentes. Nenhuma migration, escrita de dados, Auth/RLS ou produção.

**Pendente:** CI no SHA da PR, Preview TEST READY e revisão visual do proprietário das três abas. Não publicar PROD antes do aceite visual; esta tarefa não autoriza alterações econômicas nem operações de jogo.
