# ECONOMY-001A — proposta de catálogo produtivo

**APROVADA expressamente pelo proprietário em02/11/2026:** “Aprovar catálogo e starter descritos”. Aprovação de catálogo/aquisição, condicionada aos gates TEST/CI/produção; não é prova de migration ou concessão executada. Sem alterações remotas nesta aprovação.

Fonte: packages/database/deployments/fixprod003/test-catalog.json, definitionsSha256 `ec5a22038ca372e57e9b64fc5883d3086a25db241b0d3f03e5c0e39d3437baf1`. A aprovação atual é exclusivamenteTEST; PROD não contém catálogo.

Proposta: homologar em PROD as **mesmas sete regras existentes**, sem alterar números, raridades, níveis mínimos, ações, efeitos ou artes: Ataque Simples, Defesa, Golpe do Caminho, Golpe Medido, Guarda Perseverante, Discernimento e Passo do Peregrino. Versão produtiva própria proposta `arena-cards-2026-11-02.1-economy-001a`; referência humana `ECONOMY-001A:OWNER:2026-11-02`. Somente metadados de versão/aprovação/aquisição terão identificadores produtivos, preservando o manifesto TEST original e seus registros.

Fonte de aquisição proposta: **starter existente**, exclusivamente por botão e confirmação do jogador autenticado, uma vez por identidade Auth, preso ao avatar escolhido. Repetição não duplica nem transfere para outro avatar. São sete cartas com recibo legítimo, sem XP/moedas/baús/equipamentos, sem compra ou saldo histórico alterado. Não é concessão automática por login nem uso de autoridade QA. Nenhum recibo será criado pela migration; o jogador solicita posteriormente pelo contrato validado.

Implementação exige ponte restrita de sessão/conta/avatar ativo ao comando starter existente; nenhuma execução genérica de arena_authority_v3 será concedida ao cliente/service_role. Primeiro TEST e testes econômicos críticos dirigidos; pacote PROD próprio, snapshot/recuperação e demais gates antes da publicação. Após uma concessão real, contenção preserva inventário e recibos, sem excluir histórico.

A proposta não aprova recompensas da Arena/Torre, XP de Guilda/EBD, baús, Loja, reconciliação histórica ou progressão009. O proprietário poderá aprovar somente o catálogo e starter descritos, mantendo as demais fronteiras fechadas.
