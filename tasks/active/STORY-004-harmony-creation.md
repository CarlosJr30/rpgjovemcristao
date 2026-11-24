# STORY-004 — Harmonia da Criação

ID: STORY-004
TITLE: Ordenar os sete símbolos da Criação
PRIORITY: P1 High
STATUS: VALIDATING

## Entrega

- Base local `eb295ee14ad6018d04fca0fddfadccff1ee0b778` e branch isolada `codex/story-004-harmony-creation`.
- Após a resposta correta do Dia 7, o retorno ao Santuário libera o painel na sessão da demo. Recarregar a página reinicia o percurso.
- O painel reaproveita os símbolos e a ordem da STORY-003. O jogador escolhe símbolos embaralhados, preenche sete posições numeradas, desfaz a última escolha, reinicia e confere a sequência. O erro indica a referência bíblica e permite novas tentativas.
- A conclusão acende as sete posições em sequência. A preferência por movimento reduzido mantém o estado visual estático.
- As associações seguem [Gênesis 1 na NVI](https://www.bible.com/pt/bible/129/GEN.1.NVI) e [Gênesis 2:1–3 na NVI](https://www.bible.com/pt/bible/129/GEN.2.1-3.NVI). Aprovação editorial final pendente.
- O desafio opera apenas em memória. A chave futura `story:creation:challenge:harmony-of-creation:v1`, 100 XP, 30 moedas e 1 Baú Comum permanecem no contrato da [STORY-001A](../completed/STORY-001A-biblical-journey-rewards.md). A conciliação do Economy-041 com 500 XP, 200 moedas e quatro baús continua pendente.

## Validação

- Vitest direcionado cobre acesso após o Dia 7, retorno antecipado, reinício da sessão, sequência errada e correta, desfazer, reiniciar e ausência de gravação local.
- Edge em 320, 360, 390 e 1280 px, com avatar de teste. Fluxo completo, teclado e toque emulado, alvos de 44 px, ausência de rolagem horizontal, foco, mensagens de status, animação em sequência e movimento reduzido. Teste de toque físico, leitor de tela e sessão autenticada real pendentes.
- A rota real redireciona para login sem sessão. Durante o desafio, o navegador não enviou requisições POST, PUT, PATCH ou DELETE. O código de autenticação, o progresso oficial e a economia ficam fora do diff.
- ESLint direcionado e build local com TypeScript.

Próxima tarefa: STORY-005 — Quiz e Diário Bíblico.
