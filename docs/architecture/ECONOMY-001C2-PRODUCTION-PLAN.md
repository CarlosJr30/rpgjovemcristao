# ECONOMY-001C.2 — pacote produtivo próprio

03/11/2026. **Preparado, sem DDL/merge/deploy PROD. D5 pendente.** Pedido1731b83f autoriza a preparação e publicação após os gates e a aprovação explícita das decisões econômicas faltantes. PR31a31f0a8 confirmada; fechamento76b9e45 incorporado por fast-forward, sem perder commits.

## D5 — única decisão econômica proposta

| Produto existente | ID canônico | Preço proposto PROD |
| --- | --- | ---: |
| Baú comum |common|40moedas|
| Espada do Caminho |traveler-sword-common|35moedas|
| Couraça do Viajante |traveler-armor-uncommon|65moedas|
| Escudo da Perseverança |traveler-shield-rare|115moedas|

Aprovação solicitada para esse catálogo restrito e seus preços, preservando efeitos, raridades, slots, artes e demais regras existentes. O Elmo do Viajante continua somente como conteúdo épico aprovado, sem preço de venda. Conteúdo dos comuns/épicos, cotas e calendário já aprovados emD1/D2 não são decisões novas. Não há venda de cartas, outro tipo de baú, pagamento real, crédito grátis ou reconciliação de legados nesta proposta. Aprovação de TEST emD3 não equivale à aprovaçãoD5.

## Arquivos e fronteira

- PROD próprio: `20261103045257_economy_001c_community_chests_production.sql` e `20261103045303_economy_001c_shop_release_production.sql`. TEST incremental separado: `20261103045300_economy_001c_shop_release_test.sql`. Arquivos TEST anteriores permanecem intactos.
- Guardas de projeto/escopo/protocolo e definições/ACLs legadas. A migration da Loja PROD exige também o registro operacional explícito da decisãoD5; a configuração sintética dos testes não é autorização humana.
- Nenhuma tabela/perfil/orçamento QA será criado em PROD. Autoridades genéricas continuam fechadas; novos wrappers públicos INVOKER usam sessão atual e avatar próprio. Débito/entrega/sorteio/equipamentos reutilizam autoridades existentes, sem integrar PR12 inteira.
- Saldo canônico reúne créditos comunitários e débitos/aberturas da Loja. Isso permite abrir um baú comunitário depois de uma compra legítima, sem confundir gasto com fraude. Operações suspeitas permanecem suspensas, com histórico privado imutável.

## Preservação e recuperação

Os20avatares PROD não reconciliados continuam bloqueados para operações dependentes; saldos e inventários não serão modificados para desbloqueá-los. Novos avatares com saldo0 não recebem moedas no login: a fonte é atividade elegível posterior à ativação e abertura autorizada. Consultas e módulos independentes permanecem disponíveis.

Recuperação vazia própria, na ordem Loja→baús, recusa histórico emitido. Contenção revoga apenas novas escritas e mantém vínculos, recibos, saldo, inventário e a leitura do saldo canônico. Propostas em `packages/database/proposals/economy-001c-*-production.sql` e `economy-001c-shop-release-*-prod.sql`; execução remota somente se necessária.

Validação adicional mínima:14PG da fronteira produtiva,2da compatibilidade TEST/QA e7unitários novos PASS; provas anteriores reutilizadas. Build/tipos/lint PASS; variável sem uso no coletor corrigida sem desativar regra. CI exato/Preview final/preflight autenticado/ativação PROD ainda pendentes. Nenhuma nova compra, abertura ou batalha PROD será usada para fabricar prova. Não DEPLOY_COMPLETE.
