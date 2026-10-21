# DEPLOY-002 — Supabase isolado, Auth e ACL

ID: DEPLOY-002
TITLE: Implantação controlada do backend consolidado
OBJECTIVE: Reconciliar e testar SQL002/004, aplicar individualmente no Supabase de testes e validar ACL/RLS/Auth/economia sem produção ou Vercel.
PRIORITY: P1 High
STATUS: VALIDATING
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
