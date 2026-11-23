# GUILD-PUBLIC-001â†’005 â€” RelatÃ³rio final

**Estado:** NO-GO para publicaÃ§Ã£o; candidato local validado, homologaÃ§Ã£o hospedada pendente.
**Base:** `origin/main` `60e8f94`; branch `codex/guild-public-001` (sem commit/PR).
**Escopo:** criaÃ§Ã£o por conta regular verificada, uma Guilda por conta, preservaÃ§Ã£o dos fluxos existentes. PR #55, TASK-STORY-002, economia e PROD nÃ£o alterados.

## Resultado

| Gate | Estado | EvidÃªncia |
| --- | --- | --- |
| CriaÃ§Ã£o elegÃ­vel e lideranÃ§a limitada Ã  nova Guilda | PASS local | PostgreSQL sintÃ©tico: criaÃ§Ã£o, lideranÃ§a e replay idempotente. |
| Uma Guilda por conta, avatar alternativo e concorrÃªncia | PASS local | Segundo avatar negado; corrida de duas solicitaÃ§Ãµes produziu uma Guilda. |
| RPC legado nÃ£o contorna o limite | PASS local | `public.create_guild` tambÃ©m negado apÃ³s consumir a cota. |
| Convite, pedido e aprovaÃ§Ã£o | PASS local | Fluxo existente executado em fixture. EvidÃªncias hospedadas anteriores reutilizadas nos fluxos nÃ£o alterados. |
| Auth, autorizaÃ§Ã£o, ACL, RLS e isolamento | PASS local / PENDING hospedado | Conta regular verificada, avatar ativo, revogaÃ§Ã£o, escopo e claims privadas verificadas; sem sessÃ£o autenticada para prova hospedada. |
| PreservaÃ§Ã£o de memberships e economia | PASS local | Guildas/membros histÃ³ricos e snapshots de carteira, stats, inventÃ¡rio, baÃºs/operaÃ§Ãµes preservados. |
| Vitest direcionado | PASS | 3 arquivos, 21 testes. |
| Typecheck | PASS | `npm run typecheck` em todos os workspaces. |
| ESLint, Prettier e diff check | PASS parcial | ESLint e diff check passaram. Prettier passou nos componentes e helper novos; arquivos gerados `database.types.ts` e harness legado jÃ¡ falham no Prettier no HEAD. |
| Supabase TEST migration | PASS | `guild_public_001_test` aplicada na migration `20261123193206`; preflight dos guards/hash e pÃ³s-check de RLS/ACL/escopo confirmados. |
| Supabase TEST + Auth smoke | PENDING | Migration instalada, mas nÃ£o hÃ¡ sessÃ£o autorizada para smoke autenticado. |
| Vercel Preview autenticada | PENDING | NÃ£o publicada nem inspecionada nesta execuÃ§Ã£o. |
| PROD | PASS â€” inalterada | Metadados atuais confirmaram hashes-base e claims ausentes; deployment/migrations reutilizados do registro anterior. Nenhum DDL ou escrita. |

## Defeitos reproduzidos e corrigidos

1. Claim anterior Ã  Guilda falhava na FK imediata. A FK agora Ã© `DEFERRABLE INITIALLY DEFERRED`, dentro da mesma transaÃ§Ã£o.
2. O `guild_command` ainda exigia autorizaÃ§Ã£o manual. `require_creation` agora valida conta regular confirmada, avatar ativo e revogaÃ§Ã£o; tanto o comando scoped quanto o RPC legado passam pelo claim.
3. A tela perdeu a variÃ¡vel `writesEnabled` no novo fluxo e falhava ao renderizar. Restaurada a leitura.

## Migration e seguranÃ§a

Pacotes TEST/PROD separados, com guards de projeto, scope, protocolo e hashes-base. Leitura remota read-only confirmou TEST `hero-equipment-006` e PROD `guild-ebd-001`; ambos com protocol 3 e os mesmos hashes de autoridade. Backfill consome a cota de contas criadoras histÃ³ricas sem reescrever Guildas, vÃ­nculos ou economia.

Claims ficam em schema privado, RLS habilitado, sem acesso direto Ã  tabela; apenas funÃ§Ãµes estreitas recebem EXECUTE autenticado. Sem mudanÃ§as em Auth/RLS existentes, privilÃ©gios globais ou controles de idade. `search_path` das funÃ§Ãµes novas Ã© vazio.

RecuperaÃ§Ã£o: interromper temporariamente escritas pelo controle existente de Guildas; restaurar a guarda manual e a UI anterior, validar e reativar escritas. Preservar a tabela de claims, Guildas, vÃ­nculos, convites e economia. Nenhuma reversÃ£o foi executada.

## ProduÃ§Ã£o e recomendaÃ§Ã£o

PROD nÃ£o foi consultado nem alterado nesta execuÃ§Ã£o. Supabase TEST recebeu somente a migration autorizada; 4 claims histÃ³ricos preservam a cota de criaÃ§Ã£o e as 11 Guildas existentes continuam intactas. A tabela privada estÃ¡ com RLS ligada e sem privilÃ©gios diretos para `anon`, `authenticated` e `service_role`; a RPC de status estÃ¡ concedida apenas a `authenticated`.

**RecomendaÃ§Ã£o: HOMOLOGAÃ‡ÃƒO PENDENTE / NO-GO.** Falta obter SHA candidato com CI e deployment TEST autenticado. O push da branch tambÃ©m pode gerar Preview no projeto Vercel `rpgjovemcristao-web`; nÃ£o foi feito porque a autorizaÃ§Ã£o de publicaÃ§Ã£o cobre exclusivamente `rpgjovemcristao-test`. ApÃ³s resolver esse limite operacional, ainda serÃ¡ necessÃ¡rio o smoke autenticado TEST; nÃ£o registrar `GUILDA HOMOLOGADA` ou `PROD VALIDADA` antes disso.
