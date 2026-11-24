# STORY-002C — Revisão visual e jogabilidade do Dia 1

ID: STORY-002C
TITLE: Revisão do Santuário e do Dia 1
PRIORITY: P1 High
STATUS: VALIDATING

## Entrega

- Base limpa: `354c9267d8e402bb7e881ff33fad936432fabd7f`. Trabalho isolado em `codex/story-002c-day-one-review`.
- O mapa usa câmera fixa e recebe comandos de teclado quando tem foco. Clique e toque passam pela mesma colisão no trajeto. A margem do mapa mantém o avatar dentro do cenário.
- Os pontos do mapa usam proximidade. A lista semântica permite acionar as mesmas ações sem deslocar o avatar. O desafio aparece após a interação com o marco.
- Santuário fictício com símbolos, portal destacado, objetivo e indicação de alcance. Dia 1 usa contraste entre luz e trevas, feedback textual e transição que respeita a preferência por movimento reduzido.
- A revisão técnica comparou pergunta, resposta e explicação com [Gênesis 1:3–5 na NVI](https://www.bible.com/pt/bible/129/GEN.1.3-5.NVI). A explicação é uma paráfrase. Aprovação editorial final pendente.
- Demonstração com estado temporário e leitura dos registros canônicos. Checkpoints no servidor ficam para uma tarefa própria. Recompensas e Economy-041 permanecem intactas.

## Verificações

- Revisão visual por capturas no Edge. Layout e fluxo em 320, 360, 390 e 1280 px com avatar de teste e o mesmo componente de cena. Verificados limites visuais do avatar, ausência de rolagem horizontal, alvos do mapa de pelo menos 44 px, painéis fora da cena, colisão, portal, marco, feedback e retorno.
- Teclado, foco, controles semânticos, mensagens de status e movimento reduzido verificados por testes e no DOM do navegador. Sessão real, toque físico e leitor de tela permanecem pendentes.
- A revisão de acesso pelo autor confirmou que o link e o caminho exato da demo estão disponíveis no desenvolvimento e que a regra de produção recusa o caminho. A rota real encaminhou o visitante sem sessão para o login. O componente reutiliza a validação de viajante existente. O roteiro de navegador e a página de teste temporária foram removidos.
- Vitest direcionado: 51 testes em quatro arquivos. ESLint dos arquivos alterados e build local com TypeScript.

Próximo contrato: [STORY-003](../backlog/STORY-003-creation-seven-days.md).
