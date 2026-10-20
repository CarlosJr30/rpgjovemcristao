# Consolidação 003 — seis propostas e a sétima ação pendente

Registro de design, não concessão ou homologação econômica. A fonte executável das fichas é [arena-card-catalog.ts](../../packages/game-engine/src/arena-card-catalog.ts). `getArenaCardCatalog()` reúne propostas; `getApprovedArenaCards()` continua vazio. IDs reservados não devem ser reutilizados para outro efeito.

## Primeiro conjunto

| ID estável | Nome | Tipo existente | Ação real | Nível / Foco base | Estado |
| --- | --- | --- | --- | --- | --- |
| arena-card-basic-attack | Ataque Simples | OFFENSIVE | attack | 1 / 0 | proposta |
| arena-card-basic-defense | Defesa | DEFENSIVE | defend | 1 / 0 | proposta |
| arena-card-path-strike | Golpe do Caminho | OFFENSIVE | special:path-strike | 2 / 2 | proposta |
| arena-card-steadfast-guard | Guarda Perseverante | DEFENSIVE | special:steadfast-guard | 4 / 2 | proposta |
| arena-card-discernment | Discernimento | TACTICAL | special:discernment | 6 / 2 | proposta |
| arena-card-pilgrim-step | Passo do Peregrino | TACTICAL | special:pilgrim-step | 8 / 3 | proposta |

Os números acima documentam o motor existente. Em runtime, níveis/custos/parâmetros vêm de arenaSpecials, arenaCombatConfig e battleBalanceConfig; os textos vêm de describeArenaAction da 0086. `describeCatalogCard(id,fighter)` considera o snapshot e os modificadores reais, sem prever decisão oculta do adversário. Multiplicadores ofensivos não são percentuais da vida, Guarda respeita arredondamentos e a esquiva não cura. Nenhuma descrição numérica nova foi escrita na interface.

Cada ficha contém versão de catálogo `arena-cards-2026-10-20.1`, versão de balanceamento `arena-v2-existing-effects-0086.1`, descrição/condição/duração, parâmetros numéricos, nível/Foco, uso único, permanência na coleção, status de homologação, fontes propostas/autorizadas e referência de arte. Todas começam `proposed`, sem referência de aprovação, arte ou fonte autorizada. Os nomes são nomes de mecânicas de jogo já existentes, classificados FICTIONAL; não são versículos ou afirmações canônicas. Referência bíblica nula, sem citação inventada ou necessidade de nova pesquisa teológica.

Proposta inicial de raridade: todas **Comum**, para que o starter não dependa de distribuição rara. É metadado ainda sujeito a homologação; não muda custo, poder ou probabilidade. O domínio aceita somente comum/incomum/raro/épico/lendário, este último apresentado como Extraordinário pelo sistema existente. Nenhuma Mítica. Novas raridades/distribuição só por contrato próprio; nenhuma carta foi inserida na tabela de sorteios.

## Por que o baralho ainda não fecha

Há seis ações de ArenaV2 e seis propostas distintas, faltando uma. `focus`/`equipment` da engine legada/lab não são ações de carta da Arena atual. Equipamento automático, ilustração, raridade ou outro ID para o mesmo efeito não cria uma sétima carta legítima. O validador continua exigindo sete IDs únicos; não foi alterado para aceitar seis ou repetição.

No nível 1, apenas as duas propostas básicas são utilizáveis; as demais preservam níveis 2/4/6/8. Possuir uma carta não ignora nível ou Foco. O contrato atual permite selecionar uma carta funcional cujo uso ainda depende de nível/Foco, mas não a torna disponível na batalha. Não rebaixar requisitos existentes para fingir que sete habilidades iniciais estão liberadas.

## Proposta mínima para aprovação: Golpe Medido

Esta seção **não é implementação**, ficha oficial, ID de coleção ou efeito homologado. Contrato separado em [TASK-CONSOLIDATION-003A](../../tasks/backlog/TASK-CONSOLIDATION-003A-seventh-card-proposal.md), BACKLOG, sem autorização para executar nova ação.

Uma nova ação ofensiva poderia reutilizar calculateDamage e os mesmos equipamentos/Defesa/guarda/armadura/arredondamento, mudando somente um multiplicador próprio da nova ação. Candidato a balancear: nível 1, custo 1 Foco, multiplicador ofensivo **1,15**, sem gerar Foco e sem bônus/estado adicional; uma utilização por batalha via carta. Referência comparativa existente: ataque básico custa 0 e gera Foco; Golpe do Caminho exige nível 2, custa 2 e usa 1,45. São propostas de valores, não conclusões de equilíbrio ou alteração das fórmulas globais.

A diferença precisa ser comprovada em cenários fora do dano mínimo/teto de HP, com custo de oportunidade e build/equipamento. Não basta uma nova skin ou nome. Não adicionar botão principal: conservar Atacar/Defender/Cartas. O jogador teria que carregar Foco antes do Golpe Medido; nenhuma ativação gratuita automática. O comando continua enviando apenas cardId, identidade e revisão, e o resolvedor escolhe ação/parâmetros da versão congelada.

Antes de implementar: aprovação explícita da ação e intervalo inicial de balanceamento, revisão do contrato de homologação, testes comparativos de dano/arredondamento/nível/Foco/equipamentos/uso/revanche/replay/IA e compatibilidade de versão. Não usar essa proposta para concluir 7/7 nesta tarefa. Não implementar uma segunda engine, nova recompensa ou combate autoritativo aqui.

## Starter proposto, ainda desativado

Após sete fichas homologadas e protocolo de aquisição aprovado, propor um conjunto fixo com uma unidade de cada ID, sem sorteio. Se Golpe Medido for aprovado no desenho acima, nível 1 teria três cartas utilizáveis e quatro com requisito futuro; básicos Atacar/Defender continuam disponíveis. A aceitação desse perfil inicial é decisão de produto, não rebaixamento silencioso dos níveis. Se a exigência passar a ser sete habilidades utilizáveis no nível 1, será necessário outro desenho aprovado; este conjunto não atende essa exigência.

Recomenda-se concessão única por **conta**, vinculada ao Viajante destinatário, com chave de programa/versionamento; criar outro Viajante ou novo UUID de requisição não reinicia o direito. Essa política é proposta a aprovar, não nova regra econômica ativa. Nenhum ID entrou no inventário, nenhum programa de starter existe em produção e a Arena permanece bloqueada. [Aquisição, recibos e plano de backend](../architecture/CONSOLIDATION-003-ACQUISITION-AND-RECEIPTS.md).
