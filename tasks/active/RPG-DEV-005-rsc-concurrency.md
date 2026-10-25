# RPG-DEV-005 — WebKit/RSC durante navegações concorrentes

ID: RPG-DEV-005
TITLE: Localizar e corrigir trabalho RSC residual durante substituição de documento
OBJECTIVE: Correção mínima comprovada na reprodução determinística e na aplicação real, preservando PR11 e produção Guilda/EBD.
PRIORITY: P1 High
STATUS: VALIDATING
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

LOCAL_VALIDATION: 798unitPASS74SKIP (787 anteriores+11 novas regressões; antes3PASS8FAIL). Controle nativo3/3FAIL2erros/caso; hash tardio nativo3/3FAIL6erros/caso. Candidato schedulerREWORK3falhas reais; patch mínimo no transporte interno passa60fixture/48aplicação completa locais sem erro. Lint/types/build/protocolo25PASS. QA/Security pelo autor. CI exato e Preview/teste hospedado pendentes neste checkpoint; gameplay/produçãoBLOCKED. Relatório docs/architecture/RPG-DEV-005-REPORT.md e recorteRPG-DEV-005-EVIDENCE.json.
