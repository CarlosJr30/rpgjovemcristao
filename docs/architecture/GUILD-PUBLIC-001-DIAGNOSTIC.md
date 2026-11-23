# GUILD-PUBLIC-001 â€” DiagnÃ³stico e plano mÃ­nimo

**Base:** `origin/main` / `60e8f94e65385cdd87c713b565ef13c6f0bf6885`
**Branch isolada:** `codex/guild-public-001`
**Resultado da etapa 001:** diagnÃ³stico concluÃ­do; implementaÃ§Ã£o autorizada continua nas etapas seguintes.

## DiagnÃ³stico

- `public.create_guild(uuid,text,text)` executa como `SECURITY DEFINER`. Ele exige `guild_admin_private.require_creation`, que confirma avatar ativo/proprietÃ¡rio e ausÃªncia de revogaÃ§Ã£o, mas tambÃ©m exige `leader_authorizations` vigente. A autorizaÃ§Ã£o manual Ã© o bloqueio atual.
- `guild_admin_private.active_actor` deriva a conta de `auth.uid()`, rejeita conta anÃ´nima e confirma avatar ativo pertencente Ã  conta. Os controles centrais de governanÃ§a tambÃ©m exigem usuÃ¡rio Auth regular. A base nÃ£o contÃ©m polÃ­tica/atributo etÃ¡rio na rota de Guildas; nÃ£o importar mudanÃ§as da PR #55.
- O comando de criaÃ§Ã£o jÃ¡ grava `created_by_user_id` com a identidade autenticada e associa o avatar como `leader` somente na Guilda recÃ©m-criada. OperaÃ§Ãµes de gestÃ£o consultam membership, Guild ID e papel; o papel de LÃ­der nÃ£o Ã© um papel administrativo global.
- A trava consultiva `pg_advisory_xact_lock(1010,1)` serializa comandos Guilda existentes. O ledger de auditoria permite replay quando recebe a mesma chave, mas `create_guild` fabrica um request ID novo por chamada. A chamada atual nÃ£o Ã© idempotente no cliente e o limite de uma criaÃ§Ã£o Ã© aplicado somente ao avatar, nÃ£o Ã  conta.
- `guild_members` preserva mÃºltiplas participaÃ§Ãµes por avatar e a unicidade do vÃ­nculo Ã© por Guilda/avatar. Convite por link e aprovaÃ§Ã£o sÃ£o RPCs distintos e nÃ£o precisam mudar.
- `OnlineGuildHub` apresenta formulÃ¡rio de criaÃ§Ã£o apenas sem Guilda ativa. Quem jÃ¡ participa de outra Guilda nÃ£o vÃª a opÃ§Ã£o; a criaÃ§Ã£o bem-sucedida atualiza o hub, mas nÃ£o persiste seleÃ§Ã£o explÃ­cita do novo Guild ID.

## Plano mÃ­nimo

1. Criar controle privado de uma criaÃ§Ã£o por `auth.uid()`, com backfill somente para Guildas jÃ¡ criadas pelo prÃ³prio titular; manter linhas/memberships existentes intocadas. Garantir limite sob concorrÃªncia e replay por chave de requisiÃ§Ã£o na RPC, sem confiar no cliente.
2. Remover somente a autorizaÃ§Ã£o administrativa prÃ©via do caminho de criaÃ§Ã£o. Preservar conta nÃ£o anÃ´nima, avatar prÃ³prio ativo, estado de revogaÃ§Ã£o, gate global de escrita, integridade de guild membership e RPCs de gestÃ£o existentes. Aplicar confirmaÃ§Ã£o de conta/estado banido na elegibilidade de criaÃ§Ã£o.
3. Adicionar estado de elegibilidade limitado e exibir criaÃ§Ã£o tanto no onboarding quanto para membros de outras Guildas. Criar sucesso seleciona a nova Guilda; conta que jÃ¡ criou recebe mensagem e continua podendo pedir ingresso.
4. Emparelhar migrations TEST/PROD versionadas, sem aplicar remotamente; criar testes PostgreSQL focados em auth, titularidade, limite por conta, concorrÃªncia, idempotÃªncia e isolamento, mais Vitest da UI/repositÃ³rio.
5. Revisar diff/seguranÃ§a, executar checks obrigatÃ³rios do CI, homologar TEST/Preview autenticada se credenciais/sessÃµes autorizadas jÃ¡ existirem, e preparar relatÃ³rio GO/NO-GO. Sem merge, deploy ou SQL PROD.

**Risco que exige atenÃ§Ã£o:** a base nÃ£o define idade por conta. O escopo preserva as verificaÃ§Ãµes de Auth existentes e nÃ£o adiciona exceÃ§Ãµes Ã s polÃ­ticas etÃ¡rias do produto nem incorpora PR #55. Se uma regra etÃ¡ria especÃ­fica for precondiÃ§Ã£o do lanÃ§amento, nÃ£o existe fonte atual na rota Guilda para implementÃ¡-la sem nova decisÃ£o de produto.