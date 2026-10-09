# TASK-0025 → Conexão inicial segura com Supabase

ID: TASK-0025
TITLE: Conexão inicial segura com Supabase
OBJECTIVE: Configurar o cliente browser do Supabase no app Next.js, validar ambiente e conectividade sem criar banco, autenticação ou migrações.
PRIORITY: P1 High
STATUS: DONE
SCOPE: dependência `@supabase/supabase-js` no workspace web; configuração central em `apps/web/lib/supabase/`; testes diretamente relacionados; documentação curta de ambiente/Vercel; manifests npm; memória e este contrato.
OUT_OF_SCOPE: tabelas, migrations, RLS, Auth, chave privilegiada, mudança de persistência/localStorage, Guilda, Arena, equipamentos, Jornada e UI final do jogo.
DEPENDENCIES: nenhuma.
ASSIGNED_AGENT: FRONTEND, com integração de configuração autorizada pelo pedido; QA e Security revisados pelo próprio autor.
REQUIRED_CONTEXT: pedido do usuário; `.agent/GLOBAL_CONTEXT.md`; `.agent/memory/CURRENT_STATE.md`; manifests npm; estrutura e configuração do app web; documentação local do Next.js para variáveis de ambiente.
SECURITY_CONSIDERATIONS: ler somente as duas variáveis públicas; nunca registrar seus valores; rejeitar configuração ausente/inválida; confirmar `.env.local` ignorado e não rastreado; revisar dependência e diff sem expor secrets.
ACCEPTANCE_CRITERIA:

- `@supabase/supabase-js` existe somente no workspace web e `@supabase/ssr` não é adicionado sem necessidade.
- Cliente browser singleton usa apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` por uma camada central.
- Variáveis ausentes ou URL inválida produzem erro claro sem revelar valores.
- Diagnóstico seguro comprova que uma requisição alcança o projeto Supabase sem depender de tabela.
- `.env.local` permanece ignorado e não rastreado; nenhuma chave privilegiada aparece no diff.
- Documentação informa as duas variáveis que precisam ser cadastradas na Vercel.
- Lint, typecheck, testes pertinentes e build passam sem regressão causada pela integração.

TEST_PLAN:

- Testes unitários da validação de ambiente e do diagnóstico com `fetch` simulado.
- Verificação real redigida do endpoint Auth settings do projeto, sem imprimir URL ou chave.
- Executar `npm run lint`, `npm run typecheck`, testes pertinentes, `npm run build` e `npm audit`.
- Inspecionar `git diff`, `git check-ignore` e `git ls-files` para prevenir exposição.

DEFINITION_OF_DONE:

- Critérios de aceite comprovados; QA e Security registrados; memória atualizada; tarefa movida para `tasks/completed/`.

## Evidências de conclusão — 2026-09-26

- Dependência: `@supabase/supabase-js` 2.117.2 instalada somente em `@rpg/web`; `@supabase/ssr` N/A porque esta etapa não implementa Auth nem sessão server-side. `npm audit --omit=dev`: 0 vulnerabilidades.
- Implementação: validação de ambiente, cliente browser singleton e diagnóstico sem tabela em `apps/web/lib/supabase/`.
- Conectividade: requisição somente leitura para `/auth/v1/settings` retornou `CONNECTED`; nenhum valor de URL ou chave foi impresso.
- UNIT TEST PASS: `npm test` — 18 arquivos e 106 testes aprovados; 7 testes focados cobrem ambiente e diagnóstico.
- LINT PASS: `npm run lint`.
- TYPECHECK PASS: `npm run typecheck` em todos os workspaces.
- BUILD PASS: `npm run build` — 18 rotas estáticas geradas.
- INTEGRATION TEST PASS: endpoint público Auth settings alcançado com a publishable key, sem tabela e sem escrita.
- E2E N/A: nenhuma rota, componente visual ou fluxo do jogo foi alterado; regressão coberta pela suíte unitária completa e pelo build.
- SECURITY REVIEW PASS (revisão pelo próprio autor): somente variáveis `NEXT_PUBLIC_*` previstas são lidas; erros são redigidos; HTTP é aceito apenas para hosts locais; `.env.local` está ignorado e não rastreado; varredura do escopo não encontrou credenciais; nenhum achado crítico/alto.
- DOCUMENTATION UPDATED: `docs/architecture/SUPABASE-CONNECTION.md` registra uso central, diagnóstico e configuração na Vercel.
- NO KNOWN CRITICAL REGRESSIONS: funcionalidades e persistência existentes não foram modificadas.
