# TASK-0076E — Preview da Arena integrada
ID: TASK-0076E
TITLE: Publicar navegação integrada da Arena em Preview isolada
OBJECTIVE: Jornada fictícia → Arena de Cartas → retorno em HTTPS, sem economia/persistência.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: seleção server-side de páginas Preview, navegação fictícia, demo existente, proxy deny-by-default, testes/configuração/relatório; commit e push somente branch preview/task-0076e-integrated-arena; leitura Vercel e teste Preview.
OUT_OF_SCOPE: Supabase, SQL/RLS, jogadores, recompensas, balanceamento, engines, layout mobile aprovado, main, Production, segredos/proteção/domínios.
DEPENDENCIES: TASK-0076C demo memória-only; TASK-0076D integração local; economia remota0076A não é habilitada.
ASSIGNED_AGENT: autor Frontend/DevOps/QA/Security, autorrevisão sem subagentes.
REQUIRED_CONTEXT: relatórios C/D, proxy/layout, páginas Jornada/Arena e demo, testes de isolamento.
SECURITY_CONSIDERATIONS: server decide Preview; Providers ausente; API/métodos persistentes negados; CSP self; zero storage/rede externa. OIDC efêmero somente em memória, nunca vercel curl.
ACCEPTANCE_CRITERIA:
- /journey abre entrada fictícia identificada; /journey/arena usa ArenaDemo existente e permite retorno; /journey/arena/legacy redireciona para principal.
- cinco cartas, energia3, turnos, vitória/derrota e mobile preservados sem ganhos ou persistência.
- Build/lint/types/testes PASS; push só branch dedicada; deployment targetPreview READY e URL funcional comprovados; main/Production preservadas.
TEST_PLAN: unit proxy; E2E local Chromium/WebKit com armadilhas de storage/rede; testes HTTPS direcionados sem traces/autenticação persistente; comparar main/Production antes/depois.
DEFINITION_OF_DONE: INTEGRATED_PREVIEW_READY somente com evidências reais; pendências físicas/economia autenticada explicitadas.

## Autorizações e ownership
Pedido vigente autoriza branch/commit/push/Preview automática. Orquestrador assume perfis e estende ownership a apps/web (UI e guarda Preview), testes/config e docs/memória dentro do escopo. Sem alteração do backend econômico ou autenticação normal. Preservar arquivos preexistentes D e fechamento C; SQL-PARA-REVISAO fica local, não versionar. Navegação Preview não representa jornada/progresso real: dados fictícios e ArenaDemo aprovada, sem novo motor.
