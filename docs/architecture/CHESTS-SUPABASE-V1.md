# Sistema de Baús — Supabase V1

## Estado

Código, migrations e rollbacks estão versionados. O usuário confirmou em 2026-09-30 que `0002_traveler_chests.sql` foi aplicada ao Supabase real. A integração atualizada das Missões da Guilda requer ainda a aplicação administrativa da incremental `0003_guild_mission_chest_rewards.sql`.

## Causa do problema anterior

Não existia um objeto persistido que representasse posse de Baú:

- os pontos chamados de Baú no Jardim eram abertos imediatamente e salvavam somente moedas e o ID em `gardenOpenedChests`;
- recompensas da Guilda possuíam apenas `chestLabel`; os claims entregavam XP/moedas e marcavam o desafio como concluído;
- a Mochila renderizava somente `Traveler.inventory`, que contém equipamentos.

Por isso uma mensagem podia dizer “Baú” sem existir quantidade para a Mochila carregar.

## Modelo

Baús não reutilizam `inventory`: equipamentos têm identidade/catálogo e podem ser equipados, enquanto Baús são pilhas consumíveis com origem, compra, RNG, retry e histórico próprios.

| Tabela             | Responsabilidade                                                                        |
| ------------------ | --------------------------------------------------------------------------------------- |
| `traveler_chests`  | quantidade por Traveler/tier e fila de origens correspondente a cada unidade            |
| `chest_operations` | ledger idempotente de grants, compras e aberturas, com preço e recompensa materializada |

`UNIQUE(traveler_id, operation_key)` impede repetir uma intenção. A abertura gravada é a autoridade do resultado; o RNG não é recalculado em retry.

No modo local, os equivalentes ficam no próprio save estritamente validado: `chests`, `chestSources`, `chestOperationIds` e `chestHistory`. Histórico é limitado a 100 aberturas e operações a 200 IDs.

## Catálogo, preços e disponibilidade

A fonte compartilhada da UI e do modo local é `chestCatalog` em `@rpg/game-engine`.

| Tipo           |         Preço | Requisito | Disponibilidade |
| -------------- | ------------: | --------: | --------------- |
| Comum          |            40 |   nível 1 | sempre          |
| Incomum        |            90 |   nível 1 | sempre          |
| Raro           |           180 |   nível 3 | por nível       |
| Épico          | não comprável |   nível 5 | evento/desafio  |
| Extraordinário | não comprável |  nível 10 | Guilda          |

Épico e Extraordinário não podem ser comprados infinitamente. Os checks autoritativos de preço e nível estão fechados na RPC, não no payload do browser.

## Loot

As probabilidades ficam em uma tabela única do game engine para modo local e são espelhadas na RPC autoritativa:

| Tipo           |                              Moedas | Chance de equipamento |
| -------------- | ----------------------------------: | --------------------: |
| Comum          |       25; ou 10 + Espada do Caminho |                   20% |
| Incomum        |     55; ou 20 + Couraça do Viajante |                   30% |
| Raro           | 105; ou 35 + Escudo da Perseverança |                   35% |
| Épico          |       190; ou 70 + Elmo do Viajante |                   45% |
| Extraordinário |   360; ou 120 + Medalhão do Caminho |                   50% |

Não há XP em Baús. Equipamento duplicado incrementa `inventory.quantity`; a Mochila mostra a quantidade e nada é apagado silenciosamente. Consumíveis/cosméticos permanecem extensões futuras do contrato de reward.

## Operações

### Grant

`grant_traveler_chest` recebe Traveler, tier, origem e chave determinística. É função interna sem grant para `authenticated`. Chamadores autorizados são responsáveis pela regra que originou o prêmio:

- conclusão da fase usa `claim_chest_reward` com chave fechada `phase:garden-choice`;
- missão remota da Guilda chama o grant dentro do mesmo processamento de reward;
- claims locais usam `grantChest` com chaves derivadas do conteúdo.

### Compra

`purchase_chest`:

1. valida `travelers.user_id = auth.uid()`;
2. recupera retry anterior pela operação;
3. resolve preço/nível no SQL;
4. registra a intenção;
5. reutiliza `spend_coins` na mesma transação;
6. incrementa a pilha e registra origem `shop`;
7. grava e retorna o resultado.

Qualquer exceção desfaz débito, ledger e grant juntos.

### Abertura

`open_chest`:

1. valida ownership;
2. retorna o resultado anterior no retry;
3. bloqueia a pilha com `FOR UPDATE`;
4. sorteia somente no banco;
5. consome uma origem/unidade;
6. soma moedas e incrementa o equipamento, se houver;
7. grava a recompensa materializada no ledger;
8. retorna somente o resultado confirmado.

A UI nunca usa `Math.random()`. O modo local injeta um roll em `selectChestReward`, obtido via `crypto.getRandomValues`.

## Interface

`Mochila` contém as abas Itens, Equipamentos e Baús. Baús oferece:

- badge com total não aberto;
- estado vazio explicativo;
- cards de posse e catálogo;
- preço em Moedas do Viajante;
- abertura em modal curto com brilho, resultado, “Pular animação” e “Continuar”;
- layout fluido que empilha os cards em telas estreitas;
- animações desativadas com `prefers-reduced-motion`.

## Aplicação manual

1. Confirmar backup e projeto Supabase correto.
2. Garantir que `0000_initial_supabase_gameplay.sql` e `0001_guild_supabase_v1.sql` estão aplicadas.
3. Aplicar integralmente `packages/database/migrations/0002_traveler_chests.sql` por conexão administrativa segura.
4. Atualizar o schema cache do PostgREST, se necessário.
5. Não executar `.down.sql` em produção: ele remove posses e histórico de Baús.

## Aceite remoto obrigatório

Com duas contas e Travelers distintos:

1. concluir a fase e confirmar um único Baú Comum após F5;
2. concluir Missões Normal/Grande/Épica/Extraordinária e confirmar respectivamente Baú Comum/Incomum/Raro/Épico; confirmar que nenhuma concede Baú Extraordinário;
3. comprar Comum/Incomum e conferir débito + grant atômicos;
4. repetir a mesma operação e confirmar ausência de débito/grant adicional;
5. tentar Raro abaixo do nível 3 e receber negação;
6. abrir um Baú e conferir quantidade, moedas/item e ledger;
7. repetir a mesma abertura e obter o mesmo resultado sem nova recompensa;
8. ganhar equipamento repetido e confirmar incremento de quantidade;
9. tentar consultar/usar o Traveler da outra conta e receber zero linhas/erro;
10. reabrir em outro navegador e confirmar posse/histórico remotos.

Sem essas evidências, a implementação pode passar QA local, mas não deve ser marcada como aceita no projeto real.
