# RPG-ARENA-UI-007 — limpeza da apresentação da Arena

**VALIDATING.** O painel QA era montado antes do conteúdo de cada rota de treino e empurrava a Arena para baixo. Foi removido da área principal e movido, recolhido, para a sidebar; somente uma designação QA existente mostra o controle. A ativação/saída continuam usando o mesmo estado e a mesma validação do servidor. Saldo e validade não são mais exibidos no painel; permanece o aviso breve de isolamento.

Removidos textos introdutórios e links redundantes da apresentação principal; mantidos o acesso à Torre, ao Meu Baralho quando necessário, o aviso ético e as mensagens curtas de baralho incompleto. O título sobe no desktop; o override mobile existente permanece, sem novas regras responsivas para a Arena. Motor, cartas, dados, treinamento, economia, Auth/RLS e backup não foram alterados.

**Checks:** 9 testes focados Provider/Shell PASS; ESLint e `git diff --check` PASS. CI identificou que retirar todo link ao baralho removia o caminho necessário quando o treino está sem sete cartas. O link foi restaurado apenas nesse bloqueio; o teste afetado passou (1 PASS, 4 não executados). Novo CI do SHA `21bf934dae5b9315f89adc46a204a3416b773f2c`: run 42364607345 success, 1124 unit PASS / 74 SKIP, lint, tipos/build, PostgreSQL e RSC/móvel PASS. Job condicional de Preview SKIP, não PASS.

Preview `dpl_4fy8dp6kDUEExLRaiv5WNxpUkV4m` READY para o SHA `21bf934`; `/auth` e `/journey/arena` respondem HTTP 200. O proprietário confirmou a remoção do bloco e a disponibilidade do Treino QA no menu. Como o commit subsequente inclui apenas registros de status, essa aprovação visual continua válida. Sem mudança de Auth/RLS ou escrita econômica; publicação aguarda o CI do head documental exato.

O caminho `backup/arena-visual-006-aprovada-2026-11-07` não existe neste checkout. A versão aprovada continua preservada no merge publicado `cdd4dcf`; nenhum arquivo presumido foi criado ou sobrescrito. Nenhuma escrita em PROD ou dado de jogador.
