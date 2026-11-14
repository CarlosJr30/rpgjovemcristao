# GUILD-027 — preparação de migrations COMMUNITY-043B para PROD

14/11/2026. **Pacote preparado; SQL PROD bloqueado para geração/validação. Nenhuma alteração remota foi executada.** PR #55 permanece OPEN/Draft no head `e894b226f9b5669885f0e7bba72de8f856262f8a`; CI `43605745124` SUCCESS associado ao SHA exato. PR #53/#54 seguem integradas. PROD Vercel `dpl_5KXQjeZJDvi3DG98ongNGADoNT4R` READY no main `60e8f94`; não houve deploy.

## Estado remoto lido

Confirmei o projeto Supabase PROD `wspafhlbtlpabypzymjo` (ACTIVE_HEALTHY, PostgreSQL 17.6.1), sem consultar linhas de contas/jogadores. `release_scope()` retorna `guild-ebd-001`. Histórico: ECONOMY-041 (`20261113153902`) aplicada; nenhuma migration COMMUNITY-043B aplicada. As flags de criação COMMUNITY não existem ainda; `multiguild_control` atualmente tem somente `singleton`, `writes_enabled` e `revision`.

As seis tabelas estruturais relevantes verificadas (`guilds`, `guild_members`, `guild_join_requests`, `multiguild_control`, `audit`, `link_invites`) têm RLS habilitado. As policies públicas atuais de leitura observadas são restritas a membros/participantes. `guild_command`, o wrapper de criação de convite e `request_join_guild` são `SECURITY DEFINER`, `search_path` vazio, EXECUTE autenticado permitido e anon negado. O wrapper de convite usa assinatura de 1 argumento; o helper de 2 argumentos permanece privado sem EXECUTE autenticado. Os contratos PROD devem preservar essas fronteiras.

## Compatibilidade das fontes TEST

Os três arquivos TEST foram preservados byte a byte no checkout. `git hash-object` (com os filtros do repositório) coincide com o blob Git para cada fonte; `--no-filters` e SHA-256 dos bytes locais diferem porque o checkout está CRLF e os blobs estão normalizados. O manifesto GUILD-024 registra ambos os tipos de hash.

As fontes não podem ser aplicadas diretamente em PROD: as guardas exigem `release_scope()='hero-equipment-006'`, mas PROD declara `guild-ebd-001`; cada fonte também exige seu próprio GUC `local-test`. A fundação TEST limita `community_environment` a `disabled/local/test` e o ator só aceita `local/test`, sem modo `production`. A migração de quotas depende da ordem posterior à fundação e da assinatura privada do helper; o estado/ACLs de PROD foram conferidos em leitura. A lista não equivale a uma tradução segura dos corpos SQL.

## Pacote preparado e validação

Criado `packages/database/deployments/community043b/` com README operacional, manifesto `status: blocked`, projeto PROD fixo, escopo/estado PROD observado, ordem esperada e preflight que recusa alvo implicitamente TEST, projeto diferente, lista vazia/bloqueada, ordem/nome fora do pacote e SHA-256 divergente. Os arquivos TEST originais permanecem no diretório comum. O preflight é o ponto de entrada do pacote curado; não impede alguém de ignorá-lo e rodar o CLI geral.

**Migrations PROD preparadas: não.** A lista no manifesto permanece vazia e não há arquivos SQL PROD neste pacote. Não gerei variante sem conseguir executá-la em PostgreSQL descartável, pois isso seria uma falsa validação. O ambiente não tem `psql`, `postgres`, `initdb` ou Docker. A leitura de schema e as guardas estáticas permitem apontar incompatibilidades, mas não provar sintaxe/execução, efeitos de triggers, ordem transacional ou ACL final.

Testes direcionados do pacote: **5/5 PASS** (manifesto bloqueado, fontes TEST mantidas fora do pacote, recusa de destino TEST/implícito, projeto divergente e preflight fechado). `git diff --check` PASS. Nenhum dos 1.218 testes da aplicação foi repetido. PostgreSQL/sintaxe de migrations: **não executado / não PASS**. CI continua válido somente para o candidato PR #55; não houve SHA novo publicado em GitHub.

## Bloqueios e próximo passo

1. Preparar três arquivos PROD próprios em `packages/database/deployments/community043b/sql/`, com guardas específicas para `wspafhlbtlpabypzymjo`/`guild-ebd-001`, funções fechadas por padrão e grants/ACLs preservados; executar cadeia completa no PostgreSQL descartável e conferir negativos de target/projeto/hash.
2. Comprovar recuperação PROD com backup/restore isolado; Supabase Free não forneceu PITR e o backup manual não foi executado/verificado.
3. Obter decisão de produto/jurídica para retenção finita do marcador de uma Guilda por conta. Até lá, não ativar criação em PROD.

Não aplicar `supabase db push` do checkout misto: a referência atual do CLI diz que `db push --remote` envia as migrations locais pendentes. O pacote COMMUNITY separado evita selecionar acidentalmente as fontes TEST quando o processo de release aprovado for seguido ([CLI db push](https://supabase.com/docs/reference/cli/supabase-db-push), [changelog CLI v3](https://supabase.com/changelog/supabase-cli-v3)). Nenhum SQL remoto, ativação, dado de jogador, merge ou deployment foi alterado.
