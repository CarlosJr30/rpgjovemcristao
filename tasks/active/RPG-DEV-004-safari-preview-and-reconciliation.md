# RPG-DEV-004 — Safari, Preview e reconciliação

ID: RPG-DEV-004
TITLE: Investigar o mecanismo RSC e validar nova Preview TEST
OBJECTIVE: Avançar na PR11 com as dez composições aprovadas, sem comprometer Guilda/EBD.
PRIORITY: P1 High
STATUS: BLOCKED
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

RESULTS_2026_10_25:
- DONE: Preview47ef29f READY/TEST,12hashes hospedados/10composições preservados,4equipBrowserPASS,777unitPASS74SKIP,15syncPASS,12AuthRLSAPIchecksPASS,lint/types/build/protocolo25PASS. PG74/ArenaTorre anteriores reutilizados sem alteraçãoSQL/motor.
- REWORK resolvido no ensaio: seletorEBD mobile-only no desktop; sondas403 em abas separadas para não substituir documento EBD durante prefetch. Nenhuma alteração de produto/arte/segurança.
- DONE no fluxo normal WebKit/líder:3repetições60checksPASS; todas as abas monitoradas, duas repetições sem wrapperfetch. Não transforma FAIL de concorrência em PASS.
- BLOCKED: hard navigation com prefetch iniciado no documento antigo; contraste hospedado200antes,recusa semHTTP durantefaseprovisória,pageerror antespagehide,mesmo com rejeição tratada. Mecanismo reproduzido também em fixturesemNext/Auth/Vercel. Nenhum patch de produto comprovado; correção upstream pendente.
- BLOCKED:16XP6moedas semproveniência,catálogo/recompensas/gameplayhospedado,Safarifísico. Zero migrations/grants/recibosretroativos/recursospagos/merge/promoção.
- DONE:produção808433aREADY,7HTTPchecks,oitohashesPRODidênticos. TEST7hasheseconômicosidênticos;travelershashmudoucomseleçõesnormais/timestamps,3originaisativosrestauradosporRPCoficial.
- QA/SECURITY:revisão peloautor,semindependência alegada;OIDCrestritoàorigem/headerspermitidos/secrets ausentes/listenerssemfiltros/proteçõespreservadas. AceiteintegralBLOCKED,PR11rascunho.
- COMMITS:7613eaaCIpush40151827015/PR40151830235success;1758241instrumentaçãodirecionada/sondasseparadas,CIregistradonorelatório.
- REPORT:docs/architecture/RPG-DEV-004-REPORT.md;RSCrecorteseguroemRPG-DEV-004-RSC-EVIDENCE.json,artefatosprivadosbuild/rpg-dev-004/.
UNBLOCK_CONDITION:Correção específica de lifecycle/framework/motor validada no contraste preservado e regressõesnormais,sem suprimirerros;demais gatesdegameplayexigemhomologação/evidênciaprópria. Não publicar emprodução enquanto faltarem.

CONTINUATION_2026_10_25: ACTIVE somente na investigação concorrente autorizada. Preservar por hash as três provas WebKit/líder60checks. Criar fixture Next de produção local e barreiras por eventos para comparar prefetch real concorrente em navegação SPA, substituição de documento e alteração de estado sem navegação. Nenhuma conta, Supabase, configuração CORS/Auth ou proteção Vercel será alterada. Correção de produto somente após causa comprovada; QA/Security pelo autor; atualizar esta mesma PR11 e relatório, sem merge/deploy produtivo.
