# RPG-DEV-009 — Progressão persistente sem economia

ID: RPG-DEV-009
TITLE: Auditar, recuperar e homologar autoridade de progresso e desbloqueio sequencial
OBJECTIVE: Reutilizar story_progress/receipts e componentes publicados; nenhuma conclusão baseada apenas em confirmação cliente ou concessão econômica.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: 009A autoridade/persistência em packages/database e adaptações mínimas apps/web quando comprovadas;009B projeção/desbloqueio só conteúdo aprovado;009C integrar apenas evidências verificáveis. Testes unitários/PG isolado/API/Chromium/WebKit, CI/TEST/Preview/produção conforme RELEASE_POLICY e gates reais. Documentação/segurança/memória e recuperação. Perfis Backend/Database/Frontend/Game Designer/Biblical Content/QA/Security/DevOps assumidos pelo autor no escopo explícito do usuário, sem delegação ou independência alegada.
OUT_OF_SCOPE: XP/moedas/baús/cartas/recompensas, PR12/equipamentos, Arena/Torre/Loja, corrigir16XP/6moedas, novas fases/artes/engine, alteração indevida de legado ou dados produtivos para fabricar testes, recursos pagos.
DEPENDENCIES: Main/produção a conferir c14fd5e; branch codex/rpg-dev-009-progression criada de origin/main, fechamento008C439567c incorporado apenas documentalmente. Homologação editorial e evidência dos requisitos permanecem gates, nunca presumidas por esta autorização técnica.
REQUIRED_CONTEXT: pedido anexado009, RELEASE_POLICY, relatório008 final, contratosSQLstory/legacy e pareceres editoriais pertinentes.
SECURITY_CONSIDERATIONS: Auth não anônimo e dono real no servidor; autorização exclusiva de escrita, revisão/policy fixada no servidor, idempotência/concorrência/replay, sem flags/score/client receipts como prova. Não expor gabaritos privados nem texto devocional. Preservar RLS/ACL/economia/legado. Migrations mínimas somente após testes e compatibilidade/recuperação; nunca aplicar pendentes em lote. PROD autorizado para leituras de preservação; positivos de persistência em TEST pelo fluxo normal quando houver conteúdo elegível, sem manipulação administrativa.
ACCEPTANCE_CRITERIA:
- Fonte oficial e separação journey_progress/story_progress documentadas, sem reinterpretar legado.
- Conclusão oficial sem economia depende de requisitos aprovados e recibos verificáveis; autorrelato nunca prova leitura humana/oração/vitória.
- Ordem oficial/primeira fase/disponibilidade/reload/reconexão e isolamento protegidos por servidor; repetição e concorrência seguras.
- 008A/B/C/Guilda/EBD/consultas e assets preservados.
- Cada subescopo publicado somente com todos os gates obrigatórios; falta crítica BLOCKED, continuar trabalhos independentes.
TEST_PLAN: unidade e fronteiras; PG isolado com fixtures explícitas separado de prova hospedada; API/realAuth/RLS, positivo legítimo/negativos/replay/concorrência/idempotência; Chromium/WebKit e toque emulado identificado; regressões de módulos publicados; lint/types/build/protocolo/CI noSHA exato; baselines/hash/recuperação antes de DDLPROD.
DEFINITION_OF_DONE: aceite/gates comprovados por subentrega, relatório009/commits/PRs/migrations/URLs/resultados e limitações registrados; sem DEPLOY_COMPLETE apenas local. Se nenhum conteúdo permitir prova real, não fabricar conclusão para liberar os gates.

## Retomada27/10/2026

009A/009B/009C em auditoria. Contratos atuais acoplam conclusão a vídeo e recibo econômico. Criação é primeiro item candidato, com homologação editorial humana e vídeo pendentes no parecer005. Perguntada referência de homologação posterior sem pausar trabalhos independentes; nenhum gate removido, flagReady promovido ou prova falsa aceita. Minigame/vídeo/autorrelatos continuam demonstrativos enquanto não houver autoridade verificável.

## 28/10/2026 — contrato da continuação TEST

Usuário confirmou que não há aceite posterior e autorizou concluir somente autoridade/testes independentes em TEST, com proposta editorial separada para revisão. Migration009A exclusivamente TEST, cinco políticas fechadas, sem emissores reais de evidência; nenhuma conclusão oficial ou deploy PROD autorizado por esta preparação.32PG isolados PASS, lint/types/build/protocolo25 PASS; positivos locais não são prova hospedada. CI/migration TEST/API/Preview ainda pendentes neste checkpoint. Segurança/QA pelo autor, sem independência alegada. Preservar demonstrações008 e PR12. Aceite editorial e verificadores reais continuam BLOCKED para009B/C; não declarar toda009DONE.
