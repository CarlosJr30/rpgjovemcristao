# DEPLOY-002 — Supabase isolado, Auth e ACL

ID: DEPLOY-002
TITLE: Implantação controlada do backend consolidado
OBJECTIVE: Reconciliar e testar SQL002/004, aplicar individualmente no Supabase de testes e validar ACL/RLS/Auth/economia sem produção ou Vercel.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Base CI cb66b6c4b87645cf5911a86b8b99943cc2d1664b preservada; checkout/branch de integração codex/deploy-supabase-002. Banco remoto exclusivamente wkdvdzfkbwvhyjmamrsg/host correspondente/orgxwyyrzctzharutyqysch/sa-east-1. Orquestrador autoriza Database/Backend/DevOps/QA/Security pelo autor, escrita de scripts/testes/manifesto/migrations de implantação e documentação própria; correções apenas de incompatibilidades reproduzidas. Sem subagentes ou revisão independente. Memória raiz somente prefixada.
OUT_OF_SCOPE: Produção wspafhlbtlpabypzymjo, dados reais, main/merge/push/deploy Vercel/configuração Vercel, recursos pagos, homologação/concessão de cartas/prêmios reais, edição de contratos ou locks SQL históricos, nova funcionalidade/economia.
DEPENDENCIES: DEPLOY-001 CI aprovado; receitas002+004 e recuperação; matriz006. URLHTTPS/callback/APP_BASE_URL reais dependem de DEPLOY-003 e ficam pendentes, sem domínio fictício.
ASSIGNED_AGENT: Autor assume Database/Backend/DevOps/QA/Security, sem independência.
REQUIRED_CONTEXT: AGENTS/GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY; skills Supabase/Postgres, perfis necessários; reciboDEPLOY-001, relatórios002/004/006, locks/fontes15SQL e fixture28PG.
SECURITY_CONSIDERATIONS: Confirmar ref/host/org imediatamente antes de escrever; inventário só metadata/contagens inicialmente, zero usuários/tabelas públicas. Registrar snapshot antes; não expor passwords/JWT/service_role; manter confirmaçãoemail/anonoff; dados sintéticos identificáveis somente no teste. Não executar filesystem/OS via SQL. Defaults gerenciados são permissivos: validar contenção da API durante implantação individual antes de liberar USAGE. Nenhuma escrita remota antes de gates locais.
ACCEPTANCE_CRITERIA:
- Manifesto novo reconcilia hashes15SQL e ordem, sem0010 cumulativo ou journal fictício.
-28PG opt-in PASS e ensaio de instalação/ACL/defaults/recuperação da sequência exata; no gate crítico falho, parar a parte remota.
- Alvo isolado/sem schema fora de journal comprovado, snapshot/recuperação prontos; migrations reais via ferramenta suportada e conferência após cada etapa.
- ACL/RLS/Definer/privados/negativas econômicas e isolamento comprovados hospedados, com limites de JWT/catálogo explícitos.
- Auth de teste configurada/verificada conforme capacidade disponível; callbacks públicos pendentes até origem real, sem desabilitar confirmação.
- Contas/testes sintéticos seguros quando disponíveis, sem prêmio/carta homologada; positivos oficiais bloqueados documentados.
- Relatório13itens/variáveisDEPLOY-003/checklist/memória e evidências de aplicado/configurado/testado versus pendente separados.
TEST_PLAN:
- RPG_LOCAL_PG=1 vitest postgres.integration.test.ts --testTimeout60000 sobre PostgreSQL descartável sem rede.
- Testar sequência de implantação com defaults iguais ao snapshot gerenciado, quarentena inicial/liberação final, rollback de falha e hashes/protocolo/ACL/catalog0.
- apply_migration individual, list_migrations e metadata/contagens após cada sucesso; parar ao primeiro erro ou divergência.
- Negativas anon/authenticated/service_role, RLS/ownership e APIs de Auth/REST quando configuradas; advisors finais e classificações.
DEFINITION_OF_DONE: Gates críticos comprovados e estado real registrado; bloqueios de URL/Vercel/homologação não disfarçados. Não declarar P1 hospedado resolvido só pela aplicação de SQL. Sem avanço automáticoDEPLOY-003.

## Preparação

Snapshot33worktrees/refs/pendências e reciboDEPLOY-001 antes de alterações. Metadata confirmou projectname/ref/host/região/org e PostgreSQL17.11.0.003, sem migrations; SELECT inicial metadata/contagens: auth.users0/publictables0/publicfunctions0, semDrizzle/Supabasejournal/foreignservers/subscriptions. Não consultada produção. Changelog/docs atuais lidos, incluindo avisoPG17.11/pgcrypto e TLS para aceite físico; sem upgrade/downgrade.

Necessário ensaiar defaults gerenciados mais amplos e contenção temporária de API durante etapas baseline→EXPAND→CONTRACT. Plano deve negar acesso intermediário, depois liberar somente os grants revisados, sem alterar a economia004.

Primeiro gate local28PG:25PASS/3FAIL (postgres-28-baseline.log). Ensaio de concorrência assumia primeiro ataque terminal apesar de RNG; deixou batalha ativa e causou duas falhas em cascata por unicidade. Corrigir somente a preparação do teste para alcançar rodada final real e preservar asserts de concorrência/rollback/recibo; nenhuma alteração de engine/SQL/recompensa. Parte remota de migrations segue bloqueada até28PASS.

Gates locais apósREWORK:28PGPASS/0skip em postgres-28-rework.log;4casos própriosPASS/0skip em postgres-deployment.log. Dois containers descartáveis encerrados; SQL15histórico/locks/engine/serviço/runtime intocados. Lint dirigido e TypeScript completoPASS, next-env gerado restaurado. [Plano/recuperação](../../docs/architecture/DEPLOY-002-MIGRATION-PLAN.md) e [manifesto17etapas](../../packages/database/deployments/deploy002/manifest.json) preparados antes de qualquer escrita remota.

Snapshot inicial salvo fora doGit: schema-before.json, zeroAuthusers/storageobjects/tabelas/funções da aplicação, sem vínculosforeignserver/subscription. Defaultspermissivos explícitos reconciliados por prepare_acl, contençãoUSAGE antes de cada commit e release somente apósCONTRACT. Arquivosguard/release gerados por CLIoficial2.121.0 verificada porSHA256; CLI usada só local, não autenticada/linkada ou publicada. CacheCLI ignorado.

Authsettings públicos reais já conformes: emaillogintrue/disable_signupfalse/mailer_autoconfirmfalse/anonymous_usersfalse; preservados, sem configuração alterada. Não há navegador conectado nem ferramentaadminAuth nesta conexão. Solicitada disponibilidade de contas sintéticas confirmadas/painel para JWTs reais; enquanto isso, preparar negativas anon/JWTinválido e testes SQLcomROLE explicitamente distintos de JWT verificado. Callbacks públicos permanecem pendentes de URLDEPLOY-003.

## Execução e aceite parcial — 2026-10-21

Aplicadas17migrations via ferramenta suportada, sem erro/replay, somente no ref autorizado. Cada etapa conferida com journal real e payload exato;16etapas mantiveram contençãoUSAGE, última liberou apósCONTRACT/guards. Versões reais20261021031639–20261021032433. Protocolo3,30tabelas públicasRLS, catálogo0. Nenhum0010, grant econômico arbitrário, cópia de produção, conta real ou Vercel. SQLhistórico/locks intactos.

Fixture nova teveREWORK por campos obrigatórios EBD ausentes/nomes incorretos/resposta vazia; corrigida após leitura do contratoSQL. Logs anteriores preservados, sem ignorar falhas. Ensaio final5casosPASS/0skip em postgres-hosted-harness-acceptance.log (inclui4anteriores, não somar). Somente então a mesma fixture executada hospedada:31assertionsPASS/cinco papéis, SETLOCALROLE/claims eROLLBACK. Não é JWT real. Contagens posterioresAuthusers/Travelers/Guildas/aulas/recibos/cartashomologadas0. Sequênciasidentity podem avançar no rollback.

HTTP16checksPASS no alvo real: Authsettings conforme sem alteração, anonleitura/RPC negados, seis privados não expostos, JWTinválido rejeitado, anonymous signupdisabled, password de conta inexistente rejeitado. Primeira tentativa à raizREST recebeu401, endpoint de tabela corrigido para testar406PGRST106; sem mudança de produto/configuração. Relatório13itens/checklist/variáveis em [DEPLOY-002-REPORT](../../docs/architecture/DEPLOY-002-REPORT.md), matriz [Security](../../docs/security/DEPLOY-002-HOSTED-SECURITY.md). Advisors34security(20WARN/14INFO) e49performance classificados; zeroERRORsecurity. Não declarar P1 integralmente resolvido: negativos SQL/HTTP comprovados, positivos JWT/concorrência hospedada ainda pendentes.

| Gate | Estado |
| --- | --- |
| SELF VALIDATE / QA autor | PASS preparação/aplicação/negativas:28PG+5deploy locais e31SQL+16HTTP hospedados. |
| LINT / TYPECHECK | PASS lint dirigido e tipos completos, logs lint-final.log/typecheck-final.log. next-env gerado restaurado. |
| BUILD / UNIT base | PASS reutilizado CI do SHA aprovado687unit+25protocolo/build; runtime/manifests/lockfile/workflows intocados. Nova lógica de implantação validada nos5testes PG, sem build frontend adicional necessário. |
| SECURITY autor | PASS controles aplicados/negativas, com limites/advisors documentados; sem revisão independente. Gate Auth/JWT real continua aberto. |
| DOC / NO SECRETS / preservação | Relatórios/manifesto/journal/auditoria/recibo locais; sem chave/senha/JWT versionados. Root/33worktrees e contratos antigos protegidos; memória raiz só prefixada. |
| ACCEPTANCE integral | BLOCKED: cinco contas confirmadas e Auth positivo; origem/callback/aparelhos dependentes003; positivos Arena/Torre/Story dependem homologação/serviço/eventos. |

Condição de retomada: painelAuth de testes ou contas sintéticas confirmadas por canal seguro, mantendo confirmaçãoemail e sem passwords/tokens na conversa. Depois executar positivosAuth e registrar evidência. Não iniciarDEPLOY-003 automaticamente ou publicarVercel enquanto gates aplicáveis estiverem abertos. Dados do banco estão preservados no estado sem usuários/fixtures persistidas; novas migrations exigem reconciliação com journal existente, nunca replay cego.

## Retomada via Edge — 2026-10-21

Painel conectado pelo usuário via @Edge e projeto/ref/org/Healthy/sa-east-1 conferidos visualmente; bloqueio de acesso ao navegador removido. Auth UI confirma signup/email habilitados, Confirm email ativo e anonymous sign-ins desativado, sem alteração. URL Configuration inspecionada: Site URL http://localhost:3000 e nenhuma Redirect URL, preservados até origemHTTPS realDEPLOY003. Users não mostra linhas; total estimado10 não é contagem atual confiável após fixturesROLLBACK, não foi tratado como dez contas reais.

Formulário Create a new user aberto com deploy002-jogador@fixture.invalid; password não inserido e Create user não acionado. Auto confirm user padrão refere-se somente à conta sintética administrativa; não altera a confirmação global. A política obrigatória do controle de navegador exige handoff para entrada/confirmação/envio de nova credencial. Usuário deve definir senhas e concluir criação das contas sintéticas diretamente; nenhuma senha/token solicitado na conversa. Evidência local auth-account-handoff.jpg e auth-panel-status.json em build/deploy-002. Sem novos testesAuth positivos, DDL/configuração remota/push/Vercel ou concessões; BLOCKED até credenciais/contas acessíveis por fluxo seguro. Validação desta retomada é inspeçãoUI/documental pelo autor; não exige repetir28PG/build/CI, pois não há mudança executável.

## Continuidade pela conexão autorizada — 2026-10-21

Novo pedido reafirma alvo exclusivo e proíbeprodução/main/Vercel. Antes de SQL, get_project/get_project_url/list_migrations e receita local reconfirmaram ref/nome/org/host/sa-east-1/ACTIVE_HEALTHY e17entradas exatas. Depois, journal SQL somente leitura conferiu statements reais com17payloads completos; zero divergência. Nenhuma migration nova ou reaplicada. Snapshot atual tem mesmos96functions/38tables/39policies/columns/defaults/roles do snapshot pós-cutover;30públicasRLS, nenhumDefiner sem search_path. Seis fontes executáveis/testes iguais aos hashes do recibo anterior; gates locais28+5 reutilizados, não repetidos.

Executados nesta continuidade: guardACL em transação READONLY PASS,31assertionsSQL hospedadas/cinco papéis/ROLLBACK PASS,16HTTPchecks reais PASS. Contagens posterioresAuthusers/Travelers/Guildas/aulas/recibos/cartas0, protocolo3 e journal17. Authorityanon/authfalse, servicetrue. Advisors novamente34security(20WARN+14INFO)/49performance(2WARN+47INFO), sem mudança/ERRORsecurity; classificação anterior permanece. Negativas HTTP usam só chave publicável no artefato local ignorado; credenciais não exibidas.

Browser novamente disponível no ref correto, formulário pendente sem criação. Fallback MCP funciona e é suficiente para SQL/ACL/negativas, mas não fornece APIadminAuth ou sessão de jogador. Presença de configuração esperada no processo verificada somente por nomes/booleans: nenhumaURL/key/service_role/access_token configurada; não buscar secrets em perfis de navegador/VSCode nem simular usuário confirmado via SQL. Não solicitar passwords/tokens no chat. Authpositivo permaneceBLOCKED por contas/sessões reais ausentes, junto com callbacks/aparelhos003/homologações; P1 público integral não declarado resolvido. NenhumconfigAuth/DDL/grant/prêmio/push/produção/main/Vercel alterado. Evidências novas: identity-journal-resume.json, schema-revalidated.json, acl-guard-resume.json, sql-results-resume.json, http-results-resume.json, counts-resume.json, advisors-resume.json e revalidation-receipt.json em build/deploy-002. QA/Security/documentação pelo autor; diff e preservação revisados, sem nova mudança executável que exija build/lint/tipos/28PG.
