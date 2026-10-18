# TASK-0076A — Anexo operacional do preflight

2026-10-17. Comandos propostos, **não executar como um script contínuo**. Cada etapa depende do aceite indicado no relatório principal. Nenhuma migration, exportação, restauração, alteração de variável ou publicação foi executada neste preflight. Não há senha/token neste documento.

## A. Leitura remota e inspeção local

Vercel CLI 64.0.2 existente no workspace; parâmetros explícitos impedem selecionar outro projeto. Não usar env pull ou imprimir JSON bruto com valores.

```powershell
$Vc = 'D:\rpg-jovem-cristao-combat-0076\.npm-cache\_npx\c96642427131a8ff\node_modules\vercel\dist\index.js'
$Project = 'prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG'
$Team = 'team_FWD8MfZ9vARK8EBovoyTn9Ox'
node $Vc project inspect $Project --scope $Team --non-interactive
$Metadata = node $Vc api "/v10/projects/$Project/env?teamId=$Team&decrypt=false" --method GET --raw --scope $Team --non-interactive
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível confirmar variáveis.' }
($Metadata | ConvertFrom-Json).envs | Select-Object key,target,type
git ls-tree -r --name-only 0df878764f26f0501959031dd4aec4a77fb9308a apps/web/app/api/economy apps/web/lib/economy
Get-FileHash -Algorithm SHA256 packages/database/migrations/0009_reward_security_task0076a.sql,packages/database/migrations/0010_reward_security_cutover_task0076a.sql
```

Consultas MCP somente leitura realizadas, com argumentos exatos:

```text
vercel.get_deployment({idOrUrl:"rpgjovemcristao-web-inky.vercel.app",withGitRepoInfo:"true"})
vercel.get_project({idOrName:"rpgjovemcristao-web"})
supabase.get_project({id:"wspafhlbtlpabypzymjo"})
supabase.get_project_url({project_id:"wspafhlbtlpabypzymjo"})
supabase.get_organization({id:"xwyyrzctzharutyqysch"})
supabase.list_migrations({project_id:"wspafhlbtlpabypzymjo"})
```

`filter_project_envs(decrypt:false)` retornou 403; fallback CLI acima funcionou. Apenas NEXT_PUBLIC_SUPABASE_URL foi lido individualmente por GET `/v1/projects/prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG/env/ut9eGiA6d50k14HM?teamId=team_FWD8MfZ9vARK8EBovoyTn9Ox`; saída reduzida ao identificador público. Publishable key e segredos não foram descriptografados. GET da página `/journey` e de seus nove scripts públicos confirmou o mesmo ref; evidência contém somente paths/hashes/refs.

SQL de diagnóstico, executável por `supabase.execute_sql` no ref confirmado ou por psql com conexão segura. **Leitura remota**; não selecionar saldos ou dados de contas:

```sql
BEGIN READ ONLY;
SELECT current_database(),current_user,current_setting('server_version'),
       to_regnamespace('economy_private'),
       to_regprocedure('public.economy_protocol_version()'),
       to_regprocedure('public.economy_authority(uuid,uuid,text,jsonb)');
SELECT proname,pg_get_function_identity_arguments(oid),prosecdef
FROM pg_proc WHERE pronamespace='public'::regnamespace
AND proname IN ('create_traveler','open_chest','purchase_chest');
COMMIT;
```

Pré-condições adicionais de catálogo já consultadas estão integralmente em `build/task-0076a-reward-security/remote-preflight/prerequisites-readonly.sql`, com BEGIN READ ONLY. São as oito assinaturas, oito políticas a remover, duas colunas e papéis/schemas usados pelas migrations, não nova auditoria econômica.

## B. Backup — leitura remota, escrita apenas em armazenamento privado

**Verificação de acesso em 2026-10-17:** nenhum backup real autorizado identificado nos registros TASK-0076A ou no diretório privado previsto (inexistente). PGSERVICE/PGSERVICEFILE/PGPASSFILE, DATABASE_URL e token de Management API ausentes na sessão; arquivos libpq padrão não encontrados. Nenhum valor de credencial foi lido, criado ou alterado. MCP de SQL não é acesso pg_dump; a capacidade de executar SELECT via conector não autoriza exportar dados pessoais. CLI Supabase nativa ausente; psql/pg_dump/pg_dumpall/pg_restore 17.6 disponíveis na imagem Docker já existente. Dashboard/Management API podem oferecer backups conforme o plano, mas não há artefato recuperável confirmado. **Não executar a exportação abaixo sem autorização própria**, que não foi concedida por este pedido condicional.

**Proposta ainda bloqueada:** operador deve confirmar ferramenta PostgreSQL 17, conexão direta ou pooler de sessão com TLS/certificado verificado, autoridade de exportação e armazenamento protegido. Clientes nativos não estão no PATH desta sessão; imagem PostgreSQL 17.6 existente contém o psql previamente testado. Não instalar/provisionar nada automaticamente. A sintaxe abaixo é para estação operacional preparada.

Conexões libpq via `PGSERVICEFILE`/`PGPASSFILE` privados, fora do repo; serviço `task0076a_prod` deve apontar ao ref confirmado. Não criar, resetar nem copiar credenciais nesta etapa. Serviços não estão configurados na sessão atual. Sem URL com senha na linha de comando.

```powershell
$BackupDir = 'D:\TASK-0076A-BACKUP-PRIVADO'
$Checkpoint = 'B0' # B0 antes de 0009; repetir como B1 após 0009 e antes de 0010.
$Archive = Join-Path $BackupDir "$Checkpoint.dump"
pg_dump --no-password --dbname 'service=task0076a_prod' --format=custom --file "$Archive"
if ($LASTEXITCODE -ne 0) { throw 'Backup incompleto; bloquear implantação.' }
pg_dumpall --no-password --dbname 'service=task0076a_prod' --database postgres --roles-only --no-role-passwords --file "$BackupDir\$Checkpoint.roles.sql"
if ($LASTEXITCODE -ne 0) { throw 'Papéis não exportados; bloquear implantação.' }
pg_restore --list "$Archive" | Set-Content -LiteralPath "$BackupDir\$Checkpoint.toc" -Encoding UTF8
if ($LASTEXITCODE -ne 0) { throw 'Archive inválido.' }
Get-FileHash -Algorithm SHA256 "$Archive","$BackupDir\$Checkpoint.roles.sql"
```

Um único pg_dump sem filtro de schema reúne dados e definições no mesmo snapshot: public, guild_chat_private, economy_private se existente, dependências Auth e demais schemas não sistêmicos. Inclui RLS/ACL/owners/funções/triggers, saldos, stats/equipamentos/inventários, progresso, baús, recibos e Guilda. Não passar `--no-acl`, `--no-owner`, `--enable-row-security` nem filtrar contas: isso comprometeria a recuperação. Não adicionar grants, desligar RLS ou instalar extensões para conseguir exportar; qualquer erro mantém BLOCKED. Papéis globais não compartilham o snapshot do dump: coordenar ausência de mudanças administrativas durante coleta e conferir catálogo/roles no ensaio.

O dump contém dados pessoais/Auth potencialmente sensíveis; criptografar/limitar acesso fora do repo, não anexar ao ChatGPT. Senhas de roles são excluídas; mecanismos de senha, Vault e chaves de plataforma exigem custódia separada pelo operador, sem revelar valores. Storage binário e configuração externa Vercel/Auth não são um dump PostgreSQL: inventariar referências/recuperação separadamente, sem copiar objetos ou segredos agora.

## C. Ensaio — modifica somente alvo isolado

**Preparação efetivamente executada em 2026-10-17:** PostgreSQL 17.6 inicializado vazio em Docker, somente exec interno, sem publicação de portas, rede interna, filesystem raiz read-only e dados em tmpfs. Zero tabelas da aplicação, sem schema auth e sem extensão supabase_vault disponível. Utilitários pg_dump/pg_restore/pg_dumpall 17.6 conferidos por --version; nenhum dump nem restore foi executado. Container/rede descartados ao encerrar. Evidência: `build/task-0076a-reward-security/backup-restore-preparation/local-preparation.json`. Isso é preparação de ferramenta/alvo base, **não validação de backup**, nem clone Supabase completo.

Comandos exatos para recriar o mesmo alvo base local, sem credenciais e sem publicar portas; executados nesta etapa (não restauram dados):

```powershell
docker network create --internal --label task=TASK-0076A-BACKUP rpg-task0076a-backup-isolated
if ($LASTEXITCODE -ne 0) { throw 'Rede isolada não criada; parar.' }
docker run --detach --rm --name rpg-task0076a-backup --label task=TASK-0076A-BACKUP --network rpg-task0076a-backup-isolated --read-only --tmpfs /var/lib/postgresql/data:rw,nosuid,size=512m --tmpfs /var/run/postgresql:rw,nosuid --tmpfs /tmp:rw,nosuid --env POSTGRES_HOST_AUTH_METHOD=trust --env POSTGRES_DB=task0076a_restore postgres:17.6
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL descartável não criado; parar.' }
docker exec rpg-task0076a-backup pg_isready -U postgres -d task0076a_restore
docker exec rpg-task0076a-backup pg_dump --version
docker exec rpg-task0076a-backup pg_restore --version
docker exec rpg-task0076a-backup pg_dumpall --version
```

Trust aplica-se apenas a esse container vazio, em rede interna sem portas expostas; nenhum segredo PostgreSQL foi configurado. Não copiar essa configuração para produção. Não reutilizar esse alvo para dados reais até revisar capacidade, isolamento, extensões e custódia; tmpfs de 512 MiB é apenas preparação vazia, não capacidade confirmada para um backup real.

Preparar alvo isolado compatível com Supabase/PostgreSQL 17 e extensões/owners/Auth/Vault. Bloquear saída de rede e manter webhooks/jobs/serviços externos sem acesso a produção **no alvo**, antes de carregar dados. Postgres puro da suíte sintética não comprova restauração integral de Supabase. Alvo compatível completo/manifesto ainda não existem; não há alegação de ensaio PASS. Não tentar contornar extensão/owner ausentes eliminando objetos ou desativando RLS.

Operador deve preparar `task0076a_restore` exclusivamente loopback, `roles.restore-reviewed.sql` com os papéis necessários e `restore-approved.toc` compatível com os objetos gerenciados já presentes no alvo. Não ignorar erros nem excluir ACL/RLS/dados econômicos para fazer passar. Se for necessária adaptação de objetos gerenciados, documentar cada entrada e validar sua equivalência. Comandos condicionais a esses insumos revisados:

```powershell
psql --no-password -X --single-transaction --set=ON_ERROR_STOP=1 --dbname 'service=task0076a_restore' --file "$BackupDir\roles.restore-reviewed.sql"
if ($LASTEXITCODE -ne 0) { throw 'Falha nos papéis do alvo.' }
pg_restore --no-password --single-transaction --exit-on-error --dbname 'service=task0076a_restore' --use-list "$BackupDir\restore-approved.toc" "$Archive"
if ($LASTEXITCODE -ne 0) { throw 'Restauração falhou; produção bloqueada.' }
```

Conferir no alvo checksums/TOC, owners/grants, RLS, FKs, quantidades/recursos/progresso e recibos; registrar tempo real de restauração para fixar RTO/RPO. Guardar baseline privado agregado do alvo; aplicar etapas propostas somente no clone em autorização própria e provar preservação/replay/rollback. Não executar 0000–0008 sobre o dump restaurado. Não fazer restauração de produção durante este ensaio. Preparar descarte seguro do alvo/artefatos sensíveis conforme retenção aprovada.

### Restauração via Docker e verificação futura

Alternativa exata aos binários nativos, **não executada**. Só depois de backup real autorizado, SHA-256/TOC/procedência conferidos e alvo compatível preparado. Diretório `$BackupDir` permanece privado fora do repo; não copiar dumps para build/, public/ ou staging do artefato de aplicação. A lista de restauração e roles revisados são insumos ainda pendentes; não são arquivos ficticiamente existentes.

```powershell
docker cp "$BackupDir\B0.dump" rpg-task0076a-backup:/tmp/backup.dump
if ($LASTEXITCODE -ne 0) { throw 'Cópia privada para alvo falhou.' }
docker cp "$BackupDir\roles.restore-reviewed.sql" rpg-task0076a-backup:/tmp/roles-reviewed.sql
if ($LASTEXITCODE -ne 0) { throw 'Papéis revisados ausentes.' }
docker cp "$BackupDir\restore-approved.toc" rpg-task0076a-backup:/tmp/restore-approved.toc
if ($LASTEXITCODE -ne 0) { throw 'TOC aprovado ausente.' }
docker exec rpg-task0076a-backup psql -U postgres -d task0076a_restore -X --single-transaction --set=ON_ERROR_STOP=1 --file=/tmp/roles-reviewed.sql
if ($LASTEXITCODE -ne 0) { throw 'Falha nos papéis; não continuar.' }
docker exec rpg-task0076a-backup pg_restore -U postgres -d task0076a_restore --single-transaction --exit-on-error --use-list=/tmp/restore-approved.toc /tmp/backup.dump
if ($LASTEXITCODE -ne 0) { throw 'Restauração falhou; manter bloqueio.' }
```

Validação somente após restauração autorizada. Executar o SQL abaixo no alvo pelo psql; **não executado nesta etapa**, nem no remoto. A saída completa permanece privada: somente PASS/FAIL e totais não identificáveis devem entrar no relatório. Contagens não substituem equivalência; comparar também definições/owners/ACL/RLS com baseline aprovado do mesmo backup, não com consultas ao banco vivo em outro instante.

```sql
BEGIN READ ONLY;
SELECT format('SELECT %L AS object, count(*) AS rows FROM %I.%I;',
              schemaname||'.'||tablename,schemaname,tablename)
FROM pg_tables WHERE schemaname IN ('auth','public','guild_chat_private','economy_private')
ORDER BY schemaname,tablename
\gexec
SELECT n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,
       pg_get_userbyid(c.relowner) AS owner,
       md5(coalesce(c.relacl::text,'')) AS acl_hash
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('auth','public','guild_chat_private','economy_private')
AND c.relkind IN ('r','p') ORDER BY n.nspname,c.relname;
SELECT schemaname,tablename,policyname,permissive,roles,cmd,
       md5(coalesce(qual,'')||'|'||coalesce(with_check,'')) AS predicate_hash
FROM pg_policies
WHERE schemaname IN ('auth','public','guild_chat_private','economy_private')
ORDER BY schemaname,tablename,policyname;
SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),
       p.prosecdef,p.proconfig,pg_get_userbyid(p.proowner) AS owner,
       md5(pg_get_functiondef(p.oid)) AS definition_hash,
       md5(coalesce(p.proacl::text,'')) AS acl_hash
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('auth','public','guild_chat_private','economy_private')
AND p.prokind IN ('f','p') ORDER BY n.nspname,p.proname,pg_get_function_identity_arguments(p.oid);
SELECT n.nspname,c.relname,con.conname,con.convalidated,
       md5(pg_get_constraintdef(con.oid)) AS definition_hash
FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('auth','public','guild_chat_private','economy_private')
ORDER BY n.nspname,c.relname,con.conname;
COMMIT;
```

O hash bruto de ACL depende da ordem textual dos grants: diferenças exigem comparar ACL efetiva normalizada por papel/permissão/grantor, não declarar falha de dados ou relaxar grants automaticamente. Contagens precisam cobrir auth.users/profiles, travelers/wallets/stats/inventory/equipped, progresso JSON, Guildas/membros/missões/claims/chat, chests/operations e ledger privado se presente no backup. Verificar relações/FKs, sequências, triggers e equivalência dos valores de XP/moedas/quantidades/progresso/recibos dentro do ambiente privado, sem listar usuários, e-mails, tokens ou reflexões. Privilégios efetivos devem ser testados em transações locais revertidas com papéis anon/authenticated, preservando RLS. Tudo isso permanece NOT_RUN sem backup real.

Ao encerrar, verificar ID e label TASK-0076A-BACKUP antes de `docker stop rpg-task0076a-backup`; AutoRemove elimina o container/tmpfs. Confirmar ausência e remover apenas a rede interna identificada com `docker network rm rpg-task0076a-backup-isolated`. Nunca executar DROP/restore/reset no projeto Supabase para testar recuperação.

## D. Implantação — altera remotamente, proibida neste preflight

Pré-condições: liberar todos os blockers do relatório, aprovação do artefato/hash, segredo somente servidor configurado pelo responsável, B0/ensaio e janela de manutenção aprovados. Nenhum comando de criação de segredo é proposto nesta entrega; configuração futura deve ocorrer em canal seguro do Vercel. Deployment deve usar Production e ficar inicialmente sem promoção automática, conforme [documentação Vercel](https://vercel.com/docs/cli/deploy#skip-domain).

```powershell
# D1: altera banco remoto; somente EXPAND.
psql --no-password -X --single-transaction --set=ON_ERROR_STOP=1 --dbname 'service=task0076a_prod' --file 'packages/database/migrations/0009_reward_security_task0076a.sql'
if ($LASTEXITCODE -ne 0) { throw 'EXPAND falhou; parar.' }
# D2: cria deployment remoto Production sem trocar domínio público.
node $Vc deploy --prod --skip-domain --project $Project --scope $Team --non-interactive
if ($LASTEXITCODE -ne 0) { throw 'Não há artefato pronto; parar.' }
```

Registrar o ID/hash retornado, confirmar READY/configuração e gate de protocolo 1. Repetir backup B1. **Ainda não há comando de ativação/dreno de manutenção selecionado:** é blocker operacional. Não inventar flag inexistente; página de manutenção Vercel não bloqueia RPC direto de abas antigas ao Supabase. Autorizar o mecanismo e a duração após ensaio antes de continuar.

```powershell
# D3: altera domínio/produção, apenas com ID validado do artefato novo.
node $Vc promote $env:TASK_0076A_APPROVED_DEPLOYMENT_ID --scope $Team --non-interactive
if ($LASTEXITCODE -ne 0) { throw 'Promoção não confirmada; manter manutenção.' }
# D4: altera banco remoto; CONTRACT integral numa única transação.
psql --no-password -X --single-transaction --set=ON_ERROR_STOP=1 --dbname 'service=task0076a_prod' --file 'packages/database/migrations/0010_reward_security_cutover_task0076a.sql'
if ($LASTEXITCODE -ne 0) { throw 'CONTRACT falhou; não liberar economia.' }
# D5: somente leitura; precisa retornar 2 antes do smoke.
psql --no-password -X --set=ON_ERROR_STOP=1 --dbname 'service=task0076a_prod' --command 'BEGIN READ ONLY; SELECT public.economy_protocol_version(); COMMIT;'
if ($LASTEXITCODE -ne 0) { throw 'Protocolo não confirmado.' }
```

Em D5, operador deve conferir valor 2, não apenas exit 0. Parar se valor diferente. Gate comprovado no runner anterior `review-four-points/postgres-evidence.json`; as opções `--single-transaction`/ON_ERROR_STOP não são opcionais. D1 e D4 são transações separadas; não juntar as duas etapas nem executar indiscriminadamente migrations pendentes.

## E. Recuperação — comandos remotos somente após aprovação específica

Se CONTRACT falhar, o próprio psql reverte sua transação. Antes de CONTRACT confirmado, rollback do deployment pode retornar ao publicado anterior (mantém exposição econômica antiga; decisão consciente do operador):

```powershell
node $Vc rollback dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt --scope $Team --non-interactive
if ($LASTEXITCODE -ne 0) { throw 'Rollback de deployment não confirmado.' }
```

Após CONTRACT bem-sucedido, **não** usar esse backend antigo como recuperação. Manter manutenção/release compatível, preservar ledger/ACL/RLS e corrigir para frente. Pausa adicional somente do gateway (modifica função remota, não executada):

```powershell
$PauseGateway = @'
CREATE OR REPLACE FUNCTION public.economy_protocol_version()
RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $$ SELECT 0 $$;
'@
$PauseGateway | psql --no-password -X --single-transaction --set=ON_ERROR_STOP=1 --dbname 'service=task0076a_prod' --file=-
if ($LASTEXITCODE -ne 0) { throw 'Pausa não confirmada.' }
```

Protocolo 0 não pausa RPCs seguras de baú/Guilda nem equivale à manutenção global. Retornar 2 exige nova validação/autorização. Restauração de desastre em produção NÃO é um comando pronto neste preflight: necessita reconciliação de concessões posteriores, plano específico para Supabase gerenciado, alvo/horário confirmados e aprovação separada. Não reaplicar dump antigo automaticamente nem reabrir grants vulneráveis.

Referências: [snapshot consistente pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html), [roles sem passwords](https://www.postgresql.org/docs/17/app-pg-dumpall.html), [restore transacional](https://www.postgresql.org/docs/17/app-pgrestore.html), [limites dos backups Supabase](https://supabase.com/docs/guides/platform/backups). Estratégia documentada, não confundida com export/restore executados.
