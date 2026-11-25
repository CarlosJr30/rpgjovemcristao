# STORY-003 — Ampliar a exploração aos sete dias da Criação

ID: STORY-003
TITLE: Sete áreas jogáveis em No Princípio de Tudo
PRIORITY: P1 High
STATUS: VALIDATING

**Objetivo** — ampliar o protótipo do Santuário e do Dia 1 para uma aventura navegável pelos sete dias de Gênesis 1:1–2:3.

**Dependências** — [especificação STORY-002](../../docs/game-design/STORY-002-EXPLORATION.md), [revisão STORY-002C](../active/STORY-002C-day-one-review.md) e aprovação editorial de cada atividade. Para progresso oficial e retomada entre dispositivos, definir e validar antes o contrato versionado de checkpoints no servidor.

## Critérios de aceite

- Reusar o mapa, avatar autenticado, teclado, ponteiro, toque e navegação semântica. Validar a apresentação em 320, 360 e 390 px e desktop.
- Configurar as transições e um objetivo obrigatório por área, com referência na NVI, interação, feedback e evidência conforme a especificação. Descobertas opcionais ficam fora do critério de conclusão.
- Distinguir o Santuário fictício do relato bíblico. Manter os conteúdos sem aprovação rotulados como demonstração.
- Restringir progresso oficial à validação do servidor com identidade do viajante, revisão de conteúdo, repetição segura e retomada. A demo continua temporária enquanto esse contrato estiver pendente.
- Preservar STORY-001A, suas quatro chaves e as metas de 500 XP, 200 moedas, 2 Baús Comuns, 1 Raro e 1 Épico. Qualquer ativação econômica depende de resolução específica da Economy-041 e evita somar automaticamente a recompensa de Origens.

**Verificação** — testar a sequência completa, caminhos alternativos e critérios de conclusão em testes direcionados. Homologar persistência separadamente quando disponível.

## Registro de implementação

- Base limpa `0376a51415ecbf6e4796a2b7e9f4507bf1af3cc6` e branch isolada `codex/story-003-creation-seven-days`.
- A STORY-002 prevê associação de rótulos. O anexo da STORY-003 detalha perguntas factuais para a demonstração e três marcos de terra, mares e vegetação no Dia 3. A implementação mantém essas visitas dentro de um único objetivo educativo. As demais áreas usam um marco. A especificação de progresso oficial permanece intacta.
- A revisão técnica comparou as perguntas e paráfrases com [Gênesis 1 na NVI](https://www.bible.com/pt/bible/129/GEN.1.NVI) e [Gênesis 2:1–3 na NVI](https://www.bible.com/pt/bible/129/GEN.2.1-3.NVI). O link identifica o texto bíblico, o feedback é explicativo e a paisagem é fictícia. Aprovação editorial final pendente.
- Os sete desafios liberam a próxima área apenas na sessão da demo. Retornar ao Santuário e entrar pelo portal reinicia o percurso. Recarregar ou trocar de dispositivo não retoma posições, visitas ou respostas.
- A revisão de acesso pelo autor verificou que a rota existente continua restrita ao desenvolvimento, redireciona visitantes sem sessão para o login e usa o mesmo viajante validado. O código de exploração continua somente leitura para progresso oficial. Economia e chaves da STORY-001A permanecem intactas.

## Evidências

- Vitest direcionado: 48 testes em três arquivos. A sequência verifica todos os marcos, respostas incorretas e corretas em cada dia, avanço, retorno, reinício e ausência de gravação local pela cena. Os testes de geometria e de rotas foram reaproveitados.
- Edge em 320, 360, 390 e 1280 px: sequência completa com avatar de teste, teclado e mouse no desktop, toque emulado no mobile e navegação semântica. Verificados ausência de rolagem horizontal, rótulos e avatar dentro do mapa, alvos de 44 px, foco ao abrir o desafio e preferência de movimento reduzido. A página e o roteiro temporários de verificação local foram removidos.
- ESLint direcionado e build local do app com TypeScript. Nenhuma migration ou publicação.
- Pendências de homologação: sessão autenticada real, toque físico, leitor de tela, aprovação editorial e contrato de checkpoints no servidor.

Próximo passo recomendado: homologar a demo com sessão real e concluir a aprovação editorial. Depois, especificar checkpoints versionados com identidade do viajante, validação de resposta e retomada segura antes de ativar progresso oficial.
