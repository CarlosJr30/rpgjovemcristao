# RPG-DEV-010B — Convites, classes e EBD

ID: RPG-DEV-010B
STATUS: ACTIVE
PRIORITY: P1 High
OBJECTIVE: Adaptar Guilda/EBD publicados para convites automáticos, múltiplas classes, professores, aulas flexíveis, quiz de sete perguntas e presença auditada sem concessão econômica.
AUTHORIZATION: Pedido integral anexado pelo proprietário em 30/10/2026. Autoriza implementação, testes isolados e duas identidades TEST normais, publicação incremental somente após todos os gates de RELEASE_POLICY. Sem autorização para dados artificiais PROD ou privilégios administrativos adicionais.
BASE: origin/main 994fe9d3323ba193aafc873fc2774d8a33637206; fechamento documental 8e7797c incorporado por fast-forward. Branch codex/rpg-dev-010b-ebd-classes, worktree próprio; originais e PR12/18 preservados.
SCOPE: apps/web (Guilda/EBD/convites, contratos e fronteiras API), packages/database, supabase/migrations próprias, testes/fixtures/CI pertinentes, relatórios e memória. Perfis Database/Backend/Frontend/QA/Security/DevOps assumidos pelo autor; ampliação dos caminhos de cada perfil autorizada pelo orquestrador exclusivamente neste escopo. Sem subagentes ou alegação de revisão independente.
OUT_OF_SCOPE: XP/moedas/baús reais, catálogo/cartas/equipamentos, economia, Arena/Torre/Loja, progresso009, chat/notificações010E, diferença histórica16XP/6moedas, reconstrução do jogo/artes, novos recursos pagos.
DEPENDENCIES: 010A publicada; preservar Admin explicitamente designado, autorizações de liderança, seleção multiguild e vínculos legados.
ACCEPTANCE_CRITERIA:
- Auditar e reutilizar convites, aulas, atividades, professores e presença existentes; documentar adaptações e compatibilidade.
- Convites comuns até30dias/100usos, consumo atômico/idempotente, revogação/expiração/esgotamento; entrada sem aprovação manual e sem papel privilegiado.
- Classes explícitas por Guilda e professores por classe; participação múltipla preserva vínculos; revogação imediata no servidor.
- Aulas flexíveis, quiz quando presente com exatamente7perguntas e correção no servidor; sem consultar reflexões pessoais.
- Presença pendente/presente/ausente/justificada, unicidade aluno/aula e correções auditadas; elegibilidade50XP apenas contrato, emissão desabilitada.
- Auth/RLS/ACL/legado/privacidade e dados preservados; operações ambíguas negadas.
- Gates próprios por incremento: local/PG/qualidade → CI exato → TEST → Preview → duas identidades normais e regressões Chromium/WebKit emulado → segurança/recuperação → migrations PROD próprias → deploy/READY/SHA/alias/conferência.
TEST_PLAN: Unitários, PostgreSQL isolado, permissões/replay/concorrência/idempotência, convites/cadastro/login/avatar, classe/professor/rematrícula/revogação/presença/quiz/reload/respostas atrasadas; hashes e estrutura antes/depois; regressões publicadas, lint/types/build/protocolo/CI. Fixtures não são prova hospedada; SKIP não é PASS; aparelho físico não inferido.
DEFINITION_OF_DONE: Somente incremento integralmente homologado pode ser publicado e declarado DONE/DEPLOY_COMPLETE; dependência crítica mantém PROD atual. Relatório010B/geral, memória e evidências atualizados.

## Preparação

30/10: branch própria criada da main publicada e fechamento documental preservado. Main/CI994fe9d success; PR12draft61b7177 e PR18draftfd6f149 intactas. TEST33migrations/PROD10 reconfirmadas. Sem DDL ou mutações de dados010B neste checkpoint. Ordem dos incrementos será fixada pela auditoria antes de alterações de autoridade.
