# RPG-DEV-005 — WebKit/RSC durante navegações concorrentes

ID: RPG-DEV-005
TITLE: Localizar e corrigir trabalho RSC residual durante substituição de documento
OBJECTIVE: Correção mínima comprovada na reprodução determinística e na aplicação real, preservando PR11 e produção Guilda/EBD.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Branch codex/rpg-dev-001 / PR11; leitura de RPG-DEV-004 e evidências; instrumentação local do scheduler/cache RSC/hidratação/cancelamento; correção mínima em apps/web ou patch estreito do framework se comprovado; testes/fixture/CI e documentação. Preservar os 787 testes existentes. Operação GitHub/Preview existente apenas conforme RELEASE_POLICY e gates; nenhum recurso pago.
OUT_OF_SCOPE: Merge/publicação de gameplay com bloqueios críticos; novas funcionalidades; alteração Auth/CORS/RLS/proteções Vercel; banco, contas, economia, artes e recursos pagos; mitigação aprovada somente em fixture; filtros/supressão de erros.
DEPENDENCIES: RPG-DEV-004 (reprodução e evidências, aceite integral BLOCKED).
ASSIGNED_AGENT: Agente principal assumindo Frontend/QA/Security/DevOps localmente, sem delegação. Ampliação delimitada a código, testes, scripts, CI, documentação e operação autorizados pelo pedido RPG-DEV-005.
REQUIRED_CONTEXT: .agent/GLOBAL_CONTEXT.md; memória (trechos RPG-DEV-004); WORKFLOW/RULES/SECURITY/RELEASE_POLICY; relatório004; scripts/fontes pertinentes e guias locais Next16.4.2.
SECURITY_CONSIDERATIONS: Nenhuma escrita em banco ou produção. Diagnóstico loopback sem credenciais; logs com headers permitidos. Não gravar sessões/secrets. Proteções existentes preservadas.
ACCEPTANCE_CRITERIA:
- Preservar controle WebKit seis links 3/3 falhas e seus artefatos; explicar causa com timeline do scheduler/cache/hidratação/cancelamento.
- Correção mínima com prefetch normal preservado, sem filtro de erros; regressões repetidas sem RSC na fixture E aplicação real, incluindo hidratação tardia/remount/retorno/cancelamento.
- 787 testes existentes preservados, lint/types/build/protocolo e CI do SHA candidato aprovados.
- QA/Security identificados pelo autor; PR11 atualizada; produção Guilda/EBD preservada enquanto persistirem bloqueios.
- RPG-DEV-005-REPORT.md com causas, correções, testes, limitações e bloqueios; memória atualizada.
TEST_PLAN: Reproduzir controle determinístico; rastrear trabalho scheduler/RSC sem alterar resultado; testar candidato contra mesmos controles e aplicação completa Chromium/WebKit em repetições; testes afetados e suíte integral; gates locais e CI; inspeção do diff/no secrets. Hospedado somente após gates e sem alterar proteções.
DEFINITION_OF_DONE: Todos os critérios comprovados para DONE. Falha de candidato exige REWORK; dependência externa indispensável exige BLOCKED com condição de desbloqueio. Sem DEPLOY_COMPLETE de gameplay enquanto houver bloqueios prévios.

INITIAL_STATE: HEAD local/remoto35fa16d992898035d52fb266223b876a6e88c445; worktree limpa. PR11 aberta/draft, base808433a. Protótipo004 apenas fixture, produto restaurado. 787PASS74SKIP anteriores; WebKit nativo3/3FAIL, protótipo aplicativo3/24FAIL. CheckoutD e demais worktrees preexistentes preservados.

LOCAL_VALIDATION: 798unitPASS74SKIP (787 anteriores+11 novas regressões; antes3PASS8FAIL). Controle nativo3/3FAIL2erros/caso; hash tardio nativo3/3FAIL6erros/caso. Candidato schedulerREWORK3falhas reais; candidato que retomava por interaçãoREWORK3/3FAIL durante navegação provisória. Patch final conservador passa63fixture/48aplicação completa locais sem erro. Retoma somentepageshow; após diálogo cancelado, SPA/estado funcionam e prefetch de fundo aguarda restauração/documento novo. Risco residual de desempenho explicitado, sem dispensar assertions de erro; não é homologação de BFCache/Safari físico. Aplicação explícita nos comandos próprios mantendoignore-scripts=true;primeiroCIrejeitouhooknãoexecutado. QA/Security pelo autor. CI exato e Preview/teste hospedado pendentes neste checkpoint; gameplay/produçãoBLOCKED. Relatório docs/architecture/RPG-DEV-005-REPORT.md e recorteRPG-DEV-005-EVIDENCE.json.

FINAL_ACCEPTANCE_2026_10_25:
- DONE no escopo RSC conservador: runtime d95cd4cf3516c56d6d6b8060bc5bf394f79dbba8; CIpush40195978867/PR40195981694completed-success. CIWindows48controles nativos/63estáveis/24aplicação completaPASS. Gates798unitPASS74SKIP/lint/types/build/protocolo25PASS, novePNGs/dezcomposições preservados.
- DONE: Preview dpl_AeogfSbkQRjcTzs4nPb5fmFGiLxE READY/TEST, https://rpgjovemcristao-pxf5m3jfd-carlos-junior-s-projects.vercel.app, SHAexato. Patch observado nos logs do build;12hashes de assets/corposPASS.
- DONE realTEST:6fluxos Chromium/WebKit×3perfis/126checks mais3repetições WebKit/líder/66checks,192PASS; quatro pedidos reais RSC retidos antes de substituir o documento, nenhum pageerror/DOM/RSCconsole.12AuthRLSAPIchecksPASS.
- Tentativa estrita3 preservadaFAIL de clique antes da barreira; repetição distintaPASS, sem converter anterior. Recoveryhelper privado corrigido para sucesso200/204 da RPCoficial; identidades/posse e3originaisativos conferidos. Operações de seleção TEST foram fluxos autorizados de UI/RPC, não alterações administrativas de banco.
- Preservação:8datasets de jogo PROD+20tabelas Guilda/EBD PROD com os mesmos hashes; TEST7datasets econômicos iguais,travelershashalterado por seleções oficiais e3originais restaurados. Provas004/60checks com os mesmos hashes. Produção808433aREADY/alias e7HTTP esperados, sem nova homologação produtiva autenticada.
- QA/Security/aceite pelo autor:PASS no escopo, sem independência alegada; risco residual de desempenho após diálogo cancelado e manutenção do patch registrados. Não há filtro de erros nem mudanças Auth/CORS/RLS/proteções/economia/artes. Zero migrations/dependênciasnovas/recursospagos/merge/promoção.
- BLOCKED permanece na publicação de gameplay:16XP6moedas sem proveniência,catálogo/recompensas/positivoshospedados/Safarifísico. Nenhum DEPLOY_COMPLETE produtivo. Relatório005 e evidênciaslocal/hospedada atualizados; commits seguintes apenasensaio/documentação não mudam o runtime homologado.
