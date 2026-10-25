# RPG-DEV-004 — Safari, Preview e reconciliação

ID: RPG-DEV-004
TITLE: Investigar o mecanismo RSC e validar nova Preview TEST
OBJECTIVE: Avançar na PR11 com as dez composições aprovadas, sem comprometer Guilda/EBD.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: Mesma branch codex/rpg-dev-001 e PR11; diagnóstico local/hospedado WebKit, instrumentação e correção apenas de causa comprovada; Preview do SHA aprovado no projeto Vercel existente com Supabase TEST; validação de assets, sincronização, Auth/Guilda/EBD e fronteiras; economia somente leitura; relatório/memória.
OUT_OF_SCOPE: Outra PR; novo banco/branch paga/recurso com cobrança; mudanças produtivas sem gates; aquisição/recompensa/gameplay; edição de saldos/recibos/certificação; alterar dez composições aprovadas ou CORS/Auth/RLS/prefetch global/proteções por hipótese.
ASSIGNED_AGENT: Agente principal assumindo Frontend/QA/Security/DevOps, sem delegação. Ampliação dos perfis limitada à instrumentação e operação descritas, conforme pedido explícito RPG-DEV-004.
REQUIRED_CONTEXT: Política, relatórios001–003, recibos visuais, estado remoto47ef29f, fontes mínimas pertinentes ao mecanismo.
SECURITY_CONSIDERATIONS: TESTwkdvdzfkbwvhyjmamrsg separado de PRODwspafhlbtlpabypzymjo. Credenciais somente em memória/armazenamento protegido; OIDC restrito à origem da Preview. Não relaxar fronteiras para testes positivos. Nenhuma conta/jogador produtivo modificado.
ACCEPTANCE_CRITERIA:
- Mecanismo WebKit isolado e corrigido com regressões, ou BLOCKED com evidência e limites reais.
- Dez composições/hash/posições preservados; equipamentos desktop/móvel e persistência validados sem concessões.
- Nova Preview SHA aprovado READY/TEST, Auth/avatar/Guilda/EBD/negativas avaliados de verdade; READY não substitui testes.
- Proveniência16XP6moedas investigada sem ajustes; ausência de prova mantém BLOCKED.
- Testes afetados/gates completos/CI exato/relatório004; PR11 em rascunho, produção preservada se houver bloqueios.
TEST_PLAN: Instrumentar pageerror/DOM/unhandledrejection/fetch sem filtrar eventos. Controles de sessão/hidratação/prefetch/navegação e respostas antigas. Reusar provas PG/Arena/Torre inalteradas, executar regressões afetadas, Chromium/WebKit local/hospedado, lint/types/build/protocolo. Preservação por hash e QA/Security pelo autor.
DEFINITION_OF_DONE: Resultados verificáveis, status DONE/BLOCKED/REWORK por item, relatório docs/architecture/RPG-DEV-004-REPORT.md e memória atualizados. Sem DEPLOY_COMPLETE produtivo sem gates/remoto.
