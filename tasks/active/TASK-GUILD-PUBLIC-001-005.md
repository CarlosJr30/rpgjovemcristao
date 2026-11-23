# TASK-GUILD-PUBLIC-001→005 — Criação pública limitada de Guildas
ID: TASK-GUILD-PUBLIC-001→005
TITLE: Permitir uma Guilda própria por conta regular elegível e preparar candidato de publicação
OBJECTIVE: Liberar criação pública de uma Guilda por conta autenticada elegível, mantendo a liderança limitada a essa Guilda, ingresso por convite/aprovação e todo o restante do jogo intacto.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Diagnóstico e implementação mínima de backend/RPC, migration versionada se necessária, repositório/UI da criação e testes focados em `supabase/`, `apps/web/features/journey/`, `apps/web/lib/supabase/repositories/`, `packages/database/tests/`, `apps/web/**/*.test.*`, documentação de tarefa/relatório e CI do candidato final.
OUT_OF_SCOPE: PR #55 e controles globais de idade/acesso; outras funcionalidades/módulos; alterar recompensas; dados reais; migration/Supabase PROD; merge; deploy PROD; bypass de RLS/Auth; uso do checkout story-002 para código desta entrega.
DEPENDENCIES: Nenhuma para diagnóstico. TEST/Preview autenticados exigidos para aceite hospedado; se indisponíveis, registrar BLOCKED sem inventar PASS.
ASSIGNED_AGENT: Autor único, conforme solicitação do proprietário; sem agentes paralelos.
REQUIRED_CONTEXT: Pedido GUILD-PUBLIC-001 a 005 do proprietário; `.agent/GLOBAL_CONTEXT.md`, `CURRENT_STATE.md`, `WORKFLOW.md`, `RULES.md`, `SECURITY.md`, `RELEASE_POLICY.md`; perfis backend/database/frontend/security/qa/devops aplicáveis; skill Supabase.
SECURITY_CONSIDERATIONS: Identidade vem de `auth.uid()` e avatar pertence à conta; limite de uma Guilda por conta deve ser garantido server-side sob concorrência; no máximo escopo da nova comunidade; preservação de memberships/convites/economia/dados; RLS e Auth permanecem ativos; nunca incluir PR #55; sem credenciais ou operações de PROD.
ACCEPTANCE_CRITERIA:
- Conta autenticada elegível cria uma Guilda, tornando-se Líder somente nela.
- Limite de uma Guilda criada por conta é atômico/concurrency-safe e retries não duplicam.
- Não autenticado/inelegível/segunda criação é negado com mensagem compreensível.
- Liderança não confere administração global ou de outra Guilda.
- Participações existentes, convite e aprovação permanecem funcionais.
- Interface elegível oferece criação; conta que atingiu limite segue podendo participar de outras Guildas.
- Testes focados cobrem os 9 casos listados em GUILD-PUBLIC-004, reaproveitando evidências dos comportamentos não alterados.
- QA/Security e checks CI aplicáveis aprovados; Preview TEST autenticada aprovada ou bloqueio explícito.
- Sem dependência ou alteração da PR #55/TASK-STORY-002; relatório final GO/NO-GO.
TEST_PLAN:
- 001: traçar RPC, guardas de identidade/liderança, memberships, limites, lock/idempotência e UI; registrar plano mínimo.
- 002–003: implementar sob a menor migration/RPC/UI necessária.
- 004: testes PostgreSQL/Vitest dirigidos para sucesso, segunda criação, concorrência, privilégio/isolamento, convites, preservação, anônimo/inelegível; evitar suítes alheias.
- 005: revisão diff/security, compatibilidade migration, CI exigido no SHA final, TEST/Preview autenticados quando autorizados; sem PROD.
DEFINITION_OF_DONE: Relatório e memória atualizados; evidências reais vinculadas; apenas se todos os gates críticos passarem, commit e PR sem merge. Não executar deploy mesmo que a política global costume fazê-lo: restrição explícita desta autorização prevalece.

Etapa 001 concluída: diagnóstico/plano em docs/architecture/GUILD-PUBLIC-001-DIAGNOSTIC.md. Etapas 002–005 seguem nesta autorização sequencial; uso apenas da worktree codex/guild-public-001 baseada em origin/main SHA 60e8f94.

SELF VALIDATE / evidências (2026-11-23): migration TEST isolada em PostgreSQL 17.10: 8/8 checks PASS, syntheticData=true, hostedProof=false; Vitest direcionado: 21/21 PASS; `npm run typecheck`, ESLint direcionado e `git diff --check` PASS. Prettier PASS nos componentes/helper novos; `database.types.ts` gerado e harness legado não formatam no HEAD (baseline confirmado). `package-lock.json` sem diff. Corrigidos três defeitos reproduzidos na FK/guarda/UI. Em TASK-006, migration TEST remota `20261123193206` aplicada após guards/hashes correspondentes; pós-check de tabela, claims, RLS, grants e RPC PASS. PROD sem consulta/escrita. CI/Preview e sessão autorizada para smoke ainda pendentes; o push pode gerar Preview também no projeto Vercel web, então aguarda solução que mantenha publicação exclusivamente em TEST. QA/Security autorrevisados, não independentes. Relatório: `docs/architecture/GUILD-PUBLIC-001-005-REPORT.md`.
