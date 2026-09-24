# Personagem, progressão e recompensas

Fonte oficial de PROGRESSION & REWARDS e personagem, atualizada pela TASK-0007. O [balanceamento de Neemias](history/CHARACTER-SYSTEM-NEHEMIAH.md) é SUPERSEDED para a campanha atual; não reutilizar seus números automaticamente.

## Criação e classes

Criação do personagem é separada de criação da conta e vínculo com igreja. Preservar um personagem por conta como limite inicial de simplicidade, pseudônimo privado e retrato sem efeito espiritual. Não exigir nome real, gênero ou igreja para jogar. Validação e renderização segura do pseudônimo permanecem necessárias.

Escolha inicial de GUERREIRO, SACERDOTE, PROFETA e ARQUEIRO: **SUPERSEDED**, removida do design inicial. A pendência de classes da TASK-0006 está encerrada. Classes tradicionais não poderão ser introduzidas posteriormente sem nova decisão explícita de game design.

Todo jogador começa no **nível 1, sem classe ou especialização**, com a mesma configuração mecânica base. **VIAJANTE** é o nome provisório do personagem inicial; poderá ser refinado sem mudar a mecânica.

> Você não escolhe quem será no começo. Sua jornada constrói quem você se torna.

As escolhas iniciais são principalmente nome, aparência/avatar e customização cosmética permitida. Aparência não concede vantagem mecânica. Evolução, equipamentos, talentos, escolhas de build, exploração e recompensas poderão diferenciar o personagem ao longo da jornada. Talentos são direção futura: nenhuma árvore está especificada ou implementada nesta tarefa.

## Atributos mecânicos

| Atributo | Finalidade de gameplay |
| --- | --- |
| VIDA | Resistência em sistemas de gameplay apropriados |
| FORÇA | Capacidade ofensiva em mecânicas futuras adequadas |
| DEFESA | Proteção e redução em desafios apropriados |
| SABEDORIA | Puzzles, investigação e determinadas interações de gameplay |

São convenções FICTIONAL de jogo, com base 1 igual para todos. O total deriva de base + equipamento + progressão configurada + efeito temporário, conforme [Sistema de atributos](ATTRIBUTE-SYSTEM.md). Sabedoria é exclusivamente mecânica: não representa sabedoria espiritual real, fé, conhecimento de Deus, maturidade cristã ou santidade. Dicas adicionais podem apoiar puzzles, mas nunca resolvê-los automaticamente. Não transformar o atributo em nota do Quiz ou juízo espiritual sobre o jogador.

## Funções oficiais

| Sistema | Função | Limite |
| --- | --- | --- |
| XP | Progressão no jogo por objetivos verificáveis e conquistas de gameplay | Não representa fé, espiritualidade, santidade ou conhecimento de Deus; não pontuar oração/reflexão |
| LEVEL | Evolução do personagem; pode abrir conteúdo, regiões, recursos, customizações e desafios | Pré-requisitos narrativos continuam necessários; nível nunca permite saltar/alterar fatos canônicos |
| MOEDAS | Economia interna: cosméticos, roupas, personalização, itens, colecionáveis e decoração | Sem monetização nesta fase, compra de aprovação, pay-to-win ou acesso bíblico pago |
| EQUIPAMENTOS | Aparência e utilidade em exploração/minigames/desafios, com pequenas vantagens transparentes | Não se limitam a ataque; nunca mudam acontecimentos canônicos nem dispensam desafio |
| ITENS | Recursos de interação e recompensas definidas por conteúdo | Não são objetos espirituais que medem mérito; efeitos e limites explícitos |
| COLECIONÁVEIS | Descoberta, memória da jornada e incentivo a replay | Regras e proveniência em [Codex](CODEX-COLLECTION.md) |

XP é cumulativo e não gasto; nível é derivado da curva de regras versionada. Moedas têm saldo não negativo, concessões e gastos autorizados no servidor; cliente não informa saldo/recompensa final. Valores, curva, fontes/sumidouros, preços, slots e capacidade serão fechados no design do slice. Níveis 1–3, 100 XP por missão e inventário de quatro espaços não são parâmetros atuais aprovados.

Prêmios de comunidade podem reconhecer conclusão objetiva, mas nunca a qualidade de prática espiritual. Seu balanceamento deve impedir que vínculo/aprovação se tornem necessários para qualquer requisito principal. Não vender vantagem nem oferecer equipamento necessário exclusivamente por dinheiro real ou aprovação comunitária.

## Equipamentos e desafio justo

Exemplos de possibilidades FICTIONAL, não catálogo aprovado: ferramenta destaca pista adicional; vestimenta muda aparência; recurso oferece pequena margem de erro num puzzle. Toda vantagem tem limite e descrição; sempre deve existir solução acessível com recursos in-game básicos. Nenhum equipamento abre o mar, derrota Golias pelo jogador ou altera escolha de personagem bíblico. Não aprovar poderes de oração nem atributos espirituais.

Equipar exige posse e compatibilidade; configuração da tentativa fica fixada para evitar troca no meio do desafio. Pausa/reconexão não renova uso consumido. Regras específicas de troca e tentativas serão definidas no slice; não importar slots de combate para toda modalidade.

## Concessão e replay

Servidor calcula elegibilidade. Conclusão, concessão, XP/moedas, posse e desbloqueio devem confirmar atomicamente; recibo permite retomar após resposta perdida. Identidade única de concessão de negócio impede duplicação mesmo com novo ID de operação. Recompensa principal: uma vez por personagem/objetivo publicado; replay não repaga. Objetivo opcional ou descoberta inédita pode ter sua própria concessão única. Sem recompensas aleatórias ou recorrentes aprovadas nesta tarefa. [Quiz](QUIZ-SYSTEM.md) define suas possibilidades de prêmio e bônus limitado por melhoria de recorde, ainda dependente de regras futuras; sorteio de perguntas não implica sorteio de recompensa.

Derrota, recusa comunitária ou pular reflexão não retiram XP/moedas/itens existentes. Ajuda acessível não reduz prêmio principal. Curvas devem permitir toda progressão principal sem comunidade, compras ou completar todos os segredos. Não equiparar nível a maturidade cristã.

## Pendências de balanceamento

Curva de XP/level, economia, catálogo, utilidades, inventário, desafios, duração e valores de prêmio precisam de teste futuro. Equipamento com bônus deve ser avaliado com e sem benefício. Diversão e ausência de grind são metas a validar, não resultados comprovados.
