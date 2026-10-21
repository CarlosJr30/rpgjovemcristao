# DEPLOY-002 — sequência e recuperação do alvo isolado

2026-10-21. Autorização do usuário limitada a wkdvdzfkbwvhyjmamrsg, rpgjovemcristao-test, orgxwyyrzctzharutyqysch/CarlosJr30's Org, sa-east-1, API/DB hosts correspondentes. Produçãowspafhlbtlpabypzymjo proibida. Base CI preservada:cb66b6c4b87645cf5911a86b8b99943cc2d1664b; branch local de integração codex/deploy-supabase-002. Não inclui push/deployVercel ou nova funcionalidade.

## Gate inicial

Metadata confirmou ACTIVE_HEALTHY e PostgreSQL17.11.0.003. SQL apenas metadata/contagens: auth.users0, publictables0/publicfunctions0, nenhum journalSupabase/Drizzle/foreignserver/subscription. Não há evidência de aplicação fora do journal ou ligação de dados a produção. Extensãopgcrypto no schemaextensions e publicaçãosupabase_realtime gerenciadas existentes, não substituir helpersAuth/roles do provedor. Snapshot antes da primeira escrita preserva schemas/roles/ACL/defaults/policies/functions e contagens; não lê passwords/JWTsecrets/linhas de jogadores.

## Receita reconciliada

Fonte: [manifesto](../../packages/database/deployments/deploy002/manifest.json), com17etapas, hashes completos do SQL original e do payload aplicado; [builder](../../packages/database/deployments/deploy002/recipe.mjs). Treze SQL002 e dois SQL004 permanecem byte a byte, normalizaçãoLF conferida contra locks históricos. O campo remoteApplyAuthorized:false do lock004 documenta sua tarefa antiga; a autorização remota atual é exclusivamente este contratoDEPLOY-002.

1. prepare_acl: retirar defaults automáticos para objetos futuros de postgres e conter USAGEpublic paraPUBLIC/anon/authenticated.
2. baseline0000 inicial.
3. baseline0001 Guilda.
4. baseline0002 baús.
5. baseline0003 prêmio de missão legado.
6. baseline0004 painel líder.
7. baseline0005 aulas/calendário.
8. baseline0006 checkpoint legado.
9. baseline0007 chat.
10. baseline0008 ordem chat.
11. QR0080 versionado fora do journalDrizzle.
12. Story0081.
13. Missões0082.
14. EBD0083.
15. EXPAND0078, cópia revisada004.
16. CONTRACT004, alternativa ao0010, nunca cumulativo com ele.
17. release_acl: conferir protocolo3, catálogo vazio, RLS, grants de tabela/coluna, APIs legadas negadas, authorityservice-only e search_path; só então restaurar USAGEpúblico paraanon/authenticated.

O provedor tinha defaultsALL de tabela/sequência eEXECUTE para papéis API; o ensaio histórico era restritivo. prepare_acl reconcilia essa diferença. EXECUTEimplícito dePUBLIC é defaultglobal: sua revogação é global para objetos futuros criados porpostgres; defaults de roles gerenciadas diferentes não são alterados. Tabelas/funções já existentes do sistema não são revogadas ou reescritas.

Cada payload intermediário acrescenta a mesma negaçãoUSAGE antes do commit, porque0000 concedeUSAGEpublic por conta própria. BEGIN/COMMIT externos das propostas0081–83 são movidos para a fronteira transacional da aplicação suportada, sem reescrever corpo/regraSQL. Uma etapa nunca pode reabrir a API antes do CONTRACT. Outros grants originais permanecem; nem RLS nem confirmaçãoAuth são desligados. O novo release aborta se um gate divergir.

## Ferramenta e journal

Aplicar uma etapa de cada vez via MCPapply_migration, project_id literal do alvo, nome único do manifesto, payload/hash congelados. Não usar execute_sql para contornar histórico deDDL. Após cada sucesso, list_migrations e inspeção deUSAGE/tabelas/RLS/contagens devem confirmar journal+n e estado esperado. Falha/divergência interrompe antes da próxima etapa; não repetir nome/SQL já registrado.

O journalSupabase é o histórico remoto real; timestamps são gerados pela ferramenta, mapeados ao nome/hash de origem no recibo. O journalDrizzle histórico não é preenchido artificialmente nem utilizado para reaplicar esse banco. Dois novos arquivos deguard/release foram gerados por CLIoficial2.121.0 (download/hash verificados) apenas localmente. A pasta supabase/migrations desse subdiretório contém somente esses dois arquivos; **não usar dbpush diretamente nela**. O manifesto referencia as outras15fontes históricas e é a sequência inteira deste cutover.

## Recuperação

Antes de qualquer migração, salvar snapshot metadata/ACL e contagens/journal vazio em build/deploy-002 da raiz, fora doGit. Como alvo está vazio, não há backup de dados de jogadores a copiar ou restaurar; não reutilizar dump de produção. Não é alegação de PITR/backup gerenciado disponível noFree.

Uma etapa transacional que falha reverte suas alterações; conferir journal e schema antes de qualquer ação seguinte. Teste local criou tabela-prova/erro e verificou rollback, e forçou privilégio econômico indevido para provar que release aborta e mantém contenção. Se etapa anterior já confirmouCOMMIT, preservar journal/objetos/recibos, manterUSAGE negado e preparar forward-fix revisado. Sem DROP/down/reset, alteração de migrationhistórica, mentira no journal ou reativação de grants antigos. Nenhum rollback remoto destrutivo automático autorizado.

Se a ferramenta deixar journal/schema incompatíveis, interromper e registrar o estado exato; não assumir que replay é seguro. Liberação final depende de testes negativos e advisers, não só de DDL ter sido aceito. Nenhum frontend/testador deve ser conectado antes de validar o cutover. Novos Authusers reais confirmados/URLs públicas dependem dos gates específicos, sem desativar confirmaçãoemail.

## Gates locais

28testesPG opt-in reais após correção do ensaioRNG, sem alteração de engine/SQL/economia.4testes próprios verificam hashes, sequência sob defaults gerenciados, contenção, rollback e liberação/negativas. Falha inicial25PASS/3FAIL preservada; primeiro caso assumia ataque inicial fatal, e duas falhas eram cascata da batalha aberta. Preparação agora encontra a última rodada real, conserva corrida/pagamento único/rollback e compara revisão anterior efetiva.

PostgreSQLlocal17.6 e hospedado17.11 são minorversions distintas. Changelog17.11 revisado: nenhuma fonte usa legado de criptografia ou índicesltree/btree_gist que exigem ação; sem dados existentes para recriptografar. Verificar primitivosgen_random_bytes/uuid do alvo antes de aplicar; não executar upgrade/reindex/downgrade por suposição. [Changelog](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes), [migrations](https://supabase.com/docs/guides/deployment/database-migrations), [grants e RLS](https://supabase.com/docs/guides/api/securing-your-api).
