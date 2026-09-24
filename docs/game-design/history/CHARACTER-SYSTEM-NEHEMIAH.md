> SUPERSEDED — histórico da TASK-0003. Não rege o produto atual. Ver [MVP vigente](../MVP.md), TASK-0006.

# Sistema de personagem

Fonte de verdade v1 para TASK-0003. Todos os atributos, itens e efeitos são FICTIONAL, convenções de jogo; não medem fé, santidade ou valor espiritual.

## Criação

Um personagem por conta, criado uma única vez pelo servidor com XP 0, nível 1, inventário inicial e retrato padrão. Sem classe, gênero obrigatório ou customização extensa. Nome: pseudônimo privado de 3–20 caracteres após remover espaços nas extremidades; aceitar letras com acentos, espaços simples e hífen, sem HTML/controles. Validar também no servidor e renderizar como texto. Não pedir nome real. Nome/retrato não afetam regras; edição de nome fica fora do slice.

## Atributos e XP

| Nível | XP total mínimo | Vida máxima | Ataque base | Defesa base | Velocidade |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 30 | 8 | 2 | 5 |
| 2 | 100 | 36 | 10 | 3 | 5 |
| 3 | 300 | 42 | 12 | 4 | 5 |

XP é cumulativo, não gasto. M1 concede 100, M2 concede 100 e M3 concede 100: totais 100/200/300. Nível é derivado da tabela, com teto 3; não há repetição remunerada nem fonte adicional. Sem distribuição manual, mana, crítico, esquiva ou atributo espiritual. Velocidade determina iniciativa, não ações extras. Vida atual fica entre zero e a máxima; dano nunca a torna negativa.

Subir de nível atualiza atributos e restaura a vida. Toda nova batalha começa com vida cheia; a vida atual só persiste durante a tentativa. Derrota não perde XP, nível ou equipamento. Personagem fica apto a tentar novamente; não há morte permanente.

## Equipamentos e inventário

Quatro espaços; cada item ocupa um, inclusive equipado. Sem pilhas, peso, venda, troca, descarte ou duplicatas. Dois slots: mão e proteção. Só alterar equipamento no mapa, sem missão ativa; ao entrar na missão, a configuração fica fixa até vitória/abandono. Não há bônus ocultos.

| ID / item | Aquisição única | Slot / efeito |
| --- | --- | --- |
| I1 / Bastão de treino | Criação do personagem, equipado | Mão; +0 ataque, identidade visual |
| I2 / Proteção de treino | Conclusão de M1 | Proteção; +1 defesa quando equipada |
| I3 / Lembrança da jornada | Conclusão de M3 | Nenhum; lembrança sem bônus |

Recompensa I2 entra no inventário e o mapa destaca a ação Equipar; não depende dela para vencer M2/M3. Ataque efetivo = base + bônus da mão; defesa efetiva = base + bônus da proteção. No máximo três espaços ocupados, portanto não existe overflow no conteúdo aprovado. Se o servidor encontrar posse/capacidade inválida, não descartar prêmio: a transação inteira falha e exige correção/retentativa, sem conclusão parcial.

## Habilidade e exemplos de aceite

Golpe preciso: uma vez por batalha, +4 ao ataque usado no cálculo de dano; não altera permanentemente o atributo. Reinicia apenas em nova tentativa, nunca ao reconectar. Regras completas em [Batalha](../BATTLE-SYSTEM.md).

- Após M1: XP 100, nível 2, vida máxima 36, ataque 10, defesa 3; equipar I2 eleva defesa a 4.
- Após M2: XP 200 e nível 2, sem novo item. Após M3: XP 300, nível 3 e I3; defesa com I2 = 5.
- Reabrir a tela de recompensa ou repetir conclusão conserva XP/posse.
- Nome inválido, segundo personagem ou equipamento não possuído é rejeitado sem alterar o estado.

