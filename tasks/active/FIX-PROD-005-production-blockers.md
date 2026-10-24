# FIX-PROD-005 — Conclusão dos bloqueios de produção

ID: FIX-PROD-005
TITLE: Integração transacional da Torre e investigação dos gates restantes
OBJECTIVE: Avançar de456f8fb/e997afe sem repetir migrations ou fabricar evidência.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: Rastrear eventos16XP/6moedas; integrar no servidor a proposta430XP/215moedas/1baú épico, com homologação desativada; testes PostgreSQL/integração/segurança/hosted; mecanismo administrativo auditável que preserve avatar antigo; visual autorizado; GitHub/CI/Preview e produção somente após gates.
OUT_OF_SCOPE: Prêmios hospedados antes de homologação; editar saldos ou verified sem origem/autoridade; forçar vitórias/progresso/seed em hospedagem; copiar jogador produtivo para fixture; alterar avatar antigo; resets; desativar Auth/RLS; aprovação humana inventada de arte; reexecução de migration.
ASSIGNED_AGENT: Orquestrador assume Database/Backend/GameDesigner/Frontend/QA/Security/DevOps. Escopo ampliado desses perfis conforme pedido explícito, sem subagentes.
DEPENDENCIES: Proveniência legada verificável, identidade/autoridade administrativa, arte elegível e homologação econômica final, gates reais.
REQUIRED_CONTEXT: RELEASE_POLICY; FIX-PROD-004-REPORT;456f8fb/e997afe; workflow/rules/security e contratos específicos já lidos.
SECURITY_CONSIDERATIONS: Recuperação antes de DDL; configuração protegida de testes apenas interna; nenhuma credencial no Git/log/chat; contas de testes para operações; bloqueio econômico no banco não controlável pelo cliente.
ACCEPTANCE_CRITERIA:
- Atomicidade XP/moedas/baú/recibo, primeira vitória por andar, idempotência, concorrência, rollback e controles de acesso testados em PG isolado; homologação desativada em hospedagem.
- Cenários sintéticos offline não contam como vitórias legítimas hospedadas2–7/campeão.
- Investigar logs/eventos reais sem certificar saldo por coincidência matemática.
- Liderança somente por processo autorizado/auditável, sem tocar o avatar antigo.
- Arte, atributos/persistência desktop/móvel e gates não executados identificados honestamente.
- Testes/lint/types/build/CI/Preview reais e relatório/memória; produção só com todos os gates.
TEST_PLAN: Reusar evidência intacta; executar testes dos novos caminhos e regressão pertinente; inspeção remota/journal, recuperação e somente migrations pendentes em testes; nenhuma ativação de créditos reais.
DEFINITION_OF_DONE: Aceites integralmente comprovados; BLOCKED com causa para dependências indisponíveis; REWORK para falhas corrigíveis.

SELF VALIDATE / QA / SECURITY (autor, sem independência): integração transacional desativada por padrão, testes de Torre8PASS, autoridade/Auth/RLS28PASS contra a nova migration e recuperação exata/CRLF1PASS em PostgreSQL descartável; suíte geral721PASS/54SKIP na primeira rodada (não equivale a executar opt-ins), protocolo25PASS, lint/types/buildPASS. Testes adicionados/alterados passaram também no lint individual. Não há concessão hospedada, DDL produtivo ou homologação econômica.

REWORK corrigido: baseline de função com CRLF e limite de tempo do executor WSL; assertions de conflitos usam status409 real. Teste de capacidade do baú valida rollback do campeão antes de retry. Próximos gates: commit/CI exato, somente migration nova em testes após snapshot/restauração, Preview e verificações reais. Persistem origem16/6, positivos hospedados2–7, arte compatível/homologada, sessão de identidade/liderança e aparelho físico; produção bloqueada enquanto qualquer requisito crítico estiver ausente.
