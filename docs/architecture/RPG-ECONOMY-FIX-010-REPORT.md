# RPG-ECONOMY-FIX-010 — reconciliação individual

07/11/2026. **BLOCKED para regularização/publicação. Auditoria somente leitura concluída.** Base Git d0e30e0; branch codex/rpg-economy-fix-010. Nenhum saldo, item, XP, marca de verificação ou perfil QA foi alterado.

| Origem / valor | Evidência e tratamento |
| --- | --- |
| Identidade | Teste Chat A ativo, nível 50, pertence à conta Auth confirmada vinculada à política QA. Fingerprints do avatar/conta na evidência. Homônimo inativo nível 1 identificado e excluído. Não houve login novo nem atuação em nome da sessão do usuário. |
| Base administrativa histórica | FIX-PROD-004 documenta a conferência do provisionamento TASK-0077: 245.000 XP e 999.999 moedas, seis equipamentos e 500 de cada baú. A conferência histórica de hash é reutilizada; o arquivo privado original não foi localizado no caminho histórico nesta máquina. |
| Moedas legadas | 999.999 + 7.160 em 28 aberturas antigas − 900 em cinco compras = 1.006.259. Saldo armazenado 1.006.265: **6 moedas sem evento autoritativo**. Os cinco checkpoints de compra conferem numericamente. |
| XP | 245.016 atuais: **16 XP sem evento autoritativo** além da base administrativa. Zero eventos do alvo nos ledgers de batalha, recompensas de Jornada/Guilda e pendências EBD consultados. |
| Operações antigas | 34 registros legados (28 aberturas, cinco compras e um grant) sem account_id. Explicam quantidades, mas são anteriores às barreiras econômicas atuais; não foram promovidos a ganhos legítimos por coincidência aritmética. |
| Equipamentos legados | Botas/Espada/Couraça/Escudo: um de cada; Elmo: quatro; Medalhão: seis. As aberturas registram três Elmos e cinco Medalhões adicionais. Seis slots equipados preservados. Quantidades conciliadas com o histórico, certificação produtiva pendente. |
| Baús legados | Comum 500, incomum 500, raro 505, épico 492, extraordinário 480. Fontes existentes preservadas; esta tarefa não aprova seus tiers, fontes ou tabelas para abertura. |
| Sete cartas | Um starter legítimo, vinculado à conta correta, versão aprovada, sete linhas quantidade 1 e sem revogação. Não dependem de certificar as moedas legadas. |
| Treino QA | Perfil privado habilitado e não expirado: 9.960 moedas, um baú comum privado, revisão 2. Recibos: orçamento +10.000, compra −40, equipar 0; soma exata 9.960. Expira em 10/11/2026 às 13h10 BRT. Não reiniciado ou prorrogado. |

A Loja oficial tem **dois impedimentos**: economic_verified_at NULL e saldo reconhecido pela autoridade shop_private.coin_balance igual a zero. A autoridade publicada considera somente recibos comunitários/Loja atuais, com conta e catálogo válidos; não aceita automaticamente provisionamento ou operações antigas. **Marcar a coluna por SQL direto não resolveria a reconciliação do saldo e é proibido.**

O processo existente de reconciliação consiste nas consultas somente leitura de FIX-PROD-004/006 e nas guardas da autoridade. Não foi localizada uma função de escrita para reconciliar legados. Não será inventada uma chamada existente nem aberto EXECUTE genérico.

**Treino privado:** a autoridade economy_qa_private e seu validador de identidade não dependem de economic_verified_at. O cliente readQAShop já usa activeTraining antes da consulta oficial, e o provider remonta a tela ao entrar/sair do modo. A ação existente é **Treino QA → Ativar treino isolado**, no menu. Perfil habilitado no banco não seleciona automaticamente esse modo em cada sessão. Não se demonstrou defeito que justifique reconstruir o acesso; inspeção do código e evidência anterior ECONOMY-QA-002 reutilizadas. Não foi executada compra, abertura, mudança de equipamento ou nova homologação de navegador.

## Única decisão antes de qualquer escrita

**Proposta para aprovação:** reconhecer os valores existentes **1.006.265 moedas e 245.016 XP** como base administrativa individual de teste do avatar ativo, explicitando no registro que os **16 XP e 6 moedas** não têm evento de jogo comprovado e que os registros legados não constituem recibos autoritativos modernos. Isso permitirá tornar gastável o saldo legado na Loja após implementação e gates; não é aprovação de nova moeda, recompensa retroativa ou prova de vitória. Equipamentos, cartas, baús e históricos ficam intactos; aberturas de tiers/fontes não aprovados continuam fechadas.

Sem essa ratificação explícita, manter a economia oficial bloqueada e o treino privado existente disponível até sua validade. Não usar a aprovação anterior do orçamento QA como aprovação deste saldo oficial.

## Execução preparada, condicionada à decisão

1. Reutilizar o ledger/autoridade existentes: acrescentar somente o suporte ao registro de reconciliação administrativa individual, sem criar carteira, inventário ou compra paralelos. Registrar aprovação atual, motivo, origem administrativa anterior, lacunas declaradas e hashes do snapshot; nunca retrodatá-lo ou preencher account_id dos recibos antigos.
2. Comando privado e restrito à conta/avatar exatos, sem EXECUTE para clientes ou service_role; sessão normal confirmada antes da ativação. Locks e comparação integral do snapshot devem abortar se algo mudar. Repetição deve retornar o mesmo registro, sem conceder ou contabilizar o saldo duas vezes.
3. Fazer a autoridade de saldo reconhecer essa base apenas uma vez e somente para o avatar designado; entradas/débitos futuros seguem os recibos atuais. Preencher a verificação apenas como parte dessa operação auditada validada, nunca por UPDATE avulso. Carteira/XP/nível/itens permanecem nos números originais na ativação.
4. Validar somente esta fronteira em PostgreSQL isolado/TEST: idempotência, débito, concorrência, homônimo/outros jogadores negados, ausência de crédito adicional, preservação e contenção. CI/gates da política antes de qualquer pacote/ativação PROD. O suporte ao checkpoint ainda não foi implementado ou homologado.

**Evidência:** [snapshot sanitizado](RPG-ECONOMY-FIX-010-EVIDENCE.json); consultas existentes packages/database/deployments/fixprod004/reconciliation-readonly.sql e fixprod006/reconciliation-checkpoints.sql reutilizadas. Oito conjuntos canônicos/privados e a linha do homônimo permaneceram idênticos na conferência final; não se declara auditoria de todas as tabelas do projeto. Uma primeira consulta de catálogo falhou ao aplicar pg_get_functiondef a agregado; corrigida para funções escalares, sem escrita.

QA/Security pelo autor, sem revisão independente. Sem alteração de runtime/SQL executável, migration, concessão ou deploy; nenhum teste geral repetido. **Não DONE / DEPLOY_COMPLETE.**
