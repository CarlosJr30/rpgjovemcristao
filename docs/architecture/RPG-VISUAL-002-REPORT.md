# RPG-VISUAL-002 — integração das sete artes aprovadas

**Estado: integração em andamento na branch `codex/rpg-visual-002-release`, baseada no main `a3ff7089e4d18d70c939df144d8506149681b29e`.** O proprietário aprovou expressamente as sete artes e a apresentação conjunta. A PR #35 e sua publicação de RPG-VISUAL-001 permanecem preservadas.

## Inventário

O catálogo canônico `packages/game-engine/src/arena-card-catalog.ts` contém estas sete definições e declara `art.approved: false` e `reference: null` para cada uma. `DeckEditor` reutiliza os ícones existentes de espada, escudo e amuleto e os identifica como símbolos, não como arte de carta. Foram recuperadas as artes já aprovadas do pátio da Arena (`arena_training_courtyard.webp`), dos personagens da Arena (Davi, Elias, Mara e Noemi), do avatar e dos ícones de equipamento. Busca nos assets rastreados e histórico Git não encontrou ilustrações individuais das sete cartas.

## Propostas geradas

Geração raster via ferramenta integrada `image_gen`, em arquivos PNG retrato 1024×1536, fora de `public/` e sem associação de runtime. Prompts seguem a direção visual vista no pátio/personagens existentes; cada cena não contém texto nem moldura, para preservar os componentes publicados. Nenhuma imagem de terceiros foi usada. As artes continuam **propostas**, sujeitas a revisão do proprietário.

| Definição canônica | ID | Proposta e prompt final resumido | Arquivo |
|---|---|---|---|
| Ataque Simples | `arena-card-basic-attack` | Viajante executa golpe simples e controlado contra alvo de treino. | [PNG](../../assets-source/proposed/rpg-visual-002/arena-card-basic-attack.png) |
| Defesa | `arena-card-basic-defense` | Viajante bloqueia golpe de treino com escudo físico comum. | [PNG](../../assets-source/proposed/rpg-visual-002/arena-card-basic-defense.png) |
| Golpe do Caminho | `arena-card-path-strike` | Passo avançado e golpe de espada em movimento para frente. | [PNG](../../assets-source/proposed/rpg-visual-002/arena-card-path-strike.png) |
| Guarda Perseverante | `arena-card-steadfast-guard` | Postura firme e paciente, escudo erguido contra golpe de treino. | [PNG](../../assets-source/proposed/rpg-visual-002/arena-card-steadfast-guard.png) |
| Discernimento | `arena-card-discernment` | Viajante compara rotas em pergaminho sem escrita, sob luz natural. | [PNG](../../assets-source/proposed/rpg-visual-002/arena-card-discernment.png) |
| Passo do Peregrino | `arena-card-pilgrim-step` | Viajante percorre estrada antiga ao nascer do sol. | [PNG](../../assets-source/proposed/rpg-visual-002/arena-card-pilgrim-step.png) |
| Golpe Medido | `arena-card-measured-strike` | Golpe preciso e controlado contra alvo de madeira. | [PNG](../../assets-source/proposed/rpg-visual-002/arena-card-measured-strike.png) |

Prompt comum: fantasia medieval heroica realista, viajante recorrente de cabelo castanho ondulado, túnica de linho creme, manto bordô, couro marrom e detalhes bronze; luz quente, verdes profundos e dourado coerentes com a Arena publicada. Ilustrações sem palavras, números, UI, logotipo, moldura, violência gráfica, brilho mágico ou atribuição de poder espiritual. Cada prompt individual corresponde à ação da linha acima.

## Integração

Os sete PNGs originais permanecem íntegros em `assets-source/proposed/rpg-visual-002/`; cópias WebP de 1024×1536 são servidas de `apps/web/public/assets/cards/arena/` (aproximadamente 2,66 MB no total). O mapeamento por ID canônico reutiliza `DeckEditor` e `BattleCards`, sem nova moldura e sem tocar catálogo, motor ou economia. O estado `USADA`, seleção, foco, custos, descrições e requisitos continuam vindos dos componentes e do motor existentes. Fallbacks de símbolos continuam disponíveis para cartas sintéticas ou não mapeadas.

## Validação e publicação

Pendentes neste checkpoint: testes direcionados de mapeamento/seleção/estado usado; conferência visual única em 320/390/desktop; gates obrigatórios do CI; Preview, integração Git e conferência do deployment oficial. Nenhuma operação econômica, migration, escrita de dados ou alteração Auth/RLS foi executada.
