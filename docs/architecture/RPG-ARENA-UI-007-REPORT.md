# RPG-ARENA-UI-007 — limpeza da apresentação da Arena

**VALIDATING.** O painel QA era montado antes do conteúdo de cada rota de treino e empurrava a Arena para baixo. Foi removido da área principal e movido, recolhido, para a sidebar; somente uma designação QA existente mostra o controle. A ativação/saída continuam usando o mesmo estado e a mesma validação do servidor. Saldo e validade não são mais exibidos no painel; permanece o aviso breve de isolamento.

Removidos textos introdutórios e links redundantes da apresentação principal; mantidos o acesso à Torre, ao Meu Baralho quando necessário, o aviso ético e as mensagens curtas de baralho incompleto. O título sobe no desktop; o override mobile existente permanece, sem novas regras responsivas para a Arena. Motor, cartas, dados, treinamento, economia, Auth/RLS e backup não foram alterados.

**Checks locais:** 9 testes focados de Provider/Shell PASS; ESLint e `git diff --check` PASS. Uma assertion inicial usou visibilidade que JSDOM não modela para conteúdo interno de `<details>` fechado; substituída pela verificação do estado nativo, sem mudança de runtime. CI, Preview e publicação pendentes.

O caminho `backup/arena-visual-006-aprovada-2026-11-07` não existe neste checkout. A versão aprovada continua preservada no merge publicado `cdd4dcf`; nenhum arquivo presumido foi criado ou sobrescrito. Nenhuma escrita em PROD ou dado de jogador.
