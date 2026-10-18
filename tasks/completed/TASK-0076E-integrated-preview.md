# TASK-0076E — Preview da Arena integrada
ID: TASK-0076E
TITLE: Publicar navegação integrada da Arena em Preview isolada
OBJECTIVE: Jornada fictícia → Arena de Cartas → retorno em HTTPS, sem economia/persistência.
PRIORITY: P1 High
STATUS: DONE
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

## Aceite efetivo — 2026-10-17

INTEGRATED_PREVIEW_READY. Build/lint/typecheck PASS; 5 unitários +16 E2E locais +8 E2E HTTPS PASS, sem falhas finais/retries/skips. Quatro probes HTTP PASS. Jornada fictícia, Arena principal/legado/retorno, cartas/turnos/resultados/mobile e ausência de persistência/rede externa comprovados. CSS/19 keyframes, engine, economia e SQL preservados. Autorrevisão QA/Security; sem independência alegada. Deployment dpl_2mtUz82NvJyqkidmtsNo86BxXTqA READY Preview, commit 40e843c1cf7defb661294bac0b646b09d8c4bf81. Production/main/aliases/proteção idênticos ao baseline; nenhum Supabase/jogador/migration/segredo de produção alterado. Relatório docs/architecture/TASK-0076E-INTEGRATED-PREVIEW.md; evidências build/task-0076e-integrated-preview/acceptance.json e galeria review/index.html. Jornada completa, economia autenticada0076A e POCO físico/FPS pendentes. Fechamento documental local posterior à publicação, sem novo deploy só de docs.
