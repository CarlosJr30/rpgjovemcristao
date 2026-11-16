# GUILD-024 — preparação para produção

14/11/2026. **Preparação parcial; PROD permanece inalterada.** Worktree isolado `codex/guild-024-prod-preparation`, base `e894b226f9b5669885f0e7bba72de8f856262f8a` (HEAD conhecido da PR #55). PR #55 permanece OPEN/Draft. Estado remoto revalidado: main `60e8f94`; CI `43605745124` SUCCESS no candidato da PR; deploy PROD `dpl_5KXQjeZJDvi3DG98ongNGADoNT4R` READY no SHA de main. Economia 041 está aplicada; nenhuma migration COMMUNITY-043B aparece no histórico PROD. Nenhuma escrita remota, merge ou deployment nesta tarefa.

## Migrations e sequência segura

As três fontes TEST foram preservadas sem alterações. SHA-256:

| Migration | Git blob no HEAD | SHA-256 bytes locais |
| --- | --- | --- |
| `20261113215415_community_043b_controlled_creation_test.sql` | `a562923cbf42a1b96f90494ecdee6e84a5fd1e67` | `CC9FC8E40EEEB75AD7A51F82297CAD810F0AE1FEFA00D3AD921CC1587D038865` |
| `20261113232954_community_043b_membership_link_quotas.sql` | `692a15aececb86eb0f2bff61a90ae59746ac864e` | `74C51F665DE388E22B3CEAACCB8F988A5EFE54113BFB6E6CAED3586D429632B1` |
| `20261114110000_community_043b_join_request_quotas_test.sql` | `99188b48126fb12fd608de92fa5682eb03d4814a` | `6626AFDA2667A8695529E535B5408C665829B0C842C77F9C7D02A3AE023DDE16` |

Para os três arquivos, `git hash-object` com filtros equivale ao blob exato no HEAD. `--no-filters` produz OIDs diferentes porque o checkout está em CRLF e o blob é normalizado; os SHA-256 da tabela são dos bytes locais CRLF. Nenhuma fonte foi editada.

**Nenhum SQL PROD foi criado.** A seleção observada no repositório é por pacotes de implantação curados (p.ex. CONTENT-040/ECONOMY-041), com artefatos e manifesto por destino; ao mesmo tempo, migrations de vários ambientes convivem em `supabase/migrations` e não há `supabase/config.toml` neste checkout. Por isso, `supabase db push` indiscriminado na raiz é inseguro: pode tentar aplicar arquivos TEST ainda pendentes. Foi preparado `packages/database/deployments/community043b/` com manifesto bloqueado, instruções e preflight. O preflight recusa estado bloqueado, destino diferente do projeto PROD fixo, alvo implícito/TEST, arquivos fora do pacote, nomes/ordem inesperados e hashes divergentes. Isto estabelece um ponto de entrada explícito no padrão curado existente, sem alegar que bloqueia alguém que ignore o processo e execute o CLI geral diretamente. A primeira e a terceira fontes são explicitamente TEST/local; as três abortam sem GUC de fixture e `release_scope()='hero-equipment-006'`. A primeira também restringe o enum de ambiente a `disabled/local/test`, e a autoridade de criação só admite `local/test`. Uma migration posterior na pasta comum não neutraliza a execução anterior dessas fontes. Copiar SQL e remover guardas, ou apenas renomear os arquivos, não é uma sequência PROD segura.

Próximo desenho necessário: pacote PROD versionado separado, derivado e revisado linha a linha, com guardas de identidade PROD, estados novos desligados por padrão, grants/ACLs equivalentes e plano de contenção/recuperação. Antes dele, definir como o pipeline de migrations seleciona arquivos por ambiente sem executar os candidatos TEST em PROD; testar ordenação e replay em PostgreSQL isolado. Não há `psql`, `pg_dump`, `pg_restore`, `postgres`, `initdb` ou Docker neste ambiente; portanto não foi possível validar a variante PROD em banco descartável. **Gate de produção permanece bloqueado; nenhuma variante não testada foi produzida.**

## Retenção do limite de criação

O contrato existente usa Guilda/auditoria como marcador persistente, mas não resolve exclusão/recuperação Auth. Não recomendo retenção indefinida de UUID de conta sem base e prazo aprovados. Opção para decisão de produto/jurídica: tombstone mínimo, sem email, nome ou avatar, acessível somente à RPC de criação e à auditoria estritamente necessária; prazo finito alinhado ao período formal de recuperação/contestação. Ao fim do prazo, a regra deve declarar explicitamente se a conta recuperada pode criar novamente. Até aprovação do prazo, finalidade, controle de acesso e consequência da expiração, manter criação desativada. Nenhuma retenção ou política foi implementada.

## Recuperação Supabase PROD

Não há backup manual restaurado nem evidência de PITR; a decisão anterior de dispensar o backup manual não equivale a `BACKUP_VERIFIED`. A rota gratuita a preparar é exportação lógica autenticada com Supabase CLI (`db dump`) para armazenamento privado criptografado, hash SHA-256 e ensaio em PostgreSQL descartável. A documentação oficial alerta que o dump padrão exclui schemas gerenciados como `auth` e `storage`, e não inclui dados nem roles customizadas por padrão; esses componentes exigem captura e plano separados. Arquivos binários do Storage precisam ser copiados separadamente pela API/objeto, além dos metadados do banco. A restauração de Auth/Storage, extensões, roles/ACLs, secrets e integrações externas precisa ser explicitamente ensaiada; não está coberta por um dump lógico genérico.

Ferramentas e credenciais de conexão/armazenamento seguro não estão disponíveis neste ambiente; não foi feita exportação. Portanto recuperação **BLOCKED / não verificada**, conforme `.agent/RELEASE_POLICY.md`. Referências oficiais: [backups Supabase](https://supabase.com/docs/guides/platform/backups), [CLI `db dump`](https://supabase.com/docs/reference/cli/supabase-db-dump), [backup e restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

## Checks e estado

- Preflight direcionado: **3/3 PASS** (recusa pacote bloqueado, alvo TEST/implícito e projeto divergente); a invocação PROD correta termina `blocked`, como esperado. `git diff --check` PASS; relatório e manifesto inspecionados quanto a whitespace. Hashes blob/filtros e bytes CRLF/LF diferenciados acima.
- PR #55, SHA e CI acima revalidados por leitura. O CI valida o candidato existente, não migrations PROD novas.
- Nenhum teste PostgreSQL descartável foi executado: ferramentas ausentes. Nenhum teste de aplicação foi repetido.
- Branch `codex/guild-024-prod-preparation`, HEAD `e894b226f9b5669885f0e7bba72de8f856262f8a`; pacote/relatório/memória locais não commitados. PR #55 e seus arquivos não foram modificados. Nenhum CI novo é aplicável sem commit/PR; CI citado continua sendo somente do SHA original.
- Backup Arena `backup/rpg-equipment-fix-014-aprovado-2026-11-11` preservado; nenhum arquivo de backup foi movido ou alterado.

**Para publicar:** (1) comprovar exportação e restore isolado PROD incluindo cobertura e lacunas; (2) aprovar política finita de retenção do marcador; (3) definir/validar seleção por ambiente e preparar pacote PROD próprio em banco descartável; (4) concluir Preview TEST e smoke autenticado conforme a política; (5) atualizar PR #55, aprovar CI no SHA final e seguir merge/deploy normais. Até então, Guildas COMMUNITY-043B continuam não aplicadas e desativadas em PROD.
