# RPG-ECONOMY-FIX-010 — reconciliação individual

07/11/2026. **VALIDATING. Base administrativa individual aprovada explicitamente pelo proprietário.** Valores existentes 1.006.265 moedas/245.016 XP serão reconhecidos somente pelo comando privado auditado após os gates. PROD ainda não recebeu migration ou ativação. Base Git d0e30e0; branch codex/rpg-economy-fix-010.

Suporte implementado no ledger existente, sem carteira/inventário/compra paralelos. Registro administrativo único e protegido, conferência de conta/avatar/sessão e snapshot sob locks; nenhuma moeda nova. **16 casos PG TEST e os mesmos16 no pacote produtivo isolado PASS**, não32 casos distintos; recuperação vazia/contenção incluídas. Somente suporte instalado em TEST, sem ativar saldo em outra conta:90 conjuntos acompanhados idênticos,249 rotinas anteriores preservadas e três novas privadas. Uma revisão TEST endurece a inserção da auditoria para postgres; história da migration inicial preservada. CI e gates PROD pendentes. Auth/RLS e interface não mudaram; provas anteriores aplicáveis reutilizadas.

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

## Decisão recebida antes da escrita financeira

**Aprovada pelo proprietário: “Aprovar base administrativa individual”.** Reconhecer os valores existentes **1.006.265 moedas e 245.016 XP** como base administrativa individual de teste do avatar ativo, explicitando no registro que os **16 XP e 6 moedas** não têm evento de jogo comprovado e que os registros legados não constituem recibos autoritativos modernos. Isso permitirá tornar gastável o saldo legado na Loja após os gates; não é aprovação de nova moeda, recompensa retroativa ou prova de vitória. Equipamentos, cartas, baús e históricos ficam intactos; aberturas de tiers/fontes não aprovados continuam fechadas.

A ratificação específica foi recebida nesta tarefa; a aprovação antiga do orçamento QA não foi usada para autorizá-la. A economia oficial continua bloqueada até aplicar com sucesso o comando aprovado após os gates.

## Execução preparada, condicionada à decisão

1. Reutilizar o ledger/autoridade existentes: acrescentar somente o suporte ao registro de reconciliação administrativa individual, sem criar carteira, inventário ou compra paralelos. Registrar aprovação atual, motivo, origem administrativa anterior, lacunas declaradas e hashes do snapshot; nunca retrodatá-lo ou preencher account_id dos recibos antigos.
2. Comando privado e restrito à conta/avatar exatos, sem EXECUTE para clientes ou service_role; sessão normal confirmada antes da ativação. Locks e comparação integral do snapshot devem abortar se algo mudar. Repetição deve retornar o mesmo registro, sem conceder ou contabilizar o saldo duas vezes.
3. Fazer a autoridade de saldo reconhecer essa base apenas uma vez e somente para o avatar designado; entradas/débitos futuros seguem os recibos atuais. Preencher a verificação apenas como parte dessa operação auditada validada, nunca por UPDATE avulso. Carteira/XP/nível/itens permanecem nos números originais na ativação.
4. Validar somente esta fronteira: idempotência, débito, concorrência, homônimo/outros jogadores negados, ausência de crédito adicional, preservação e contenção. Casos isolados PASS; suporte TEST sem designação presente nesse banco e sem verba artificial nova. CI e preflight/ativação produtivos ainda obrigatórios.

**Evidência:** [snapshot sanitizado](RPG-ECONOMY-FIX-010-EVIDENCE.json); consultas existentes packages/database/deployments/fixprod004/reconciliation-readonly.sql e fixprod006/reconciliation-checkpoints.sql reutilizadas. Oito conjuntos canônicos/privados e a linha do homônimo permaneceram idênticos na conferência final; não se declara auditoria de todas as tabelas do projeto. Uma primeira consulta de catálogo falhou ao aplicar pg_get_functiondef a agregado; corrigida para funções escalares, sem escrita.

QA/Security pelo autor, sem revisão independente. A rodada inicial foi somente leitura; nesta continuação há suporte SQL TEST, ainda sem PROD ou concessão. Falhas preservadas: etapa QA ausente na fixture inicial; recuperação TEST usava constraint produtiva sem a variante QA (corrigida para seu envelope exato); ensaio de fonte antiga esperava erro em vez da resposta publicada suspended, agora exige suspensão e ausência de crédito. Lint apontou duas variáveis não usadas no novo teste, removidas. Nenhuma guarda de produção ou assertion de saldo foi relaxada. **Não DONE / DEPLOY_COMPLETE.**
