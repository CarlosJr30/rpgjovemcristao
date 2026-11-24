# TASK-0104 — Exceção revogável de criação múltipla de Guildas para QA

ID: TASK-0104
TITLE: GUILD-QA-001
OBJECTIVE: Permitir múltiplas criações apenas para a identidade QA autorizada, com controle privado e revogável.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Migrations GUILD-QA-001 TEST/PROD e testes direcionados do fluxo de criação.
OUT_OF_SCOPE: PR #55, TASK-STORY-002, convites/economia/XP/baús, merge, deploy PROD e criação de contas.
DEPENDENCIES: Confirmação verificável do plano de recuperação/backup PROD e sessão autenticada TEST autorizada para a identidade QA.
ASSIGNED_AGENT: Codex
REQUIRED_CONTEXT: PR #56 merged em main; migração GUILD-PUBLIC-001 instalada em TEST/PROD.
SECURITY_CONSIDERATIONS: Permissão privada vinculada ao UUID autenticado, sem grants a clientes, preservando RLS, claims, isolamento e revogação.
ACCEPTANCE_CRITERIA:
- Conta QA pode criar mais Guildas somente enquanto a permissão estiver ativa.
- Contas normais permanecem limitadas a uma Guilda por conta.
- Revogar a permissão bloqueia novas criações e preserva Guildas/claims existentes.
- TEST mantém RLS e não expõe a permissão.
TEST_PLAN:
- PostgreSQL isolado: criação normal, exceção QA, claim preservado, revogação, isolamento e economia.
- Supabase TEST: conferir migration, RLS, grants e ausência de identidade QA.
- GitHub Actions: CI obrigatório no SHA candidato.
- Smoke autenticado TEST: pendente de sessão autorizada existente.
DEFINITION_OF_DONE:
- Migration TEST/PROD versionada, testes locais e hospedados aplicáveis aprovados, CI PASS e recuperação PROD comprovada.
- Sem escrita PROD até comprovar todos os gates.

## Evidências e status

- PostgreSQL isolado: PASS, 9 verificações; dados e recompensas sintéticos.
- Supabase TEST: migration aplicada como versão `20261124051929`; RLS ligada; sem grants `anon`/`authenticated`; sem permissão ou identidade QA no projeto.
- TypeScript, ESLint e build: PASS.
- Smoke autenticado: PENDING; sem sessão TEST autorizada para a identidade QA.
- PROD: nenhuma escrita; plano/estado de recuperação verificável indisponível nesta execução.
- CI exato e publicação PROD: pendentes.
