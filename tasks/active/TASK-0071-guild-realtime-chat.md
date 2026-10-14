# TASK-0071 — Chat da célula em tempo real
ID: TASK-0071
TITLE: Chat da célula em tempo real
OBJECTIVE: Primeira versão do chat isolado por Guilda com Supabase Database/Realtime.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Módulo de chat em apps/web, integração mínima no OnlineGuildHub, tipos Supabase, migrações aditivas em packages/database, testes e documentação específica. Pedido explícito de 2026-10-14 autoriza este runtime. Resposta posterior autoriza aplicar ao projeto RPGJOVEMCRISTAO e selecionar duas contas para teste. Sem dependências novas; sem push/deploy.
OUT_OF_SCOPE: Chat global, mensagens privadas, gameplay, recompensas, saves, assets, cadastro/consentimento de menores, push/deploy, apagar dados ou desabilitar proteções.
DEPENDENCIES: Auth/travelers/guilds/guild_members existentes; migrações 0000 e 0001 para o chat; outras migrações da Guilda para o hub completo.
ASSIGNED_AGENT: Orquestrador assumindo DATABASE, FRONTEND, QA e SECURITY localmente; sem subagentes, revisão pelo próprio autor.
REQUIRED_CONTEXT: .agent/GLOBAL_CONTEXT.md; CURRENT_STATE.md; WORKFLOW/RULES/SECURITY/TOKEN_POLICY; perfis e skills selecionados; Auth/client/types/guild repository/hub; schema e migrações relevantes.
SECURITY_CONSIDERATIONS: RLS por participação ativa e conta real; identidade derivada do banco; RPCs com grants mínimos; limite concorrente por conta; texto simples, sem mídia/links ativos; denúncias confidenciais; remoção com auditoria; nenhum segredo registrado.
ACCEPTANCE_CRITERIA:
- Mensagens com nome/avatar/horário; avisos de líder; não lidas e histórico paginado; mobile verde/dourado.
- Acesso e envio restritos à célula autorizada; tamanho/frequência no banco; denúncia, remoção e log por moderadores.
- Reconexão recupera estado; troca de célula/conta limpa o conteúdo; sem chat local simulado.
- Provas com duas contas/navegadores e isolamento entre células; lint/typecheck/build e testes pertinentes.
TEST_PLAN:
- Testes de integração do repository e UI, limites e estados concorrentes/reconexão.
- SQL transacional de segurança com rollback em ambiente autorizado; duas sessões reais e fluxos negativos.
- QA responsivo e regressão mínima do hub; Security pelo autor, limitações explícitas.
DEFINITION_OF_DONE:
- Todos os critérios comprovados e gates aprovados; memória/relatório atualizados. Gates remotos sem acesso permanecem BLOCKED, nunca PASS presumido.

## Execução e aceite — 2026-10-14

- ID local anterior TASK-0062 foi reidentificado na TASK-0072, pois o notebook publicou uma tarefa mobile com esse ID antes do merge. O contrato de chat e seu aceite permanecem o mesmo; histórico original preservado em backup/commit 0192b8f. Migrações locais renumeradas de 0006/0007 para 0007/0008; histórico Supabase preservado, sem nova execução.

- Implementação e validação técnica concluídas; `ACTIVE → VALIDATING → BLOCKED` pelo gate de duas sessões reais. Nenhuma falha conhecida de código ficou aberta.
- Migrações 0007/0008 aplicadas ao projeto autorizado: `20261014032438_guild_chat_v1` e `20261014033334_guild_chat_commit_order`. Journal/snapshots locais gerados pelo Drizzle instalado; Supabase CLI ausente, sem instalar dependências. 0008 serializa commits por célula para proteger o cursor de leitura.
- SELF VALIDATE: lint/typecheck/build PASS; suíte completa 64 arquivos/414 testes PASS; novos testes após o ajuste final 2 arquivos/11 testes PASS; diff/scan final registrado abaixo.
- QA pelo autor: 14 E2E existentes de Guilda/Auth desktop/mobile PASS; 10 checks de UI standalone em Chrome/Edge e 360/390/768/1440 px PASS com fixtures, imagens carregadas e capturas mobile/desktop inspecionadas.
- Security pelo autor: SQL real com duas contas e claims simuladas PASS (isolamento, autoria, papéis, limites, denúncias, moderação, revogação, archive, anon). Transação revertida. API real: tabela/RPC anon HTTP401; schema privado HTTP406. Advisors: INFO intencional de rate_limits sem policy/grants e avisos preexistentes registrados no parecer.
- Preservation: Guildas/associações/mensagens após os testes = 0/0/0; nada anterior apagado; gameplay, saves, Avatar/arte, Auth e configuração privada sem mudanças. Sem alegação de QA/Security independente.
- ACCEPTANCE: interface/repository/SQL/limites/controles e regressões automatizadas PASS. Duas contas com autenticação de navegador, concorrência de sessões, isolamento/reconexão/token refresh de Realtime real **BLOCKED**, não PASS nem N/A.
- BLOCKER: inventário CUA retornou `apps=[]`, `browsers=[]`; não há sessões autenticadas para testar. Escolhidos dois Viajantes de contas distintas, finais `51057`/`eff5b`; solicitação assíncrona de conexão/login enviada, sem pedir senhas/tokens. Projeto ainda tem 0 Guildas; a célula de teste real deverá ser criada/aprovada pelo fluxo existente quando as sessões estiverem disponíveis.
- UNBLOCK: conectar Chrome/Edge, autenticar manualmente as contas escolhidas e executar o roteiro real em `docs/architecture/GUILD-CHAT-V1.md`; comprovar todos os gates antes de DONE.
- DOCUMENTATION: relatório de arquivos/migrações/testes em `docs/architecture/GUILD-CHAT-V1.md`; parecer `docs/security/GUILD-CHAT-V1-REVIEW.md`; memória atualizada.
- FINAL REVIEW: `git diff --check` PASS; varredura heurística de 24 arquivos alterados/novos sem achados de credenciais; diff delimitado revisado. `next-env.d.ts` restaurado ao conteúdo inicial após geração automática. Nenhuma alteração de package/lock/env/assets/game-engine ou processo preexistente. Servidores de teste encerrados pelos runners.
