# Ambiente de desenvolvimento isolado

Repositório `CarlosJr30/rpgjovemcristao`, branch de migração `cloud/rpg-jovem-cristao-migration`. Começar pela raiz do checkout, ler `AGENTS.md`, `.agent/GLOBAL_CONTEXT.md` e `.agent/memory/CURRENT_STATE.md`. Não presumir o caminho Windows dos relatórios históricos. As fontes0076/A/B/C/D/E já estão nessa linhagem; não reiniciar a partir de main.

## Preparação de um checkout limpo

O manifesto exige Node **24.16.x ou posterior da série24**, npm **11.13.x ou posterior da série11**. Conferir as versões antes de instalar:

```sh
node --version
npm --version
npm ci
npm run typecheck
npm run lint
npx vitest run packages/game-engine/src/combat-card-system.test.ts apps/web/lib/arena-preview.test.ts apps/web/features/journey/card-arena-unavailable.test.tsx apps/web/lib/economy/server.test.ts
```

Não copiar `.env.local` do computador nem configurar dados de produção. `.env.example` e `apps/web/.env.example` contêm apenas nomes e valores vazios. O código contém referências públicas do projeto em documentos históricos; elas não autorizam acesso. Nunca disponibilizar service_role, token Vercel, credencial PostgreSQL ou backup a tarefas de desenvolvimento. Não habilitar autoexecução de migrations.

Para ensaio da navegação fictícia integrada sem autenticação/economia:

```sh
RPG_ARENA_DEMO=1 npm run dev
```

Abrir `/journey`, entrar em `/journey/arena`, usar o retorno. Proxy bloqueia APIs/métodos persistentes e áreas reais; dados sintéticos só em memória. `/journey/arena/legacy` redireciona para a Arena principal. Não usar `VERCEL_ENV=production` nesse ensaio: o switch local é deliberadamente ignorado nesse ambiente.

Build local Preview sem segredos:

```sh
RPG_ARENA_DEMO=1 VERCEL_ENV=preview npm run build
RPG_ARENA_DEMO=1 VERCEL_ENV=preview npm run start
```

Variáveis são prefixos de comando POSIX; no PowerShell usar `$env:NOME='valor'`. Não é comando de deploy. A instalação de navegadores/dependências de sistema para E2E precisa estar disponível no ambiente; não alegar validação Linux/Cloud ou POCO físico a partir dos testes Windows existentes. A configuração Playwright atual usa Edge no projeto Android; adaptar o ambiente de teste numa tarefa própria se esse binário não existir.

## Limites e recuperação

As migrations `packages/database/migrations/0009_reward_security_task0076a.sql` e `0010_reward_security_cutover_task0076a.sql` são propostas preservadas, não autorização de aplicação. BACKUP_ACCESS_PENDING e demais gates0076A seguem vigentes. Consultar `docs/security/TASK-0076A-REWARD-SECURITY.md` antes de qualquer tarefa econômica.

Não importar `SQL-PARA-REVISAO`: são cópias idênticas dos originais versionados. Logs, screenshots, runtimes, caches e dados de sessão em `build/task-0076*` ficam privados locais. Os testes mantêm fixtures sintéticas no código; não precisam dos recibos de execução anteriores para funcionar.

Não fazer push em main, merge automático, promoção Vercel ou operação Supabase a partir deste guia. A integração Git existente pode criar uma Preview automaticamente ao receber uma branch; ela permanece isolada e não equivale a publicação Production. Credenciais/configuração de conta Codex Cloud não foram configuradas por esta tarefa. Migração pronta significa fontes no GitHub verificadas, não ambiente Cloud já provisionado ou produção liberada.
