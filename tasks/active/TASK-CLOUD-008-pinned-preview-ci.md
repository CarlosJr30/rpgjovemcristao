# TASK-CLOUD-008 — Release por SHA e preparação do CI oficial

ID: TASK-CLOUD-008
OBJECTIVE: Publicar exatamente o commit aprovado e preparar CI em branches/PRs, checks de merge e plano de produção/rollback, sem publicar produção.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: .github/workflows, scripts/ci, apps/web/vercel.json, documentação/contrato/memória; worktrees isolados, branches codex/, PRs revisáveis sem merge; Preview no projeto/equipe já existentes, somente após validação. Inspeção de metadados de credenciais e regras; configurações de CI dentro do plano vigente. DEVOPS/QA/SECURITY assumidos pelo orquestrador e ampliados explicitamente apenas a esse recorte, conforme pedido do usuário.
OUT_OF_SCOPE: Deploy/merge em produção ou main, Supabase/SQL/dados reais, jogo/arte/balanceamento, coletar ou transportar tokens pessoais para CI, novos serviços/dependências sem necessidade demonstrada. Preservar o fluxo CLOUD-007 até haver substituto validado.
DEPENDENCIES: CLOUD-007 concluída; eventual autenticação de deploy configurada pelo usuário no ambiente protegido do GitHub.
ASSIGNED_AGENT: Orquestrador assume DEVOPS/QA/SECURITY, revisão pelo autor, sem independência.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY; CLOUD-007; skills vercel:deployments-cicd/vercel-cli.
SECURITY_CONSIDERATIONS: SHA imutável, destino Preview fixo, validação de fonte e resultado, sem retry de POST, credenciais só no job autorizado sem execução do código do PR; Actions fixadas por SHA; forks sem secrets. Nenhum token em arquivo/log/prompt. Credenciais novas de CI devem ser configuradas diretamente pelo usuário, conforme a skill.
ACCEPTANCE_CRITERIA:
- API de deploy aceita SHA fixo; HEAD da branch pode avançar sem trocar o commit publicado.
- Falha/ausência de validação e divergência de SHA/target impedem publicação/aceite.
- Workflow oficial de qualidade cobre branches/PRs, com check estável para proteção de main, preparado em PR separado de main sem código de jogo.
- Plano de instalação dos checks e de produção/rollback concreto; nada publicado em produção.
- Código/config testados, CI real e Preview verificados quando credenciais disponíveis; pendências explícitas sem declarar ativação não comprovada.
TEST_PLAN: Testes de concorrência, destino errado, failure/timeout/duplicação; YAML/permissões/secret scan; CI Linux no GitHub; Preview SHA/READY/isolamento; inspeção de preservação de produção.
DEFINITION_OF_DONE: Critérios comprovados, QA/Security pelo autor, documentação e memória atualizadas. Falha gera REWORK; credencial/permissão indispensável ausente gera BLOCKED com desbloqueio preciso.

## Resultado técnico e QA/Security — 2026-10-18

Revisão pelo próprio autor, sem independência. Worktree/branch originais e SQLs pendentes preservados; runtime, arte, dependências e lockfile sem alterações.

- 15 testes Node do protocolo PASS: SHA antigo enquanto branch avança, CI falho/outro SHA, branch indevida, rerun, timeout sem retry, projeto/target/SHA/URL incorretos, deduplicação e polling/erro. YAML/JSON/pins/permissões/secret scan/lint PASS.
- CI real corrigido: run39102978491 para6796845c89b039d64a53da1bb5376cfd2d87ebaa PASS;561 testes do jogo PASS/14 skips preexistentes,15 testes de protocolo PASS,lint/types/build PASS. Os skips não cobrem banco real. Job novo de deploy SKIPPED porque não ativado.
- REWORK inicial preservado: request com target:preview rejeitado HTTP400;zero deployments para0ae9dc2. Corrigido para omissão do target, padrãoPreview daAPI, com rejeição de respostaProduction. Nenhum --prod executado.
- Prova real com CLI autenticado local: branch avançada paracdf39671e8c887582f146b713cec6308ecc424df, mas request/retorno/publicação no SHA aprovado6796845. Exatamente1deployment dpl_4Q9NbuEFwtz5fqEtD9bBp3j5c78y READY; targetnull/Preview;repo/projeto/sha reais conferidos. Isso valida a pinagem, mas não equivale à ativação do runner GitHub.
- SmokeHTTPS6/6PASS comOIDCefêmero só emmemória: Jornada/Arena200,legacyGETHEAD307,Auth307,API403,headersmemory-only/CSPself/no-store/noindex;sem dados reais/bypasspermanente.
- PR4→cloud007 com publicação porSHA; PR5→main comsomente3arquivosdeCI, ambos drafts semmerge. CIoficial push39102792903/PR39102807772 PASS,452 testes/lint/types/build PASS.
- Proteção main aplicada após o check existir: PR obrigatório,checkestável doGitHubActions15368,strict/up-to-date,enforceadmins,semforcepush/exclusão. main0df8787/produção dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt READY/proteçãoVercel preservadas.
- AmbienteGitHubpreview-deploy criado semsecrets, Carlosaprovador ebranchescodex/pinned-preview-ci/preview/* permitidas. Inspeçãofinal:VERCEL_TOKENausente/flagRPG_PINNED_PREVIEW_ENABLEDfalse. Usuário pediu orientação e recebeu links/passos; nenhum token coletado/copiadodoCLI.
- Plano deprodução/rollback documentado; sem execução/migrations/Supabase. Configurações de produção não instaladas ou liberadas por esta tarefa.

## Bloqueio anterior e próximo passo

BLOCKED_ENVIRONMENT_CREDENTIAL: usuário deve criar token naVercel com menor escopo disponível e expiração e inseri-lo diretamente no EnvironmentsecretVERCEL_TOKEN de preview-deploy. Exigência da skilldeployments-cicd: "Have the user configure credentials directly in their CI provider". Não pedir o valor em chat e não extrair tokenlocal para oGitHub.

Retomada: usuário confirmou "Salvei". Conferência somente dos metadados confirmou VERCEL_TOKEN presente no ambiente protegido; RPG_PINNED_PREVIEW_ENABLED=true ativada e lida de volta. Nenhum valor de segredo foi lido ou movido. Novo commit documental revisado inicia run push para validar o runner real; aprovação do ambiente para o SHA exato e READY/smoke ainda pendentes. Produção/main e PRs permanecem sem merge.

Após confirmação, conferir só metadados, ativarflag, enviar novo commit revisado para gerar runpush e apresentar aprovação do ambiente para o SHA exato. Então acompanhar o jobGitHub atéREADY e smoke, sem confundir a provaCLI atual com automaçãoativada. PR5 continua semmerge; instalarworkflowemmain exige revisão separada porque pode dispararProduction. Não marcarDONE antes do aceite do runner.

Evidências privadas na raiz: build/task-cloud-008-pinned-ci/{pinned-proof.json,created-deployment.json,pinned-request.json,preview-smoke.json,acceptance.json}. Encerramento documental local,semoutropush/deployapenasparadocs.
