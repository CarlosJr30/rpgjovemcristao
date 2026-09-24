> TASK-0006: subsistema opcional preservado para fases apropriadas. Combate não rege o loop global nem é obrigatório em Gênesis. E1–E3, M1–M3, boss e percursos numéricos abaixo são exemplos históricos de Neemias, SUPERSEDED como slice inicial; não são balanceamento de Gênesis. Conclusão exclusivamente por vitória vale apenas para aquele exemplo. Regras atuais de concessão e missões estão em [MISSION-SYSTEM](MISSION-SYSTEM.md); parâmetros históricos em [personagem de Neemias](history/CHARACTER-SYSTEM-NEHEMIAH.md).

# Sistema de batalha

Design v1, TASK-0003. Batalhas FICTIONAL de treino, sem mortes ou adversários bíblicos demonizados. Vida representa capacidade abstrata de continuar o treino. Derrotar o instrutor não muda os acontecimentos bíblicos.

## Escolha e ciclo

Combate determinístico por turnos, 1 contra 1, adequado a toque e pausas. Tempo real exigiria precisão motora/conexão contínua; auto-battle reduziria agência. Aqui o jogador escolhe uma ação por rodada, vê a intenção do inimigo e acompanha efeitos breves que pode acelerar. Nenhuma decisão depende da velocidade da animação.

Na entrada, servidor restaura vida, inicializa inimigo, rodada 1 e habilidade disponível. Maior velocidade age primeiro; empate favorece jogador. Ordem recalculada por rodada a partir dos atributos fixos da tentativa. Sem sorte, crítico, esquiva, efeitos periódicos ou contra-ataques.

Uma intenção válida do jogador resolve a rodada inteira no servidor: preparar defesa (se escolhida), primeira ação, verificar fim, segunda ação se ambos seguem ativos, verificar fim, remover defesa e avançar rodada. Não há timeout; ausência de comando pausa o jogo. A UI anuncia ordem e intenção antes da confirmação. Nunca existe resposta de inimigo depois de sua vida chegar a zero.

## Ações e dano

| Ação | Regra |
| --- | --- |
| Atacar | Dano base = máximo(1, ataque efetivo do atacante − defesa efetiva do alvo) |
| Defender | Gasta a ação ofensiva e reduz à metade o dano recebido nessa rodada, arredondado para cima; mínimo 1. Proteção ativada antes da iniciativa, inclusive contra inimigo mais rápido |
| Golpe preciso | Ataca usando ataque efetivo +4 na mesma fórmula; uma utilização por tentativa; sem custo adicional |

Inimigos não defendem nem usam Golpe preciso. Dano final é subtraído com piso de vida zero. Ação inválida, habilidade já usada ou versão vencida não gasta turno. Não aceitar dano/vida enviados pelo cliente. Preview é informativo; resposta oficial prevalece.

## Adversários e boss

| Encontro | Vida | Ataque | Defesa | Velocidade | Padrão |
| --- | --- | --- | --- | --- | --- |
| E1 / Parceiro de treino | 18 | 6 | 1 | 3 | Ataque normal toda rodada |
| E2 / Parceiro ágil | 24 | 8 | 2 | 6 | Ataque normal toda rodada |
| E3 / Instrutora do pátio, boss | 32 | 9 | 3 | 4 | Rodadas ímpares: ataque normal. Pares: golpe forte, ataque +6 |

Intenção da instrutora é sempre visível, inclusive na primeira rodada. Golpe forte passa pela fórmula comum; defender reduz o resultado. Boss usa as mesmas regras e recebe XP apenas por conclusão da missão, sem loot separado. Sem segunda fase ou invocação de aliados.

## Vitória, derrota e saída

Vida inimiga zero encerra imediatamente em vitória; vida do jogador zero encerra em derrota. Sem empates simultâneos, pois ações são sequenciais. Vitória no último encontro conclui missão e concede recompensa atomicamente, conforme [Loop](CORE-GAMEPLAY-LOOP.md). Derrota não concede prêmio, não remove itens/XP e oferece tentar novamente ou voltar ao mapa.

Nova tentativa após derrota reinicia somente o encontro com ambos cheios, rodada 1 e habilidade disponível, preservando cena/desafio já confirmados. Abandonar missão exige confirmação na UI, encerra a tentativa e retorna ao mapa; reentrar recomeça a missão, sem perda permanente. Desconexão não é abandono. Equipamento pode ser alterado apenas após sair da missão.

## Percursos numéricos de revisão

- M1, nível 1: atacar causa 7; inimigo causa 4. Três ataques vencem na rodada 3, vida final 22, pois jogador age antes. Golpe preciso na rodada 1 causa 11; ataque na rodada 2 encerra com vida 26.
- M2, nível 2 e I2: inimigo age antes e causa 4; três ataques de 8 vencem com vida 24. Sem I2, dano recebido é 5 e vida final 21.
- Boss, nível 2 e I2: ataque comum causa 7; Golpe preciso causa 11; inimigo causa 5 ou 11. Sequência Golpe preciso / Defender / Atacar / Defender / Atacar / Defender / Atacar vence na rodada 7 com vida 3. Nas rodadas pares defendidas, 11 vira 6. O golpe fatal do jogador impede a resposta da rodada 7.
- Boss sem I2: Golpe preciso seguido de três ataques vence na rodada 4 com vida 12; danos recebidos 6+12+6 = 24. Com I2, termina com 15. Defender sempre leva à derrota: reduzir dano tem custo de prolongar o combate; não é estratégia dominante.

Os exemplos são revisão de mesa; balanceamento deve ser ajustado após playtest. Não há promessa de diversão ou duração medida.

## Autoridade e segurança

Salvar vida, rodada, consumo de habilidade, status e versão por tentativa. Mesma operação repetida retorna o resultado original, sem rodada adicional; duas operações sobre a mesma versão permitem só uma alteração. Aleatoriedade futura exigirá decisão própria e fonte controlada no servidor; não faz parte deste design. Persistência, concessão e testes de falha ficam definidos em [Loop](CORE-GAMEPLAY-LOOP.md).

