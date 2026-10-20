# Golpe Medido — ensaio local da candidata003A

Autorização do pedido003A: implementar/balancear somente localmente nível1, custo1 Foco, multiplicador ofensivo inicial1,15. Não é homologação, concessão ou liberação ao jogador. Identidade da carta proposta: `arena-card-measured-strike`; ação interna `special:measured-strike`.

## Fórmula e interações

Reutiliza calculateDamage e a ordem existente: parcela ofensiva `O=3+2,2×Força+0,18×soma do poder dos itens`; subtrai `1,15×Defesa` do alvo; multiplica pelo estado tático preparado, bônus da espada após Defender quando aplicável, **1,15 da ação** e potência própria limitada ao intervalo já existente1–1,25. Arredonda ao inteiro mais próximo, piso1. Guarda então multiplica por0,5 ou0,25 com ceil/piso1; armadura com guarda aplica0,85 com novo ceil/piso1; esquiva zera; aplicação fica limitada ao HP restante. Os números são documentação do cálculo vigente, não cópia no React. Fonte executável continua nas constantes e resolvedor existentes.

Exemplo testado sem equipamento/guarda: Força5 e Defesa2 produzem `3+11−2,3=11,7`; `round(11,7×1,15)=13`. Arredondar ataque básico12 e depois multiplicar daria14, o que foi explicitamente recusado pelo teste. Com guarda básica/armadura, resultado7/6; com guarda forte/armadura,4/4. Não prometer +15% de dano final, percentual do HP, cura ou energia extra.

Custo base1, desconto limitado ao máximo existente1 e piso1, portanto nunca gratuito. Ação não gera Foco e não recebe cooldown próprio. Bônus tático e espada após Defender são compartilhados com ataques; o reforço ativo de1,28 da Espada permanece exclusivo do Golpe do Caminho e não gasta uso/cooldown ao usar Golpe Medido. Potência própria do snapshot respeita o mesmo clamp já existente. Esquiva, armadura e equipamentos não ganharam gatilhos novos.

O novo special é cardOnly: não entra no loadout legado/IA, não cria botão ou aviso de desbloqueio por nível, e a API de produto continua aceitando somente básicos/cardId/identidade/rodada. Especial direto também é recusado no resolvedor legado para esta candidata. Seis efeitos anteriores continuam com as mesmas regras; os quatro especiais legados mantêm seus slots e escolhas.

## Comparativo de um comando

Matriz reproduzível em `apps/web/features/arena-tower/measured-strike-balance.test.ts`, artefato `build/task-consolidation-003a/balance-results.json` **dentro do checkout**. São14situações×3sementes(7/19/42)×3ações =126linhas, com parcela bruta, valor multiplicado/pré-guarda, dano aplicado, custo, Foco e motivo de bloqueio. A política do ensaio parte de3Foco, salvo caso sem Foco; não é uma concessão de energia no jogo.

| Situação, seed42 | Básico | Medido (1Foco) | Caminho (2Foco, salvo desconto) |
| --- | --- | --- | --- |
| Iniciante nível1/defesa baixa |4|5|bloqueado por nível|
| Intermediário |12|13|17|
| Avançado/defesa baixa |45|51|65|
| Avançado/defesa alta |13|14|18|
| Piso de dano |1|1|1|
| HP restante3 |3|3|3|
| Sem Foco |12|bloqueado|bloqueado|
| Espada após Defender |15|17|28|
| Desconto/potência/equipamento |12|18|29 (custo1)|
| Guarda básica |6|7|9|
| Guarda forte+armadura |3|4|5|

O custo-benefício incremental foi registrado como `(dano especial−dano básico)/custo de Foco`, sem dividir o básico por zero ou atribuir raridade como poder. Exemplo intermediário: Medido ganha1dano/Foco e Caminho2,5; no piso/HPcap, ambos ganham0. Com desconto, Caminho custa1 e mantém vantagem maior, além do reforço da espada; Medido não foi rebalanceado para ultrapassá-lo. Cada carta continua de uso único, não uma ação repetível para converter Foco em dano sem limite.

## Primeiros andares

Mais27batalhas completas: três andares×três sementes×políticas básico/Medido/Caminho. Mesmo Traveler sintético por comparação, vida4/força2/defesa2/sabedoria2 e nível correspondente ao andar; começa com Foco0. Cada política usa sua carta uma vez quando ficar disponível, caso contrário Atacar. NPCs/configs/dificuldade originais intactos.

- Andar1: seed7/19/42 terminou em9/7/6rodadas com básico e Medido; Caminho não pôde ser usado no nível1.
- Andar2: básico e Medido terminaram em7rodadas nas três sementes; Caminho em6.
- Andar3: básico levou10rodadas, com derrota em19/42; Medido levou9 e venceu nas três sementes, assim como Caminho.

Esse limiar mostra que +1dano pode decidir uma batalha. Não estimar win rate de jogadores a partir dessa amostra, nem dizer que a carta está perfeitamente equilibrada. Manter1,15 como candidata local autorizada; recomendar ensaios de homologação com mais builds, progressão e políticas antes de aprovação. Não alterar NPCs, valores da carta ou fórmula global para fazer a demonstração passar.

## Evidências e limites

Antes da alteração,64trajetórias de ações/IA antigas foram capturadas no HEAD003 e resumidas em SHA256 `7a15a1ef7743bf2a9afd21867e63eee9571d3f7edd38f6dbba1992edbcb0a928`; o teste pós-alteração mantém o mesmo hash. Perfis ágil/ofensivo/guardião/tático, níveis1/2/4/8, seeds7/42 e builds com/sem equipamento fazem parte desse recorte. É regressão determinística, não autoridade de servidor.

Gates/testes finais, falhas iniciais e classificação estão no [relatório003A](../architecture/TASK-CONSOLIDATION-003A-REPORT.md). Sete propostas são injetadas somente nos testes/harness isolado. Catálogo aprovado vazio; fontes/arte/referência bíblica/posse reais ausentes. Não houve concessão, SQL, backend de combate ou operação remota.
