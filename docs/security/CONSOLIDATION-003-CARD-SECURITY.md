# Consolidação 003 — revisão de catálogo e aquisição pelo autor

Revisão do autor nos perfis QA/Security/Backend, sem independência alegada. Preparação local validada; cartas jogáveis, concessões e combate autoritativo continuam BLOCKED. A tarefa não implementa autoridade004 nem cutover0078.

## Fronteiras conferidas

| Fronteira | Controle implementado / evidência |
| --- | --- |
| Identidade do catálogo | Seis IDs estáveis, únicos, não reciclados; cada um referencia uma das seis ações reais. Registry/entradas/descrições/parâmetros/fontes congelados em memória. Versões explícitas; nenhuma sétima duplicada |
| Homologação | Propostas têm status proposed, referências de aprovação nulas e fontes autorizadas vazias. getApprovedArenaCards retorna vazio. Objeto/metadata com approved/action/valores inventados não altera o registro interno |
| Posse | Loader de produção exige conta/Traveler atuais e não usa inventory como prova econômica. Helpers legados negam IDs com prefixo reservado mesmo com quantidade positiva. Nenhum endpoint autoritativo fictício foi adicionado |
| Uso | Motor/snapshot/deck existentes preservados. Testes positivos só com injeção explícita em testes: exatamente sete slots sintéticos, ID/nível/Foco/round/owner/uso/revanche; não são concessões ou sessões oficiais |
| Recibo/baú | Adapter legado continua estrito, moedas/equipamento; IDs propostos, cards ou schemaVersion2 injetados são recusados. Abrir/animar/rever não produz uma carta nesta entrega |
| Segregação | Regressões storage/contas/Traveler/Torre executadas; aquisição autenticada atual retorna zero e nega conta/Traveler estranhos. Nenhuma concessão inicial, migração de posse/localStorage ou writes econômicos novos |

## Achados e gates abertos

**P1 herdado — escrita econômica e de inventário:** permissões/rotas legadas permitem estado próprio manipulado. A 003 fecha sua integração de coleção para não promover esses dados a cartas, mas não corrige nem aceita a superfície global. Cutover0078 precisa impedir todas as mutations diretas/indiretas de carta, derivar grants de provas e dar recibos únicos atômicos. Nenhum valor de carteira/XP/inventário real foi alterado.

**P1 de disponibilidade/autoridade:** faltam sétima ação homologável, protocolo de starter/recibo/posse autoritativa, ambiente isolado e backend004. Não contornar com seis cartas, IDs artificiais, requisito de nível reduzido, fake cards, aprovação em metadata ou vitória local. Produto continua bloqueado. A proposta de Golpe Medido é BACKLOG, sem efeito implementado ou ID de coleção.

**Versionamento futuro:** versões atuais identificam a proposta e as regras existentes; não são assinatura ou pinagem de sessão em servidor. Alteração de ação/regra deve incrementar/revisar versão e testar migração ou recusa de replay preservando dados. O futuro servidor congela catálogo, regras e posse no início e revalida comandos. Ficha/cache/browser e hash local não provam segurança da batalha.

## Aquisição e SQL

Plano específico em [aquisição/recibos](../architecture/CONSOLIDATION-003-ACQUISITION-AND-RECEIPTS.md): mesma transação para prova/recibo/inventory, unicidade pela origem e destinatário, starter proposto uma vez por conta e vinculado ao Traveler, replay sem delta e compensação somente aprovada. Não existe teste positivo de concessão idempotente, porque essa operação ainda não existe. O bloqueio atual foi testado; o comportamento futuro é requisito, não PASS.

SQL/RLS/grants/funções/journal antigos intactos; nenhum DDL novo necessário ao catálogo puro, portanto PostgreSQL novo N/A. Reutilizar a validação002 do baseline, sem declarar suas 32 tabelas como schema de cartas ou repetir auditoria fechada. A proposta descreve constraints/índices/RLS/ACL necessários ao próximo contrato; não cria ledger/carteira/inventário paralelo para aparentar integração.

## Validação e escopo

119 testes em19arquivos PASS, incluindo14casos do catálogo, os adapters e regressões de Arena/Torre/baús/revelação/storage; lint/tipos/build PASS. Testes de browser do produto atual, scan do artefato, hashes e preservação constam no relatório/recibo final. Dados sintéticos somente em testes/harness/config local de build .invalid. Nenhuma fixture de carta é importada pelo registry de runtime. Não foi gerada arte/áudio, instalado pacote, consultado serviço remoto ou modificado contrato anterior.

Revisão do diff e scan focado por segredos exigidos antes de commit. Memória recebe somente prefixo, com bytes anteriores preservados. Raiz/main/ref remoto em cache/27worktrees anteriores e sete pendências0080 devem permanecer como no baseline003. Publicação, Supabase, dados reais, main/push/merge/deploy não autorizados e não executados.
