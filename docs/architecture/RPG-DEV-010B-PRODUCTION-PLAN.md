# 010B.1/010B.2 — Plano produtivo incremental

Estado: **pacote aplicado e promoção concluída em30/10/2026**, após gates descritos abaixo. Migrations PROD214647/214654/214701; PR20/merge4670ac6, deploymentdpl_5VYBhCSmSwMJCYPmbregfDe5mWAjREADY/production/oficial,22checks retidos+22oficiais+6HTTP aprovados,44dados preservados. [Fechamento e evidências](RPG-DEV-010B-REPORT.md). Produção anterior para reversão:010A/994fe9d/dpl_BdKmqu1JYDH845BKoGH1qXiQTsTe. PR12/18 independentes. Aulas/quiz/presença010B.3 não fazem parte deste incremento. O procedimento abaixo registra a ordem cumprida e a recuperação disponível, sem autorizar reaplicação de migrations.

## Gates e ordem

1. CI no SHA exato, testes direcionados, duas identidades normais TEST, classes/permissões/convites antigos e novos, isolamento/revogação/concorrência e regressão essencial. Evidências anteriores preservadas, sem repetição local indiscriminada.
2. Renovar snapshot PROD de definições/owners/ACLs/RLS/policies/defaults/controle e hashes/contagens dos44conjuntos. Confirmar projeto/backend/variáveis/branch,10migrations anteriores, nenhum endpoint010B e somente o Admin já designado pelo proprietário. Nenhum bootstrap ou concessão administrativa neste pacote.
3. Aplicar exclusivamente os três arquivos produtivos próprios, em ordem212748/212801/212807, cada um em transação. Guardas exigem proprietário SQL, auth.uid ausente, scope produtivo e25definições/ACLs canônicas. As estruturas e corpos funcionais correspondem aos homologados TEST; não aplicar arquivos TEST-only em PROD.
4. Conferir dez tabelas novas privadas com RLS/grants fechados,21funções novas com ACLs exatas TEST e somente duas funções legadas alteradas intencionalmente. Funções/ACLs/policies/controle/dados anteriores permanecem iguais; o trigger de saída em guild_members é a alteração estrutural prevista. Conferir ausência de execução econômica. Interromper por diferença não prevista.
5. Merge normal somente após CI/segurança aprovados. Reter domínio no artefato anterior durante o deploy Git existente. Confirmar READY/production/SHA/backend; sessão PROD normal autorizada, consultas/negações e regressões essenciais, sem criar Guildas/classes/alunos para fabricar positivos.
6. Promover o mesmo deployment existente somente após os gates. Restaurar configuração anterior de associação de domínios e preservar proteção. Conferir alias/SHA/READY e repetir consultas oficiais e hashes. Não declarar DEPLOY_COMPLETE antes dessa conferência.

## Recuperação e contenção

Snapshot estrutural privado e fingerprint antes de DDL são obrigatórios. Recuperação vazia: `packages/database/proposals/rpg-dev-010b-production-recovery-empty.sql`, em transação, restaura seis definições intermediárias/legadas e retira apenas objetos novos **se todas as tabelas novas estiverem vazias**. Roundtrip isolado compara definições/ACLs/dados; nunca ensaiar remoção efetiva em PROD com dados emitidos. Histórico de migrations não é apagado; eventual compensação deve ser rastreável.

Após qualquer registro novo, usar `rpg-dev-010b-production-containment.sql`: bloqueia novas escritas e caminhos legados pela barreira protegida e revoga EXECUTEs novos de mutação; preserva consultas, vínculos, recibos, convites e auditoria. A barreira também contém temporariamente gerenciamento Guilda/EBD legado; esse impacto precisa constar do incidente. Não restaurar versão de aplicativo que finja escrita disponível. Recuperar depois por nova migration revisada, sem apagar dados ou reativar convites.

Reversão de aplicativo aponta para010A/994fe9d e seu deployment acima. A migration é aditiva e o RPC legado mantém assinatura/UUID, com a semântica autorizada de entrada automática. Se precisar voltar a semântica anterior após emissão, preparar compensação específica preservadora; não executar rollback vazio. Nenhuma operação de recuperação concede XP/moedas/baús, reativa link ou restaura índice de Guilda única.

## Limites da prova

Positivos de classes/convites pertencem a contas QA TEST. Não são provas positivas PROD. Chromium/WebKit390px são desktop/emulação; não aparelho físico. Cadastro e criação de avatar reutilizam os fluxos existentes e retorno limpo, sem novo cadastro produtivo. QA/Security pelo autor, sem independência alegada. Bloqueio crítico em qualquer etapa mantém o domínio na versão anterior ou aciona contenção/reversão compatível.
