# GUILD-028B — rascunhos PROD preparados; validação SQL bloqueada

14/11/2026. PR55 reconfirmada OPEN/Draft no `e894b226f9b5669885f0e7bba72de8f856262f8a`. Histórico remoto consultado por ferramenta somente de leitura: ECONOMY041 `20261113153902` presente; COMMUNITY043B ausente. Nenhuma query SQL remota foi executada nesta tarefa.

Três arquivos de revisão em `packages/database/deployments/community043b/sql/`, na ordem fixa:

| Arquivo | SHA-256 |
| --- | --- |
| `20261113215415_community_043b_controlled_creation_production.sql` | `47be11a66a089bd6eda0e224ab1cc2619a718c0bc01c1e5e47f8ce085bffa62f` |
| `20261113232954_community_043b_membership_link_quotas_production.sql` | `3c3141ce281fce3a20584130ea25762601a8409eb3b54fc36cf47eeae6260a93` |
| `20261114110000_community_043b_join_request_quotas_production.sql` | `4553e9e02992d2faa564d0303f44ea694c005ac79fe3696e9702c3494f04a70e` |

Renderer local confere os blobs originais e adapta guardas para postgres/projeto PROD declarado/`guild-ebd-001`, dependências em ordem, transação e lock de governança. Criação nasce false/disabled; validações de Auth, sessão e ownership permanecem. Como as fontes TEST aplicavam quotas imediatamente, os drafts incluem passagem sem enforcement nos triggers quando o controle está fechado e marcação de links novos somente quando ativado; links históricos permanecem NULL/100 usos. Isso é comportamento novo da variante PROD e exige ensaio, especialmente compatibilidade das funções substituídas com convites antigos. RLS e assinaturas públicas não são alteradas; REVOKE/GRANT seguem as fontes revisadas. O GUC de projeto não é identidade criptográfica do servidor: a instalação futura também deve conferir a conexão real.

**Baseline de execução: nenhum.** Baseline de referência é o snapshot estrutural GUILD027 (PostgreSQL17.6.1, scope `guild-ebd-001`); nenhum dado pessoal foi usado. `psql`, `postgres`, Docker e Supabase CLI não estão disponíveis no PATH. Não instalei software. Falta runtime PostgreSQL17 autorizado e descartável para testar aplicação/rollback, sintaxe PL/pgSQL, dependências, ACL/RLS, concorrência/replay e preservação de histórico simulado. Fontes originais preservadas; drafts não são migrations registradas ou aprovadas para aplicação.

**Validação local: 7 testes estáticos/preflight PASS; git diff --check PASS.** Cobrem hashes/ordem dos drafts, target/scope, pacote bloqueado, separação TEST e defaults fechados. Não são prova de SQL válido ou segurança transacional. Nenhuma suíte da aplicação repetida. Manifesto registra drafts em `candidateMigrations` com `validation=postgresql-not-executed`; `status=blocked` e `migrations=[]` preservados.

Branch local `codex/guild-024-prod-preparation`, HEAD `e894b226`; arquivos não commitados. Nenhum CI novo executado; CI43605745124 pertence ao candidato antigo e não valida estes artefatos. Revisão estática pelo autor, sem revisão independente. Recuperação PROD e retenção após exclusão Auth continuam pendentes. Próxima operação segura: fornecer PostgreSQL17 descartável autorizado e executar os testes acima; depois revisar/registrar o pacote e CI do SHA final. Sem merge, ativação, deployment ou escrita remota; GUILD029 não iniciado.
