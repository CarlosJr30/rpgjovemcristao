# STORY-005 — Quiz e Diário Bíblico da Criação

ID: STORY-005
TITLE: Quiz da Criação, capítulo no Diário e resumo demonstrativo
PRIORITY: P1 High
STATUS: VALIDATING

## Entrega

- Base local `09674ea15084a662f91fd0b20d783a34ba607baf` e branch isolada `codex/story-005-quiz-diary`.
- Harmonia concluída abre o quiz. A tentativa apresenta cinco perguntas, três alternativas por tela e confirmação. O resumo mostra acertos, referências, total de descobertas e a pendência do vídeo. A repetição abre uma nova tentativa e preserva o último resultado concluído até a próxima conclusão.
- O capítulo da Criação integra o Diário do Viajante e é usado na consulta em memória dentro da demonstração. O arquivo do Diário mostra o conteúdo em desenvolvimento, sem receber estado temporário da cena. A consulta dentro da demo mostra descobertas e preserva o tabuleiro da Harmonia, a tentativa e o resultado.
- A referência original da STORY-002 é a rota do Diário. O atalho da demonstração abre o mesmo capítulo na própria tela, mantendo a sessão em memória durante o retorno. A rota existente continua usando o Viajante validado pelo arquivo autenticado.
- Perguntas, referências NVI e paráfrases continuam sujeitas à aprovação editorial final. As notas separam o relato bíblico das representações fictícias. O capítulo não solicita reflexões pessoais.
- Sem persistência da demonstração, mutação canônica ou concessão. A chave `story:creation:quiz:perfect-5-of-5:v1` e o bônus futuro de 60 XP e 1 Baú Raro continuam reservados na [STORY-001A](../completed/STORY-001A-biblical-journey-rewards.md). Economy-041 e o teto de 500 XP, 200 moedas e quatro baús permanecem intactos.

## Validação

- Testes direcionados da jornada, Harmonia, Diário e arquivo autenticado. Cobrem acesso ao quiz, cinco perguntas, erro e acerto, 4/5, repetição com 5/5, memória entre telas, capítulo do Diário apenas em desenvolvimento e proteção dos registros do Viajante.
- Edge em 320, 360, 390 e 1280 px com avatar de teste. Fluxo completo, toque emulado, teclado, foco visível, alvos de 44 px, contraste do resumo, movimento reduzido e ausência de rolagem horizontal. A rota real redirecionou o visitante sem sessão para login. Nenhuma requisição de escrita durante a demo. Sessão autenticada real, toque físico e leitor de tela pendentes.
- ESLint direcionado e build local com TypeScript. A página temporária de verificação foi removida.

Próxima tarefa: STORY-006 — Vídeo obrigatório e preparação da conclusão.
