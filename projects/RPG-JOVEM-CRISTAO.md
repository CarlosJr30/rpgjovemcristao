# Projeto RPG Jovem Cristão

## Visão oficial — GAME VISION

RPG de jornada pelas narrativas bíblicas, começando em Gênesis e avançando progressivamente por histórias, contextos, personagens e acontecimentos de outras eras. Narrativa, exploração, reflexão/devocional, Quiz Bíblico, missões dentro e fora do jogo, comunidade, desafios, minigames, progressão, coleção, personalização e recompensas formam uma experiência de RPG com identidade visual forte.

O jogador observa, explora, ajuda e participa de acontecimentos paralelos compatíveis com o contexto, sem substituir protagonistas ou alterar fatos canônicos. Curiosidade e contato com a Bíblia são objetivos de experiência; fé e espiritualidade não são medidas pelo jogo. Respeitar [regras bíblicas](../docs/biblical/README.md).

O produto deve oferecer escolhas, desafios reais, descoberta e vontade de voltar em desktop/mobile. O Quiz integra cada fase sem reduzir a experiência a questionários ou medição de espiritualidade. A participação comunitária amplia a experiência sem bloquear o acesso geral.

## Estado de produto

GENESIS 2-3 / O JARDIM E A ESCOLHA -> CURRENT VERTICAL SLICE.
NEHEMIAH VERTICAL SLICE -> SUPERSEDED.

[Fontes oficiais e recorte do MVP](../docs/game-design/MVP.md). Personagem e atributos seguem [Viajante](../docs/game-design/CHARACTER-SYSTEM.md), Quiz segue [sua fonte oficial](../docs/game-design/QUIZ-SYSTEM.md) e os atos seguem [campanha](../docs/game-design/CAMPAIGN-STRUCTURE.md). O início está decidido; o detalhamento jogável da fase 1.1 ainda está pendente. TASK-0008 autoriza somente o onboarding visual local; [escopo implementado](../docs/architecture/LOCAL-JOURNEY.md).

Monólito modular TypeScript, Next.js/React, PostgreSQL, Drizzle e Better Auth permanecem conforme [stack](../docs/architecture/TECH-STACK.md) e ADR-0001. Bootstrap local concluído na TASK-0005 e onboarding local na TASK-0008; sem conteúdo jogável de fase, autenticação ou persistência de servidor. [Impactos da nova dinâmica](../docs/architecture/CENTRAL-DYNAMICS-IMPACT.md) devem orientar futura revisão dos contratos de dados; nenhum schema foi alterado.

Público de design: jovens iniciantes em RPG. Hipótese de piloto adulto continua pendente de confirmação operacional. Privacidade, idade, retenção/exclusão e edição/licença portuguesa são gates anteriores a cadastro/publicação.

## Roadmap

| Prioridade | Entrega | Estado |
| --- | --- | --- |
| P0 | Governança e segurança documental | TASK-0001 concluída; controles operacionais continuam pendentes |
| P1 | Stack e arquitetura | TASK-0002; decisões técnicas preservadas |
| P1 | MVP Neemias | TASK-0003 histórica; SUPERSEDED como início e recorte vigente |
| P1 | Modelo conceitual | TASK-0004 histórica; revisão parcial necessária, sem schema/banco |
| P1 | Bootstrap local | TASK-0005 concluída; sem gameplay/auth/persistência |
| P1 | Dinâmica central e Gênesis | TASK-0006; fontes oficiais consolidadas |
| P1 | Viajante, Quiz e contrato de fase | TASK-0007; decisões documentais consolidadas |
| P1 | Onboarding e mapa local | TASK-0008 implementa Viajante, introdução, oito atos e apresentação da fase 1.1; persistência local temporária |
| P1 | Especificar fase 1.1 | Única próxima tarefa recomendada: TASK-0009, somente documental; incluir Quiz e desafio; não contratada nem iniciada |
| P1 | Políticas do piloto e licenciamento | Pendentes antes de cadastro/publicação; recomendação antiga não executada |
| P1 | Revisão de dados e contratos | Pendente após detalhamento do slice; preservar invariantes compatíveis |
| P1 | Personagem, missões, exploração e grande desafio | Planejados; escopo executável ainda não contratado |
| P2 | Economia, equipamentos, Codex e replay | Design central definido; balanceamento e implementação pendentes |
| P2 | Comunidade e liderança | Conceito definido; políticas, autorização e implementação pendentes |
| P2 | Combate contextual | Design anterior disponível; adoção depende de fase apropriada |

Roadmap expressa intenção, não autorização. Nenhuma próxima tarefa é executada pela TASK-0008.
