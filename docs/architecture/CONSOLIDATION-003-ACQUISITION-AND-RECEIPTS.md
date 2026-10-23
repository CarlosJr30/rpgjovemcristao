# Consolidação 003 — aquisição, posse e recibos

Plano revisável de integração. Não é protocolo ativo, SQL aplicado, novo inventário ou fonte de cartas. A [proposta de design](../game-design/CONSOLIDATION-003-CARDS-AND-SEVENTH-EFFECT.md) contém seis fichas e a extensão mínima pendente. O [relatório](TASK-CONSOLIDATION-003-REPORT.md) distingue implementação, fixtures e bloqueios.

## Auditoria das fontes reais

| Fonte | Evidência atual | Situação para cartas |
| --- | --- | --- |
| Inventário | public.inventory, chave traveler_id/item_id, quantidade e metadata; repository existente permite escrita própria | Row/metadata/quantidade não comprovam concessão oficial. Não converter equipamento em carta |
| Baú | open_chest confirma moedas/equipamento em chest_operations, operation_key open:UUID, fonte/tier/traveler, unicidade traveler_id/operation_key | JSON legado não contém cartas. Nenhuma tabela de sorteio/valor/probabilidade alterada |
| Missões | guild_reward_claims e legado de prêmio; fluxo0082 termina aprovado com recompensa pendente | Aprovação do líder não vira carta nem chama concessão nova; precisa liquidação autorizada0078 |
| Jornada | Há prêmios legados fixos. Rascunho econômico0009 na raiz contém economy_private.journey_rewards/journey_operations | Arquivo pendente/não importado/não aplicado; não é autoridade disponível ou recibo ativo desta branch |
| Desafios/Torre | Progresso local e replay demonstrativo; contrato de autoridade existente | Vitória/flag/localStorage não comprova direito. Recebimento oficial depende004 e integração0078 |
| Starter | Não há concessão de cartas ou recibo de programa inicial | Desativado; não inventar operação de baú para representar starter |

O risco de escrita própria do inventário soma-se ao P1 econômico já reproduzido001/002. A 003 não fecha esse cutover global. O loader de cartas foi alterado para negar aquisição até existir leitura autoritativa revisada, sem consultar inventory para construir coleção oficial. O helper legado de projeção preserva os testes sintéticos, mas recusa o prefixo reservado `arena-card-`, inclusive com catálogo proposto e quantidade positiva. APPROVED_ARENA_CARDS deriva do catálogo e continua vazio.

## Fronteira de confiança

1. Conta não anônima autenticada; identidade vem de auth.uid e ownership atual do Viajante no servidor, nunca de userId/role/metadata enviados pelo navegador.
2. Fonte elegível e prova imutável obtidas pelo serviço responsável: operação de baú committed, missão liquidável, conquista autoritativa ou programa inicial aprovado. Uma submissão/flag local não é essa prova.
3. Servidor seleciona somente cardId homologado e versões de catálogo/balanceamento permitidas; consulta definição pelo ID. Nome/raridade/action/custo/parâmetros do cliente são ignorados ou recusados.
4. Mesma transação valida unicidade, vincula prova a destinatário, registra recibo no ledger econômico aprovado e atualiza **inventory existente**. Falha reverte concessão/recibo juntos; não registrar posse somente no frontend.
5. Endpoint de leitura autoritativo relaciona conta→Traveler→concessão committed→ID/versão→inventory. Cliente pode projetar essa resposta na UI, mas não certifica sua própria posse nem a batalha. O backend004 revalida ao criar sessão/usar carta.
6. Animação só lê recibo confirmado e depois inventário sincronizado; estado visual/skip/replay não sorteiam, concedem, equipam ou chamam novamente a liquidação.

`resolveApprovedArenaCard` recebe apenas ID e consulta o registro interno; objetos com status/efeito inventados não são promovidos. É validação de catálogo, não autenticação de servidor ou prova econômica. O motor existente ainda aceita definições injetadas pelos harnesses de teste; isso não é API autoritativa e continua explicitamente fora do aceite004.

## Extensão compatível do recibo de baú — proposta v2

Preservar leitura v1 e o resultado persistido de aberturas antigas. Para novas operações, após aprovação do backend/SQL, propor um discriminador schemaVersion:2, catalogVersion e entradas ordenadas do servidor. Uma entrada de carta deve conter cardId, definição/versionamento aprovado, quantity:1 e referência da concessão vinculada à própria operação; nunca um objeto action/effect enviado pelo cliente. Campos legados e v2 não devem ser misturados por inferência. Não alterar retrospectivamente recibos já committed.

Antes de animar v2, o adapter futuro verificará identidade/operation_type=open/key/tier/source, versão suportada, catálogo ativo, vínculo do recibo/concessão e posse sincronizada. O recebimento isolado da resposta RPC ou um JSON bem formado não substitui leitura autenticada do registro. O adapter atual continua recusando cards/schemaVersion/IDs das seis propostas como item de equipamento. O contrato visual já admite kind:card somente em fixtures, com arte nula quando não aprovada; o renderer usa o efeito do motor e a raridade existente.

Replay retorna o mesmo resultado econômico canônico, sem novo sorteio/delta. Uma nova UUID não pode reaproveitar o mesmo direito de origem. A unicidade econômica deve usar a prova/canonical source key além da chave de transporte. Quantidade maior que1 não cria dois slots para o mesmo ID. Duplicata de carta já possuída deve seguir política explicitamente aprovada; não inventar compensação em moedas, fusão, reroll ou poder adicional. Proposta conservadora: manter posse de uma unidade e registrar alreadyOwned no resultado do servidor, sem delta de carteira; nenhuma distribuição foi ativada aqui.

## Starter proposto e idempotência

Programa fixo de sete IDs homologados, mesma versão, destinatário verificado e sem sorteio. Proposta de unidade de concessão: uma por **conta**, vinculada ao Viajante escolhido; chave única conta/programa, não apenas requestId. Viajante novo, reload, outra aba, retry, outro dispositivo ou nova UUID não reiniciam o direito. Esta política ainda exige aprovação; nenhuma função de starter foi implementada.

Transação futura: lock da conta/direito; validar auth/owner/programa/catalogVersion/sete IDs distintos e sete definições; ler concessão anterior; se existente, devolver recibo idêntico sem inserir; caso contrário, registrar reivindicação no ledger aprovado e inserir as sete posses de quantidade1 no inventário existente, depois commit. Falha parcial desfaz todas as sete. Outro destinatário para a mesma chave deve ser negado, não transferir ou apagar posse antiga. Catálogo/versão incompatíveis bloqueiam a concessão preservando o recibo. Sem SQL/servidor autorizados, a garantia atual é mais restrita: **nenhuma concessão pode ocorrer**.

## Esquema futuro e critérios para SQL

As fichas puras não exigem alteração de banco. Não há DDL novo nesta tarefa nem teste PostgreSQL novo alegado; evidências002 continuam válidas para o baseline inalterado. Criar agora outro ledger de cartas para suprir a ausência do protocolo comum violaria a integração pretendida. A definição do ledger/cutover0078 e o contrato de fontes/starter são pré-requisitos para escrever o SQL executável da concessão. Esse próximo SQL deverá ser local, revisado e ensaiado em PostgreSQL descartável antes de qualquer aplicação autorizada.

| Área futura | Constraints/ACL/RLS a comprovar |
| --- | --- |
| Catálogo versionado | Unicidade ID/versão, enum de ação suportada/raridade, parâmetros finitos/limites, status e referência de homologação, definição imutável depois de usada; só serviço autorizado altera |
| Posse | Reutilizar PK inventory(traveler_id,item_id); quantidade1 para carta, sem mudar empilhamento de equipamentos; impedir INSERT/UPDATE/DELETE de carta por anon/authenticated e qualquer RPC legado genérico |
| Recibo econômico | Reutilizar/extender ledger aprovado0078 e a origem existente; prova única/canonical key + destinatário + catálogo/versão + resultado committed; não criar tabela de carteira/inventário paralela |
| Starter | UNIQUE(conta,programa) proposto, FK/ownership do destinatário, sete IDs distintos, lock/idempotência/rollback atômico e recibo read-only próprio |
| Leitura | RLS/ownership por auth.uid, sem listar coleção/recibo de outro Traveler; schemas privados fora da Data API; não confiar só em shape/UUID |
| Funções | Grants mínimos, PUBLIC/anon sem mutação, DEFINER com search_path controlado e identidade verificada, sem aceitar action/parâmetros/resultados de batalha do browser |
| Índices | Usar PK/unique acima e consulta por owner/traveler/source; acrescentar índices somente com consulta justificada e EXPLAIN local |

Negativas futuras obrigatórias: usuário anônimo, owner trocado durante concessão, outro Traveler/conta, origem pendente/falsa, versão não suportada, carta não homologada, replay sob UUID nova, corrida de duas abas/contas, mudança de destinatário/programa, falha após terceiro insert e acesso direto ao inventário. Positivos de idempotência/rollback/constraints não recebem PASS nesta entrega porque o backend ainda não existe.

Recuperação futura: antes do commit, rollback; após commit, suspender o módulo e preservar recibos/posse, corrigir por operação compensatória aprovada no mesmo ledger. Não apagar cartas/recibos/saves, não reaplicar starter nem reabilitar grants legados para resolver erro. Fonte, versões, IDs e SHA revisados devem integrar o recibo de instalação/validação.
